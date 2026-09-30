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

```console
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

## `hopkey session change-profile`

Change a session named-profile

```console
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

## `hopkey session change-region`

Change a session region

```console
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

## `hopkey session current`

Provides info about the current active session for a selected profile (if no profile is provided, it uses the profile default)

```console
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

## `hopkey session delete`

Delete a session

```console
USAGE
  $ hopkey session delete [--sessionId <value>] [-f]

FLAGS
  -f, --force          force a command without asking for confirmation (-f, --force)
  --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Delete a session

EXAMPLES
  $hopkey session delete

  $hopkey session delete --sessionId SESSIONID

  $hopkey session delete --sessionId SESSIONID [--force, -f]
```

## `hopkey session generate SESSIONID`

Generate STS temporary credentials for the given AWS session id

```console
USAGE
  $ hopkey session generate SESSIONID

ARGUMENTS
  SESSIONID  id of the session

DESCRIPTION
  Generate STS temporary credentials for the given AWS session id

EXAMPLES
  $hopkey session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

## `hopkey session get-id`

Get session id

```console
USAGE
  $ hopkey session get-id

DESCRIPTION
  Get session id

EXAMPLES
  $hopkey session get-id
```

## `hopkey session list`

Show sessions list with all properties; filter query is case sensitive

```console
USAGE
  $ hopkey session list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
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

## `hopkey session open-web-console`

Open an AWS Web Console

```console
USAGE
  $ hopkey session open-web-console [--sessionId <value>] [-p]

FLAGS
  -p, --print          Print an AWS Web Console login URL in the terminal instead of opening the web browser
  --sessionId=<value>  Session Id to identify the session in Hopkey, recover it with $hopkey session list -x

DESCRIPTION
  Open an AWS Web Console

EXAMPLES
  $hopkey session open-web-console

  $hopkey session open-web-console --sessionId SESSIONID [--print, -p]
```

## `hopkey session run-aws-credential-plugin`

Run a Hopkey Plugin

```console
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

## `hopkey session start [SESSIONNAME]`

Start a session

```console
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

## `hopkey session start-ssm-session`

Start an AWS SSM session

```console
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

## `hopkey session stop [SESSIONNAME]`

Stop a session

```console
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
