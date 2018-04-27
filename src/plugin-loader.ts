// tslint:disable-next-line:ordered-imports
import * as ts from 'byots';
import * as fs from 'fs';
import { getOptions, OptionObject } from 'loader-utils';
import * as path from 'path';
import * as tmp from 'tmp';
import { loader as WebpackLoader } from 'webpack';

import {
  findChildNode,
  findChildOrSelfNode,
  findParentOrSelfNode,
  getComments,
} from './utils';
import { findChildNodes, nodeToString } from './utils/utils';

const ignoreRegex = /^\/\/(\W*)strip-log(\W*)$/gi;

function isNodeCommentTrigger(node: ts.Node, sourceFile: ts.SourceFile) {
  const comments = getComments(node, sourceFile.getFullText(), true);

  const matchingComment = comments.find(tmpComment => {
    return ignoreRegex.test(tmpComment);
  });

  if (matchingComment !== undefined) {
    return true;
  } else {
    return false;
  }
}

class PluginLoader {
  private sourceText: string;
  private options: OptionObject;
  private tmpFile!: tmp.SynchrounousResult;
  private tsProgram!: ts.Program;
  private tsChecker!: ts.TypeChecker;
  private mainSourceFile: ts.SourceFile | undefined;
  private restrictedSymbols: Set<ts.Symbol> = new Set<ts.Symbol>();
  private restrictedExpressions: Set<ts.Node> = new Set<ts.Node>();
  // private toRemoveExpressions: ts.Expression[] = []; // TODO: Create this during replacement

  constructor(loaderContext: WebpackLoader.LoaderContext, sourceText: string) {
    this.sourceText = sourceText;
    this.options = getOptions(loaderContext);

    this.initTypescriptCompiler();
  }

  public process(): string {
    this.findAndRecordImportClauses();
    this.findAndRecordSymbolsAndExpressions();

    const targetText = this.returntransformedSource();

    // this.cleanup();
    return targetText;
  }

  private initTypescriptCompiler(): void {
    // console.log(this.sourceText);

    // Create new tmp file
    this.tmpFile = tmp.fileSync({
      postfix: '.js',
    });

    // Write source text content to tmp file
    fs.writeFileSync(this.tmpFile.fd, this.sourceText);

    this.tsProgram = ts.createProgram([this.tmpFile.name], {
      allowJs: true,
      noResolve: true,
    });

    this.tsChecker = this.tsProgram.getTypeChecker();

    for (const tmpSourceFile of this.tsProgram.getSourceFiles()) {
      if (!tmpSourceFile.isDeclarationFile) {
        if (
          path.normalize(tmpSourceFile.fileName) ===
          path.normalize(this.tmpFile.name)
        ) {
          this.mainSourceFile = tmpSourceFile;
        }
      }
    }

    if (this.mainSourceFile === undefined) {
      this.cleanup();
      throw new TypeError('Source file not found');
    }
  }

  private findAndRecordImportClauses(): void {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const allImportClauses: ts.ImportDeclaration[] = findChildNodes(
      this.mainSourceFile,
      ts.isImportDeclaration
    );

    for (const tmpImportClause of allImportClauses) {
      // handle `import abc from 'xyz';`
      if (
        tmpImportClause &&
        tmpImportClause.importClause &&
        tmpImportClause.importClause.name
      ) {
        // Handle only imports with comment - ignore
        if (isNodeCommentTrigger(tmpImportClause, this.mainSourceFile)) {
          const importedSymbol = this.tsChecker.getSymbolAtLocation(
            tmpImportClause.importClause.name
          );

          this.restrictedExpressions.add(tmpImportClause);
          if (importedSymbol) {
            this.restrictedSymbols.add(importedSymbol);
          }
        }
      }
    }
  }

  private isExpressionRestricted(checkeeExpression: ts.Expression): boolean {
    return this.restrictedExpressions.has(checkeeExpression);
  }

  private isSymbolRestricted(checkeeSymbol: ts.Symbol): boolean {
    const isRestrictedSymbol = this.restrictedSymbols.has(checkeeSymbol);

    const isAliasedRestrictedSymbolOrExpr =
      this.isSymbolDeclaredWithRestrictedInit(checkeeSymbol) ||
      this.isSymbolAssignedWithRestrictedInit(checkeeSymbol);

    return isRestrictedSymbol || isAliasedRestrictedSymbolOrExpr;
  }

