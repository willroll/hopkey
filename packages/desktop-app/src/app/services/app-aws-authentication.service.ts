import { Injectable, SecurityContext } from "@angular/core";
import { IAwsSamlAuthenticationService } from "@hopkey/core/interfaces/i-aws-saml-authentication-service";
import { CloudProviderType } from "@hopkey/core/models/cloud-provider-type";
import { AppProviderService } from "./app-provider.service";
import { WindowService } from "./window.service";
import { AwsIamRoleFederatedSession } from "@hopkey/core/models/aws/aws-iam-role-federated-session";
import { constants } from "@hopkey/core/models/constants";
import { AppNativeService } from "./app-native.service";
import { AppService } from "./app.service";
import { Session } from "@hopkey/core/models/session";
import { DomSanitizer } from "@angular/platform-browser";
import { LoggedEntry, LogLevel } from "@hopkey/core/services/log-service";
import { OperatingSystem } from "@hopkey/core/models/operating-system";
import { HopkeyBaseError } from "@hopkey/core/errors/hopkey-base-error";

@Injectable({ providedIn: "root" })
export class AppAwsAuthenticationService implements IAwsSamlAuthenticationService {
  constructor(
    private hopkeyCoreService: AppProviderService,
    private appService: AppService,
    private windowService: WindowService,
    private electronService: AppNativeService,
    private domSanitizer: DomSanitizer
  ) {}

  async needAuthentication(idpUrl: string): Promise<boolean> {
    const sanitizedField = this.domSanitizer.sanitize(SecurityContext.URL, idpUrl);
    return new Promise((resolve, reject) => {
      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
      const nearX = 200;
      const nearY = 50;
      // Generate a new singleton browser window for the check
      let idpWindow = this.windowService.newWindow(sanitizedField, false, "", activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);

      const timeoutInMs = 5000;
      const timeout = setTimeout(() => {
        const error = new HopkeyBaseError("SAML authentication timeout error", this, LogLevel.error, "SAML authentication timeout exceeded");
        reject(error);
      }, timeoutInMs);

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        console.log("Intercepted HTTP redirect call:", details.url);

        if (this.hopkeyCoreService.authenticationService.isAuthenticationUrl(CloudProviderType.aws, details.url)) {
          clearTimeout(timeout);
          idpWindow = null;
          resolve(true);
        }
        if (this.hopkeyCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          clearTimeout(timeout);
          idpWindow = null;
          resolve(false);
        }
        // Callback is used by filter to keep traversing calls until one of the filters apply
        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });
      // Start the process
      this.windowService.loadUrl(idpWindow, sanitizedField);
    });
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string> {
    const sanitizedField = this.domSanitizer.sanitize(SecurityContext.URL, idpUrl);
    // 1. Show or not browser window depending on needToAuthenticate
    const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
    const nearX = 200;
    const nearY = 50;
    // 2. Prepare browser window
    let idpWindow = this.windowService.newWindow(
      sanitizedField,
      needToAuthenticate,
      "IDP - Login",
      activeWindowPosition[0] + nearX,
      activeWindowPosition[1] + nearY
    );
    // Catch filter url: extract SAML response
    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    return new Promise((resolve) => {
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (this.hopkeyCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          // it will throw an error as we have altered the original response
          // Setting that everything is ok if we have arrived here
          idpWindow.close();
          idpWindow = null;

          // Shut down the filter action: we don't need it anymore
          if (callback) {
            callback({ cancel: true });
          }

          // Return the details
          resolve(this.hopkeyCoreService.authenticationService.extractAwsSamlResponse(details));
        } else {
          // Callback is used by filter to keep traversing calls until one of the filters apply
          callback({
            requestHeaders: details.requestHeaders,
            url: details.url,
          });
        }
      });
      // 4. Navigate to idpUrl
      this.windowService.loadUrl(idpWindow, sanitizedField);
    });
  }

  async closeAuthenticationWindow(): Promise<void> {}

  async logoutFromFederatedSession(session: Session, callback?: any): Promise<void> {
    try {
      // Clear all extra data
      const url = this.hopkeyCoreService.idpUrlService.getIdpUrl((session as AwsIamRoleFederatedSession).idpUrlId)?.url;
      const sanitizedField = this.domSanitizer.sanitize(SecurityContext.URL, url ? url : "");

      const getAppPath = this.electronService.path.join(this.electronService.app.getPath("appData"), constants.appName);

      this.electronService.rimraf(getAppPath + `/Partitions/hopkey-${btoa(sanitizedField)}`, async () => {
        if (session) {
          const sessionService = this.hopkeyCoreService.sessionFactory.getSessionService(session.type);
          await sessionService.stop(session.sessionId);
          if (callback) {
            callback();
          }
        }

        this.hopkeyCoreService.logService.log(
          new LoggedEntry("Cache and configuration file cleaned. Stopping session and restarting Hopkey to take effect.", this, LogLevel.info, true)
        );

        // Restart
        setTimeout(() => {
          // a bit of timeout to make everything reset as expected and give time to read message
          this.appService.restart();
        }, 3000);
      });
      this.electronService.session.defaultSession.clearStorageData([], (_data) => {});
    } catch (err) {
      this.hopkeyCoreService.logService.log(
        new LoggedEntry("Hopkey has an error re-creating your configuration file and cache.", this, LogLevel.error, false, err.stack)
      );
      if (this.appService.detectOs() === OperatingSystem.windows) {
        this.hopkeyCoreService.logService.log(
          new LoggedEntry(
            "Hopkey needs Admin permissions to do this: please restart the application as an Administrator and retry.",
            this,
            LogLevel.warn,
            true
          )
        );
      } else {
        this.hopkeyCoreService.logService.log(
          new LoggedEntry("Hopkey has an error re-creating your configuration file and cache.", this, LogLevel.error, true)
        );
      }
    }
  }
}
