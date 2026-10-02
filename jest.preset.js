module.exports = {
  verbose: true,
  silent: false,
  testMatch: [
    "**/*.spec.ts",
    "!dist/",
    "!node_modules/"
  ],
  moduleNameMapper: {
    "^@hopkey/core/(.*)$": "@hopkey/core/dist/$1",
    "axios": "axios/dist/node/axios.cjs"
  }
}
