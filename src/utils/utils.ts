import * as ts from 'byots';

export const nodeToString = (
  node: ts.Node,
  sourceFile: ts.SourceFile
): string => {
  // const sourceFile: ts.SourceFile = ts.createSourceFile(
  //   'test.ts',
  //   '',
  //   ts.ScriptTarget.ES2015,
  //   true,
  //   ts.ScriptKind.TS
  // );
  return ts
    .createPrinter()
    .printNode(ts.EmitHint.Unspecified, node, sourceFile);
};

// findChildNode
export function findChildNode<T extends ts.Node>(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => testNode is T
): T | undefined;

export function findChildNode(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): ts.Node | undefined;

export function findChildNode<T extends ts.Node>(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): T | undefined {
  let result: T | undefined;

  function _findChildNode(node: ts.Node) {
    if (result) {
      return;
    }
    if (fnTest(node)) {
      result = node as T;
      return;
    }
    ts.forEachChild(node, _findChildNode);
  }
  _findChildNode(rootNode);

  return result;
}

// findChildNodes
export function findChildNodes<T extends ts.Node>(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => testNode is T
): T[];

export function findChildNodes(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): ts.Node[];

export function findChildNodes<T extends ts.Node>(
  rootNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): T[] {
  const resultNodes: T[] = [];

  function _findChildNode(node: ts.Node) {
    if (fnTest(node)) {
      resultNodes.push(node as T);
    }
    ts.forEachChild(node, _findChildNode);
  }
  _findChildNode(rootNode);

  return resultNodes;
}

// findParentOrSelfNode
export function findParentOrSelfNode<T extends ts.Node>(
  childNode: ts.Node,
  fnTest: (testNode: ts.Node) => testNode is T
): T | undefined;

export function findParentOrSelfNode(
  childNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): ts.Node | undefined;

export function findParentOrSelfNode<T extends ts.Node>(
  childNode: ts.Node,
  fnTest: (testNode: ts.Node) => boolean
): T | undefined {
  if (fnTest(childNode)) {
    return childNode as T;
  } else {
    const nextNode = childNode.parent;

    if (nextNode === undefined) {
      return undefined;
    } else {
      return findParentOrSelfNode(nextNode, fnTest) as T;
    }
  }
}

export const getCommentRanges = (
  node: ts.Node,
  sourceString: string,
  isTrailing: boolean = false
): ts.CommentRange[] | undefined => {
  if (node.parent) {
    const nodePos = isTrailing ? node.end : node.pos;
    const parentPos = isTrailing ? node.parent.end : node.parent.pos;

    if (
      node.parent.kind === ts.SyntaxKind.SourceFile ||
      nodePos !== parentPos
    ) {
      const comments: ts.CommentRange[] | undefined = isTrailing
        ? ts.getTrailingCommentRanges(sourceString, nodePos)
        : ts.getLeadingCommentRanges(sourceString, nodePos);

      return comments;
    }
  }
};

export const getComments = (
  node: ts.Node,
  sourceString: string,
  isTrailing: boolean = false
): string[] => {
  const comments = getCommentRanges(node, sourceString, isTrailing);

  if (typeof comments !== 'undefined') {
    const commentStrings = comments.map<string>(comment => {
      // comment.type = syntaxKind[comment.kind];
      return sourceString.substring(comment.pos, comment.end);
    });
    return commentStrings;
  } else {
    return [];
  }
};

export function getNodeStart(exp: ts.Node, sourceString?: string) {
  return exp.getStart();
}

export function getNodeEnd(exp: ts.Node, sourceString?: string) {
  if (sourceString === undefined) {
    sourceString = exp.getSourceFile().getFullText();
  }

  const endPositions: number[] = [];
  endPositions.push(exp.getEnd());

  const comments = getCommentRanges(exp, sourceString, true);
  if (comments !== undefined) {
    comments.forEach(commentRange => {
      endPositions.push(commentRange.end);
    });
  }

  return Math.max(...endPositions);
}

// export function cloneNode(node: any): any {
//   if (ts.isObjectLiteralExpression(node)) {
//     node = node as ts.ObjectLiteralExpression;
//     return ts.createObjectLiteral(
//       node.properties && node.properties.map(cloneNode),
//       node.multiLine
//     );
//   } else if (ts.isArrayLiteralExpression(node)) {
//     node = node as ts.ArrayLiteralExpression;
//     return ts.createArrayLiteral(
//       node.elements && node.elements.map(cloneNode),
//       node.multiLine
//     );
//   } else if (ts.isPropertyAssignment(node)) {
//     node = node as ts.PropertyAssignment;
//     return ts.createPropertyAssignment(
//       cloneNode(node.name),
//       cloneNode(node.initializer)
//     );
//   } else if (ts.isFunctionExpression(node)) {
//     node = node as ts.FunctionExpression;
//     return ts.createFunctionExpression(
//       node.modifiers && node.modifiers.map(cloneNode),
//       node.asteriskToken && cloneNode(node.asteriskToken),
//       node.name,
//       node.typeParameters && node.typeParameters.map(cloneNode),
//       node.parameters.map(cloneNode),
//       node.type,
//       cloneNode(node.body)
//     );
//   } else if (ts.isBlock(node)) {
//     node = node as ts.Block;
//     return ts.createBlock(node.statements.map(cloneNode), node.multiLine);
//   } else if (ts.isVariableDeclaration(node)) {
//     node = node as ts.VariableDeclaration;
//     return ts.createVariableDeclaration(
//       node.name,
//       node.type,
//       cloneNode(node.initializer)
//     );
//   } else if (ts.isVariableDeclarationList(node)) {
//     node = node as ts.VariableDeclarationList;
//     return ts.createVariableDeclarationList(
//       node.declarations.map(cloneNode),
//       node.flags
//     );
//   } else if (ts.isVariableDeclaration(node)) {
//     node = node as ts.VariableDeclaration;
//     return ts.createVariableDeclaration(
//       node.name,
//       node.type,
//       cloneNode(node.initializer)
//     );
//   } else if (ts.isIdentifier(node)) {
//     node = node as ts.Identifier;
//     return ts.createIdentifier(node.text);
//   } else if (ts.isNumericLiteral(node)) {
//     node = node as ts.NumericLiteral;
//     return ts.createNumericLiteral(node.text);
//   } else if (ts.isStringLiteral(node)) {
//     node = node as ts.StringLiteral;
//     return ts.createLiteral(node.text);
//   } else {
//     return node;
//   }
// }
