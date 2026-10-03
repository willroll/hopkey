const { app, ipcMain, session } = require("electron");

interface Proxy {
  rules: string;
  username?: string;
  password?: string;
}

/**
 * Sends the app's network traffic through the proxy that the window sets from the options. Every Electron session
 * follows it: the default one, which carries the window's requests (the AWS calls among them) and the sign-in windows,
 * and the one electron-updater checks for updates with. Without a proxy, Electron follows the system's settings.
 *
 * @returns a promise resolved once the window has set the proxy, or said there's none
 */
export const setUpProxy = (autoUpdater: any): Promise<void> => {
  let proxy: Proxy | undefined;
  const sessions: any[] = [];
  let resolveSet: () => void;
  const set = new Promise<void>((resolve) => (resolveSet = resolve));

  const apply = async (target: any): Promise<void> => {
    await target.setProxy(proxy ? { proxyRules: proxy.rules } : { mode: "system" });
    // Connections opened before the change would keep bypassing it
    await target.closeAllConnections();
  };

  app.on("session-created", (created: any) => {
    sessions.push(created);
    if (proxy) {
      apply(created).catch((error) => console.error("[PROXY] Could not apply the proxy to a new session:", error));
    }
  });

  ipcMain.handle("SET_PROXY", async (_event: any, settings?: Proxy) => {
    proxy = settings?.rules ? settings : undefined;
    const targets = sessions.includes(session.defaultSession) ? sessions : [session.defaultSession, ...sessions];
    await Promise.all(targets.map(apply));
    resolveSet();
  });

  // The windows with a session of their own wait for it to go through the proxy before they load a page
  ipcMain.handle("SET_PARTITION_PROXY", (_event: any, partition: string) => apply(session.fromPartition(partition)));

  // Only the proxy gets the credentials from the options
  app.on("login", (event: any, _webContents: any, _details: any, authInfo: any, callback: (username: string, password: string) => void) => {
    if (authInfo.isProxy && proxy?.username) {
      event.preventDefault();
      callback(proxy.username, proxy.password ?? "");
    }
  });
  autoUpdater.on("login", (authInfo: any, callback: (username?: string, password?: string) => void) => {
    if (authInfo.isProxy && proxy?.username) {
      callback(proxy.username, proxy.password ?? "");
    } else {
      callback();
    }
  });
  return set;
};
