import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BillingPeriod, HopkeyProPreCheckoutDialogComponent } from "./hopkey-pro-pre-checkout-dialog.component";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../../base-injectables";
import { AppProviderService } from "../../../services/app-provider.service";
import { AwsSsoIntegration } from "@hopkey/core/models/aws/aws-sso-integration";
import { globalHopkeyProPlanStatus, HopkeyPlanStatus } from "../options-dialog/options-dialog.component";
import { ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { ApiErrorCodes } from "../../../services/team-service";

describe("HopkeyProPreCheckoutDialogComponent", () => {
  let component: HopkeyProPreCheckoutDialogComponent;
  let fixture: ComponentFixture<HopkeyProPreCheckoutDialogComponent>;

  beforeEach(async () => {
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      getSegments: [],
      listAwsSsoIntegrations: [],
      listAzureIntegrations: [],
      getDefaultLocation: () => "defaultLocation",
    });
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      integrations: [],
      integrations$: { subscribe: () => {} },
      setIntegrations: (_awsSsoIntegrations: AwsSsoIntegration[]) => void {},
      getIntegrations: () => [],
    });

    const spyIntegrationFactory = jasmine.createSpyObj("IntegrationFactory", {
      getIntegrations: () => [],
    });

    const spyHopkeyCoreService = jasmine.createSpyObj("AppProviderService", [], {
      keychainService: { saveSecret: () => {} },
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => ["mocked-region-1", "mocked-region-2"] },
      awsSsoOidcService: { listeners: [] },
      behaviouralSubjectService: spyBehaviouralSubjectService,
      awsSsoIntegrationService: { getIntegrations: () => [] },
      azureIntegrationService: { getIntegrations: () => [] },
      integrationFactory: spyIntegrationFactory,
      teamService: {
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        createCheckoutSession: () => "fakeUrl",
        getPrices: () => [
          {
            stripePriceAmount: "12000",
            stripePriceNickname: "Monthly subscription",
          },
          {
            stripePriceAmount: "120000",
            stripePriceNickname: "Annual subscription",
          },
        ],
      },
      windowService: { newWindow: (..._args) => ({ loadURL: (_str) => {} }), getCurrentWindow: () => ({ getPosition: () => [0, 0] }) },
      toasterService: { toast: (..._args) => {} },
    });

    const spyWindowService = { newWindow: (..._args) => ({ loadURL: (_str) => {} }), getCurrentWindow: () => ({ getPosition: () => [0, 0] }) };

    await TestBed.configureTestingModule({
      declarations: [HopkeyProPreCheckoutDialogComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
      ].concat(
        mustInjected().concat([
          { provide: WindowService, useValue: spyWindowService },
          {
            provide: AppProviderService,
            useValue: spyHopkeyCoreService,
          },
        ])
      ),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HopkeyProPreCheckoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    globalHopkeyProPlanStatus.next(HopkeyPlanStatus.free);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("ngOnInit - should retrieve informations about prices online and enrich data and set the prices values", async () => {
    await component.ngOnInit();
    fixture.detectChanges();
    expect((component as any).prices[0]).toEqual({
      stripePriceAmount: "12000",
      stripePriceNickname: "Monthly subscription",
      priceAmount: "120.00",
      monthlyPrice: "120.00",
    });
    expect((component as any).price).toEqual({
      stripePriceAmount: "120000",
      stripePriceNickname: "Annual subscription",
      priceAmount: "1200.00",
      monthlyPrice: "100.00",
    });
  });

  it("close - should close the modal", () => {
    const spy = spyOn((component as any).bsModalRef, "hide").and.callFake(() => null);
    (component as any).close();
    expect(spy).toHaveBeenCalled();
  });

  it("setBillingPeriod - set the values of the billing period variable and reset the current selected price", async () => {
    await component.ngOnInit();
    (component as any).setBillingPeriod(BillingPeriod.yearly);
    expect((component as any).selectedPeriod).toEqual(BillingPeriod.yearly);
    expect((component as any).price).toEqual((component as any).prices[1]);

    (component as any).setBillingPeriod(BillingPeriod.monthly);
    expect((component as any).selectedPeriod).toEqual(BillingPeriod.monthly);
    expect((component as any).price).toEqual((component as any).prices[0]);
  });

  it("checkAndConfirm - set the email parameter to the correct form value", () => {
    const spy = spyOn((component as any).emailFormControl, "markAsTouched").and.callFake(() => true);
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(false);

    (component as any).emailFormControl.setValue("novalid");
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(false);

    (component as any).emailFormControl.setValue("no@reply.it");
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(true);
  });

  it("upgradeToHopkeyPro", async (done) => {
    const fakeBackendCallData = { details: {}, callback: (..._args) => {} };
    const fakeWindow = {
      webContents: {
        session: {
          webRequest: {
            onBeforeRequest: (clk) => {
              setTimeout(() => clk(fakeBackendCallData.details, fakeBackendCallData.callback), 100);
            },
          },
        },
      },
      loadURL: (_str) => {},
      close: () => {},
    };
    const spyOnLoadUrl = spyOn(fakeWindow, "loadURL").and.callThrough();
    const spyOnRequest = spyOn(fakeWindow.webContents.session.webRequest, "onBeforeRequest").and.callThrough();
    const spyOnNewWindow = spyOn((component as any).appProviderService.windowService, "newWindow").and.returnValue(fakeWindow);
    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.callThrough();
    const spyOnSaveSecret = spyOn((component as any).appProviderService.keychainService, "saveSecret").and.callThrough();
    const spyOnClose = spyOn(fakeWindow, "close").and.callThrough();
    const spyOnCallback = spyOn(fakeBackendCallData, "callback").and.callThrough();

    await (component as any).upgradeToHopkeyPro();
    expect(spyOnNewWindow).not.toHaveBeenCalled();
    expect(spyOnRequest).not.toHaveBeenCalled();

    (component as any).isEmailValid = true;
    (component as any).isCFValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");
    fakeBackendCallData.details = { url: "https://www.leapp.cloud/success", requestHeaders: "fake-details" };

    await (component as any).ngOnInit();
    await (component as any).upgradeToHopkeyPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect(spyOnNewWindow).toHaveBeenCalledWith("fakeUrl", true, "", 200, 50);
    expect(spyOnLoadUrl).toHaveBeenCalledWith("fakeUrl");
    setTimeout(() => {
      expect(spyOnRequest).toHaveBeenCalled();
      expect(spyOnSaveSecret).toHaveBeenCalledWith("Hopkey", "hopkey-enabled-plan", HopkeyPlanStatus.proPending.toString());
      expect(spyOnClose).toHaveBeenCalled();
      expect(globalHopkeyProPlanStatus.getValue()).toEqual(HopkeyPlanStatus.proPending);
      expect((component as any).toasterService.toast).toHaveBeenCalledWith("Checkout completed", ToastLevel.success);
      expect(spyOnCallback).toHaveBeenCalledWith({ requestHeaders: "fake-details", url: "https://www.leapp.cloud/success" });
      done();
    }, 200);
  });

  it("upgradeToHopkeyPro - callback in cancel mode", async (done) => {
    const fakeBackendCallData = { details: {}, callback: (..._args) => {} };
    const fakeWindow = {
      webContents: {
        session: {
          webRequest: {
            onBeforeRequest: (clk) => {
              setTimeout(() => clk(fakeBackendCallData.details, fakeBackendCallData.callback), 100);
            },
          },
        },
      },
      loadURL: (_str) => {},
      close: () => {},
    };
    const spyOnLoadUrl = spyOn(fakeWindow, "loadURL").and.callThrough();
    const spyOnRequest = spyOn(fakeWindow.webContents.session.webRequest, "onBeforeRequest").and.callThrough();
    const spyOnNewWindow = spyOn((component as any).appProviderService.windowService, "newWindow").and.returnValue(fakeWindow);
    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.callThrough();
    const spyOnSaveSecret = spyOn((component as any).appProviderService.keychainService, "saveSecret").and.callThrough();
    const spyOnClose = spyOn(fakeWindow, "close").and.callThrough();
    const spyOnCallback = spyOn(fakeBackendCallData, "callback").and.callThrough();

    (component as any).isEmailValid = true;
    (component as any).isCFValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");
    fakeBackendCallData.details = { url: "https://www.leapp.cloud/cancel", requestHeaders: "fake-details" };

    await (component as any).ngOnInit();
    await (component as any).upgradeToHopkeyPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect(spyOnNewWindow).toHaveBeenCalledWith("fakeUrl", true, "", 200, 50);
    expect(spyOnLoadUrl).toHaveBeenCalledWith("fakeUrl");

    setTimeout(() => {
      expect(spyOnRequest).toHaveBeenCalled();
      expect(spyOnSaveSecret).not.toHaveBeenCalled();
      expect(spyOnClose).toHaveBeenCalled();
      expect(globalHopkeyProPlanStatus.getValue()).toEqual(HopkeyPlanStatus.free);
      expect((component as any).toasterService.toast).not.toHaveBeenCalled();
      expect(spyOnCallback).toHaveBeenCalledWith({ requestHeaders: "fake-details", url: "https://www.leapp.cloud/cancel" });
      done();
    }, 200);
  });

  it("upgradeToHopkeyPro - error in checkout session", async () => {
    const fakeBackendCallData = { details: {}, callback: (..._args) => {} };

    const error = {
      name: "Email Already Taken",
      message: "",
      response: { data: { errorCode: ApiErrorCodes.emailAlreadyTaken } },
    };

    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.throwError(error);

    (component as any).isEmailValid = true;
    (component as any).isCFValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");
    fakeBackendCallData.details = { url: "https://www.leapp.cloud/cancel", requestHeaders: "fake-details" };

    await (component as any).ngOnInit();
    await (component as any).upgradeToHopkeyPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect((component as any).toasterService.toast).toHaveBeenCalledWith("Email already taken", ToastLevel.error);
  });

  it("upgradeToHopkeyPro - error in checkout session, but is generic and not about email", async () => {
    const fakeBackendCallData = { details: {}, callback: (..._args) => {} };

    const error = {
      name: "Catastrophic Error",
      message: "",
      response: { data: { errorCode: "500" } },
    };

    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.throwError(error);

    (component as any).isEmailValid = true;
    (component as any).isCFValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");
    fakeBackendCallData.details = { url: "https://www.leapp.cloud/cancel", requestHeaders: "fake-details" };

    await (component as any).ngOnInit();
    await (component as any).upgradeToHopkeyPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect((component as any).toasterService.toast).toHaveBeenCalledWith("Something went wrong during pre-checkout", ToastLevel.error);
  });

  it("upgradeToHopkeyPro - error after pre-checkout", async (done) => {
    const spyOnNewWindow = spyOn((component as any).appProviderService.windowService, "newWindow").and.throwError(new Error());
    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.callThrough();

    (component as any).isEmailValid = true;
    (component as any).isCFValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");

    await (component as any).ngOnInit();
    await (component as any).upgradeToHopkeyPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect(spyOnNewWindow).toHaveBeenCalledWith("fakeUrl", true, "", 200, 50);

    setTimeout(() => {
      expect(globalHopkeyProPlanStatus.getValue()).toEqual(HopkeyPlanStatus.free);
      expect((component as any).toasterService.toast).toHaveBeenCalledWith("Something went wrong during checkout", ToastLevel.error);
      done();
    }, 200);
  });
});
