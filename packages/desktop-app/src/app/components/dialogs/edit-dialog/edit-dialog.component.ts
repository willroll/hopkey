import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AppService } from "../../../services/app.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionType } from "@hopkey/core/models/session-type";
import { Workspace } from "@hopkey/core/models/workspace";
import { BehaviouralSubjectService } from "@hopkey/core/services/behavioural-subject-service";
import { constants } from "@hopkey/core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { SessionService } from "@hopkey/core/services/session/session-service";
import * as uuid from "uuid";
import { Session } from "@hopkey/core/models/session";
import { AzureLocation } from "@hopkey/core/services/azure-location";
import { AwsIamRoleChainedSession } from "@hopkey/core/models/aws/aws-iam-role-chained-session";
import { AwsIamRoleFederatedSession } from "@hopkey/core/models/aws/aws-iam-role-federated-session";
import { HopkeySelectComponent } from "../../hopkey-select/hopkey-select.component";
import { HopkeyParseError } from "@hopkey/core/errors/hopkey-parse-error";
import { AppMfaCodePromptService } from "../../../services/app-mfa-code-prompt.service";
import { SessionStatus } from "@hopkey/core/models/session-status";
import { OptionsService } from "../../../services/options.service";
import { IKeychainService } from "@hopkey/core/interfaces/i-keychain-service";
import { AwsAgentSettings, agentRoleSessionName, normalizeAgentSettings } from "@hopkey/core/models/aws/aws-agent";
import { agentFormControls, agentSettingsFromForm, isAgentFormValid, setAgentForm } from "../../agent-settings/agent-form";

@Component({
  selector: "app-edit-dialog",
  templateUrl: "./edit-dialog.component.html",
  styleUrls: ["./edit-dialog.component.scss"],
})
export class EditDialogComponent implements OnInit, AfterViewInit {
  @ViewChild("roleInput", { static: false })
  public roleInput: ElementRef;

  @ViewChild("namedProfileSelect", { static: false })
  public namedProfileSelect: HopkeySelectComponent;

  @ViewChild("idpUrlSelect", { static: false })
  public idpUrlSelect: HopkeySelectComponent;

  @Input()
  public selectedSessionId: string;

  public accountType = SessionType.aws;
  public provider = SessionType.awsIamRoleFederated;
  public selectedSession: any;
  public selectedParentSession: any;
  public selectedAccountNumber = "";
  public selectedIdpUrl;
  public selectedRegion;
  public regions = [];
  public workspace: Workspace;
  public eSessionType = SessionType;
  public eConstants = constants;

