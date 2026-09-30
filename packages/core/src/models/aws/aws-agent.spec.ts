import { describe, expect, test } from "@jest/globals";
import {
  AgentPermissions,
  agentAssumeRoleParameters,
  agentRoleSessionName,
  normalizeAgentSettings,
  normalizeSessionPolicy,
  validateAgentName,
} from "./aws-agent";

describe("aws-agent", () => {
  const policy = JSON.parse('{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "s3:ListBucket", "Resource": "*"}]}');

  test("validateAgentName", () => {
    expect(validateAgentName("claude-infra")).toBeUndefined();
    expect(validateAgentName("a")).toBeUndefined();
    expect(validateAgentName("x".repeat(58))).toBeUndefined();
    expect(validateAgentName("x".repeat(59))).toBeDefined();
    expect(validateAgentName("")).toBeDefined();
    expect(validateAgentName("-starts-with-dash")).toBeDefined();
    expect(validateAgentName("has space")).toBeDefined();
    expect(validateAgentName("slash/name")).toBeDefined();
  });

  test("agentRoleSessionName fits the 64 characters AWS allows", () => {
    expect(agentRoleSessionName("claude")).toBe("agent-claude");
    expect(agentRoleSessionName("x".repeat(58)).length).toBe(64);
  });

  test("normalizeSessionPolicy minifies a policy", () => {
    expect(normalizeSessionPolicy(JSON.stringify(policy, null, 2))).toBe(JSON.stringify(policy));
  });

  test("normalizeSessionPolicy refuses what AWS would refuse", () => {
    expect(() => normalizeSessionPolicy("{")).toThrow("not valid JSON");
    expect(() => normalizeSessionPolicy("[]")).toThrow("with a Statement");
    expect(() => normalizeSessionPolicy('{"Version":"2012-10-17"}')).toThrow("with a Statement");
    const bigPolicy = JSON.stringify(policy).replace('"*"', `"${"x".repeat(2100)}"`);
    expect(() => normalizeSessionPolicy(bigPolicy)).toThrow("more than the 2048 AWS allows");
  });

  test("normalizeAgentSettings keeps only what the permissions use", () => {
    expect(
      normalizeAgentSettings({
        name: "claude",
        permissions: AgentPermissions.readOnly,
        sessionPolicy: "ignored",
        durationSeconds: 1800,
        setSourceIdentity: undefined,
      })
    ).toEqual({ name: "claude", permissions: AgentPermissions.readOnly, durationSeconds: 1800, setSourceIdentity: false });

    expect(
      normalizeAgentSettings({
        name: "claude",
        permissions: AgentPermissions.custom,
        sessionPolicy: JSON.stringify(policy, null, 2),
        durationSeconds: undefined,
        setSourceIdentity: true,
      })
    ).toEqual({
      name: "claude",
      permissions: AgentPermissions.custom,
      sessionPolicy: JSON.stringify(policy),
      durationSeconds: 900,
      setSourceIdentity: true,
    });
  });

  test("normalizeAgentSettings refuses invalid settings", () => {
    const valid = { name: "claude", permissions: AgentPermissions.role, durationSeconds: 900, setSourceIdentity: false };
    expect(() => normalizeAgentSettings({ ...valid, name: "bad name" })).toThrow("Agent names");
    expect(() => normalizeAgentSettings({ ...valid, permissions: "admin" as any })).toThrow('Unknown agent permissions "admin"');
    expect(() => normalizeAgentSettings({ ...valid, durationSeconds: 899 })).toThrow("between 15 and 60 minutes");
    expect(() => normalizeAgentSettings({ ...valid, durationSeconds: 3601 })).toThrow("between 15 and 60 minutes");
    expect(() => normalizeAgentSettings({ ...valid, durationSeconds: 1000.5 })).toThrow("between 15 and 60 minutes");
    expect(() => normalizeAgentSettings({ ...valid, permissions: AgentPermissions.custom })).toThrow("need a session policy");
  });

  test("agentAssumeRoleParameters - read-only and view-only use the AWS managed policies of the role's partition", () => {
    const agent = { name: "claude", permissions: AgentPermissions.readOnly, durationSeconds: 900, setSourceIdentity: false };
    expect(agentAssumeRoleParameters(agent, "arn:aws:iam::123456789012:role/agents")).toEqual({
      ["RoleSessionName"]: "agent-claude",
      ["DurationSeconds"]: 900,
      ["PolicyArns"]: [{ arn: "arn:aws:iam::aws:policy/ReadOnlyAccess" }],
    });
    expect(agentAssumeRoleParameters({ ...agent, permissions: AgentPermissions.viewOnly }, "arn:aws-us-gov:iam::123456789012:role/agents")).toEqual({
      ["RoleSessionName"]: "agent-claude",
      ["DurationSeconds"]: 900,
      ["PolicyArns"]: [{ arn: "arn:aws-us-gov:iam::aws:policy/job-function/ViewOnlyAccess" }],
    });
  });

  test("agentAssumeRoleParameters - custom policy, role permissions and source identity", () => {
    const agent = {
      name: "claude",
      permissions: AgentPermissions.custom,
      sessionPolicy: JSON.stringify(policy),
      durationSeconds: 3600,
      setSourceIdentity: true,
    };
    expect(agentAssumeRoleParameters(agent, "arn:aws:iam::123456789012:role/agents")).toEqual({
      ["RoleSessionName"]: "agent-claude",
      ["DurationSeconds"]: 3600,
      ["Policy"]: JSON.stringify(policy),
      ["SourceIdentity"]: "agent-claude",
    });
    expect(agentAssumeRoleParameters({ ...agent, permissions: AgentPermissions.role, setSourceIdentity: false }, "not-an-arn")).toEqual({
      ["RoleSessionName"]: "agent-claude",
      ["DurationSeconds"]: 3600,
    });
  });
});
