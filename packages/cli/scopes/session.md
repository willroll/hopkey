`hopkey session`
===============

Sessions management

* [`hopkey session add`](#hopkey-session-add)
* [`hopkey session change-profile`](#hopkey-session-change-profile)
* [`hopkey session change-region`](#hopkey-session-change-region)
* [`hopkey session current`](#hopkey-session-current)
* [`hopkey session delete`](#hopkey-session-delete)
* [`hopkey session generate SESSIONID`](#hopkey-session-generate-sessionid)
* [`hopkey session get-id`](#hopkey-session-get-id)
* [`hopkey session list`](#hopkey-session-list)
* [`hopkey session open-web-console`](#hopkey-session-open-web-console)
* [`hopkey session run-aws-credential-plugin`](#hopkey-session-run-aws-credential-plugin)
* [`hopkey session start [SESSIONNAME]`](#hopkey-session-start-sessionname)
* [`hopkey session start-ssm-session`](#hopkey-session-start-ssm-session)
* [`hopkey session stop [SESSIONNAME]`](#hopkey-session-stop-sessionname)

## `hopkey session add`

Add a new session

```
USAGE
  $ hopkey session add [--providerType aws] [--accessKey <value>] [--idpArn <value>] [--idpUrl <value>]
    [--mfaDevice <value>] [--sessionName <value>] [--parentSessionId <value>] [--profileId <value>] [--region <value>]
    [--roleArn <value>] [--roleSessionName <value>] [--secretKey <value>] [--sessionType
    awsIamRoleFederated|awsIamUser|awsIamRoleChained]

FLAGS
  --accessKey=<value>        AWS Access Key ID of the IAM User
  --idpArn=<value>           AWS IAM Federated Role IdP Arn value, obtain it from your AWS Account
  --idpUrl=<value>           the idp url address we want to create
  --mfaDevice=<value>        MFA Device Arn retrieved from your AWS Account
  --parentSessionId=<value>  For AWS IAM Role Chained is the session Id of the session that will assume the chained
                             role. Retrieve it using $hopkey session list -x
  --profileId=<value>        an AWS named profile ID in Hopkey
  --providerType=<option>    Identify the provider for your sessions. Valid types are [aws]
                             <options: aws>
  --region=<value>           Session Region for AWS sessions in Hopkey
  --roleArn=<value>          AWS IAM Federated Role Arn value, obtain it from your AWS Account
  --roleSessionName=<value>  Optional Alias for the Assumed Role Session name
  --secretKey=<value>        AWS Secret Access Key of the IAM User
  --sessionName=<value>      Session Alias to identify the session in Hopkey
  --sessionType=<option>     Identify the AWS session type. Valid types are [awsIamRoleFederated, awsIamUser,
                             awsIamRoleChained]
                             <options: awsIamRoleFederated|awsIamUser|awsIamRoleChained>

DESCRIPTION
  Add a new session

EXAMPLES
  $hopkey session add

  $hopkey session add --providerType [aws] --sessionType [awsIamRoleFederated, awsIamRoleChained, awsIamUser] --region [AWSREGION] --sessionName NAME ...[combination of flags relative to the session]

  $hopkey session add --providerType aws --sessionType awsIamRoleFederated --sessionName NAME --region AWSREGION --idpArn IDPARN --idpUrl IDPURL --profileId PROFILEID --roleArn ROLEARN

  $hopkey session add --providerType aws --sessionType awsIamRoleChained --sessionName NAME --region AWSREGION --profileId PROFILEID --roleArn ROLEARN --parentSessionId ID (--roleSessionName ROLESESSIONNAME)

  $hopkey session add --providerType aws --sessionType awsIamUser --sessionName NAME --region AWSREGION --profileId PROFILEID --accessKey ACCESSKEY --secretKey SECRETKEY (--mfaDevice MFADEVICEARN)
```

_See code: [src/commands/session/add.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/add.ts)_

## `hopkey session change-profile`

Change a session named-profile

```
USAGE
  $ hopkey session change-profile [--sessionId <value>] [--profileId <value>]

FLAGS
  --profileId=<value>  an AWS named profile ID in Hopkey
  --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Change a session named-profile

EXAMPLES
  $hopkey session change-profile

  $hopkey session change-profile --profileId PROFILEID --sessionId SESSIONID
```

_See code: [src/commands/session/change-profile.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/change-profile.ts)_

## `hopkey session change-region`

Change a session region

```
USAGE
  $ hopkey session change-region [--sessionId <value>] [--region <value>]

FLAGS
  --region=<value>     Session Region for AWS sessions in Hopkey
  --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Change a session region

EXAMPLES
  $hopkey session change-region

  $hopkey session change-region --sessionId SESSIONID --region REGION
```

_See code: [src/commands/session/change-region.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/change-region.ts)_

## `hopkey session current`

Provides info about the current active session for a selected profile (if no profile is provided, it uses the profile default)

```
USAGE
  $ hopkey session current [-i] [-p <value>] [-r aws|azure] [-f <value>]

FLAGS
  -f, --format=<value>     allows formatting data to show
                           - aws -> id alias, accountNumber, roleArn
                           - azure -> id tenantId, subscriptionId
  -i, --inline
  -p, --profile=<value>    [default: default] aws named profile of which gets info
  -r, --provider=<option>  filters sessions by the cloud provider service
                           <options: aws|azure>

DESCRIPTION
  Provides info about the current active session for a selected profile (if no profile is provided, it uses the profile
  default)

EXAMPLES
  $hopkey session current --format "alias accountNumber" --inline --provider aws
```

_See code: [src/commands/session/current.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/current.ts)_

## `hopkey session delete`

Delete a session

```
USAGE
  $ hopkey session delete [--sessionId <value>] [-f]

FLAGS
  -f, --force              force a command without asking for confirmation (-f, --force)
      --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Delete a session

EXAMPLES
  $hopkey session delete

  $hopkey session delete --sessionId SESSIONID

  $hopkey session delete --sessionId SESSIONID [--force, -f]
```

_See code: [src/commands/session/delete.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/delete.ts)_

## `hopkey session generate SESSIONID`

Generate STS temporary credentials for the given AWS session id

```
USAGE
  $ hopkey session generate SESSIONID

ARGUMENTS
  SESSIONID  id of the session

DESCRIPTION
  Generate STS temporary credentials for the given AWS session id

EXAMPLES
  $hopkey session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

_See code: [src/commands/session/generate.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/generate.ts)_

## `hopkey session get-id`

Get session id

```
USAGE
  $ hopkey session get-id

DESCRIPTION
  Get session id

EXAMPLES
  $hopkey session get-id
```

_See code: [src/commands/session/get-id.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/get-id.ts)_

## `hopkey session list`

Show sessions list with all properties; filter query is case sensitive

```
USAGE
  $ hopkey session list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended         show extra columns
      --columns=<value>  only show provided columns (comma-separated)
      --csv              output is csv format [alias: --output=csv]
      --filter=<value>   filter property by partial string matching, ex: name=foo
      --no-header        hide table header from output
      --no-truncate      do not truncate output to fit screen
      --output=<option>  output in a more machine friendly format
                         <options: csv|json|yaml>
      --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show sessions list with all properties; filter query is case sensitive

EXAMPLES
  $hopkey session list

  $hopkey session list --filter="ID=Foo" -x

  $hopkey session list --filter="Session Name=Foo"

  $hopkey session list --filter="Type=Foo"

  $hopkey session list --filter="Named Profile=Foo"

  $hopkey session list --filter="Region/Location=Foo"

  $hopkey session list --filter="Status=Foo"
```

_See code: [src/commands/session/list.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/list.ts)_

## `hopkey session open-web-console`

Open an AWS Web Console

```
USAGE
  $ hopkey session open-web-console [--sessionId <value>] [-p]

FLAGS
  -p, --print              Print an AWS Web Console login URL in the terminal instead of opening the web browser
      --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Open an AWS Web Console

EXAMPLES
  $hopkey session open-web-console

  $hopkey session open-web-console --sessionId SESSIONID [--print, -p]
```

_See code: [src/commands/session/open-web-console.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/open-web-console.ts)_

## `hopkey session run-aws-credential-plugin`

Run a Hopkey Plugin

```
USAGE
  $ hopkey session run-aws-credential-plugin [--sessionId <value>] [--pluginName <value>]

FLAGS
  --pluginName=<value>  Unique name of a Hopkey Plugin
  --sessionId=<value>   Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Run a Hopkey Plugin

EXAMPLES
  $hopkey session run-plugin

  $hopkey session run-plugin --sessionName SESSIONAME --pluginName PLUGINNAME
```

_See code: [src/commands/session/run-aws-credential-plugin.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/run-aws-credential-plugin.ts)_

## `hopkey session start [SESSIONNAME]`

Start a session

```
USAGE
  $ hopkey session start [SESSIONNAME] [--sessionId <value>] [--sessionRole <value>] [--noInteractive]

ARGUMENTS
  SESSIONNAME  Name of the Hopkey session

FLAGS
  --noInteractive        If the specified session is not unique or doesn't exist, throw an error without starting the
                         interactive session selection mode
  --sessionId=<value>    Session Id to identify the session in Hopkey, recover it with $hopkey session list -x
  --sessionRole=<value>  Session Role of one or more sessions in Hopkey

DESCRIPTION
  Start a session

EXAMPLES
  $hopkey session start

  $hopkey session start SESSIONNAME

  $hopkey session start SESSIONNAME --sessionRole SESSIONROLE

  $hopkey session start SESSIONNAME --noInteractive

  $hopkey session start --sessionId SESSIONID
```

_See code: [src/commands/session/start.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/start.ts)_

## `hopkey session start-ssm-session`

Start an AWS SSM session

```
USAGE
  $ hopkey session start-ssm-session [--sessionId <value>] [--region <value>] [--ssmInstanceId <value>]

FLAGS
  --region=<value>         Session Region for AWS sessions in Hopkey
  --sessionId=<value>      Session Id to identify the session in Hopkey, recover it with $hopkey session list -x
  --ssmInstanceId=<value>  Instance ID for EC2 instance we want to access with SSM

DESCRIPTION
  Start an AWS SSM session

EXAMPLES
  $hopkey session start-ssm-session

  $hopkey session start-ssm-session --sessionId SESSIONID --region AWSREGION --ssmInstanceId EC2INSTANCEID
```

_See code: [src/commands/session/start-ssm-session.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/start-ssm-session.ts)_

## `hopkey session stop [SESSIONNAME]`

Stop a session

```
USAGE
  $ hopkey session stop [SESSIONNAME] [--sessionId <value>] [--sessionRole <value>] [--noInteractive]

ARGUMENTS
  SESSIONNAME  Name of the Hopkey session

FLAGS
  --noInteractive        If the specified session is not unique or doesn't exist, throw an error without starting the
                         interactive session selection mode
  --sessionId=<value>    Session Id to identify the session in Hopkey, recover it with $hopkey session list -x
  --sessionRole=<value>  Session Role of one or more sessions in Hopkey

DESCRIPTION
  Stop a session

EXAMPLES
  $hopkey session stop

  $hopkey session stop SESSIONNAME

  $hopkey session stop SESSIONNAME --sessionRole SESSIONROLE

  $hopkey session stop SESSIONNAME --noInteractive

  $hopkey session stop --sessionId SESSIONID
```

_See code: [src/commands/session/stop.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/session/stop.ts)_
