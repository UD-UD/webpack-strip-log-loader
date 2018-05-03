<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

# webpack-strip-log-loader

A webpack loader that can remove import and other usage statements from a logger module.

Look in the examples section to understand what is supported.

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

## Examples

### Marking restricted symbols

1. ES6 import and require calls (with strip-log comment)

Default import : 
```
import logger from 'some-logger'; // strip-log
```

Namespace import :
```
import * as logger2 from 'some-logger'; // strip-log
```

Named import :
```
import {log as speak, warn} from 'some-logger'; // strip-log
```

```
var logger = require('some-logger') // strip-log
```

2. Explicit symbol(s) (variable) marking

Restrict a symbol :
```
console; // strip-log
```

Restrict multiple symbols at once :
```
console1, console2; // strip-log
```

3. Loader config

In webpack config file,
```
    module: {
      rules: [
        {
          test: /\.js1$/,
          use: {
            loader: '../../lib/plugin-loader.js',
            // tslint:disable-next-line:object-literal-shorthand
            options: {
                "modules": "some-logger"
            },
          },
        },
      ],
    },
```