import { CreateAwsSessionRequest } from "../create-aws-session-request";
import { AwsAgentSettings } from "../../../models/aws/aws-agent";

export interface AwsIamRoleChainedSessionRequest extends CreateAwsSessionRequest {
  roleArn: string;
  parentSessionId: string;
  roleSessionName?: string;
  agent?: AwsAgentSettings;
}
