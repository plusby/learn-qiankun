const packageName = require('./package.json').name;

module.exports = {
  devServer: {
    port: 8088,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  configureWebpack: {
    output: {
      library: `vueApp`,
      libraryTarget: 'umd',
    },
  },
  lintOnSave: false
};