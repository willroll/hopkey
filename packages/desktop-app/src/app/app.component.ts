import { Component, OnInit } from "@angular/core";
import { RemoteProceduresServer } from "@hopkey/core/services/remote-procedures-server";
import { environment } from "../environments/environment";
import { AppService } from "./services/app.service";
import { Router } from "@angular/router";
import { setTheme } from "ngx-bootstrap/utils";
import { AppMfaCodePromptService } from "./services/app-mfa-code-prompt.service";
import { AppAwsAuthenticationService } from "./services/app-aws-authentication.service";
import { UpdaterService } from "./services/updater.service";
import compareVersions from "compare-versions";
import { LoggedEntry, LogLevel, LogService } from "@hopkey/core/services/log-service";
import { BehaviouralSubjectService } from "@hopkey/core/services/behavioural-subject-service";
import { TimerService } from "@hopkey/core/services/timer-service";
import { constants } from "@hopkey/core/models/constants";
import { FileService } from "@hopkey/core/services/file-service";
import { AwsCoreService } from "@hopkey/core/services/aws-core-service";
import { RetroCompatibilityService } from "@hopkey/core/services/retro-compatibility-service";
import { AppProviderService } from "./services/app-provider.service";
import { SessionFactory } from "@hopkey/core/services/session-factory";
import { RotationService } from "@hopkey/core/services/rotation-service";
import { AppVerificationWindowService } from "./services/app-verification-window.service";
import { WindowService } from "./services/window.service";
import { AppNativeService } from "./services/app-native.service";
import { AwsSsoIntegrationService } from "@hopkey/core/services/integration/aws-sso-integration-service";
import { AwsSsoRoleService } from "@hopkey/core/services/session/aws/aws-sso-role-service";
import { OptionsService } from "./services/options.service";
import { IntegrationIsOnlineStateRefreshService } from "@hopkey/core/services/integration/integration-is-online-state-refresh-service";
import { AzureSessionService } from "@hopkey/core/services/session/azure/azure-session-service";
import { AzureCoreService } from "@hopkey/core/services/azure-core-service";
import { PluginManagerService } from "@hopkey/core/plugin-sdk/plugin-manager-service";
import { ExtensionWebsocketService } from "./services/extension-websocket.service";
import { AnalyticsService } from "./services/analytics.service";
import { legacyApp } from "@hopkey/core/services/legacy-import-service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: false,
})
export class AppComponent implements OnInit {
  fetchingState: string | undefined;

  private fileService: FileService;
  private awsCoreService: AwsCoreService;
  private loggingService: LogService;
  private timerService: TimerService;
  private sessionServiceFactory: SessionFactory;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private retroCompatibilityService: RetroCompatibilityService;
  private rotationService: RotationService;
  private awsSsoIntegrationService: AwsSsoIntegrationService;
  private awsSsoRoleService: AwsSsoRoleService;
  private remoteProceduresServer: RemoteProceduresServer;
  private integrationIsOnlineStateRefreshService: IntegrationIsOnlineStateRefreshService;
  private azureSessionService: AzureSessionService;
  private azureCoreService: AzureCoreService;
  private pluginManagerService: PluginManagerService;

