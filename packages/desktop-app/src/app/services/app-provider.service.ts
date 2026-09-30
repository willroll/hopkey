import { Injectable, NgZone } from "@angular/core";
import { AwsSamlAssertionExtractionService } from "@hopkey/core/services/aws-saml-assertion-extraction-service";
import { RemoteProceduresServer } from "@hopkey/core/services/remote-procedures-server";
import { AwsIamUserService } from "@hopkey/core/services/session/aws/aws-iam-user-service";
import { FileService } from "@hopkey/core/services/file-service";
import { AwsCoreService } from "@hopkey/core/services/aws-core-service";
import { LogService } from "@hopkey/core/services/log-service";
import { TimerService } from "@hopkey/core/services/timer-service";
import { AwsIamRoleFederatedService } from "@hopkey/core/services/session/aws/aws-iam-role-federated-service";
import { AzureSessionService } from "@hopkey/core/services/session/azure/azure-session-service";
import { AppNativeService } from "./app-native.service";
import { AppMfaCodePromptService } from "./app-mfa-code-prompt.service";
import { ExecuteService } from "@hopkey/core/services/execute-service";
import { RetroCompatibilityService } from "@hopkey/core/services/retro-compatibility-service";
import { AppAwsAuthenticationService } from "./app-aws-authentication.service";
import { AwsParentSessionFactory } from "@hopkey/core/services/session/aws/aws-parent-session.factory";
import { AwsIamRoleChainedService } from "@hopkey/core/services/session/aws/aws-iam-role-chained-service";
import { Repository } from "@hopkey/core/services/repository";
import { LegacyImportService } from "@hopkey/core/services/legacy-import-service";
import { AwsSsoRoleService } from "@hopkey/core/services/session/aws/aws-sso-role-service";
import { AwsSsoOidcService } from "@hopkey/core/services/aws-sso-oidc.service";
import { AppVerificationWindowService } from "./app-verification-window.service";
import { BehaviouralSubjectService } from "@hopkey/core/services/behavioural-subject-service";
import { SessionFactory } from "@hopkey/core/services/session-factory";
import { RotationService } from "@hopkey/core/services/rotation-service";
import { AzureCoreService } from "@hopkey/core/services/azure-core-service";
import { constants } from "@hopkey/core/models/constants";
import { AwsSsoIntegrationService } from "@hopkey/core/services/integration/aws-sso-integration-service";
import { WebConsoleService } from "@hopkey/core/services/web-console-service";
import { WindowService } from "./window.service";
import { SsmService } from "@hopkey/core/services/ssm-service";
import { IdpUrlsService } from "@hopkey/core/services/idp-urls-service";
import { NamedProfilesService } from "@hopkey/core/services/named-profiles-service";
import { SegmentService } from "@hopkey/core/services/segment-service";
import { SessionManagementService } from "@hopkey/core/services/session-management-service";
import { WorkspaceService } from "@hopkey/core/services/workspace-service";
import { AppNativeLoggerService } from "./app-native-logger-service";
import { MessageToasterService } from "./message-toaster.service";
import { AzurePersistenceService } from "@hopkey/core/services/azure-persistence-service";
import { AzureIntegrationService } from "@hopkey/core/services/integration/azure-integration-service";
import { IntegrationIsOnlineStateRefreshService } from "@hopkey/core/services/integration/integration-is-online-state-refresh-service";
import { PluginManagerService } from "@hopkey/core/plugin-sdk/plugin-manager-service";
import { HttpClient } from "@angular/common/http";
import { EnvironmentType, PluginEnvironment } from "@hopkey/core/plugin-sdk/plugin-environment";
import { IntegrationFactory } from "@hopkey/core/services/integration-factory";
import { AppKeychainService } from "./app-keychain-service";
import { IKeychainService } from "@hopkey/core/interfaces/i-keychain-service";
import { WorkspaceConsistencyService } from "@hopkey/core/services/workspace-consistency-service";
import { RegionsService } from "@hopkey/core/services/regions-service";
import { NotificationService } from "@hopkey/core/services/notification-service";
import { TeamService } from "./team-service";
import { LocalstackSessionService } from "@hopkey/core/services/session/localstack/localstack-session-service";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { AgentActivityService } from "@hopkey/core/services/agent-activity-service";
import { AgentService } from "@hopkey/core/services/agent-service";

