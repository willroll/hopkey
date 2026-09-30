import { Flags } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";
import { region } from "../../flags";
import { AgentPermissions, agentConstants, agentPermissionsLabels, validateAgentName } from "@hopkey/core/models/aws/aws-agent";
import { CreateAgentRequest } from "@hopkey/core/services/agent-service";

export default class AddAgent extends HopkeyCommand {
  static description = "Give an AI agent narrowed, short-lived credentials of its own, tracked in its activity history";

  static examples = [
    `$hopkey agent add`,
    `$hopkey agent add --name claude --parentSessionId SESSIONID --roleArn arn:aws:iam::123456789012:role/agents`,
    `$hopkey agent add --name claude --parentSessionId SESSIONID --roleArn ROLEARN --permissions custom --policyFile policy.json --duration 30`,
  ];

  static flags = {
    name: Flags.string({ description: "Name of the agent, used in its named profile (agent-<name>) and in CloudTrail" }),
    parentSessionId: Flags.string({
      description:
        "Id of the AWS IAM User, IAM Role Federated or IAM Identity Center session the agent assumes its role from; see $hopkey session list -x",
    }),
    roleArn: Flags.string({ description: "ARN of the role the agent assumes" }),
    region,
    profileName: Flags.string({ description: "Named profile of the agent, agent-<name> by default" }),
    permissions: Flags.string({
      description: "What the agent may do with the role: its own permissions, AWS ReadOnlyAccess, AWS ViewOnlyAccess or a custom session policy",
      options: Object.values(AgentPermissions),
    }),
    policyFile: Flags.string({ description: "File with the session policy (IAM policy JSON) for --permissions custom" }),
    duration: Flags.integer({ description: "Minutes the agent's credentials last, from 15 to 60", min: 15, max: 60 }),
    sourceIdentity: Flags.boolean({
      description:
        "Also set the agent as source identity, kept by AWS through further role changes; the role's trust policy must allow sts:SetSourceIdentity",
      default: false,
    }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(AddAgent);
      const request = flags.name || flags.parentSessionId || flags.roleArn ? this.requestFromFlags(flags) : await this.askForRequest();
      await this.addAgent(request);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  requestFromFlags(flags: any): CreateAgentRequest {
    if (!flags.name || !flags.parentSessionId || !flags.roleArn) {
      throw new Error("--name, --parentSessionId and --roleArn are required");
    }
    if ((flags.permissions === AgentPermissions.custom) !== !!flags.policyFile) {
      throw new Error("--policyFile goes with --permissions custom");
    }
    return {
      name: flags.name,
      parentSessionId: flags.parentSessionId,
      roleArn: flags.roleArn,
      region: flags.region,
      profileName: flags.profileName,
      permissions: flags.permissions as AgentPermissions,
      sessionPolicy: flags.policyFile ? this.readPolicyFile(flags.policyFile) : undefined,
      durationSeconds: flags.duration ? flags.duration * 60 : undefined,
      setSourceIdentity: flags.sourceIdentity,
    };
  }

  async askForRequest(): Promise<CreateAgentRequest> {
    const parentSessions = this.cliProviderService.agentService.getParentSessions();
    if (parentSessions.length === 0) {
      throw new Error("an agent assumes its role from an AWS IAM User, IAM Role Federated or IAM Identity Center session: add one first");
    }
    const answers: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "name",
        message: "name of the agent",
        type: "input",
        validate: (name: string) => validateAgentName(name) ?? true,
      },
      {
        name: "parentSessionId",
        message: "session to assume the role from",
        type: "list",
        choices: parentSessions.map((session) => ({ name: session.sessionName, value: session.sessionId })),
      },
      {
        name: "roleArn",
        message: "ARN of the role the agent assumes",
        type: "input",
        validate: (roleArn: string) => (roleArn.trim() ? true : "insert the role ARN"),
      },
      {
        name: "permissions",
        message: "what the agent may do with the role",
        type: "list",
        default: agentConstants.defaultPermissions,
        choices: Object.values(AgentPermissions).map((permissions) => ({ name: agentPermissionsLabels[permissions], value: permissions })),
      },
      {
        name: "policyFile",
        message: "file with the session policy",
        type: "input",
        when: (answer: any) => answer.permissions === AgentPermissions.custom,
      },
      {
        name: "duration",
        message: "how long the agent's credentials last",
        type: "list",
        choices: [15, 30, 45, 60].map((minutes) => ({ name: `${minutes} minutes`, value: minutes })),
      },
      {
        name: "sourceIdentity",
        message: "set the agent as source identity? (the role's trust policy must allow sts:SetSourceIdentity)",
        type: "confirm",
        default: false,
      },
    ]);
    return {
      name: answers.name,
      parentSessionId: answers.parentSessionId,
      roleArn: answers.roleArn,
      permissions: answers.permissions,
      sessionPolicy: answers.policyFile ? this.readPolicyFile(answers.policyFile) : undefined,
      durationSeconds: answers.duration * 60,
      setSourceIdentity: answers.sourceIdentity,
    };
  }

  async addAgent(request: CreateAgentRequest): Promise<void> {
    try {
      const session = await this.cliProviderService.agentService.createAgent(request);
      const profileName = this.cliProviderService.namedProfilesService.getProfileName(session.profileId);
      this.log(`agent ${session.agent.name} added with the named profile ${profileName}`);
      this.log(`enable it with "hopkey agent enable ${session.agent.name}", then give the agent AWS_PROFILE=${profileName}`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  private readPolicyFile(policyFile: string): string {
    return this.cliProviderService.cliNativeService.fs.readFileSync(policyFile, "utf8");
  }
}
