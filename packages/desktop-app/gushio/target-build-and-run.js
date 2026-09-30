module.exports = {
  cli: {
    name: 'build',
    description: 'Build and run hopkey desktop app',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['aot', 'configuration production']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')

    const currentPath = shellJs.pwd()
    try {
      await gushio.run(path.join(__dirname, './target-build.js'), args)

      console.log('Launching hopkey... ')
      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('electron --enable-accelerated-mjpeg-decode --enable-accelerated-video --ignore-gpu-blacklist --enable-native-gpu-memory-buffers --enable-gpu-rasterization --ignore-gpu-blacklist .')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
