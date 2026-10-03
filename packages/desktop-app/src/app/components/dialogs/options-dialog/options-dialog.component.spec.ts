import { OptionsDialogComponent } from "./options-dialog.component";
import { ToastLevel } from "../../../services/message-toaster.service";

describe("OptionsDialogComponent", () => {
  let component: OptionsDialogComponent;
  let optionsService: any;
  let toasterService: any;
  let appService: any;
  let logService: any;

  beforeEach(() => {
    optionsService = jasmine.createSpyObj("OptionsService", ["updateProxyConfiguration", "applyProxy"]);
    optionsService.updateProxyConfiguration.and.resolveTo();
    optionsService.applyProxy.and.resolveTo();
    toasterService = jasmine.createSpyObj("MessageToasterService", ["toast"]);
    appService = jasmine.createSpyObj("AppService", ["closeModal"]);
    logService = jasmine.createSpyObj("LogService", ["log"]);
    component = new OptionsDialogComponent({ logService } as any, appService, optionsService, null, null, toasterService, null, null, null);
    component.form.controls["sessionDuration"].setValue("1");
  });

  const changeProxy = (values: { [control: string]: string | boolean }) => {
    for (const [control, value] of Object.entries(values)) {
      component.form.controls[control].setValue(value);
      component.form.controls[control].markAsDirty();
    }
  };

  it("saves and applies a changed proxy, with its credentials when authentication is on", async () => {
    component.showProxyAuthentication = true;
    changeProxy({ proxyProtocol: "HTTP", proxyUrl: "proxy.example.com", proxyPort: "3128", proxyUsername: "me", proxyPassword: "p4ss" });

    await component.saveOptions();

    expect(optionsService.updateProxyConfiguration).toHaveBeenCalledWith({
      proxyUrl: "proxy.example.com",
      proxyProtocol: "HTTP",
      proxyPort: "3128",
      username: "me",
      password: "p4ss",
    });
    expect(optionsService.applyProxy).toHaveBeenCalled();
    expect(appService.closeModal).toHaveBeenCalled();
    const logged = logService.log.calls.mostRecent().args[0];
    expect(logged.message).toBe("Option saved.");
    expect(logged.customStack).toContain("proxy.example.com");
    expect(logged.customStack).not.toContain("p4ss");
  });

  it("drops the credentials when authentication is off", async () => {
    component.showProxyAuthentication = false;
    changeProxy({ proxyProtocol: "HTTP", proxyUrl: "proxy.example.com", proxyPort: "3128", proxyUsername: "me", proxyPassword: "p4ss" });

    await component.saveOptions();

    expect(optionsService.updateProxyConfiguration).toHaveBeenCalledWith(jasmine.objectContaining({ username: "", password: "" }));
  });

  it("doesn't save a proxy it can't use", async () => {
    changeProxy({ proxyProtocol: "HTTP", proxyUrl: "proxy.example.com", proxyPort: "31a28" });

    await component.saveOptions();

    expect(toasterService.toast).toHaveBeenCalledWith(
      `Hopkey can't use the proxy in the options: "31a28" isn't a port number`,
      ToastLevel.warn,
      "Options"
    );
    expect(optionsService.updateProxyConfiguration).not.toHaveBeenCalled();
    expect(optionsService.applyProxy).not.toHaveBeenCalled();
    expect(appService.closeModal).not.toHaveBeenCalled();
  });

  it("doesn't apply the proxy again when it didn't change", async () => {
    component.form.controls["proxyUrl"].setValue("proxy.example.com");
    component.form.controls["proxyPort"].setValue("3128");

    await component.saveOptions();

    expect(optionsService.updateProxyConfiguration).toHaveBeenCalled();
    expect(optionsService.applyProxy).not.toHaveBeenCalled();
    expect(appService.closeModal).toHaveBeenCalled();
  });
});