@Injectable({
  providedIn: "root",
})
export class AppProviderService {
  // Injected by app.component
  mfaCodePrompter: AppMfaCodePromptService;
  awsAuthenticationService: AppAwsAuthenticationService;
  verificationWindowService: AppVerificationWindowService;
  windowService: WindowService;

  private behaviouralSubjectServiceInstance: BehaviouralSubjectService;
  private awsIamUserServiceInstance: AwsIamUserService;
  private awsIamRoleFederatedServiceInstance: AwsIamRoleFederatedService;
  private awsIamRoleChainedServiceInstance: AwsIamRoleChainedService;
  private awsSsoRoleServiceInstance: AwsSsoRoleService;
  private awsSsoIntegrationServiceInstance: AwsSsoIntegrationService;
  private awsSsoOidcServiceInstance: AwsSsoOidcService;
  private awsCoreServiceInstance: AwsCoreService;
  private azureServiceInstance: AzureSessionService;
  private azureIntegrationServiceInstance: AzureIntegrationService;
  private localstackServiceInstance: LocalstackSessionService;
  private authenticationServiceInstance: AwsSamlAssertionExtractionService;
  private sessionFactoryInstance: SessionFactory;
  private awsParentSessionFactoryInstance: AwsParentSessionFactory;
  private fileServiceInstance: FileService;
  private repositoryInstance: Repository;
  private legacyImportServiceInstance: LegacyImportService;
  private regionsServiceInstance: RegionsService;
  private keychainServiceInstance: IKeychainService;
  private workspaceConsistencyServiceInstance: WorkspaceConsistencyService;
  private logServiceInstance: LogService;
  private timerServiceInstance: TimerService;
  private executeServiceInstance: ExecuteService;
  private rotationServiceInstance: RotationService;
  private retroCompatibilityServiceInstance: RetroCompatibilityService;
  private azureCoreServiceInstance: AzureCoreService;
  private webConsoleServiceInstance: WebConsoleService;
  private ssmServiceInstance: SsmService;
  private idpUrlServiceInstance: IdpUrlsService;
  private namedProfileInstance: NamedProfilesService;
  private remoteProceduresServerInstance: RemoteProceduresServer;
  private segmentServiceInstance: SegmentService;
  private sessionManagementServiceInstance: SessionManagementService;
  private workspaceServiceInstance: WorkspaceService;
  private azurePersistenceServiceInstance: AzurePersistenceService;
  private integrationIsOnlineStateRefreshServiceInstance: IntegrationIsOnlineStateRefreshService;
  private pluginManagerServiceInstance: PluginManagerService;
  private integrationFactoryInstance: IntegrationFactory;
  private teamServiceInstance: TeamService;
  private notificationServiceInstance: NotificationService;
  private agentActivityServiceInstance: AgentActivityService;
  private agentServiceInstance: AgentService;

  constructor(
    private appNativeService: AppNativeService,
    private messageToaster: MessageToasterService,
    private ngZone: NgZone,
    private http: HttpClient
  ) {}

  public get agentActivityService(): AgentActivityService {
    if (!this.agentActivityServiceInstance) {
      this.agentActivityServiceInstance = new AgentActivityService(this.appNativeService);
    }
    return this.agentActivityServiceInstance;
  }

  public get agentService(): AgentService {
    if (!this.agentServiceInstance) {
      this.agentServiceInstance = new AgentService(
        this.repository,
        this.namedProfileService,
        this.awsIamRoleChainedService,
        this.agentActivityService
      );
    }
    return this.agentServiceInstance;
  }

  public get notificationService(): NotificationService {
    if (!this.notificationServiceInstance) {
      this.notificationServiceInstance = new NotificationService(this.repository);
    }
    return this.notificationServiceInstance;
  }

  public get pluginManagerService(): PluginManagerService {
    if (!this.pluginManagerServiceInstance) {
      this.pluginManagerServiceInstance = new PluginManagerService(
        new PluginEnvironment(EnvironmentType.desktopApp, this),
        this.appNativeService,
        this.logService,
        this.repository,
        this.sessionFactory,
        this.http
      );
    }
    return this.pluginManagerServiceInstance;
  }

