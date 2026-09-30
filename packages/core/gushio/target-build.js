module.exports = {
  cli: {
    name: 'build',
    description: 'Build the hopkey core library',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const compileFunction = require('./compile-func')
    const fs = require('fs')

    try {
      await gushio.run(path.join(__dirname, './target-clean.js'))

      console.log('Building hopkey-core library... ')
      await compileFunction(path, shellJs)
      console.log('Build completed successfully')

      fs.copyFileSync("README.md", "dist/README.md");
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
