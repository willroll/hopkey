import { IPlugin, IPluginMetadata } from "./interfaces/i-plugin";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "../services/log-service";
import { constants } from "../models/constants";
import { Repository } from "../services/repository";
import { SessionType } from "../models/session-type";
import { OperatingSystem } from "../models/operating-system";
import { Session } from "../models/session";
import { SessionFactory } from "../services/session-factory";
import { PluginEnvironment } from "./plugin-environment";
import { AwsCredentialsPlugin } from "./aws-credentials-plugin";
import { legacyApp } from "../services/legacy-import-service";

// npm package names: lowercase and URL-safe, optionally scoped (see npm's validate-npm-package-name)
const npmPackageName = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const maxNpmPackageNameLength = 214;

export class PluginContainer {
  public pluginInstances: IPlugin[];

  constructor(public metadata: IPluginMetadata) {
    this.pluginInstances = [];
  }
}

export class PluginManagerService {
  private _pluginContainers: PluginContainer[];
  private _requireModule;
  private _pluginDir = "plugins";

  constructor(
    public pluginEnvironment: PluginEnvironment,
    private nativeService: INativeService,
    private logService: LogService,
    private repository: Repository,
    private sessionFactory: SessionFactory,
    private http: any
  ) {
    this._pluginContainers = [];
    this._requireModule = nativeService.requireModule;
  }

  // Plugins published for the app Hopkey was forked from declare themselves with its keyword and package.json key
  private static hasPluginKeyword(keywords: string[] | undefined): boolean {
    return !!keywords && (keywords.includes(constants.npmRequiredPluginKeyword) || keywords.includes(legacyApp.pluginKeyword));
  }

  get pluginContainers(): PluginContainer[] {
    return this._pluginContainers;
  }

  getPluginByName(name: string): PluginContainer {
    return this._pluginContainers.find((plugin) => plugin.metadata.uniqueName === name);
  }

  verifyAndGeneratePluginFolderIfMissing(): void {
    if (!this.nativeService.fs.existsSync(this.nativeService.os.homedir() + "/.hopkey/" + this._pluginDir)) {
      this.nativeService.fs.mkdirSync(this.nativeService.os.homedir() + "/.hopkey/" + this._pluginDir);
    }
  }

  async loadFromPluginDir(): Promise<void> {
    this._pluginContainers = [];
    const pluginDirContent = this.nativeService.fs.readdirSync(this.nativeService.os.homedir() + "/.hopkey/" + this._pluginDir);
    for (const pluginName of pluginDirContent) {
      const pluginFilePath = this.nativeService.os.homedir() + "/.hopkey/" + this._pluginDir + "/" + pluginName;
      const isDir = this.nativeService.fs.existsSync(pluginFilePath) && this.nativeService.fs.lstatSync(pluginFilePath).isDirectory();
      if (isDir) {
        const packageJson = this.readPackageJson(pluginFilePath);

        // HANDLE PACKAGE.JSON ERROR
        let metadata: IPluginMetadata;
        try {
          metadata = this.extractMetadata(packageJson);
        } catch (errors) {
          this.logService.log(
            new LoggedEntry(`missing or invalid values in plugin ${pluginName} package.json: ${errors.message}`, this, LogLevel.warn, true)
          );
          continue;
        }

        // LOAD
        try {
          if (this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")) {
            const pluginModule = this._requireModule(pluginFilePath + "/plugin.js");
            this.logService.log(new LoggedEntry(`loading ${pluginName} plugin`, this, LogLevel.info, false));

            const pluginContainer = new PluginContainer(metadata);
            const pluginClasses = Object.values(pluginModule) as any[];
            for (const pluginClass of pluginClasses) {
              const pluginInstance = new pluginClass(this.pluginEnvironment, this.sessionFactory) as IPlugin;
              (pluginInstance as any).metadata = metadata;
              pluginContainer.pluginInstances.push(pluginInstance);
            }
            this._pluginContainers.push(pluginContainer);
            if (!this.repository.getPluginStatus(metadata.uniqueName)) {
              this.repository.createPluginStatus(metadata.uniqueName);
            }
          }
        } catch (error) {
          this.logService.log(new LoggedException(`error loading plugin ${pluginName}: ${error.message}`, this, LogLevel.error, true));
        }
      }
    }
  }

  unloadAllPlugins(): void {
    this._pluginContainers = [];
  }

  unloadSinglePlugin(name: string): void {
    const pluginIndex = this._pluginContainers.map((p) => p.metadata.uniqueName).indexOf(name);
    if (pluginIndex > -1) {
      this._pluginContainers.splice(pluginIndex, 1);
    }
  }

  availableAwsCredentialsPlugins(os: OperatingSystem, session: Session): AwsCredentialsPlugin[] {
    const list = this._pluginContainers.filter((plugin) => {
      const active = this.repository.getPluginStatus(plugin?.metadata?.uniqueName)?.active;
      const supportedOS = plugin?.metadata?.supportedOS?.includes(os);
      const supportedSome = plugin?.metadata?.supportedSessions?.some((supportedSession) =>
        this.sessionFactory.getCompatibleTypes(supportedSession).includes(session.type)
      );
      return active && supportedOS && supportedSome;
    });
    let arrayToReturn = [];
    list.forEach((pluginContainer) => {
      arrayToReturn = arrayToReturn.concat(pluginContainer.pluginInstances.filter((plugin) => plugin.pluginType === AwsCredentialsPlugin.name));
    });
    return arrayToReturn;
  }