  public get workspaceService(): WorkspaceService {
    if (!this.workspaceServiceInstance) {
      this.workspaceServiceInstance = new WorkspaceService(this.repository);
    }
    return this.workspaceServiceInstance;
  }

  public get segmentService(): SegmentService {
    if (!this.segmentServiceInstance) {
      this.segmentServiceInstance = new SegmentService(this.repository);
    }
    return this.segmentServiceInstance;
  }

  public get sessionManagementService(): SessionManagementService {
    if (!this.sessionManagementServiceInstance) {
      this.sessionManagementServiceInstance = new SessionManagementService(this.repository, this.sessionFactory);
    }
    return this.sessionManagementServiceInstance;
  }

  public get idpUrlService(): IdpUrlsService {
    if (!this.idpUrlServiceInstance) {
      this.idpUrlServiceInstance = new IdpUrlsService(this.sessionFactory, this.repository);
    }
    return this.idpUrlServiceInstance;
  }

  public get namedProfileService(): NamedProfilesService {
    if (!this.namedProfileInstance) {
      this.namedProfileInstance = new NamedProfilesService(this.sessionFactory, this.repository, this.behaviouralSubjectService);
    }
    return this.namedProfileInstance;
  }

  public get webConsoleService(): WebConsoleService {
    if (!this.webConsoleServiceInstance) {
      this.webConsoleServiceInstance = new WebConsoleService(this.windowService, this.logService, this.appNativeService);
    }
    return this.webConsoleServiceInstance;
  }

  public get behaviouralSubjectService(): BehaviouralSubjectService {
    if (!this.behaviouralSubjectServiceInstance) {
      this.behaviouralSubjectServiceInstance = new BehaviouralSubjectService(this.repository);
    }
    return this.behaviouralSubjectServiceInstance;
  }

  public get awsIamUserService(): AwsIamUserService {
    if (!this.awsIamUserServiceInstance) {
      this.awsIamUserServiceInstance = new AwsIamUserService(
        this.behaviouralSubjectService,
        this.repository,
        this.mfaCodePrompter,
        this.mfaCodePrompter,
        this.keychainService,
        this.fileService,
        this.awsCoreService
      );
    }
    return this.awsIamUserServiceInstance;
  }

  public get awsIamRoleFederatedService(): AwsIamRoleFederatedService {
    if (!this.awsIamRoleFederatedServiceInstance) {
      this.awsIamRoleFederatedServiceInstance = new AwsIamRoleFederatedService(
        this.behaviouralSubjectService,
        this.repository,
        this.fileService,
        this.awsCoreService,
        this.awsAuthenticationService,
        this.repository.workspace.samlRoleSessionDuration
      );
    }
    return this.awsIamRoleFederatedServiceInstance;
  }

  public get awsIamRoleChainedService(): AwsIamRoleChainedService {
    if (!this.awsIamRoleChainedServiceInstance) {
      this.awsIamRoleChainedServiceInstance = new AwsIamRoleChainedService(
        this.behaviouralSubjectService,
        this.repository,
        this.awsCoreService,
        this.fileService,
        this.awsIamUserService,
        this.awsParentSessionFactory,
        this.agentActivityService
      );
    }
    return this.awsIamRoleChainedServiceInstance;
  }

  public get awsSsoIntegrationService(): AwsSsoIntegrationService {
    if (!this.awsSsoIntegrationServiceInstance) {
      this.awsSsoIntegrationServiceInstance = new AwsSsoIntegrationService(
        this.repository,
        this.keychainService,
        this.behaviouralSubjectService,
        this.appNativeService,
        this.sessionFactory,
        this.awsSsoOidcService,
        this.awsSsoRoleService
      );
    }
    return this.awsSsoIntegrationServiceInstance;
  }

  public get awsSsoRoleService(): AwsSsoRoleService {
    if (!this.awsSsoRoleServiceInstance) {
      this.awsSsoRoleServiceInstance = new AwsSsoRoleService(
        this.behaviouralSubjectService,
        this.repository,
        this.fileService,
        this.keychainService,
        this.awsCoreService,
        this.appNativeService,
        this.awsSsoOidcService
      );
    }
    return this.awsSsoRoleServiceInstance;
  }

