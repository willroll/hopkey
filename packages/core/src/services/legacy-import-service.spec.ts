import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { LegacyImportService, legacyApp } from "./legacy-import-service";
import { constants } from "../models/constants";

describe("LegacyImportService", () => {
  const homeDir = "/home/user";
  const workspaceFile = `${homeDir}/.hopkey/hopkey-lock.json`;
  const leappWorkspaceFile = `${homeDir}/.Leapp/Leapp-lock.json`;
  const pendingFile = `${homeDir}/.hopkey/.leapp-secrets-import-pending`;

  let existingFiles: Set<string>;
  let nativeService: any;
  let fileService: any;
  let vault: Map<string, string>;
  let legacyImportService: LegacyImportService;

  beforeEach(() => {
    existingFiles = new Set<string>();
    vault = new Map<string, string>();
    nativeService = {
      os: { homedir: () => homeDir },
      fs: { copyFileSync: jest.fn() },
      keytar: {
        findCredentials: jest.fn(async (service: string) =>
          [...vault.entries()]
            .filter(([key]) => key.startsWith(`${service}/`))
            .map(([key, password]) => ({ account: key.substring(service.length + 1), password }))
        ),
        getPassword: jest.fn(async (service: string, account: string) => vault.get(`${service}/${account}`) ?? null),
        setPassword: jest.fn(async (service: string, account: string, password: string) => {
          vault.set(`${service}/${account}`, password);
        }),
      },
    };
    fileService = {
      existsSync: jest.fn((path: string) => existingFiles.has(path)),
      newDir: jest.fn(),
      copyDir: jest.fn(),
      writeFileSync: jest.fn((path: string) => existingFiles.add(path)),
      removeFileSync: jest.fn((path: string) => existingFiles.delete(path)),
    };
    legacyImportService = new LegacyImportService(nativeService, fileService);
  });

  test("the paths match Hopkey's constants", () => {
    expect(constants.lockFileDestination).toBe(".hopkey/hopkey-lock.json");
    expect(constants.lockFileBackupPath).toBe(".hopkey/hopkey-lock.backup.bin");
    expect(constants.appName).toBe("Hopkey");
  });

  test("importWorkspace() - does nothing when Hopkey already has a workspace", () => {
    existingFiles.add(workspaceFile);
    existingFiles.add(leappWorkspaceFile);

    expect(legacyImportService.importWorkspace()).toBe(false);
    expect(nativeService.fs.copyFileSync).not.toHaveBeenCalled();
    expect(fileService.writeFileSync).not.toHaveBeenCalled();
  });

  test("importWorkspace() - does nothing when there is no Leapp workspace", () => {
    expect(legacyImportService.importWorkspace()).toBe(false);
    expect(fileService.newDir).not.toHaveBeenCalled();
    expect(nativeService.fs.copyFileSync).not.toHaveBeenCalled();
  });

  test("importWorkspace() - copies the Leapp workspace, its backup and plugins, and marks the secrets for import", () => {
    existingFiles.add(leappWorkspaceFile);
    existingFiles.add(`${homeDir}/.Leapp/Leapp-lock.backup.bin`);
    existingFiles.add(`${homeDir}/.Leapp/plugins`);

    expect(legacyImportService.importWorkspace()).toBe(true);
    expect(fileService.newDir).toHaveBeenCalledWith(`${homeDir}/.hopkey`, { recursive: true });
    expect(nativeService.fs.copyFileSync).toHaveBeenCalledWith(leappWorkspaceFile, workspaceFile);
    expect(nativeService.fs.copyFileSync).toHaveBeenCalledWith(
      `${homeDir}/.Leapp/Leapp-lock.backup.bin`,
      `${homeDir}/.hopkey/hopkey-lock.backup.bin`
    );
    expect(fileService.copyDir).toHaveBeenCalledWith(`${homeDir}/.Leapp/plugins`, `${homeDir}/.hopkey/plugins`);
    expect(existingFiles.has(pendingFile)).toBe(true);
  });

  test("importWorkspace() - skips a missing backup and plugins directory", () => {
    existingFiles.add(leappWorkspaceFile);

    expect(legacyImportService.importWorkspace()).toBe(true);
    expect(nativeService.fs.copyFileSync).toHaveBeenCalledTimes(1);
    expect(fileService.copyDir).not.toHaveBeenCalled();
  });

  test("importSecrets() - does nothing unless a workspace was imported", async () => {
    vault.set("Leapp/session-1-iam-user-aws-session-access-key-id", "AKIA...");

    expect(await legacyImportService.importSecrets()).toBeUndefined();
    expect(nativeService.keytar.findCredentials).not.toHaveBeenCalled();
    expect(vault.has("Hopkey/session-1-iam-user-aws-session-access-key-id")).toBe(false);
  });

  test("importSecrets() - copies Leapp's secrets without overwriting Hopkey's, once", async () => {
    existingFiles.add(leappWorkspaceFile);
    legacyImportService.importWorkspace();
    vault.set("Leapp/session-1-iam-user-aws-session-access-key-id", "leapp-key-id");
    vault.set("Leapp/aws-sso-integration-access-token-1", "leapp-token");
    vault.set("Hopkey/aws-sso-integration-access-token-1", "hopkey-token");
    vault.set("SomeOtherApp/secret", "other");

    expect(await legacyImportService.importSecrets()).toBe(1);
    expect(nativeService.keytar.findCredentials).toHaveBeenCalledWith(legacyApp.appName);
    expect(vault.get("Hopkey/session-1-iam-user-aws-session-access-key-id")).toBe("leapp-key-id");
    expect(vault.get("Hopkey/aws-sso-integration-access-token-1")).toBe("hopkey-token");
    expect(vault.has("Hopkey/secret")).toBe(false);
    expect(existingFiles.has(pendingFile)).toBe(false);

    expect(await legacyImportService.importSecrets()).toBeUndefined();
  });

  test("importSecrets() - keeps the import pending when the vault cannot be read", async () => {
    existingFiles.add(pendingFile);
    nativeService.keytar.findCredentials = jest.fn(async () => {
      throw new Error("the keyring is locked");
    });

    await expect(legacyImportService.importSecrets()).rejects.toThrow("the keyring is locked");
    expect(existingFiles.has(pendingFile)).toBe(true);
  });
});
