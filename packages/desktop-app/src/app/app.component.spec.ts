import { TestBed, waitForAsync } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { mustInjected } from "../base-injectables";
import { AppProviderService } from "./services/app-provider.service";
import { Workspace } from "@hopkey/core/models/workspace";
import { constants } from "@hopkey/core/models/constants";
import { LoggedEntry, LoggedException, LogLevel } from "@hopkey/core/services/log-service";

describe("AppComponent", () => {
  beforeEach(waitForAsync(() => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
      workspaceExists: () => true,
      getWorkspace: () => new Workspace(),
      persistWorkspace: () => {},
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      createWorkspace: () => {},
      getWorkspace: (): Workspace => new Workspace(),
    });
    const spyHopkeyCoreService = jasmine.createSpyObj("HopkeyCoreService", [], {
      workspaceService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyHopkeyCoreService })),
      declarations: [AppComponent],
    }).compileComponents();
  }));

  it("should create the app", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();

    // A deep link left by a launch while the app was closed
    (app as any).fileService = {};
    (app as any).fileService.readFileSync = jasmine.createSpy().and.returnValue("hopkey://hopkey-plugin-example");
    (app as any).fileService.existsSync = jasmine.createSpy().and.returnValue(true);
    (app as any).awsSsoRoleService = { setAwsIntegrationDelegate: () => {} };
    (app as any).windowService = { blockDevToolInProductionMode: () => {} };
    (app as any).updaterService = { createFoldersIfMissing: () => {} };
    (app as any).retroCompatibilityService = { applyWorkspaceMigrations: () => {} };
    (app as any).showCredentialBackupMessageIfNeeded = () => {};
    (app as any).manageAutoUpdate = () => {};
    (app as any).timerService = { start: () => {} };
    (app as any).loggingService = { log: () => {} };
    (app as any).behaviouralSubjectService = { fetchingIntegrationState$: { subscribe: () => {} } };
    (app as any).behaviouralSubjectService.sessions = [];
    (app as any).extensionWebsocketService = { bootstrap: () => {} };
    (app as any).remoteProceduresServer = { startServer: () => {} };
    (app as any).router = { navigate: jasmine.createSpy().and.returnValue(true) };

    constants.disablePluginSystem = true;
    (app as any).appNativeService = {
      os: {
        homedir: () => {},
      },
      path: {
        join: () => "",
      },
      ipcRenderer: { on: (_string, _callback) => {} },
      fs: { removeSync: jasmine.createSpy("removeSync") },
    };

    await app.ngOnInit();
    expect((app as any).fileService.existsSync).toHaveBeenCalled();
    expect((app as any).appNativeService.fs.removeSync).toHaveBeenCalled();
    expect((app as any).router.navigate).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("manageAutoUpdate uses the current version when the saved one can't be read", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    (app as any).updaterService.getSavedAppVersion = jasmine.createSpy().and.throwError("error");
    (app as any).updaterService.getCurrentAppVersion = jasmine.createSpy().and.returnValue("0.0.0");

    expect(() => (app as any).manageAutoUpdate()).toThrowError("this.electronService.fs.writeFileSync is not a function");
    expect((app as any).updaterService.getCurrentAppVersion).toHaveBeenCalled();
  });

  it("listens for updates and plugin links", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const listeners: { [channel: string]: (event: any, payload: any) => any } = {};
    (app as any).appNativeService = { ipcRenderer: { on: (channel, listener) => (listeners[channel] = listener) } };
    (app as any).behaviouralSubjectService = { sessions: [] };
    (app as any).appProviderService = { sessionManagementService: { updateSessions: jasmine.createSpy("updateSessions") } };
    (app as any).updaterService = {
      getSavedAppVersion: () => "0.0.1",
      getCurrentAppVersion: () => "0.0.0",
      updateVersionJson: jasmine.createSpy("updateVersionJson"),
      getReleaseNote: async () => "release-note",
      setUpdateInfo: jasmine.createSpy("setUpdateInfo"),
      isUpdateNeeded: () => true,
      updateDialog: jasmine.createSpy("updateDialog"),
    };
    (app as any).installPluginFromLink = jasmine.createSpy("installPluginFromLink");
    const pluginSystemDisabled = constants.disablePluginSystem;
    constants.disablePluginSystem = false;

    (app as any).manageAutoUpdate();
    await listeners["UPDATE_AVAILABLE"](null, { version: "1.0.0", releaseName: "Hopkey 1.0.0", releaseDate: "2026-10-01" });
    listeners["PLUGIN_URL"](null, "hopkey-plugin-example");
    constants.disablePluginSystem = pluginSystemDisabled;

    expect((app as any).updaterService.setUpdateInfo).toHaveBeenCalledWith("1.0.0", "Hopkey 1.0.0", "2026-10-01", "release-note");
    expect((app as any).updaterService.updateDialog).toHaveBeenCalled();
    expect((app as any).appProviderService.sessionManagementService.updateSessions).toHaveBeenCalled();
    expect((app as any).installPluginFromLink).toHaveBeenCalledWith("hopkey-plugin-example");
  });

  it("beforeCloseInstructions", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    (app as any).loggingService = { log: jasmine.createSpy().and.callFake(() => {}) };
    (app as any).remoteProceduresServer = { stopServer: jasmine.createSpy().and.callFake(() => {}) };
    (app as any).appProviderService = {
      sessionManagementService: {
        stopAllSessions: jasmine.createSpy().and.callFake(() => {}),
      },
    };
    (app as any).appService = { quit: jasmine.createSpy().and.callFake(() => {}) };

    await (app as any).beforeCloseInstructions();

    expect((app as any).loggingService.log).toHaveBeenCalledWith(new LoggedEntry("Closing app with cleaning process...", this, LogLevel.info));
    expect((app as any).remoteProceduresServer.stopServer).toHaveBeenCalledTimes(1);
    expect((app as any).appProviderService.sessionManagementService.stopAllSessions).toHaveBeenCalledTimes(1);
    expect((app as any).appService.quit).toHaveBeenCalledTimes(1);
  });

  describe("installPluginFromLink", () => {
    let app;
    let answer: string;

    beforeEach(() => {
      const fixture = TestBed.createComponent(AppComponent);
      app = fixture.debugElement.componentInstance;
      answer = constants.confirmed;
      (app as any).windowService = {
        confirmDialog: jasmine.createSpy("confirmDialog").and.callFake((_message, callback) => callback(answer)),
      };
      (app as any).pluginManagerService = {
        pluginPackageName: (link: string) => {
          if (link.includes("<")) {
            throw new LoggedException(`"${link}" is not the name of an npm package`, null, LogLevel.error, true);
          }
          return link.replace("hopkey://", "");
        },
        installPlugin: jasmine.createSpy("installPlugin"),
        loadFromPluginDir: jasmine.createSpy("loadFromPluginDir"),
      };
      (app as any).loggingService = { log: jasmine.createSpy("log") };
    });

    it("installs and loads the plugin once the user agrees", async () => {
      await (app as any).installPluginFromLink("hopkey://hopkey-plugin-example");

      const [message, , confirmText] = (app as any).windowService.confirmDialog.calls.mostRecent().args;
      expect(message).toContain("install the plugin <b>hopkey-plugin-example</b> from npm");
      expect(message).toContain("can use all your sessions");
      expect(confirmText).toBe("Install plugin");
      expect((app as any).pluginManagerService.installPlugin).toHaveBeenCalledWith("hopkey://hopkey-plugin-example");
      expect((app as any).pluginManagerService.loadFromPluginDir).toHaveBeenCalled();
    });

    it("installs nothing when the user cancels", async () => {
      answer = constants.confirmClosed;
      await (app as any).installPluginFromLink("hopkey://hopkey-plugin-example");

      expect((app as any).windowService.confirmDialog).toHaveBeenCalled();
      expect((app as any).pluginManagerService.installPlugin).not.toHaveBeenCalled();
      expect((app as any).pluginManagerService.loadFromPluginDir).not.toHaveBeenCalled();
    });

    it("doesn't ask about a link that isn't an npm package", async () => {
      await (app as any).installPluginFromLink("hopkey://<img src=x>");

      expect((app as any).windowService.confirmDialog).not.toHaveBeenCalled();
      expect((app as any).pluginManagerService.installPlugin).not.toHaveBeenCalled();
      expect((app as any).loggingService.log.calls.mostRecent().args[0].message).toBe('"hopkey://<img src=x>" is not the name of an npm package');
    });

    it("reports a plugin that fails to install", async () => {
      (app as any).pluginManagerService.installPlugin.and.rejectWith(new Error("socket hang up"));
      await (app as any).installPluginFromLink("hopkey://hopkey-plugin-example");

      const logged = (app as any).loggingService.log.calls.mostRecent().args[0];
      expect(logged.message).toBe("Hopkey could not install the plugin: socket hang up");
      expect(logged.display).toBeTrue();
    });
  });
});
