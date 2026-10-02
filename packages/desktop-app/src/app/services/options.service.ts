import { Injectable } from "@angular/core";
import Folder from "@hopkey/core/models/folder";
import { AppProviderService } from "./app-provider.service";
import { WorkspaceService } from "@hopkey/core/services/workspace-service";
import { Session } from "@hopkey/core/models/session";
import { constants } from "@hopkey/core/models/constants";
import { ProxyConfiguration, proxyPasswordKeychainItemName } from "@hopkey/core/services/proxy-service";
import { AppNativeService } from "./app-native.service";

@Injectable({ providedIn: "root" })
export class OptionsService {
  workspaceService: WorkspaceService;

  constructor(private appProviderService: AppProviderService, private appNativeService: AppNativeService) {
    this.workspaceService = this.appProviderService.workspaceService;
  }

  get macOsTerminal(): string {
    return this.workspaceService.getWorkspace().macOsTerminal;
  }

  set macOsTerminal(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.macOsTerminal = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get proxyConfiguration(): ProxyConfiguration {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.proxyConfiguration;
  }

  async getProxyPassword(): Promise<string> {
    return (await this.appProviderService.keychainService.getSecret(constants.appName, proxyPasswordKeychainItemName)) ?? "";
  }

  async updateProxyConfiguration(value: ProxyConfiguration): Promise<void> {
    const { password, ...configuration } = value;
    await this.saveProxyPassword(password);
    const workspace = this.workspaceService.getWorkspace();
    workspace.proxyConfiguration = configuration;
    this.workspaceService.persistWorkspace(workspace);
  }

  /**
   * Sends the app's connections through the proxy in the options, or directly when there's none. The Electron
   * sessions carry the window's requests, which include the AWS calls, the sign-in windows and the update check, and
   * the programs the app starts, such as the Azure CLI, get the proxy in their environment.
   */
  async applyProxy(): Promise<void> {
    const proxyService = this.appProviderService.proxyService;
    await proxyService.load();
    const url = proxyService.url ? new URL(proxyService.url) : undefined;
    const proxy = url && {
      rules: `${url.protocol}//${url.host}`,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
    await this.appNativeService.ipcRenderer.invoke("SET_PROXY", proxy);
  }

  /**
   * Earlier versions, and the workspaces imported from them, kept the proxy password in the workspace file
   */
  async moveProxyPasswordToKeychain(): Promise<void> {
    const workspace = this.workspaceService.getWorkspace();
    const password = workspace.proxyConfiguration?.password;
    if (password) {
      await this.saveProxyPassword(password);
      delete workspace.proxyConfiguration.password;
      this.workspaceService.persistWorkspace(workspace);
    }
  }

  get defaultRegion(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.defaultRegion;
  }

  set defaultRegion(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.defaultRegion = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get defaultLocation(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.defaultLocation;
  }

  set defaultLocation(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.defaultLocation = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get pinned(): string[] {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.pinned;
  }

  set pinned(pinned: string[]) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.pinned = pinned;
    this.workspaceService.persistWorkspace(workspace);
  }

  get folders(): Folder[] {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.folders;
  }

  set folders(folders: Folder[]) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.folders = folders;
    this.workspaceService.persistWorkspace(workspace);
  }

  get colorTheme(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.colorTheme;
  }

  set colorTheme(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.colorTheme = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get credentialMethod(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.credentialMethod;
  }

  set credentialMethod(credentialMethod: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.credentialMethod = credentialMethod;
    this.workspaceService.persistWorkspace(workspace);
  }

  pinSession(session: Session): void {
    const workspace = this.workspaceService.getWorkspace();
    if (workspace.pinned.indexOf(session.sessionId) === -1) {
      workspace.pinned.push(session.sessionId);
      this.workspaceService.persistWorkspace(workspace);
    }
  }

  unpinSession(session: Session): void {
    const workspace = this.workspaceService.getWorkspace();
    const index = workspace.pinned.indexOf(session.sessionId);
    if (index > -1) {
      workspace.pinned.splice(index, 1);
      this.workspaceService.persistWorkspace(workspace);
    }
  }

  get ssmRegionBehaviour(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.ssmRegionBehaviour;
  }

  set ssmRegionBehaviour(ssmRegionBehaviour: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.ssmRegionBehaviour = ssmRegionBehaviour;
    this.workspaceService.persistWorkspace(workspace);
  }

  set extensionEnabled(value: boolean) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.extensionEnabled = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get extensionEnabled(): boolean {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.extensionEnabled;
  }

  get samlRoleSessionDuration(): number {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.samlRoleSessionDuration / 60 / 60;
  }

  set samlRoleSessionDuration(value: number) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.samlRoleSessionDuration = value * 60 * 60;
    this.workspaceService.persistWorkspace(workspace);
  }

  private async saveProxyPassword(password?: string): Promise<void> {
    if (password) {
      await this.appProviderService.keychainService.saveSecret(constants.appName, proxyPasswordKeychainItemName, password);
    } else {
      await this.appProviderService.keychainService.deleteSecret(constants.appName, proxyPasswordKeychainItemName);
    }
  }
}