  /**
   * The npm package a hopkey:// link or a plugin name points to. Anything else is refused before it reaches npm or the
   * screen, since a link can come from any web page.
   */
  pluginPackageName(url: string): string {
    const packageName = url.replace("hopkey://", "").trim();
    if (!npmPackageName.test(packageName) || packageName.length > maxNpmPackageNameLength) {
      throw new LoggedException(`"${packageName}" is not the name of an npm package`, this, LogLevel.error, true);
    }
    return packageName;
  }

  async installPlugin(url: string): Promise<void> {
    const packageName = this.pluginPackageName(url);
    const pluginsDir = this.nativeService.os.homedir() + "/.hopkey/plugins";

    this.logService.log(new LoggedEntry(`We are ready to install Plugin ${packageName}, please wait...`, this, LogLevel.info, true));

    const npmMetadata = await this.http.get(`https://registry.npmjs.org/${packageName}`, { responseType: "json" }).toPromise();
    if (!PluginManagerService.hasPluginKeyword(npmMetadata["keywords"])) {
      throw new LoggedException(`${npmMetadata["name"]} is not a Hopkey plugin`, this, LogLevel.error, true);
    }
    const version = npmMetadata["dist-tags"].latest;
    const tarballUrl = npmMetadata.versions[version].dist.tarball;
    const tarballPathComponents = tarballUrl.split("/");
    const tarballFileName = tarballPathComponents[tarballPathComponents.length - 1];
    const tarballBuffer = await this.http.get(tarballUrl, { responseType: "arraybuffer" }).toPromise();
    const tarballFilePath = this.nativeService.path.join(pluginsDir, tarballFileName);
    this.nativeService.fs.writeFileSync(tarballFilePath, Buffer.from(tarballBuffer));

    const pluginDir = this.nativeService.path.join(pluginsDir, packageName);
    await this.nativeService.fs.remove(pluginDir);
    await this.nativeService.fs.ensureDir(pluginDir);

    await this.nativeService.tar.x({
      file: tarballFilePath,
      strip: 1,
      ["C"]: pluginDir,
    });

    await this.nativeService.fs.remove(tarballFilePath);
    this.logService.log(new LoggedEntry(`Plugin ${packageName} installed correctly.`, this, LogLevel.info, true));
  }

  private extractMetadata(packageJson: any): IPluginMetadata {
    const errors = [];
    const version = packageJson.version;
    if (!version) {
      errors.push("version");
    }
    const uniqueName = packageJson.name;
    if (!uniqueName) {
      errors.push("name");
    }
    const author = packageJson.author?.name ? packageJson.author.name : packageJson.author;
    if (!author) {
      errors.push("author");
    }
    const description = packageJson.description;
    if (!description) {
      errors.push("description");
    }

    const keywords = packageJson.keywords as string[];
    if (!keywords || keywords.length === 0) {
      errors.push("keywords");
    } else if (!PluginManagerService.hasPluginKeyword(keywords)) {
      errors.push(`${constants.npmRequiredPluginKeyword} keyword`);
    }

    const hopkeyPluginConfig = packageJson.hopkeyPlugin ?? packageJson[legacyApp.pluginConfigKey];
    if (!hopkeyPluginConfig) {
      errors.push("hopkeyPlugin");
    }

    const supportedSessionTypes = hopkeyPluginConfig?.supportedSessions || [SessionType.anytype];
    for (const sessionType of supportedSessionTypes) {
      if (this.sessionFactory.getCompatibleTypes(sessionType).length === 0) {
        errors.push(`hopkeyPlugin.supportedSessions: ${sessionType} is unsupported`);
      }
    }
    const icon = hopkeyPluginConfig?.icon || "fas fa-puzzle-piece";
    const operatingSystems = [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows];
    const supportedOS = hopkeyPluginConfig?.supportedOS || operatingSystems;
    for (const os of supportedOS) {
      if (!operatingSystems.includes(os)) {
        errors.push(`hopkeyPlugin.supportedOS: ${os} is unsupported`);
      }
    }

    const url = hopkeyPluginConfig?.url;

    if (errors.length) {
      throw new Error(errors.join(", "));
    }

    const pluginStatus = this.repository.getPluginStatus(uniqueName);
    return {
      version,
      active: pluginStatus ? pluginStatus.active : true,
      author,
      description,
      supportedOS,
      supportedSessions: supportedSessionTypes,
      icon,
      keywords,
      uniqueName,
      url,
    };
  }

  /**
   * The parsed package.json of a plugin folder, or undefined if the folder doesn't have a package.json and a plugin.js
   * or the package.json can't be read. Hopkey doesn't verify plugins: it loads whatever is in the plugins folder.
   */
  private readPackageJson(pluginFilePath: string): any {
    if (!this.nativeService.fs.existsSync(pluginFilePath + "/package.json") || !this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")) {
      this.logService.log(new LoggedEntry(`folder ${pluginFilePath} is not a plugin folder, ignoring...`, this, LogLevel.info, false));
      return undefined;
    }
    try {
      return JSON.parse(this.nativeService.fs.readFileSync(pluginFilePath + "/package.json"));
    } catch (error) {
      this.logService.log(new LoggedException(`reading ${pluginFilePath}/package.json failed: ${error.message}`, this, LogLevel.warn, false));
      return undefined;
    }
  }
}
