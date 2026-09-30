module.exports = {
  cli: {
    name: 'brew-release',
    description: 'Release hopkey cli on npm and homebrew',
    version: '0.2'
  },
  deps: [
    {name: '@aws-sdk/client-s3', version: '^3.67.0'},
  ],
  run: async () => {
    const shellJs = await gushio.import('shelljs')
    const path = await gushio.import('path')
    const os = await gushio.import('os')
    const {S3Client, PutObjectCommand} = await gushio.import('@aws-sdk/client-s3')

    const cliPackageJson = require('../package.json')
    const getFormula = require('./homebrew/get-formula')
    const getInstallerFormula = require('./homebrew/get-installer-formula')

    const requiredEnv = (name) => {
      if (!process.env[name]) {
        throw new Error(`${name} must be set`)
      }
      return process.env[name]
    }
    // Homebrew tap (e.g. willroll/homebrew-tap) and S3 bucket that host the formulas and the OCLIF installer
    const [gitHubOrganization, gitHubRepo] = requiredEnv('HOMEBREW_TAP_REPOSITORY').split('/')
    const npmPath = "@hopkey/cli"
    const tarballTargets = "darwin-x64"
    const s3Bucket = requiredEnv('CLI_INSTALLER_BUCKET')
    const bucketRegion = process.env['CLI_INSTALLER_BUCKET_REGION'] || "eu-west-1"

    const gitPushToken = process.env['GIT_PUSH_TOKEN']
    const credentials = gitPushToken ? `${gitPushToken}:x-oauth-basic@` : ''
    const formulaRepo = `https://${credentials}github.com/${gitHubOrganization}/${gitHubRepo}.git`
    const tempDir = os.tmpdir();
    const formulaRepoPath = path.join(tempDir, gitHubRepo);

    const baseS3PublicUrl = `https://${s3Bucket}.s3.${bucketRegion}.amazonaws.com/`
    const hopkeyCliVersion = cliPackageJson.version
    const gitFormulaCommitMessage = `hopkey-cli v${hopkeyCliVersion}`;

    try {
      console.log('Cloning formula repo... ')

      await fs.remove(formulaRepoPath)

      shellJs.cd(tempDir)
      let result = shellJs.exec(`git clone ${formulaRepo}`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }


      console.log('Downloading npm tarball... ')

      result = shellJs.exec(`npm view ${npmPath} dist.tarball`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      const tarballUrl = result.stdout.trim()

      result = shellJs.exec(`curl -o tarball ${tarballUrl}`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec(`openssl dgst -sha256 -r tarball`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      const tarballSha256 = result.stdout.split(' ')[0]


      console.log('Updating npm formula... ')

      const formula = getFormula(hopkeyCliVersion, tarballUrl, tarballSha256)
      await fs.writeFile(path.join(formulaRepoPath, 'Formula/hopkey-cli.rb'), formula)


      console.log('Generating OCLIF installer... ')

      shellJs.cd(path.join(__dirname, '..'))
      result = shellJs.exec(`npx oclif pack tarballs --targets=${tarballTargets}`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      shellJs.cd(path.join(__dirname, '../dist'))
      const tarballFileName = shellJs.ls('*.xz')[0]

      result = shellJs.exec(`openssl dgst -sha256 -r ${tarballFileName}`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      const oclifInstallerSha256 = result.stdout.split(' ')[0]


      console.log('Uploading OCLIF installer... ')

      const bucketParams = {
        Bucket: s3Bucket,
        Key: `${hopkeyCliVersion}/${tarballFileName}`,
        Body: await fs.readFile(path.join(__dirname, '../dist', tarballFileName)),
      };
      const s3Client = new S3Client({region: bucketRegion});
      await s3Client.send(new PutObjectCommand(bucketParams));

      const tarballS3Url = baseS3PublicUrl + bucketParams.Key
      const installerFormula = getInstallerFormula(hopkeyCliVersion, tarballS3Url, oclifInstallerSha256)


      console.log('Updating installer formula... ')

      await fs.writeFile(path.join(formulaRepoPath, 'Formula/hopkey-cli-darwin-arm64.rb'), installerFormula)


      console.log('Pushing updated formula repo... ')

      shellJs.cd(formulaRepoPath)
      result = shellJs.exec(`git add .`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec(`git commit -m "${gitFormulaCommitMessage}"`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec(`git push`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      await fs.remove(formulaRepoPath)
    }
  }
}
