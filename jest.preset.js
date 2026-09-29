module.exports = {
  verbose: true,
  silent: false,
  testMatch: [
    "**/*.spec.ts",
    "!dist/",
    "!node_modules/"
  ],
  moduleNameMapper: {
    "^@noovolari/leapp-core/(.*)$": "@noovolari/leapp-core/dist/$1",
    "axios": "axios/dist/node/axios.cjs",
    // Jest 27 does not resolve package.json "exports" subpaths used by puppeteer >= 20
    "^puppeteer-core/internal/(.*)$": "<rootDir>/node_modules/puppeteer-core/lib/cjs/puppeteer/$1"
  }
}
