import { WindowService } from "./window.service";

describe("WindowService", () => {
  let service: WindowService;
  let windows: any[];
  let ipcRenderer: any;
  let logService: any;
  let resolveProxy: () => void;
  let rejectProxy: (error: Error) => void;

  beforeEach(() => {
    windows = [];
    ipcRenderer = {
      invoke: jasmine.createSpy("invoke").and.callFake(
        () =>
          new Promise<void>((resolve, reject) => {
            resolveProxy = resolve;
            rejectProxy = reject;
          })
      ),
    };
    class FakeWindow {
      loadURL = jasmine.createSpy("loadURL");
      constructor(public options: any) {
        windows.push(this);
      }
      setMenuBarVisibility(): void {}
      removeMenu(): void {}
      setMenu(): void {}
    }
    logService = { log: jasmine.createSpy("log") };
    service = new WindowService(null, { browserWindow: FakeWindow, os: { platform: () => "linux" }, ipcRenderer } as any, { logService } as any);
  });

  it("newWindow gives the window a session of its own, and has the proxy applied to it", () => {
    const window = service.newWindow("https://idp.example.com/login", true, "IDP - Login");

    const partition = `persist:hopkey-${btoa("https://idp.example.com/login")}`;
    expect(window.options.webPreferences.partition).toBe(partition);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("SET_PARTITION_PROXY", partition);
  });

  it("loadUrl loads the page once the window's session goes through the proxy", async () => {
    const window = service.newWindow("https://idp.example.com/login", true);

    const loading = service.loadUrl(window, "https://idp.example.com/login");
    await Promise.resolve();
    expect(window.loadURL).not.toHaveBeenCalled();

    resolveProxy();
    await loading;
    expect(window.loadURL).toHaveBeenCalledWith("https://idp.example.com/login");
  });

  it("loadUrl still loads the page, and logs it, when the proxy can't be applied", async () => {
    const window = service.newWindow("https://idp.example.com/login", true);

    const loading = service.loadUrl(window, "https://idp.example.com/login");
    rejectProxy(new Error("no main process"));
    await loading;

    expect(window.loadURL).toHaveBeenCalledWith("https://idp.example.com/login");
    expect(logService.log.calls.mostRecent().args[0].message).toBe("Could not apply the proxy to the window: no main process");
  });
});
