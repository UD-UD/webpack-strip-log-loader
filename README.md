<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

# webpack-strip-log-loader

A webpack loader to remove import and other statements containing reference to a module (usually, logger module).

## Use case

_Removing all lines which directly or indirectly reference to a third-party (or, inbuilt) logging module during production build._

For ex, removing all calls to winston logger or removing all console.* statements.

Example 1 : 

Removes logger module and its usage

```javascript
// Pre 
import {Logger, defaultLogger} from 'logger'; // strip-log

const myLogger = new Logger({level: 2});

var someInt = 123;
var someInt2 = someInt * 2;

myLogger.debug(someInt);
defaultLogger.log(someInt2);
```

```javascript
// Post 
var someInt = 123;
var someInt2 = someInt * 2;
```


Example 2 :

Removes console.* usage


```javascript
// Pre 
console; // strip-log

function abc() {
    var someObj = {};
    
    console.log(someObj);
    return someObj;
}
```

```javascript
// Post 
function abc() {
    var someObj = {};
    
    return someObj;
}
```


Please look in the usage and examples section to understand more.

## Getting Started

To begin, you'll need to install `webpack-strip-log-loader`:

```console
$ npm install webpack-strip-log-loader --save-dev
```

Then add the loader to your `webpack` config. For example:

```js
// webpack.config.js
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'webpack-strip-log-loader',
        // Options is optional and should include the module names whose usage (via import/require) will be stripped (in any matching file)
        options: {
            modules: ["remove-module-name"]
        }
      }
    ]
  }
}
```

And run `webpack` via your preferred method.

Note: We have only tested this with Webpack 3 and 4. For webpack 3, use its corresponding configuration format.

## Terminologies

Knowing some terms will help you in the later section.

We will first try to show them directly within a pseudo code snippet and then proceed to describe them.

```javascript
 
// RS = Restricted symbol
// RE = Restricted expression
// RM = Restricted module

import {Logger, defaultLogger} from 'logger'; // strip-log
//      (^ RS ) (^ RS       )       (^ RM  )  (^ Trigger comment)

console; // strip-log
//       (^ Trigger comment)

const myLogger = new Logger({level: 2}); // normal comment
//   (^ RS   )   (^ RE                )

var someInt = 123;
var someInt2 = someInt * 2;

myLogger.debug(someInt);
//(^ RS)
//(^ RE              )

defaultLogger.log(someInt2);
//(^ RS)
//(^ RE                   )
```
**Trigger comment** - Comment with special content to mark its associated statement for further scrutiny.

**Restricted module** - Modules whose usage you want to remove. Its content is not changed. Typically, log modules can be marked as restricted.

**Symbol** - Symbols are equivalent to what we think of as variables. Wherever you use the same variable (variable hiding in inner scope creates new variable), you can think of them as the same symbol.

**Restricted symbol** -  Restricted symbols are those symbols which either have some dependency on restricted modules or are explicitly marked as restricted. Any statement which uses this symbol will be removed. It is also used to find more related restricted symbols or expressions (for eg. when you assign a different variable/symbol to the value of an already restricted symbol, the assignee symbol also gets marked as restricted).

**Restricted expression** - These are those expressions which have some dependency on other restricted symbols or expressions. For eg. `new abc()` becomes a restricted expression if `abc` is a restricted symbol.

## Usage

To remove the affected lines during build, there are two phases that you need to care about:

1. Marking symbols as restricted
2. Using restricted symbols in language constructs


### 1. Marking restricted symbols

The following types of statements are monitored for finding initial restricted symbols.

#### A. ES6 import and require calls (with strip-log comment)


Default import : 

```js
import logger from 'some-logger'; // strip-log
```

Namespace import :

```js
import * as logger2 from 'some-logger'; // strip-log
```

Named import :

```js
import {log as speak, warn} from 'some-logger'; // strip-log
```

Require statement:

```js
var logger = require('some-logger') // strip-log
```

Note: 
After build, this "marking" import / require statements will be removed.

#### B. Explicit symbol(s) marking

Restrict a symbol :

```js
console; // strip-log
```

Restrict multiple symbols at once :

```js
console1, console2; // strip-log
```
Note: 
After build, this "marking" statements will be removed.

#### C. Loader config

In webpack config file, pass options to this loader in the form of `{modules: string[] }` where modules is an array of globally restricted module names.

This is equivalent to marking all import statements to "some-logger" in all files with comment strip-log.

