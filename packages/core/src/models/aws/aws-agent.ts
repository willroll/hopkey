/**
 * What an AI agent may do with the role of its session.
 */
export enum AgentPermissions {
  role = "role",
  readOnly = "read-only",
  viewOnly = "view-only",
  custom = "custom",
}

/**
 * Settings that turn an IAM Role Chained session into the credentials of an AI agent. Hopkey assumes the role with a
 * session policy that narrows it, names the role session after the agent so that CloudTrail attributes every call to
 * it, and only hands the credentials out through credential_process, never through the credentials file.
 */
export interface AwsAgentSettings {
  name: string;
  permissions: AgentPermissions;
  // IAM policy JSON, used with AgentPermissions.custom
  sessionPolicy?: string;
  durationSeconds: number;
  // Requires sts:SetSourceIdentity in the trust policy of the role
  setSourceIdentity: boolean;
}

export const agentConstants = {
  defaultPermissions: AgentPermissions.readOnly,
  // AssumeRole from role credentials (role chaining) lasts between 15 minutes and 1 hour
  minDurationSeconds: 900,
  maxDurationSeconds: 3600,
  defaultDurationSeconds: 900,
  // Session policies can't exceed 2,048 characters
  maxSessionPolicyLength: 2048,
  roleSessionNamePrefix: "agent-",
  activityFileDestination: ".hopkey/agent-activity.jsonl",
  previousActivityFileDestination: ".hopkey/agent-activity.1.jsonl",
  maxActivityFileSize: 10 * 1024 * 1024,
};

export const agentPermissionsLabels: { [permissions in AgentPermissions]: string } = {
  [AgentPermissions.role]: "Role's own permissions",
  [AgentPermissions.readOnly]: "Read-only",
  [AgentPermissions.viewOnly]: "View-only",
  [AgentPermissions.custom]: "Custom policy",
};

// Role session names allow 2 to 64 of [\w+=,.@-]: the name leaves room for the "agent-" prefix
const agentNamePattern = /^[A-Za-z0-9][A-Za-z0-9_+=,.@-]{0,57}$/;

const managedPolicyNames = {
  [AgentPermissions.readOnly]: "ReadOnlyAccess",
  [AgentPermissions.viewOnly]: "job-function/ViewOnlyAccess",
};

export const agentRoleSessionName = (agentName: string): string => `${agentConstants.roleSessionNamePrefix}${agentName}`;

export const validateAgentName = (name: string): string | undefined => {
  if (!name || !agentNamePattern.test(name)) {
    return "Agent names start with a letter or a digit and use up to 58 letters, digits and _+=,.@- characters";
  }
  return undefined;
};

/**
 * Returns the minified session policy, or throws when it isn't a valid session policy.
 */
export const normalizeSessionPolicy = (sessionPolicy: string): string => {
  let policy: any;
  try {
    policy = JSON.parse(sessionPolicy);
  } catch (error) {
    throw new Error(`The session policy is not valid JSON: ${error.message}`);
  }
  if (!policy || typeof policy !== "object" || Array.isArray(policy) || !policy.Statement) {
    throw new Error("The session policy must be an IAM policy document with a Statement");
  }
  const minified = JSON.stringify(policy);
  if (minified.length > agentConstants.maxSessionPolicyLength) {
    throw new Error(`The session policy has ${minified.length} characters, more than the ${agentConstants.maxSessionPolicyLength} AWS allows`);
  }
  return minified;
};

/**
 * Returns the agent settings to store, or throws when they aren't valid.
 */
export const normalizeAgentSettings = (agent: AwsAgentSettings): AwsAgentSettings => {
  const nameError = validateAgentName(agent.name);
  if (nameError) {
    throw new Error(nameError);
  }
  if (!Object.values(AgentPermissions).includes(agent.permissions)) {
    throw new Error(`Unknown agent permissions "${agent.permissions}"`);
  }
  const durationSeconds = agent.durationSeconds ?? agentConstants.defaultDurationSeconds;
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < agentConstants.minDurationSeconds ||
    durationSeconds > agentConstants.maxDurationSeconds
  ) {
    throw new Error("Agent credentials last between 15 and 60 minutes");
  }
  const normalized: AwsAgentSettings = {
    name: agent.name,
    permissions: agent.permissions,
    durationSeconds,
    setSourceIdentity: !!agent.setSourceIdentity,
  };
  if (agent.permissions === AgentPermissions.custom) {
    if (!agent.sessionPolicy) {
      throw new Error("Custom agent permissions need a session policy");
    }
    normalized.sessionPolicy = normalizeSessionPolicy(agent.sessionPolicy);
  }
  return normalized;
};

/**
 * The AssumeRole parameters that scope a role session to an agent.
 */
export const agentAssumeRoleParameters = (agent: AwsAgentSettings, roleArn: string): { [parameter: string]: any } => {
  const roleSessionName = agentRoleSessionName(agent.name);
  const parameters: { [parameter: string]: any } = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RoleSessionName: roleSessionName,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DurationSeconds: agent.durationSeconds,
  };
  if (agent.permissions === AgentPermissions.readOnly || agent.permissions === AgentPermissions.viewOnly) {
    const partition = roleArn?.split(":")[1] || "aws";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters.PolicyArns = [{ arn: `arn:${partition}:iam::aws:policy/${managedPolicyNames[agent.permissions]}` }];
  } else if (agent.permissions === AgentPermissions.custom) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters.Policy = agent.sessionPolicy;
  }
  if (agent.setSourceIdentity) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters.SourceIdentity = roleSessionName;
  }
  return parameters;
};
