import * as ts from 'byots';
import * as fs from 'fs';
import { getOptions, OptionObject } from 'loader-utils';
import * as path from 'path';
import * as tmp from 'tmp';
import { loader as WebpackLoader } from 'webpack';
import * as logger from 'loglevel';
// tslint:disable-next-line:no-var-requires
const flatMap = require('array.prototype.flatmap');

// Setup modules
flatMap.shim();

if (process.env.NODE_ENV === 'trace') {
  logger.setDefaultLevel(logger.levels.TRACE);
} else if (process.env.NODE_ENV === 'debug') {
  logger.setDefaultLevel(logger.levels.DEBUG);
} else {
  logger.setDefaultLevel(logger.levels.ERROR);
}

import {
  nodeToString,
  findChildNode,
  findChildNodes,
  findParentOrSelfNode,
  getComments,
  getNodeEnd,
  getNodeStart,
} from './utils';

const ignoreRegex = /^\/\/(\W*)strip-log(\W*)$/i;

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
// USE UTILS EVERYWHERE INSTEAD OF ts.forEachChild
interface PluginLoaderOptions {
  modules: string[];
}

class PluginLoader {
  private sourceText: string;
  private options: PluginLoaderOptions;
  private tmpFile!: tmp.SynchrounousResult;
  private tsProgram!: ts.Program;
  private tsChecker!: ts.TypeChecker;
  private mainSourceFile: ts.SourceFile | undefined;
  private restrictedSymbols: Set<ts.Symbol> = new Set<ts.Symbol>();
  private restrictedExpressions: Set<ts.Node> = new Set<ts.Node>();
  // private toRemoveExpressions: ts.Expression[] = []; // TODO: Create this during replacement

  constructor(loaderContext: WebpackLoader.LoaderContext, sourceText: string) {
    this.sourceText = sourceText;
    let rawOptions = getOptions(loaderContext) as OptionObject | null;
    if (rawOptions === null) {
      rawOptions = {};
    }
    rawOptions.modules = rawOptions.modules || [];
    this.options = rawOptions as PluginLoaderOptions;

    this.initTypescriptCompiler();
  }

  public process(): string {
    this.findAllImportClauses();
    this.findAllRequireStatements();
    this.findExplicitlyRestrictedSymbols();
    this.findAllSymbolsAndExpressions();

    const targetText = this.returntransformedSource();

    this.cleanup();
    return targetText;
  }