  public get awsSsoOidcService(): AwsSsoOidcService {
    if (!this.awsSsoOidcServiceInstance) {
      this.awsSsoOidcServiceInstance = new AwsSsoOidcService(this.verificationWindowService, this.repository);
    }
    return this.awsSsoOidcServiceInstance;
  }

  public get awsCoreService(): AwsCoreService {
    if (!this.awsCoreServiceInstance) {
      this.awsCoreServiceInstance = new AwsCoreService(
        new FetchHttpHandler({
          requestTimeout: constants.timeout,
        }),
        this.appNativeService,
        this.logService
      );
    }
    return this.awsCoreServiceInstance;
  }

  public get azureSessionService(): AzureSessionService {
    if (!this.azureServiceInstance) {
      this.azureServiceInstance = new AzureSessionService(
        this.behaviouralSubjectService,
        this.repository,
        this.fileService,
        this.executeService,
        constants.azureMsalCacheFile,
        this.appNativeService,
        this.azurePersistenceService,
        this.logService
      );
    }

    return this.azureServiceInstance;
  }

  public get azureIntegrationService(): AzureIntegrationService {
    if (!this.azureIntegrationServiceInstance) {
      this.azureIntegrationServiceInstance = new AzureIntegrationService(
        this.repository,
        this.behaviouralSubjectService,
        this.appNativeService,
        this.sessionFactory,
        this.executeService,
        this.azureSessionService,
        this.azurePersistenceService
      );
    }
    return this.azureIntegrationServiceInstance;
  }

  public get azurePersistenceService(): AzurePersistenceService {
    if (!this.azurePersistenceServiceInstance) {
      this.azurePersistenceServiceInstance = new AzurePersistenceService(this.appNativeService, this.keychainService);
    }
    return this.azurePersistenceServiceInstance;
  }

  public get localstackSessionService(): LocalstackSessionService {
    if (!this.localstackServiceInstance) {
      this.localstackServiceInstance = new LocalstackSessionService(
        this.behaviouralSubjectService,
        this.repository,
        this.awsCoreService,
        this.fileService
      );
    }

    return this.localstackServiceInstance;
  }

  public get authenticationService(): AwsSamlAssertionExtractionService {
    if (!this.authenticationServiceInstance) {
      this.authenticationServiceInstance = new AwsSamlAssertionExtractionService();
    }
    return this.authenticationServiceInstance;
  }

  public get sessionFactory(): SessionFactory {
    if (!this.sessionFactoryInstance) {
      this.sessionFactoryInstance = new SessionFactory(
        this.awsIamUserService,
        this.awsIamRoleFederatedService,
        this.awsIamRoleChainedService,
        this.awsSsoRoleService,
        this.azureSessionService,
        this.localstackSessionService
      );
    }
    return this.sessionFactoryInstance;
  }

  public get ssmService(): SsmService {
    if (!this.ssmServiceInstance) {
      this.ssmServiceInstance = new SsmService(this.logService, this.executeService, this.appNativeService, this.fileService);
    }
    return this.ssmServiceInstance;
  }

  public get awsParentSessionFactory(): AwsParentSessionFactory {
    if (!this.awsParentSessionFactoryInstance) {
      this.awsParentSessionFactoryInstance = new AwsParentSessionFactory(
        this.awsIamUserService,
        this.awsIamRoleFederatedService,
        this.awsSsoRoleService
      );
    }
    return this.awsParentSessionFactoryInstance;
  }

  public get fileService(): FileService {
    if (!this.fileServiceInstance) {
      this.fileServiceInstance = new FileService(this.appNativeService);
      this.fileServiceInstance.aesKey = this.appNativeService.machineId;
    }
    return this.fileServiceInstance;
  }

  public get workspaceConsistencyService(): WorkspaceConsistencyService {
    if (!this.workspaceConsistencyServiceInstance) {
      this.workspaceConsistencyServiceInstance = new WorkspaceConsistencyService(this.fileService, this.appNativeService, this.logService);
    }
    return this.workspaceConsistencyServiceInstance;
  }

  public get repository(): Repository {
    if (!this.repositoryInstance) {
      this.repositoryInstance = new Repository(this.appNativeService, this.fileService, this.workspaceConsistencyService, this.legacyImportService);
    }
    return this.repositoryInstance;
  }

