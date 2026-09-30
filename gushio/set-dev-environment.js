module.exports = {
  cli: {
    name: 'set-dev-environment',
    description: 'Set the environment in development mode (enable monorepo dependencies symlinks)',
    version: '0.1',
    arguments: [],
  },
  run: async () => {
    const hopkeyCoreBootstrap = require('./hopkey-core-bootstrap')
    const packageNames = ['desktop-app', 'cli']

    try {
      for (const packageName of packageNames) {
        console.log(`enabling monorepo dependencies symlinks for ${packageName}...`)
        await hopkeyCoreBootstrap(packageName, () => 'file:../core');
      }
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