  /* Main app file: launches the Angular framework inside Electron app */
  constructor(
    public appProviderService: AppProviderService,
    public mfaCodePrompter: AppMfaCodePromptService,
    public awsAuthenticationService: AppAwsAuthenticationService,
    public verificationWindowService: AppVerificationWindowService,
    public appService: AppService,
    public router: Router,
    private optionsService: OptionsService,
    private updaterService: UpdaterService,
    private windowService: WindowService,
    private appNativeService: AppNativeService,
    private extensionWebsocketService: ExtensionWebsocketService,
    private analyticsService: AnalyticsService
  ) {
    appProviderService.mfaCodePrompter = mfaCodePrompter;
    appProviderService.awsAuthenticationService = awsAuthenticationService;
    appProviderService.verificationWindowService = verificationWindowService;
    appProviderService.windowService = windowService;

    this.fileService = appProviderService.fileService;
    this.awsCoreService = appProviderService.awsCoreService;
    this.loggingService = appProviderService.logService;
    this.timerService = appProviderService.timerService;
    this.sessionServiceFactory = appProviderService.sessionFactory;
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.retroCompatibilityService = appProviderService.retroCompatibilityService;
    this.rotationService = appProviderService.rotationService;
    this.awsSsoIntegrationService = appProviderService.awsSsoIntegrationService;
    this.awsSsoRoleService = appProviderService.awsSsoRoleService;
    this.remoteProceduresServer = appProviderService.remoteProceduresServer;
    this.integrationIsOnlineStateRefreshService = appProviderService.integrationIsOnlineStateRefreshService;
    this.azureSessionService = appProviderService.azureSessionService;
    this.azureCoreService = appProviderService.azureCoreService;
    this.pluginManagerService = appProviderService.pluginManagerService;

    this.setInitialColorSchema();
    this.setColorSchemaChangeEventListener();
  }

  async ngOnInit(): Promise<void> {
    this.awsSsoRoleService.setAwsIntegrationDelegate(this.awsSsoIntegrationService);

    // We get the right moment to set an hook to app close
    const ipcRenderer = this.appNativeService.ipcRenderer;
    ipcRenderer.on("app-close", () => {
      this.loggingService.log(new LoggedEntry("Preparing for closing instruction...", this, LogLevel.info));
      this.beforeCloseInstructions();
    });

    ipcRenderer.on("select-all", () => {
      if (document.activeElement.tagName === "INPUT" && document.activeElement.attributes.getNamedItem("type").value === "text") {
        (document.activeElement as HTMLInputElement).select();
      }
    });

    // Use ngx bootstrap 4
    setTheme("bs4");

    if (environment.production) {
      // Clear both info and warn message in production
      // mode without removing them from code actually
      console.warn = () => {};
      console.log = () => {};
    }

    // Prevent Dev Tool to show on production mode
    // this.windowService.getCurrentWindow().webContents.openDevTools();
    this.windowService.blockDevToolInProductionMode();

    // Create folders and files if missing
    this.updaterService.createFoldersIfMissing();

    // Copy the system vault secrets of a workspace imported from the app Hopkey was forked from:
    // the migrations below may need them
    await this.importLegacySecrets();

    // Before retrieving an actual copy of the workspace we
    // check and in case apply, our retro compatibility service
    await this.retroCompatibilityService.applyWorkspaceMigrations();

    await this.moveProxyPasswordToKeychain();
    await this.applyProxy();

    // Check the existence of a pre-Hopkey credential file and make a backup
    this.showCredentialBackupMessageIfNeeded();

    // All sessions start stopped when app is launched
    if (this.behaviouralSubjectService.sessions.length > 0) {
      for (let i = 0; i < this.behaviouralSubjectService.sessions.length; i++) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(this.behaviouralSubjectService.sessions[i].type);
        await concreteSessionService.stop(this.behaviouralSubjectService.sessions[i].sessionId);
      }
    }

    // Start Global Timer
    this.timerService.start(() => this.timerFunction(this.rotationService, this.integrationIsOnlineStateRefreshService));

    // Launch Auto Updater Routines
    this.manageAutoUpdate();

    if (!constants.disablePluginSystem) {
      this.appProviderService.pluginManagerService.verifyAndGeneratePluginFolderIfMissing();
      await this.appProviderService.pluginManagerService.loadFromPluginDir();
      this.loggingService.log(
        new LoggedEntry(`Loaded plugins...\n\n${this.appProviderService.pluginManagerService.pluginContainers}`, this, LogLevel.info)
      );
    }

    let pluginLink: string;

