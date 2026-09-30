---
title: "Give AI agents their own credentials"
description: "How to give AI agents short-lived AWS credentials of their own, narrowed to what they may do, with a history of every credential they get."
page_type: "session"
---

## What an agent session is

AI agents, like coding assistants that run the AWS CLI or Terraform for you, can use the same credentials as you. That
gives them everything you can do, and CloudTrail can't tell their calls from yours.

An agent session gives an agent credentials of its own instead:

- **Narrowed**: Hopkey assumes a role for the agent with a session policy, so the agent can only do what both the role
  and the policy allow: read-only, view-only or a policy of your own.
- **Short-lived**: the credentials last 15 to 60 minutes and never land in the AWS credentials file. The agent gets them
  through its own named profile, with `credential_process`, and only while you keep it enabled.
- **Tracked**: every time the agent gets credentials, Hopkey records when, with which role and permissions, and which
  program asked. In AWS, the role session is named after the agent, so CloudTrail shows each of its calls as
  `assumed-role/<role>/agent-<name>`.

An agent session is an [AWS IAM Role Chained](configure-aws-iam-role-chained.md) session with agent settings: Hopkey
assumes the agent's role from one of your AWS IAM User, IAM Role Federated or IAM Identity Center sessions.

## Set up the role in AWS

Create a role for agents in each account they work in, and let your identity assume it. A session policy can only
narrow the role, so one role can serve several agents with different permissions. This trust policy lets the principals
of account `123456789012` assume the role and name a source identity, as long as their own permissions allow
`sts:AssumeRole` (and `sts:SetSourceIdentity`) on it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:root" },
      "Action": ["sts:AssumeRole", "sts:SetSourceIdentity"]
    }
  ]
}
```

`sts:SetSourceIdentity` is only needed for agents that set a source identity: AWS keeps it through any further role
the agent assumes, where the role session name would be lost.

## Add an agent

In the app, add an _AWS IAM Role Chained_ session and tick **Use for an AI agent**, or open **Agents** in the sidebar
for the list of agents. From a terminal:

```console
hopkey agent add --name claude --parentSessionId SESSIONID --roleArn arn:aws:iam::123456789012:role/agents
```

| Setting                | Description |
|------------------------|-------------|
| `AGENT NAME`           | Names the agent in Hopkey and in CloudTrail, where its role session is `agent-<name>`. |
| `NAMED PROFILE`        | The agent's profile, `agent-<name>` by default. It must be the agent's own: Hopkey refuses the default profile and profiles other sessions use. |
| `PERMISSIONS`          | What the agent may do with the role, see below. |
| `CREDENTIALS LAST`     | 15 to 60 minutes. Shorter is safer: disabling an agent doesn't recall the credentials it already got. |
| `SOURCE IDENTITY`      | Also sets `agent-<name>` as the source identity. The role's trust policy must allow `sts:SetSourceIdentity`. |

| Permissions            | Session policy |
|------------------------|----------------|
| Role's own permissions | None: the agent can do everything the role can. |
| Read-only              | The AWS managed policy `ReadOnlyAccess`, which can also read data, like objects in S3. |
| View-only              | The AWS managed policy `job-function/ViewOnlyAccess`, which lists and describes resources without reading data. |
| Custom policy          | Your own IAM policy JSON, up to 2,048 characters. |

## Give the credentials to the agent

Enable the agent with its toggle in **Agents** or with `hopkey agent enable claude`.

![](../../images/screens/agents/agents-dialog.png?style=center-img "The Agents screen")

Hopkey adds the agent's profile to `~/.aws/config`:

```ini
[profile agent-claude]
credential_process = hopkey session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
region = eu-west-1
```

Then start the agent with `AWS_PROFILE=agent-claude` in its environment. The AWS CLI and SDKs get the agent's
credentials from Hopkey, and ask again when they expire.

Disabling the agent removes the profile, and Hopkey refuses to hand it credentials until you enable it again. Quitting
Hopkey disables every agent. Credentials the agent already got keep working until they expire: to cut them off at
once, revoke the role's active sessions in the IAM console.

## Follow what agents do

The **Activity** tab of **Agents** and `hopkey agent history` show the history of every agent, newest first:

![](../../images/screens/agents/agents-activity.png?style=center-img "The activity of the agents")

| Event         | Meaning |
|---------------|---------|
| `credentials` | The agent got credentials, until the expiration shown. |
| `refused`     | The agent asked for credentials while disabled. |
| `failed`      | AWS or the session the role is assumed from didn't issue credentials, with the reason. |
| `enabled`, `disabled`, `created`, `updated`, `removed` | Changes you made to the agent. |

_Requested by_ names the programs that asked, closest first: for example `aws ‹ bash ‹ claude` is the AWS CLI, run
from a shell the agent started. Hopkey only keeps program names, since command lines can carry secrets.

The history lives in `~/.hopkey/agent-activity.jsonl`, one JSON object per line, readable only by you. If Hopkey can't
write to it, the agent gets no credentials.

Hopkey sees when an agent gets credentials, not what it does with them: every API call the agent makes is in
CloudTrail, under its role session name and source identity.

## Limits

- An agent that runs as your user on your computer can also reach your own credentials: keys in
  `~/.aws/credentials`, and your other sessions through the Hopkey CLI. Switch your own sessions to the
  [credential process](../security/credential-process.md) method so no keys sit in files, and to fully isolate an
  agent, run it in a container or as another user that can only reach its own profile.
- Agent sessions are AWS only.
- The Hopkey app must be running for agents, like the Hopkey CLI, to get credentials.
