import path from 'path';
import webpack from 'webpack';
// tslint:disable-next-line:no-var-requires
const memoryfs = require('memory-fs');

export function compileTest(
  absoluteEntryFilePath: string,
  options = {}
): Promise<webpack.Stats> {
  const compiler = webpack({
    context: __dirname,
    entry: absoluteEntryFilePath,
    output: {
      path: path.resolve(__dirname, '../../test_files/'),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.js1$/,
          use: {
            loader: '../../lib/plugin-loader.js',
            // tslint:disable-next-line:object-literal-shorthand
            options: options,
          },
        },
      ],
    },
    optimization: {
      minimize: false,
    },
  });

  compiler.outputFileSystem = new memoryfs();

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      resolve(stats);
    });
  });
}