    // Deep link with app closed
    if (this.fileService.existsSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile))) {
      try {
        const deepLink = this.fileService.readFileSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile));
        if (!constants.disablePluginSystem) {
          pluginLink = deepLink;
        }
      } catch (err) {
        this.loggingService.log(new LoggedEntry(`Error in install plugin from file: ${err.toString()}`, this, LogLevel.info));
      } finally {
        this.appNativeService.fs.removeSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile));
      }
    }

    this.behaviouralSubjectService.fetchingIntegrationState$.subscribe((fetchingState: string | undefined) => {
      this.fetchingState = fetchingState;
    });

    this.analyticsService.init();
    await this.router.navigate(["/dashboard"]);

    // Start the websocket server for the Hopkey Browser Extension
    this.extensionWebsocketService.bootstrap();

    (async (): Promise<void> => this.remoteProceduresServer.startServer())();

    // Asked once the app is up, so that the question doesn't hold up the launch
    if (pluginLink) {
      this.installPluginFromLink(pluginLink);
    }
  }

  closeAllRightClickMenus(): void {
    this.appService.closeAllMenuTriggers();
  }

  private timerFunction(rotationService: RotationService, integrationIsOnlineStateRefreshService: IntegrationIsOnlineStateRefreshService): void {
    rotationService.rotate();
    integrationIsOnlineStateRefreshService.refreshIsOnlineState();
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  private async beforeCloseInstructions() {
    // Check if we are here
    this.loggingService.log(new LoggedEntry("Closing app with cleaning process...", this, LogLevel.info));

    this.remoteProceduresServer.stopServer();

    // Stop all the sessions
    await this.appProviderService.sessionManagementService.stopAllSessions();

    // Finally quit
    this.appService.quit();
  }

  private async moveProxyPasswordToKeychain(): Promise<void> {
    try {
      await this.optionsService.moveProxyPasswordToKeychain();
    } catch (error) {
      this.loggingService.log(
        new LoggedEntry(
          `Could not move the proxy password to the system vault, retrying at the next launch: ${error?.message ?? error}`,
          this,
          LogLevel.warn
        )
      );
    }
  }

  private async applyProxy(): Promise<void> {
    try {
      await this.optionsService.applyProxy();
    } catch (error) {
      this.loggingService.log(new LoggedEntry(error?.message ?? `${error}`, this, LogLevel.warn, true));
    }
  }

  private async importLegacySecrets(): Promise<void> {
    try {
      const importedSecrets = await this.appProviderService.legacyImportService.importSecrets();
      if (importedSecrets !== undefined) {
        this.loggingService.log(
          new LoggedEntry(
            `Imported your ${legacyApp.appName} workspace and ${importedSecrets} secret(s) from the system vault.`,
            this,
            LogLevel.info,
            true
          )
        );
      }
    } catch (error) {
      this.loggingService.log(
        new LoggedEntry(
          `Could not copy your ${legacyApp.appName} secrets from the system vault, retrying at the next launch: ${error?.message ?? error}`,
          this,
          LogLevel.warn,
          true
        )
      );
    }
  }

  /**
   * Show that we created a copy of original credential file if present in the system
   */
  private showCredentialBackupMessageIfNeeded() {
    // TODO: move this logic inside a service
    const oldAwsCredentialsPath = this.fileService.homeDir() + "/" + constants.credentialsDestination;
    const newAwsCredentialsPath = oldAwsCredentialsPath + ".hopkey.bkp";
    const check =
      this.behaviouralSubjectService.sessions.length === 0 &&
      this.fileService.existsSync(oldAwsCredentialsPath) &&
      !this.fileService.existsSync(newAwsCredentialsPath);

    this.loggingService.log(new LoggedEntry(`Check existing credential file: ${check}`, this, LogLevel.info));

    if (check) {
      this.fileService.renameSync(oldAwsCredentialsPath, newAwsCredentialsPath);
      this.fileService.writeFileSyncWithOptions(oldAwsCredentialsPath, "", { mode: "600" });
      this.appService.getDialog().showMessageBox({
        type: "info",
        icon: __dirname + "/assets/images/Hopkey.png",
        // eslint-disable-next-line max-len
        message: "You had a previous credential file. We made a backup of the old one in the same directory before starting.",
      });
    } else if (!this.fileService.existsSync(this.awsCoreService.awsCredentialPath())) {
      this.fileService.writeFileSyncWithOptions(this.awsCoreService.awsCredentialPath(), "", { mode: "600" });
    }
  }

  /**
   * Launch Updater process
   *
   * @private
   */
  private manageAutoUpdate(): void {
    let savedVersion;

    try {
      savedVersion = this.updaterService.getSavedAppVersion();
    } catch (error) {
      savedVersion = this.updaterService.getCurrentAppVersion();
    }

    try {
      if (compareVersions(savedVersion, this.updaterService.getCurrentAppVersion()) <= 0) {
        // We always need to maintain this order: fresh <= saved <= online
        this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
      }
    } catch (error) {
      this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
    }

    const ipc = this.appNativeService.ipcRenderer;
    ipc.on("UPDATE_AVAILABLE", async (_, info) => {
      const releaseNote = await this.updaterService.getReleaseNote();
      this.updaterService.setUpdateInfo(info.version, info.releaseName, info.releaseDate, releaseNote);
      if (this.updaterService.isUpdateNeeded()) {
        this.updaterService.updateDialog();
        this.behaviouralSubjectService.sessions = [...this.behaviouralSubjectService.sessions];
        this.appProviderService.sessionManagementService.updateSessions(this.behaviouralSubjectService.sessions);
      }
    });

    ipc.on("PLUGIN_URL", (_, url) => {
      if (!constants.disablePluginSystem) {
        this.installPluginFromLink(url);
      }
    });
  }

  private setInitialColorSchema() {
    if (this.appProviderService.workspaceService.workspaceExists()) {
      const colorTheme = this.optionsService.colorTheme || constants.colorTheme;
      this.optionsService.colorTheme = this.optionsService.colorTheme || constants.colorTheme;
      if (colorTheme === constants.darkTheme) {
        document.querySelector("body").classList.add("dark-theme");
      } else if (colorTheme === constants.lightTheme) {
        document.querySelector("body").classList.remove("dark-theme");
      } else if (colorTheme === constants.systemDefaultTheme) {
        if (this.appService.isDarkMode()) {
          document.querySelector("body").classList.add("dark-theme");
        } else {
          document.querySelector("body").classList.remove("dark-theme");
        }
      }
    }
  }

  private setColorSchemaChangeEventListener() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (this.optionsService.colorTheme === constants.systemDefaultTheme) {
        if (this.appService.isDarkMode()) {
          document.querySelector("body").classList.add("dark-theme");
        } else {
          document.querySelector("body").classList.remove("dark-theme");
        }
      }
    });
  }

  /**
   * Any web page can open a hopkey:// link, and a plugin runs inside Hopkey with access to every session: a link only
   * installs one once the user agrees
   */
  private async installPluginFromLink(deepLink: string): Promise<void> {
    try {
      // Only an npm package name gets past this, so it is safe in the dialog's HTML
      const packageName = this.pluginManagerService.pluginPackageName(deepLink);
      const message =
        `A link asks Hopkey to install the plugin <b>${packageName}</b> from npm.<br><br>` +
        "Plugins run inside Hopkey and can use all your sessions. Install it only if you trust its author.";
      const confirmed = await new Promise<boolean>((resolve) =>
        this.windowService.confirmDialog(message, (status: string) => resolve(status === constants.confirmed), "Install plugin", "Cancel")
      );
      if (confirmed) {
        await this.pluginManagerService.installPlugin(deepLink);
        await this.pluginManagerService.loadFromPluginDir();
      }
    } catch (error) {
      this.loggingService.log(
        error instanceof LoggedEntry
          ? error
          : new LoggedEntry(`Hopkey could not install the plugin: ${error?.message ?? error}`, this, LogLevel.error, true)
      );
    }
  }
}
