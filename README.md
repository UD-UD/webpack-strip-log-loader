<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

# webpack-strip-log-loader

A webpack loader to remove import and other statements containing reference to a module (usually, logger module).

## Use case

Removing all lines which directly or indirectly reference to a third-party (or, inbuilt) logging module during production build. 

For ex, removing all calls to winston logger or removing all console.* statements.

Example 1 : 

Removes logger module and its usage

```javascript
// Pre 
import {Logger, defaultLogger} from 'logger'; // strip-log
console; // strip-log

const myLogger = new Logger({level: 2});

var someInt = 123;
var someInt2 = someInt * 2;

myLogger.debug(someInt);
defaultLogger.log(someInt2);

function abc() {
    var someObj = {};
    
    console.log(someObj);
    return someObj;
}
```

```javascript
// Post 
var someInt = 123;
var someInt2 = someInt * 2;

function abc() {
    var someObj = {};
    
    return someObj;
}
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

## Usage

To remove the affected lines during build, there are two things that you need to care about:

1. Marking symbols as restricted (ussually once)
2. Using this symbols in different language constructs

To give an example, 

### Marking restricted symbols

#### 1. ES6 import and require calls (with strip-log comment)


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

#### 2. Explicit symbol(s) (variable) marking

Restrict a symbol :

```js
console; // strip-log
```

Restrict multiple symbols at once :

```js
console1, console2; // strip-log
```

#### 3. Loader config

In webpack config file,
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

This is equivalent to marking all import statements to "some-logger" in all files with comment strip-log.