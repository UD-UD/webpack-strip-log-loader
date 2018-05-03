Webpack Strip Log Loader
----------------------------

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