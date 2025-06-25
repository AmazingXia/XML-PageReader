const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    open: true
  },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
})