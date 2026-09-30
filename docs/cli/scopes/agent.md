`hopkey agent`
=============

AI agent credentials, sandboxing and activity history

* [`hopkey agent add`](#hopkey-agent-add)
* [`hopkey agent disable AGENTNAME`](#hopkey-agent-disable-agentname)
* [`hopkey agent enable AGENTNAME`](#hopkey-agent-enable-agentname)
* [`hopkey agent history [AGENTNAME]`](#hopkey-agent-history-agentname)
* [`hopkey agent list`](#hopkey-agent-list)
* [`hopkey agent remove AGENTNAME`](#hopkey-agent-remove-agentname)

## `hopkey agent add`

Give an AI agent narrowed, short-lived credentials of its own, tracked in its activity history

```console
USAGE
  $ hopkey agent add [--name <value>] [--parentSessionId <value>] [--roleArn <value>] [--region <value>]
    [--profileName <value>] [--permissions role|read-only|view-only|custom] [--policyFile <value>] [--duration <value>]
    [--sourceIdentity]

FLAGS
  --duration=<value>         Minutes the agent's credentials last, from 15 to 60
  --name=<value>             Name of the agent, used in its named profile (agent-<name>) and in CloudTrail
  --parentSessionId=<value>  Id of the AWS IAM User, IAM Role Federated or IAM Identity Center session the agent assumes
                             its role from; see $hopkey session list -x
  --permissions=<option>     What the agent may do with the role: its own permissions, AWS ReadOnlyAccess, AWS
                             ViewOnlyAccess or a custom session policy
                             <options: role|read-only|view-only|custom>
  --policyFile=<value>       File with the session policy (IAM policy JSON) for --permissions custom
  --profileName=<value>      Named profile of the agent, agent-<name> by default
  --region=<value>           Session Region for AWS sessions in Hopkey
  --roleArn=<value>          ARN of the role the agent assumes
  --sourceIdentity           Also set the agent as source identity, kept by AWS through further role changes; the role's
                             trust policy must allow sts:SetSourceIdentity

DESCRIPTION
  Give an AI agent narrowed, short-lived credentials of its own, tracked in its activity history

EXAMPLES
  $hopkey agent add

  $hopkey agent add --name claude --parentSessionId SESSIONID --roleArn arn:aws:iam::123456789012:role/agents

  $hopkey agent add --name claude --parentSessionId SESSIONID --roleArn ROLEARN --permissions custom --policyFile policy.json --duration 30
```

## `hopkey agent disable AGENTNAME`

Stop handing an AI agent credentials; the ones it already got work until they expire

```console
USAGE
  $ hopkey agent disable AGENTNAME

ARGUMENTS
  AGENTNAME  Name of the agent

DESCRIPTION
  Stop handing an AI agent credentials; the ones it already got work until they expire

EXAMPLES
  $hopkey agent disable AGENTNAME
```

## `hopkey agent enable AGENTNAME`

Let an AI agent get credentials through its named profile

```console
USAGE
  $ hopkey agent enable AGENTNAME

ARGUMENTS
  AGENTNAME  Name of the agent

DESCRIPTION
  Let an AI agent get credentials through its named profile

EXAMPLES
  $hopkey agent enable AGENTNAME
```

## `hopkey agent history [AGENTNAME]`

Show what AI agents did with their credentials, newest first

```console
USAGE
  $ hopkey agent history [AGENTNAME] [--limit <value>] [--columns <value> | -x] [--sort <value>] [--filter <value>]
    [--output csv|json|yaml |  | [--csv | --no-truncate]] [--no-header | ]

ARGUMENTS
  AGENTNAME  Only show this agent

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --limit=<value>    [default: 50] Number of events to show
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show what AI agents did with their credentials, newest first

EXAMPLES
  $hopkey agent history

  $hopkey agent history AGENTNAME --limit 100

  $hopkey agent history --output json
```

## `hopkey agent list`

Show the AI agents, what they may do and when they last got credentials

```console
USAGE
  $ hopkey agent list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show the AI agents, what they may do and when they last got credentials

EXAMPLES
  $hopkey agent list

  $hopkey agent list -x

  $hopkey agent list --output json
```

## `hopkey agent remove AGENTNAME`

Remove an AI agent; its named profile and its activity history stay

```console
USAGE
  $ hopkey agent remove AGENTNAME [-f]

ARGUMENTS
  AGENTNAME  Name of the agent

FLAGS
  -f, --force  force a command without asking for confirmation (-f, --force)

DESCRIPTION
  Remove an AI agent; its named profile and its activity history stay

EXAMPLES
  $hopkey agent remove AGENTNAME

  $hopkey agent remove AGENTNAME --force
```