  public get legacyImportService(): LegacyImportService {
    if (!this.legacyImportServiceInstance) {
      this.legacyImportServiceInstance = new LegacyImportService(this.appNativeService, this.fileService);
    }
    return this.legacyImportServiceInstance;
  }

  get regionsService(): RegionsService {
    if (!this.regionsServiceInstance) {
      this.regionsServiceInstance = new RegionsService(this.sessionFactory, this.repository, this.behaviouralSubjectService);
    }
    return this.regionsServiceInstance;
  }

  public get keychainService(): IKeychainService {
    if (!this.keychainServiceInstance) {
      this.keychainServiceInstance = new AppKeychainService(this.appNativeService);
    }
    return this.keychainServiceInstance;
  }

  public get logService(): LogService {
    if (!this.logServiceInstance) {
      this.logServiceInstance = new LogService(new AppNativeLoggerService(this.appNativeService, this.messageToaster));
    }
    return this.logServiceInstance;
  }

  public get timerService(): TimerService {
    if (!this.timerServiceInstance) {
      this.timerServiceInstance = new TimerService();
    }
    return this.timerServiceInstance;
  }

  public get executeService(): ExecuteService {
    if (!this.executeServiceInstance) {
      this.executeServiceInstance = new ExecuteService(this.appNativeService, this.repository, this.logService);
    }
    return this.executeServiceInstance;
  }

  public get rotationService(): RotationService {
    if (!this.rotationServiceInstance) {
      this.rotationServiceInstance = new RotationService(this.sessionFactory, this.repository);
    }
    return this.rotationServiceInstance;
  }

  public get retroCompatibilityService(): RetroCompatibilityService {
    if (!this.retroCompatibilityServiceInstance) {
      this.retroCompatibilityServiceInstance = new RetroCompatibilityService(
        this.fileService,
        this.keychainService,
        this.repository,
        this.behaviouralSubjectService
      );
    }
    return this.retroCompatibilityServiceInstance;
  }

  public get azureCoreService(): AzureCoreService {
    if (!this.azureCoreServiceInstance) {
      this.azureCoreServiceInstance = new AzureCoreService(this.sessionManagementService, this.azureSessionService);
    }
    return this.azureCoreServiceInstance;
  }

  public get integrationFactory(): IntegrationFactory {
    if (!this.integrationFactoryInstance) {
      this.integrationFactoryInstance = new IntegrationFactory(this.awsSsoIntegrationService, this.azureIntegrationService);
    }
    return this.integrationFactoryInstance;
  }

  public get remoteProceduresServer(): RemoteProceduresServer {
    if (!this.remoteProceduresServerInstance) {
      this.remoteProceduresServerInstance = new RemoteProceduresServer(
        this.keychainService,
        this.appNativeService,
        this.verificationWindowService,
        this.awsAuthenticationService,
        this.integrationFactory,
        this.mfaCodePrompter,
        this.repository,
        this.behaviouralSubjectService,
        this.teamService,
        this.workspaceService,
        (uiSafeBlock) => this.ngZone.run(() => uiSafeBlock())
      );
    }
    return this.remoteProceduresServerInstance;
  }

  public get integrationIsOnlineStateRefreshService(): IntegrationIsOnlineStateRefreshService {
    if (!this.integrationIsOnlineStateRefreshServiceInstance) {
      this.integrationIsOnlineStateRefreshServiceInstance = new IntegrationIsOnlineStateRefreshService(
        this.integrationFactory,

        this.behaviouralSubjectService
      );
    }
    return this.integrationIsOnlineStateRefreshServiceInstance;
  }

  public get teamService(): TeamService {
    if (!this.teamServiceInstance) {
      this.teamServiceInstance = new TeamService(
        this.sessionFactory,
        this.namedProfileService,
        this.sessionManagementService,
        this.awsSsoIntegrationService,
        this.azureIntegrationService,
        this.idpUrlService,
        this.keychainService,
        this.appNativeService,
        this.fileService,
        window.crypto,
        this.workspaceService,
        this.integrationFactory,
        this.logService,
        this.behaviouralSubjectService
      );
    }
    return this.teamServiceInstance;
  }
}
