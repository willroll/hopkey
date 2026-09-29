import { IAwsSsoOidcVerificationWindowService } from "@hopkey/core/interfaces/i-aws-sso-oidc-verification-window-service";
import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse,
} from "@hopkey/core/services/session/aws/aws-sso-role-service";
import { RemoteProceduresClient } from "@hopkey/core/services/remote-procedures-client";

export class CliRpcAwsSsoOidcVerificationWindowService implements IAwsSsoOidcVerificationWindowService {
  constructor(private remoteProceduresClient: RemoteProceduresClient) {}

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: () => void
  ): Promise<VerificationResponse> {
    return this.remoteProceduresClient.openVerificationWindow(
      registerClientResponse,
      startDeviceAuthorizationResponse,
      windowModality,
      onWindowClose
    );
  }
}
