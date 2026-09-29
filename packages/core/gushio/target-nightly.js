module.exports = {
  cli: {
    name: 'nightly',
    description: 'Release the hopkey-core library on NPM under the branch Nightly',
    version: '0.1',
  },
  deps: [],
  run: async () => {
    const path = await gushio.import('path')
    const shellJs = await gushio.import('shelljs')
    const readPackageJsonFunction = require('../../../gushio/read-package-json-func')
    const writePackageJsonFunction = require('../../../gushio/write-package-json-func')
    const getNightlyVersion = require('../../../gushio/get-nightly-version')

    let corePackage;
    let originalPackage;

    try {
      console.log('Reading hopkey-core library package.json... ')
      corePackage = await readPackageJsonFunction(path, "core");
      originalPackage = JSON.parse(JSON.stringify(corePackage));

      corePackage["name"] = `@hopkey/core-nightly`;
      corePackage["version"] = corePackage["version"] + `-nightly.${getNightlyVersion()}`;

      await writePackageJsonFunction(path, "core", corePackage);

      shellJs.cd(path.join(__dirname, '..'))
      let result = shellJs.exec('npm run build')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('hopkey-core published on npm')
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "core", originalPackage);
    }
  }
}
