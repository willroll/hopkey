// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const environment = {
  appName: "Hopkey",
  samlRoleSessionDuration: 3600, // 1h
  sessionDuration: 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,
  lockFileDestination: ".hopkey/hopkey-lock.json",
  production: false,
  credentialsDestination: ".aws/credentials",
  deeplinkFile: ".hopkey/deeplink",
  azureMsalCacheFile: ".azure/msal_token_cache.json",
  defaultRegion: "us-east-1",
  defaultLocation: "eastus",
  defaultAwsProfileName: "default",
  defaultAzureProfileName: "default-azure",
  latestUrl: "https://github.com/willroll/hopkey/releases/latest",
};

export { environment };
