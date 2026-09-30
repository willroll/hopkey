import { ux } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { SessionStatus } from "@hopkey/core/models/session-status";
import { HopkeyCommand } from "../../hopkey-command";
import { Session } from "@hopkey/core/models/session";
import { SessionType } from "@hopkey/core/models/session-type";
import { AwsIamRoleFederatedSession } from "@hopkey/core/models/aws/aws-iam-role-federated-session";
import { AzureSession } from "@hopkey/core/models/azure/azure-session";
import { AwsSsoRoleSession } from "@hopkey/core/models/aws/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@hopkey/core/models/aws/aws-iam-role-chained-session";

export default class ListSessions extends HopkeyCommand {
  static description = "Show sessions list with all properties; filter query is case sensitive";
  static examples = [
    `$hopkey session list`,
    `$hopkey session list --filter="ID=Foo" -x`,
    `$hopkey session list --filter="Session Name=Foo"`,
    `$hopkey session list --filter="Type=Foo"`,
    `$hopkey session list --filter="Named Profile=Foo"`,
    `$hopkey session list --filter="Region/Location=Foo"`,
    `$hopkey session list --filter="Status=Foo"`,
  ];

  static flags = {
    ...ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showSessions();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showSessions(): Promise<void> {
    const { flags } = await this.parse(ListSessions);
    const sessionTypeLabelMap = this.cliProviderService.cloudProviderService.getSessionTypeMap();
    const namedProfilesMap = this.cliProviderService.namedProfilesService.getNamedProfilesMap();
    const data = this.cliProviderService.sessionManagementService.getSessions().map((session: any) => ({
      id: session.sessionId,
      sessionName: session.sessionName,
      role: this.getRole(session),
      type: sessionTypeLabelMap.get(session.type),
      profileId: "profileId" in session ? namedProfilesMap.get((session as any).profileId)?.name : "-",
      region: session.region,
      status: SessionStatus[session.status],
    })) as any as Record<string, unknown>[];

    const columns = {
      id: { header: "ID", extended: true },
      sessionName: { header: "Session Name" },
      role: { header: "Role", extended: true },
      type: { header: "Type" },
      profileId: { header: "Named Profile" },
      region: { header: "Region/Location" },
      status: { header: "Status" },
    };

    ux.table(data, columns, { ...flags });
  }

  private getRole(session: Session): string {
    switch (session.type) {
      case SessionType.awsIamRoleFederated:
        return (session as AwsIamRoleFederatedSession).roleArn.split("role/")[1] || "";
      case SessionType.azure:
        return (session as AzureSession).subscriptionId;
      case SessionType.awsIamUser:
        return ""; // (sessions as AwsIamUserSession).sessionName;
      case SessionType.awsSsoRole:
        const splittedRoleArn = (session as AwsSsoRoleSession).roleArn.split("/");
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join("/");
      case SessionType.awsIamRoleChained:
        return (session as AwsIamRoleChainedSession).roleArn.split("role/")[1] || "";
      default:
        return "";
    }
  }
}