  private initTypescriptCompiler(): void {
    logger.trace(`Input file content: \n ${this.sourceText}`);

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

  private findAllImportClauses(): void {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const allImportClauses: ts.ImportDeclaration[] = findChildNodes(
      this.mainSourceFile,
      ts.isImportDeclaration
    );

    for (const tmpImportClause of allImportClauses) {
      if (tmpImportClause) {
        // Handle only marked imports
        if (
          isNodeCommentTrigger(tmpImportClause, this.mainSourceFile) ||
          this.isImportModuleNameRestrictedGlobally(tmpImportClause)
        ) {
          logger.trace(
            `Checking import statement: ${nodeToString(
              tmpImportClause,
              this.mainSourceFile
            )}`
          );

          // For any passing import, add it to restricted expressions
          // This should also handle other cases like side-effect imports
          // Ex. import 'abc.css';
          this.restrictedExpressions.add(tmpImportClause);

          if (tmpImportClause.importClause) {
            if (tmpImportClause.importClause.name) {
              // Handle `import abc from 'xyz';`

              const importedSymbol = this.tsChecker.getSymbolAtLocation(
                tmpImportClause.importClause.name
              );
              if (importedSymbol) {
                this.restrictedSymbols.add(importedSymbol);
              }
            }

            // Handle named bindings
            if (tmpImportClause.importClause.namedBindings) {
              if (
                ts.isNamespaceImport(tmpImportClause.importClause.namedBindings)
              ) {
                // Handle `import * as ts from 'byots';`

                const importedSymbol = this.tsChecker.getSymbolAtLocation(
                  tmpImportClause.importClause.namedBindings.name
                );
                if (importedSymbol) {
                  this.restrictedSymbols.add(importedSymbol);
                }
              } else if (
                ts.isNamedImports(tmpImportClause.importClause.namedBindings)
              ) {
                // Handle `import { loader as WebpackLoader, abc } from 'webpack';`

                for (const tmpImportSpecifier of tmpImportClause.importClause
                  .namedBindings.elements) {
                  const importedSymbol = this.tsChecker.getSymbolAtLocation(
                    tmpImportSpecifier.name
                  );
                  if (importedSymbol) {
                    this.restrictedSymbols.add(importedSymbol);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  private findAllRequireStatements(): void {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const allRequireCalls: ts.CallExpression[] = findChildNodes(
      this.mainSourceFile,
      (node): node is ts.CallExpression => ts.isRequireCall(node, true)
    );

    for (const tmpRequireCall of allRequireCalls) {
      // Handle only statements containing require call with comment of strip-log
      // Because this is the require call expression, move up to the statement to check the comment.

      const tmpRequireStatement = this.getParentStatement(tmpRequireCall);
      if (
        tmpRequireStatement &&
        (isNodeCommentTrigger(tmpRequireStatement, this.mainSourceFile) ||
          this.isRequireModuleNameRestrictedGlobally(tmpRequireCall))
      ) {
        this.restrictedExpressions.add(tmpRequireCall);
      }
    }
  }

  private findExplicitlyRestrictedSymbols(): void {
    const restrictIdentierOrCommaBinaryExpression = (node: ts.Expression) => {
      if (ts.isIdentifier(node)) {
        const trySymbol = this.tsChecker.getSymbolAtLocation(node);
        if (trySymbol) {
          this.restrictedSymbols.add(trySymbol);
        }
      } else if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.CommaToken
      ) {
        restrictIdentierOrCommaBinaryExpression(node.left);
        restrictIdentierOrCommaBinaryExpression(node.right);
      }
    };

    const findExpResSymbolsInternal = (node: ts.Node) => {
      if (
        ts.isExpressionStatement(node) &&
        isNodeCommentTrigger(node, this.mainSourceFile as ts.SourceFile)
      ) {
        restrictIdentierOrCommaBinaryExpression(node.expression);
      } else {
        ts.forEachChild(node, findExpResSymbolsInternal);
      }
    };

    ts.forEachChild(
      this.mainSourceFile as ts.SourceFile,
      findExpResSymbolsInternal
    );
  }

  private isImportModuleNameRestrictedGlobally(
    importClause: ts.ImportDeclaration
  ): boolean {
    if (ts.isStringLiteral(importClause.moduleSpecifier)) {
      const moduleName = importClause.moduleSpecifier.text;
      return this.options.modules.includes(moduleName);
    }

    return false;
  }

  private isRequireModuleNameRestrictedGlobally(
    requireCallExpression: ts.CallExpression
  ): boolean {
    if (ts.isRequireCall(requireCallExpression, true)) {
      const moduleName = (requireCallExpression
        .arguments[0] as ts.StringLiteral).text;
      return this.options.modules.includes(moduleName);
    }

    return false;
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

    const isDeclarationForGivenSymbol = (node: ts.Node): boolean => {
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
              this.restrictedSymbols.has(initializerSymbol)) ||
            this.restrictedExpressions.has(initializer)
          ) {
            return true;
          }
        }
      }

      return false;
    };

    const matchingVarDecl = findChildNode(
      this.mainSourceFile,
      isDeclarationForGivenSymbol
    );

    return matchingVarDecl !== undefined;
  }

  private isSymbolAssignedWithRestrictedInit(
    checkeeSymbol: ts.Symbol
  ): boolean {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    const isVariableAssignmentForGivenSymbol = (node: ts.Node): boolean => {
      // if variable assignment (binary =)
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
            return true;
          }
        }
      }

      return false;
    };

    const matchingVarAssignment = findChildNode(
      this.mainSourceFile,
      isVariableAssignmentForGivenSymbol
    );

    return matchingVarAssignment !== undefined;
  }

  private findAllSymbolsAndExpressions(): void {
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

    // Find all expressions from symbols already recorded
    const expressionsFromSymbols = [...this.restrictedSymbols].flatMap(symbol =>
      this.findExpressionsWhichUseSymbol(symbol)
    );

    logger.trace(
      `Expression from symbols count: ${expressionsFromSymbols.length}`
    );

    expressionsFromSymbols.forEach(expr =>
      this.restrictedExpressions.add(expr)
    );
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
          // Restrict expression
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

        logger.trace(
          'New expression check:',
          nodeToString(node, this.mainSourceFile as ts.SourceFile)
        );

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

        logger.trace(
          'Call expression check:',
          nodeToString(node, this.mainSourceFile as ts.SourceFile)
        );

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

  private findExpressionsWhichUseSymbol(
    checkeesymbol: ts.Symbol,
    hoistToStatements?: boolean
  ): ts.Node[] {
    this.mainSourceFile = this.mainSourceFile as ts.SourceFile;

    if (hoistToStatements === undefined) {
      hoistToStatements = false;
    }

    const matchingExpressions: ts.Node[] = [];

    const findExpressionInternal = (node: ts.Node) => {
      const trySymbol = this.tsChecker.getSymbolAtLocation(node);
      if (trySymbol && trySymbol === checkeesymbol) {
        // Find what to push
        let toPush: ts.Node | undefined = node;
        if (hoistToStatements as boolean) {
          toPush = this.getParentStatement(node);
        }

        // If node or statement exists, push it to list
        if (toPush !== undefined) {
          matchingExpressions.push(node);
        }
      }

      ts.forEachChild(node, findExpressionInternal);
    };

    ts.forEachChild(this.mainSourceFile, findExpressionInternal);

    return matchingExpressions;
  }

  private logFindDetails(expressions: ts.Node[]) {
    logger.debug(
      'Found symbols: ',
      [...this.restrictedSymbols]
        .map(tmpSymbol => tmpSymbol.getName())
        .join(', ')
    );

    logger.debug(
      'Found expressions: ',
      expressions
        .map(expr => nodeToString(expr, this.mainSourceFile as ts.SourceFile))
        .join(', ')
    );
  }

  private getParentStatement(node: ts.Node): ts.Statement | undefined {
    return findParentOrSelfNode(node, ts.isStatement);
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
      if (getNodeEnd(expr1) !== getNodeEnd(expr2)) {
        if (getNodeEnd(expr1) > getNodeEnd(expr2)) {
          return -1;
        } else {
          return +1;
        }
      } else {
        if (getNodeStart(expr1) < getNodeStart(expr2)) {
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
        if (getNodeEnd(currentExpr) > getNodeStart(prevExpr)) {
          // When there is overlap
          if (
            getNodeStart(currentExpr) >= getNodeStart(prevExpr) &&
            getNodeEnd(currentExpr) <= getNodeEnd(prevExpr)
          ) {
            // When current expr is completely contained in prev expr

            logger.trace(
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

      const startPosition = getNodeStart(currentExpr);
      let endPosition = getNodeEnd(currentExpr);

      // Include following newlines in the replacement region
      if (newText.slice(endPosition, endPosition + 1) === '\n') {
        endPosition += 1;
      } else if (newText.slice(endPosition, endPosition + 2) === '\r\n') {
        endPosition += 2;
      }

      newText =
        newText.slice(0, startPosition) +
        '' + // Replace with empty string
        newText.slice(endPosition);
    }

    return newText;
  }

  private cleanup(): void {
    this.tmpFile.removeCallback();
  }
}

const schema = {
  type: 'object',
  properties: {
    test: {
      type: 'string',
    },
  },
};

function loader(this: WebpackLoader.LoaderContext, sourceText: string): string {
  const options = getOptions(this);

  const newLoaderInstance = new PluginLoader(this, sourceText);
  return newLoaderInstance.process();
}

export default loader;
