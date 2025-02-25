const path = require('path');
const webpack = require('webpack');

const shimJS = path.resolve(__dirname, 'src', 'emptyshim.js');
function shim(regExp) {
  return new webpack.NormalModuleReplacementPlugin(regExp, shimJS);
}
const pkg = require('./package.json');

module.exports = (env, argv) => {
  return {
    mode: 'production',
    devtool: 'source-map',
    entry: './src/index.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'lib'),
      publicPath: 'auto',
    },
    plugins: [
      new webpack.ProvidePlugin({
        currentScript: 'current-script-polyfill',
      }),
      // Not using moment
      shim(/moment/),
      // Don't need vim keymap
      shim(/codemirror\/keymap\/vim/),
      shim(/codemirror\/addon\/search/),
      // shim out some unused packages
      shim(/elliptic/),
      shim(/bn\.js/),
      shim(/readable\-stream/),
      // can we get away without react-dom?
      shim(/react\-dom/),
      // skip postcss
      shim(/postcss/),
      shim(/font\-awesome/),
      shim(/@blueprintjs/),
      // shim(/ajv/),
      // shim(/lodash/),
      // shim(/@lumino\/coreutils\/lib\/random/),
      // shim out some unused lumino
      shim(
        /@lumino\/widgets\/lib\/(box|commandpalette|contextmenu|dock|grid|menu|scroll|split|stacked|tab).*/,
      ),
      shim(/@lumino\/collections\/lib\/(bplustree).*/),
      shim(/@lumino\/(dragdrop|commands).*/),

      // unused @jupyterlab
      // shim(/@jupyterlab\/apputils/),
      shim(
        /@jupyterlab\/apputils\/lib\/(clientsession|dialog|instancetracker|mainmenu|thememanager|toolbar)/,
      ),
      // shim(/@jupyterlab\/ui-components/),
      // shim(/@jupyterlab\/apputils\/style\/.*/),

      // JupyterLab's codemirror package is also big,
      // but not so trival to shim
      // we only need CodeMirrorEditor.defaultConfig to be defined, as far as I can tell
      // shim(/@jupyterlab\/codemirror\/lib\/editor/),
      shim(/@jupyterlab\/codeeditor\/lib\/jsoneditor/),
      shim(/@jupyterlab\/coreutils\/lib\/(time|settingregistry|.*menu.*)/),
      shim(/@jupyterlab\/services\/lib\/(contents|terminal)\/.*/),
      shim(/@jupyterlab\/statusbar\/.*/),
      shim(/@jupyterlab\/theme-light-extension\/style\/(icons|images)\/.*/),
      shim(/@jupyterlab\/theme-light-extension\/style\/(urls).css/),
    ],
    optimization: {},
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'usage',
                    corejs: 3,
                    shippedProposals: true,
                    targets: {
                      browsers: ['chrome 60', 'edge 15', 'firefox 45', 'safari 10'],
                    },
                  },
                ],
              ],
            },
          },
          type: 'javascript/auto',
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          // type: 'javascript/auto',
        },
        { test: /\.html$/, type: 'asset/resource' },
        // jquery-ui loads some images
        { test: /\.(jpg|png|gif)$/, type: 'asset/resource' },
        // required to load font-awesome
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff',
          },
          type: 'javascript/auto',
        },
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff',
          },
          type: 'javascript/auto',
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream',
          },
          type: 'javascript/auto',
        },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader', type: 'javascript/auto' },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml',
          },
          type: 'javascript/auto',
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
          include: function (modulePath) {
            const m = modulePath.match(/thebe\/packages\/core\/dist/);
            return m != null;
          },
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
  };
};
