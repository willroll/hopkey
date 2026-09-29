import { INativeService } from "../interfaces/i-native-service";
import { constants } from "../models/constants";
import { FileService } from "./file-service";

/**
 * Hopkey is a fork of Leapp (https://github.com/Noovolari/leapp). Leapp keeps its workspace in ~/.Leapp and
 * its secrets under the "Leapp" service of the system vault, while Hopkey uses ~/.hopkey and the "Hopkey"
 * service, so the two apps can be installed side by side.
 *
 * This file names Leapp's identifiers on purpose, so tools/rebrand leaves it untouched.
 */
export const legacyApp = {
  appName: "Leapp",
  directory: ".Leapp",
  lockFileName: "Leapp-lock.json",
  lockFileBackupName: "Leapp-lock.backup.bin",
  pluginsDirectoryName: "plugins",
  pluginKeyword: "leapp-plugin",
  pluginConfigKey: "leappPlugin",
  // Noovolari's shutdown announcement, stored in every Leapp workspace since Leapp 0.26.0
  shutdownNotificationUuid: "noovolari-1000",
};

const secretsImportPendingFileName = ".leapp-secrets-import-pending";

interface VaultCredential {
  account: string;
  password: string;
}

export class LegacyImportService {
  constructor(private nativeService: INativeService, private fileService: FileService) {}

  private get homeDir(): string {
    return this.nativeService.os.homedir();
  }

  private get hopkeyDirectory(): string {
    const workspaceFile = constants.lockFileDestination;
    return this.homeDir + "/" + workspaceFile.substring(0, workspaceFile.lastIndexOf("/"));
  }

  private get secretsImportPendingFile(): string {
    return this.hopkeyDirectory + "/" + secretsImportPendingFileName;
  }

  /**
   * Copies an existing Leapp workspace, with its backup and installed plugins, into Hopkey's directory and
   * marks Leapp's secrets for import. It does nothing if Hopkey already has a workspace or Leapp has none.
   * The workspace is encrypted with a key derived from the machine id, so the copy opens as it is.
   *
   * @returns true if a Leapp workspace was imported
   */
  importWorkspace(): boolean {
    const workspaceFile = this.homeDir + "/" + constants.lockFileDestination;
    const leappDirectory = this.homeDir + "/" + legacyApp.directory;
    const leappWorkspaceFile = leappDirectory + "/" + legacyApp.lockFileName;
    if (this.fileService.existsSync(workspaceFile) || !this.fileService.existsSync(leappWorkspaceFile)) {
      return false;
    }

    this.fileService.newDir(this.hopkeyDirectory, { recursive: true });
    this.nativeService.fs.copyFileSync(leappWorkspaceFile, workspaceFile);

    const leappBackupFile = leappDirectory + "/" + legacyApp.lockFileBackupName;
    if (this.fileService.existsSync(leappBackupFile)) {
      this.nativeService.fs.copyFileSync(leappBackupFile, this.homeDir + "/" + constants.lockFileBackupPath);
    }
    const leappPluginsDirectory = leappDirectory + "/" + legacyApp.pluginsDirectoryName;
    if (this.fileService.existsSync(leappPluginsDirectory)) {
      this.fileService.copyDir(leappPluginsDirectory, this.hopkeyDirectory + "/" + legacyApp.pluginsDirectoryName);
    }

    this.fileService.writeFileSync(this.secretsImportPendingFile, new Date().toISOString());
    return true;
  }

  /**
   * Copies the secrets Leapp stored in the system vault (IAM User access keys, AWS IAM Identity Center and
   * Azure tokens) to Hopkey's service, once, after importWorkspace() imported a workspace. Secrets that Hopkey
   * already has are never overwritten. If the vault cannot be read, the import is retried at the next call.
   *
   * @returns the number of copied secrets, or undefined if there was nothing to import
   */
  async importSecrets(): Promise<number | undefined> {
    if (!this.fileService.existsSync(this.secretsImportPendingFile)) {
      return undefined;
    }

    const keytar = this.nativeService.keytar;
    const leappSecrets: VaultCredential[] = await keytar.findCredentials(legacyApp.appName);
    let copiedSecrets = 0;
    for (const { account, password } of leappSecrets) {
      if ((await keytar.getPassword(constants.appName, account)) === null) {
        await keytar.setPassword(constants.appName, account, password);
        copiedSecrets++;
      }
    }

    this.fileService.removeFileSync(this.secretsImportPendingFile);
    return copiedSecrets;
  }
}