```js
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'webpack-strip-log-loader',
            options: {
                "modules": "some-logger"
            },
          },
        },
      ],
    },
```



### 2. Using restricted symbols in language constructs

Following type of language constructs are looped through to find more restricted expression or symbol.
#### A. Function call

```js
// ## Pre ##
import defaultLogger from 'some-logger';// strip-log
defaultLogger('Init');

someOtherFunction();
```

```js
// ## Post ##
// strip-log


someOtherFunction();
```

The whole function call expression for `defautLogger` becomes a restricted expression if the function itself is restricted.

#### B. Simple assignment

```js
// ## Pre ##
import defaultLogger from 'some-logger';// strip-log

var logger = defaultLogger;
var a = 1; // some other assignment

logger('Init');
```

```js
// ## Post ##
// strip-log


var a = 1; // some other assignment


```
The variable/symbol `logger` also becomes restricted as it was assigned to the same value as `defaultLogger`, which is a restricted symbol. Hence, function calls to `logger` would also be marked as restricted expression.

#### C. New call

```js
// ## Pre ##
import Logger from 'some-logger'; // strip-log

var someLogger = new Logger({level:3});
someLogger('Init');

var a = new List(); // some other new call
```

```js
// ## Post ##
// strip-log




var a = new List(); // some other new call
```

The variable/symbol `someLogger` becomes restricted as it was assigned to the new expression, which becomes restricted as the newee `Logger` symbol is restricted.

#### D. Property access (by dot notation)

```js
// ## Pre ##
import defaultLogger from 'some-logger';// strip-log
defaultLogger.log('Init');

someOtherFunction();
```

```js
// ## Post ##
// strip-log

someOtherFunction();
```
The expression `defaultLogger.log` becomes restricted as `defaultLogger` symbol is restricted. Eventually any call with that expression as the callee also becomes restricted as mentioned in previous `Function call` section.

Note: Combinations of this various constructs should work in most cases.

## Removing statements, expressions and comments

Any restricted expression has to get removed during build. But replacing any expression with blank space is dangerous.

Consider the following:

```js
// ## Pre ##
import LogError from 'some-logger';

throw new LogError('Output stream not found');
```

If we just replaced the restricted new expression with blank, it would look like:


```js
// ## Post ##
import LogError from 'some-logger';

throw ;
```

which would be an invalid javascript syntax (as blank is not an expression).

We could have replaced expressions with `undefined` which would be an appropriate replacement expression (although it might not have _looked_ good ). 
But instead we have decided to (move up the AST tree from any restricted expression to) find out the its parent statement and remove the complete statement with blank.

Right now, this creates a empty new line for removed statements and **doesn't** remove any comment (if any) on that line. 

Note: We have future plans for removing those comments which are used to only  restrict symbols or import statements. Other comments should be handled with separate webpack plugins.

## More examples -

Examples showing more complex cases due to mixing of multiple language constructs will be added soon.


## Philosophy & Approach

Usually, we prefer to keep logs enabled in developemnt build, and supress them in production build. 

Typical solution to this is to make the log function calls no-op depending on some environment variable. But with this solution, the function call statements and other log setup statements are still present in the built source code - even though they don't cause anything.

Instead, what if we could completely remove those statements during  build by static analysis? That should cause slight performance improvement and cleanup the code a little bit. This was our motivation to build such a webpack plugin.

Our approach is to use Typescript compiler API to parse and understand the source file, then find the variables and expressions which depend on the restricted module and finally remove those occurences with string replacement.

There are a few *finder* methods which move through the whole AST to find more restricted symbols and expressions from the existing ones (already identified restricted symbols / expressions). We use multiple passes (each pass calls all the finders sequentially) to find this information. Whenever any of the finders add a new restricted symbol / expression, we do one more pass. When a complete pass doesn't find anything new, finding is considered complete.

## Scope

We support a few language constructs using finders, which we think are mostly needed to use log modules. We will always try to stay true to our original goals and don't aim to grow this as a generic dependency removal plugin.

## Contributing

Contribution is highly welcome from anyone. 
Please look into the scope before raising a new feature request. Having said that, if you have a use case where we should support more things, please let us know. 

We are eager to help the community by building better tools.

## Thanks

Lots of thanks to 
* FusionCharts (my employer) for letting me build this during office hours 
* And my colleagues there for the awesome ideas and feedback regarding this project