  private isSymbolDeclaredWithRestrictedInit(
    checkeeSymbol: ts.Symbol
  ): boolean {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    let isMatching = false;

    const checkDeclarations = (node: ts.Node): void => {
      // if variable declaration
      if (ts.isVariableDeclaration(node)) {
        // const abc = logger.log
        const variableSymbol = this.tsChecker.getSymbolAtLocation(node.name);
        const initializer = node.initializer;
        if (variableSymbol === checkeeSymbol && initializer) {
          const initializerSymbol = this.tsChecker.getSymbolAtLocation(
            initializer
          );
          if (
            (initializerSymbol &&
              this.restrictedSymbols.add(initializerSymbol)) ||
            this.restrictedExpressions.has(initializer)
          ) {
            isMatching = true;
            return;
          }
        }
      } else {
        ts.forEachChild(node, checkDeclarations);
      }
    };

    ts.forEachChild(this.mainSourceFile, checkDeclarations);

    return isMatching;
  }

  private isSymbolAssignedWithRestrictedInit(
    checkeeSymbol: ts.Symbol
  ): boolean {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    let isMatching = false;

    const checkAssignments = (node: ts.Node): void => {
      // if variable declaration
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        // const abc = logger.log
        const variableSymbol = this.tsChecker.getSymbolAtLocation(node.left);
        const initializer = node.right;
        if (variableSymbol === checkeeSymbol && initializer) {
          const initializerSymbol = this.tsChecker.getSymbolAtLocation(
            initializer
          );
          if (
            (initializerSymbol &&
              this.restrictedSymbols.has(initializerSymbol)) ||
            this.restrictedExpressions.has(initializer)
          ) {
            isMatching = true;
            return;
          }
        }
      } else {
        ts.forEachChild(node, checkAssignments);
      }
    };

    ts.forEachChild(this.mainSourceFile, checkAssignments);