  public form = new FormGroup({
    idpArn: new FormControl("", [Validators.required]),
    accountNumber: new FormControl("", [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl("", [Validators.required]),
    tenantId: new FormControl("", [Validators.required]),
    name: new FormControl("", [Validators.required]),
    role: new FormControl("", [Validators.required]),
    roleArn: new FormControl("", [Validators.required]),
    roleSessionName: new FormControl("", [Validators.pattern("[a-zA-Z\\d\\-\\_\\@\\=\\,\\.]+")]),
    federatedOrIamRoleChained: new FormControl("", [Validators.required]),
    federatedRole: new FormControl("", [Validators.required]),
    federationUrl: new FormControl("", [Validators.required, Validators.pattern("https?://.+")]),
    secretKey: new FormControl("", [Validators.required]),
    accessKey: new FormControl("", [Validators.required]),
    awsRegion: new FormControl(""),
    mfaDevice: new FormControl(""),
    awsProfile: new FormControl("", [Validators.required]),
    azureLocation: new FormControl("", [Validators.required]),
    assumerSession: new FormControl("", [Validators.required]),
    ...agentFormControls(),
  });

  public idpUrls: { value: string; label: string }[] = [];

  public profiles: { value: string; label: string }[] = [];
  public selectedProfile: { value: string; label: string };

  /* Setup the first account for the application */
  public assumerAwsSessions: { session: Session; sessionName: string }[];

  public locations = [];
  public selectedLocation;

  public submitting = false;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private keychainService: IKeychainService;
  private sessionService: SessionService;

  constructor(
    private optionsService: OptionsService,
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
    private messageToasterService: MessageToasterService,
    private router: Router,
    private windowService: WindowService,
    private hopkeyCoreService: AppProviderService,
    private mfaPrompter: AppMfaCodePromptService
  ) {
    this.behaviouralSubjectService = hopkeyCoreService.behaviouralSubjectService;
    this.keychainService = this.hopkeyCoreService.keychainService;
  }

  ngOnInit(): void {
    // Get the workspace and the account you need
    this.selectedSession = this.hopkeyCoreService.sessionManagementService.getSessionById(this.selectedSessionId) as any;
    this.sessionService = this.hopkeyCoreService.sessionFactory.getSessionService(this.selectedSession.type);
    this.accountType = this.selectedSession.type;

    // Get the workspace and the accounts you need
    const workspace = this.hopkeyCoreService.workspaceService.getWorkspace();

    // We get all the applicable idp urls
    if (workspace.idpUrls && workspace.idpUrls.length > 0) {
      workspace.idpUrls.forEach((idp) => {
        if (idp !== null && idp.id) {
          this.idpUrls.push({ value: idp.id, label: idp.url });
        }
      });
    }

    // We got all the applicable profiles
    // Note: we don't use azure profile so we remove default azure profile from the list
    workspace.profiles?.forEach((idp) => {
      if (idp !== null && idp.name !== constants.defaultAzureProfileName && idp.id) {
        this.profiles.push({ value: idp.id, label: idp.name });
      }
    });

    // Show the assumable accounts
    this.assumerAwsSessions = this.hopkeyCoreService.sessionManagementService.getAssumableSessions().map((session) => ({
      sessionName: session.sessionName,
      session,
    }));

    // Get the region
    this.regions = this.hopkeyCoreService.awsCoreService.getRegions();
    this.locations = this.hopkeyCoreService.azureCoreService.getLocations();

    this.selectedRegion = this.regions.find((r) => r.region === this.selectedSession?.region)?.region;
    this.form.controls["awsRegion"].setValue(this.selectedRegion);

    this.selectedLocation = this.locations.find((l: AzureLocation) => l.location === this.selectedSession?.region)?.location;
    this.form.controls["azureLocation"].setValue(this.selectedLocation);
  }

  ngAfterViewInit(): void {
    if (this.accountType === SessionType.awsIamRoleFederated) {
      this.form.controls["name"].setValue(this.selectedSession.sessionName);
      this.form.controls["roleArn"].setValue((this.selectedSession as AwsIamRoleFederatedSession).roleArn);
      this.form.controls["idpArn"].setValue((this.selectedSession as AwsIamRoleFederatedSession).idpArn);

      this.idpUrlSelect.selectValue({
        value: this.selectedSession.idpUrlId,
        label: this.hopkeyCoreService.idpUrlService.getIdpUrl(this.selectedSession.idpUrlId).url,
      });
      this.namedProfileSelect.selectValue({
        value: this.selectedSession.profileId,
        label: this.hopkeyCoreService.namedProfileService.getProfileName(this.selectedSession.profileId),
      });
    }

    if (this.accountType === SessionType.awsIamRoleChained) {
      this.form.controls["name"].setValue(this.selectedSession.sessionName);
      this.form.controls["roleSessionName"].setValue((this.selectedSession as AwsIamRoleChainedSession).roleSessionName);
      this.form.controls["roleArn"].setValue((this.selectedSession as AwsIamRoleChainedSession).roleArn);
      this.selectedParentSession = this.assumerAwsSessions.find(
        (ass: any) => ass.session.sessionId === (this.selectedSession as AwsIamRoleChainedSession).parentSessionId
      )?.session;
      this.namedProfileSelect.selectValue({
        value: this.selectedSession.profileId,
        label: this.hopkeyCoreService.namedProfileService.getProfileName(this.selectedSession.profileId),
      });
      setAgentForm(this.form, (this.selectedSession as AwsIamRoleChainedSession).agent);
    }

    if (this.accountType === SessionType.awsIamUser) {
      // Get other readonly properties
      this.form.controls["name"].setValue(this.selectedSession.sessionName);
      this.form.controls["mfaDevice"].setValue(this.selectedSession.mfaDevice);
      // eslint-disable-next-line max-len
      this.keychainService.getSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`).then((value) => {
        this.form.controls["accessKey"].setValue(value);
      });
      // eslint-disable-next-line max-len
      this.keychainService.getSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`).then((value) => {
        this.form.controls["secretKey"].setValue(value);
      });
      this.namedProfileSelect.selectValue({
        value: this.selectedSession.profileId,
        label: this.hopkeyCoreService.namedProfileService.getProfileName(this.selectedSession.profileId),
      });
    }

    /*if (this.accountType === SessionType.azure) {
      this.form.controls["name"].setValue((this.selectedSession as AzureSession).sessionName);
      this.form.controls["tenantId"].setValue((this.selectedSession as AzureSession).tenantId);
      this.form.controls["subscriptionId"].setValue((this.selectedSession as AzureSession).subscriptionId);
    }*/
  }

  selectedIdpUrlEvent($event: { items: any[]; item: any }): void {
    this.idpUrls = $event.items;
    this.selectedIdpUrl = $event.item;
  }

  compareAssumerSessions(a: any, b: any): boolean {
    return a?.session?.sessionId === b?.session?.sessionId;
  }

  /**
   * Add a new UUID
   */
  addNewUUID(): string {
    return uuid.v4();
  }

  /**
   * Save the edited account in the workspace
   */
  async saveAccount(): Promise<void> {
    this.submitting = true;
    try {
      if (this.formValid()) {
        this.addProfileToWorkspace();
        this.addIpdUrlToWorkspace();

        if (this.selectedSession.type !== SessionType.azure) {
          try {
            this.hopkeyCoreService.namedProfileService.getProfileName(this.selectedProfile.value);
          } catch (e) {
            this.selectedProfile.value = this.hopkeyCoreService.namedProfileService.createNamedProfile(this.selectedProfile.label).id;
          }
        }

        // Check the agent settings before changing anything
        const agent = this.validatedAgent();
        const previousAgent = (this.selectedSession as AwsIamRoleChainedSession).agent;

        // Stop the session with its old settings: an agent session hands out its credentials differently
        let wasActive = false;
        if (this.selectedSession.status === SessionStatus.active) {
          await this.sessionService.stop(this.selectedSession.sessionId);
          wasActive = true;
        }

        this.updateProperties(agent);
        if (agent || previousAgent) {
          this.recordAgentUpdate(previousAgent);
        }

        if (this.selectedSession.type !== SessionType.azure) {
          await this.hopkeyCoreService.namedProfileService.changeNamedProfile(this.selectedSession, this.selectedProfile.value);
          this.selectedSession.region = this.form.get("awsRegion").value;
        } else {
          this.selectedSession.region = this.form.get("azureLocation").value;
        }

        const sessions = this.hopkeyCoreService.sessionManagementService.getSessions();
        const index = sessions.findIndex((s) => s.sessionId === this.selectedSession.sessionId);
        sessions[index] = this.selectedSession;
        this.hopkeyCoreService.sessionManagementService.updateSessions(sessions);
        this.behaviouralSubjectService.setSessions(this.hopkeyCoreService.sessionManagementService.getSessions());

        if (wasActive) {
          await this.sessionService.start(this.selectedSession.sessionId);
        }

        this.messageToasterService.toast(`Session: ${this.form.value.name}, edited.`, ToastLevel.success, "");
      } else {
        this.messageToasterService.toast(`One or more parameters are invalid, check your choices.`, ToastLevel.warn, "");
      }
    } catch (error) {
      this.messageToasterService.toast(error.message, ToastLevel.error);
    } finally {
      this.submitting = false;
      this.closeModal();
    }
  }

  async tryProperties(): Promise<void> {
    // Trying agent settings must not change how the session hands out its credentials until it is saved
    const chainedSession = this.selectedSession as AwsIamRoleChainedSession;
    const { agent, roleSessionName } = chainedSession;
    try {
      if (this.formValid()) {
        this.updateProperties(this.agentFromForm());

        this.mfaPrompter.keepUnderlyingModal = true;
        const check = await this.sessionService.validateCredentials(this.selectedSession.sessionId);
        this.mfaPrompter.keepUnderlyingModal = false;

        if (check) {
          this.messageToasterService.toast(`Session: ${this.form.value.name} is able to generate credentials correctly.`, ToastLevel.success, "");
        } else {
          this.messageToasterService.toast(`One or more parameters are invalid, please check.`, ToastLevel.warn, "");
        }
      } else {
        this.messageToasterService.toast(`One or more parameters are invalid, please check.`, ToastLevel.warn, "");
      }
    } catch (err) {
      this.messageToasterService.toast(`One or more parameters are invalid: ${err.toString()}.`, ToastLevel.warn, "");
    } finally {
      if (this.accountType === SessionType.awsIamRoleChained) {
        chainedSession.roleSessionName = roleSessionName;
        this.setAgent(chainedSession, agent);
      }
    }
  }

  updateProperties(agent?: AwsAgentSettings): void {
    switch (this.accountType) {
      case SessionType.awsIamRoleFederated:
        (this.selectedSession as AwsIamRoleFederatedSession).sessionName = this.form.controls["name"].value;
        (this.selectedSession as AwsIamRoleFederatedSession).region = this.selectedRegion;
        (this.selectedSession as AwsIamRoleFederatedSession).idpUrlId = this.selectedIdpUrl.value.trim();
        (this.selectedSession as AwsIamRoleFederatedSession).idpArn = this.form.value.idpArn.trim();
        (this.selectedSession as AwsIamRoleFederatedSession).roleArn = this.form.value.roleArn.trim();
        break;
      case SessionType.awsIamUser:
        this.selectedSession.sessionName = this.form.controls["name"].value.trim();
        this.selectedSession.region = this.selectedRegion;
        this.selectedSession.mfaDevice = this.form.controls["mfaDevice"].value.trim();
        // eslint-disable-next-line max-len
        this.keychainService
          .saveSecret(
            constants.appName,
            `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`,
            this.form.controls["accessKey"].value.replace(/\s/g, "")
          )
          .then((_) => {});
        // eslint-disable-next-line max-len
        this.keychainService
          .saveSecret(
            constants.appName,
            `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`,
            this.form.controls["secretKey"].value.replace(/\s/g, "")
          )
          .then((_) => {});
        break;
      case SessionType.awsIamRoleChained:
        (this.selectedSession as AwsIamRoleChainedSession).sessionName = this.form.controls["name"].value;
        (this.selectedSession as AwsIamRoleChainedSession).region = this.selectedRegion;
        (this.selectedSession as AwsIamRoleChainedSession).roleSessionName = agent
          ? agentRoleSessionName(agent.name)
          : this.form.value.roleSessionName.trim();
        (this.selectedSession as AwsIamRoleChainedSession).parentSessionId = this.selectedParentSession.sessionId;
        (this.selectedSession as AwsIamRoleChainedSession).roleArn = this.form.value.roleArn.trim();
        this.setAgent(this.selectedSession as AwsIamRoleChainedSession, agent);
        break;
      /*case SessionType.azure:
        (this.selectedSession as AzureSession).region = this.selectedLocation;
        (this.selectedSession as AzureSession).sessionName = this.form.value.name;
        (this.selectedSession as AzureSession).subscriptionId = this.form.value.subscriptionId.trim();
        (this.selectedSession as AzureSession).tenantId = this.form.value.tenantId.trim();
        break;*/
    }
  }

  /**
   * Form validation mechanic
   */
  formValid(): boolean {
    let result = false;
    switch (this.accountType) {
      case SessionType.awsIamRoleFederated:
        result =
          this.form.get("name").valid &&
          this.selectedProfile &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("roleArn").valid &&
          this.selectedIdpUrl &&
          this.form.get("idpArn").valid;
        break;
      case SessionType.awsIamRoleChained:
        result =
          this.form.get("name").valid &&
          this.selectedProfile &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("roleArn").valid &&
          this.form.get("roleSessionName").valid &&
          this.selectedSession?.sessionId &&
          isAgentFormValid(this.form);
        break;
      case SessionType.awsIamUser:
        result =
          this.form.get("name").valid &&
          this.selectedProfile &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("mfaDevice").valid &&
          this.form.get("accessKey").valid &&
          this.form.get("secretKey").valid;
        break;
      /*case SessionType.azure:
        result =
          this.form.get("name").valid &&
          this.form.get("subscriptionId").valid &&
          this.form.get("tenantId").valid &&
          this.form.get("azureLocation").valid;
        break;*/
    }
    return result;
  }

  goBack(): void {
    this.appService.closeModal();
  }

  getIconForProvider(provider: SessionType): string {
    switch (provider) {
      /*case SessionType.azure:
        return "azure-logo.svg";*/
      case SessionType.google:
        return "google.png";
      case SessionType.alibaba:
        return "alibaba.png";
      default:
        return `aws${
          this.optionsService.colorTheme === constants.darkTheme ||
          (this.optionsService.colorTheme === constants.systemDefaultTheme && this.appService.isDarkMode())
            ? "-dark"
            : ""
        }.png`;
    }
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  private agentFromForm(): AwsAgentSettings | undefined {
    const agent = agentSettingsFromForm(this.form);
    return agent ? normalizeAgentSettings(agent) : undefined;
  }

  // Agent settings, checked against the other sessions: unique name, named profile of its own
  private validatedAgent(): AwsAgentSettings | undefined {
    const agent = this.accountType === SessionType.awsIamRoleChained ? agentSettingsFromForm(this.form) : undefined;
    return agent
      ? this.hopkeyCoreService.awsIamRoleChainedService.validateAgent(agent, this.selectedSession.sessionId, this.selectedProfile.value)
      : undefined;
  }

  private setAgent(session: AwsIamRoleChainedSession, agent?: AwsAgentSettings): void {
    if (agent) {
      session.agent = agent;
    } else {
      delete session.agent;
    }
  }

  private recordAgentUpdate(previousAgent?: AwsAgentSettings): void {
    try {
      this.hopkeyCoreService.agentService.recordUpdate(this.selectedSession, previousAgent);
    } catch (error) {
      this.messageToasterService.toast(`Hopkey could not record the change in the agent's activity: ${error.message}`, ToastLevel.warn);
    }
  }

  /**
   * Save a new Single Sign on object in workspace if new
   *
   * @private
   */
  private addIpdUrlToWorkspace() {
    if (this.accountType === SessionType.awsIamRoleFederated) {
      const validate = this.hopkeyCoreService.idpUrlService.validateIdpUrl(this.selectedIdpUrl.label);
      if (validate === true) {
        const idpUrl = this.hopkeyCoreService.idpUrlService.createIdpUrl(this.selectedIdpUrl.label);
        this.selectedIdpUrl.value = idpUrl.id;
      } else {
        if (validate.toString() !== "IdP URL already exists") {
          throw new HopkeyParseError(this, validate.toString());
        }
      }
    }
  }

  /**
   * Save a New profile if is not in the workspace
   *
   * @private
   */
  private addProfileToWorkspace() {
    if (this.selectedSession.type !== SessionType.azure) {
      const validate = this.hopkeyCoreService.namedProfileService.validateNewProfileName(this.selectedProfile.label);
      if (validate === true) {
        const profile = this.hopkeyCoreService.namedProfileService.createNamedProfile(this.selectedProfile.label);
        this.selectedProfile.value = profile.id;
      } else {
        if (
          validate.toString() !== "Profile already exists" &&
          this.hopkeyCoreService.workspaceService.getDefaultProfileId() !== this.selectedProfile.value
        ) {
          throw new HopkeyParseError(this, validate.toString());
        }
      }
    }
  }
}
