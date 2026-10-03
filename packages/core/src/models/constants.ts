export const constants = {
  //General
  appName: "Hopkey",
  lockFileDestination: ".hopkey/hopkey-lock.json",
  lockFileBackupPath: ".hopkey/hopkey-lock.backup.bin",
  latestUrl: "https://github.com/willroll/hopkey/releases/latest",
  workspaceLastVersion: 7,
  communityUrl: "https://github.com/willroll/hopkey/discussions",

  //Aws
  samlRoleSessionDuration: 3600, // 1h
  sessionDuration: 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,
  credentialsDestination: ".aws/credentials",
  defaultRegion: "us-east-1",
  maxSsoTps: 5, // Transaction per second for AWS SSO endpoint

  //Azure
  azureMsalCacheFile: ".azure/msal_token_cache.json",
  defaultLocation: "eastus",
  defaultAwsProfileName: "default",
  defaultAzureProfileName: "default-azure",

  inApp: "In-app",
  inBrowser: "In-browser",
  forcedCloseBrowserWindow: "ForceCloseBrowserWindow",

  confirmed: "**CONFIRMED**",
  confirmClosed: "**MODAL_CLOSED**",
  confirmClosedAndIgnoreUpdate: "**IGNORE_UPDATE_AND_MODAL_CLOSED**",
  confirmCloseAndDownloadUpdate: "**GO_TO_DOWNLOAD_PAGE_AND_MODAL_CLOSED**",

  macOsTerminal: "Terminal",
  macOsIterm2: "iTerm2",
  macOsWarp: "Warp",
  systemDefaultTheme: "System Default",

  lightTheme: "Light Theme",
  darkTheme: "Dark Theme",
  colorTheme: "System Default",

  cliStartAwsFederatedSessionChannel: "aws-federated-session-start-channel",
  cliLogoutAwsFederatedSessionChannel: "aws-federated-session-logout-channel",
  cliRefreshSessionsChannel: "refresh-sessions-channel",
  ipcServerId: "hopkey_da",

  roleSessionName: "assumed-from-hopkey",
  // Credential Process
  credentialFile: "credential-file-method",
  credentialProcess: "credential-process-method",

  // SSM region behavior
  ssmRegionNo: "No",
  ssmRegionDefault: "Use default region",

  // Contains Env for SSM on macOS
  ssmSourceFileDestination: ".hopkey/ssm-env",
  pluginEnvFileDestination: ".hopkey/plugin-env",

  npmRequiredPluginKeyword: "hopkey-plugin",
  disablePluginSystem: false,
};