    return isMatching;
  }

  private findAndRecordSymbolsAndExpressions(): void {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const findAndRecordMethods = [
      this.findAndRecordPropertyAccess,
      this.findAndRecordNewCalls,
      this.findAndRecordFunctionCalls,
    ];

    let oldRestrictedSymbolsLength = -1;
    let oldRestrictedExpressionsLength = -1;

    // Run all find methods until all of them doesn't detect any
    // restricted symbol and expression for one full pass
    while (
      oldRestrictedSymbolsLength < this.restrictedSymbols.size ||
      oldRestrictedExpressionsLength < this.restrictedExpressions.size
    ) {
      // Save old length
      oldRestrictedSymbolsLength = this.restrictedSymbols.size;
      oldRestrictedExpressionsLength = this.restrictedExpressions.size;

      // Call all findAndRecordMethods
      findAndRecordMethods.forEach(method => {
        method.call(this);
      });
    }
  }

  private findAndRecordPropertyAccess() {
    // Strategy 1: symbol property access | aa = symbol.abc; | Remove + Enrich symbols
    // Add property symbol to restrictedSymbols

    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const checkPropAccess = (node: ts.Node): void => {
      // if property accessor
      if (ts.isPropertyAccessExpression(node)) {
        // obj.prop
        const leftHandObjectIdentifier = node.expression;
        const rightHandPropIdentifier = node.name;
        const leftHandSymbol = this.tsChecker.getSymbolAtLocation(
          leftHandObjectIdentifier
        );
        const rightHandSymbol = this.tsChecker.getSymbolAtLocation(
          rightHandPropIdentifier
        );
        // if obj has symbol and symbol is in restricted list
        if (
          (leftHandSymbol && this.isSymbolRestricted(leftHandSymbol)) ||
          this.isExpressionRestricted(leftHandObjectIdentifier)
        ) {
          // Remove expression
          this.restrictedExpressions.add(node);

          // Enrich symbol
          if (leftHandSymbol) {
            this.restrictedSymbols.add(leftHandSymbol);
          }
        }
      } else {
        ts.forEachChild(node, checkPropAccess);
      }
    };

    ts.forEachChild(this.mainSourceFile, checkPropAccess);
  }

  private findAndRecordNewCalls() {
    // Strategy 2: new symbol call | new symbol() | Remove + Enrich symbols
    // Add new expression result to restrictedSymbols

    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const checkSymbolCall = (node: ts.Node): void => {
      // if new expression
      if (ts.isNewExpression(node)) {
        // new expression()
        // // tslint:disable-next-line:no-console
        // console.log(
        //   'New expression check:',
        //   nodeToString(node, this.mainSourceFile as ts.SourceFile)
        // );
        const expressionIdentifier = node.expression;
        const expressionSymbol = this.tsChecker.getSymbolAtLocation(
          expressionIdentifier
        );
        const newReturnSymbol = this.tsChecker.getSymbolAtLocation(node);
        // if obj has symbol and symbol is in restricted list
        if (
          (expressionSymbol && this.isSymbolRestricted(expressionSymbol)) ||
          this.isExpressionRestricted(expressionIdentifier)
        ) {
          // Remove expression
          this.restrictedExpressions.add(node);

          // Enrich symbol
          if (expressionSymbol) {
            this.restrictedSymbols.add(expressionSymbol);
          }
        }
      } else {
        ts.forEachChild(node, checkSymbolCall);
      }
    };

    ts.forEachChild(this.mainSourceFile, checkSymbolCall);
  }

  private findAndRecordFunctionCalls() {
    // Strategy 3: symbol as function call | symbol() | Remove + Enrich symbols
    // Add return value as symbol to restrictedSymbols

    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const checkFunctionCall = (node: ts.Node): void => {
      // if call expression
      if (ts.isCallExpression(node)) {
        // expression()
        // // tslint:disable-next-line:no-console
        // console.log(
        //   'Call expression check:',
        //   nodeToString(node, this.mainSourceFile as ts.SourceFile)
        // );
        const expressionIdentifier = node.expression;
        const expressionSymbol = this.tsChecker.getSymbolAtLocation(
          expressionIdentifier
        );
        const expressionReturnSymbol = this.tsChecker.getSymbolAtLocation(node);
        // if obj has symbol and symbol is in restricted list
        if (
          (expressionSymbol && this.isSymbolRestricted(expressionSymbol)) ||
          this.isExpressionRestricted(expressionIdentifier)
        ) {
          // Remove expression
          this.restrictedExpressions.add(node);

          // Enrich symbol
          if (expressionSymbol) {
            this.restrictedSymbols.add(expressionSymbol);
          }
        }
      } else {
        ts.forEachChild(node, checkFunctionCall);
      }
    };

    ts.forEachChild(this.mainSourceFile, checkFunctionCall);
  }

  private logFindDetails(expressions: ts.Node[]) {
    // tslint:disable-next-line:no-console
    console.log(
      [...this.restrictedSymbols]
        .map(tmpSymbol => tmpSymbol.getName())
        .join(', ')
    );

    // tslint:disable-next-line:no-console
    console.log(
      expressions
        .map(expr => nodeToString(expr, this.mainSourceFile as ts.SourceFile))
        .join(', ')
    );
  }

  private getParentStatement(node: ts.Node): ts.Statement | undefined {
    if (ts.isStatement(node)) {
      return node;
    } else if (node.parent) {
      return this.getParentStatement(node.parent);
    } else {
      return undefined;
    }
  }

  private returntransformedSource(): string {
    let newText = this.sourceText;

    const toRemoveExpressions: ts.Statement[] = [...this.restrictedExpressions]
      .map((node: ts.Node) => {
        return this.getParentStatement(node);
      })
      .filter(statementOrUndefined => {
        return statementOrUndefined !== undefined;
      }) as ts.Statement[];

    const revSortedExpressions = toRemoveExpressions.sort((expr1, expr2) => {
      if (expr1.getEnd() !== expr2.getEnd()) {
        if (expr1.getEnd() > expr2.getEnd()) {
          return -1;
        } else {
          return +1;
        }
      } else {
        if (expr1.getStart() < expr2.getStart()) {
          return -1;
        } else {
          return +1;
        }
      }
    });

    this.logFindDetails(revSortedExpressions);

    for (
      let exprIndex = 0;
      exprIndex < revSortedExpressions.length;
      exprIndex++
    ) {
      this.mainSourceFile = this.mainSourceFile as ts.SourceFile;
      const currentExpr = revSortedExpressions[exprIndex];

      if (exprIndex > 0) {
        const prevExpr = revSortedExpressions[exprIndex - 1];
        if (currentExpr.getEnd() > prevExpr.getStart()) {
          // When there is overlap
          if (
            currentExpr.getStart() >= prevExpr.getStart() &&
            currentExpr.getEnd() <= prevExpr.getEnd()
          ) {
            // When current expr is completely contained in prev expr
            // tslint:disable-next-line:no-console
            console.log(
              `Skipping expression as it is completely contained: ${nodeToString(
                currentExpr,
                this.mainSourceFile
              )}`
            );
            continue;
          } else {
            // There is non-contained overlap
            throw new Error(
              'Breaking build as there is non-contained overlap between 2 expressions'
            );
          }
        }
      }

      newText =
        newText.slice(0, currentExpr.getStart()) +
        '' + // Replace with empty string
        newText.slice(currentExpr.getEnd());
    }

    return newText;
  }

  private cleanup(): void {
    this.tmpFile.removeCallback();
  }
}

function loader(this: WebpackLoader.LoaderContext, sourceText: string): string {
  const newLoaderInstance = new PluginLoader(this, sourceText);
  return newLoaderInstance.process();
}

export default loader;
