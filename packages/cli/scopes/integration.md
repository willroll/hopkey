`hopkey integration`
===================

Hopkey Integrations management

* [`hopkey integration create`](#hopkey-integration-create)
* [`hopkey integration delete`](#hopkey-integration-delete)
* [`hopkey integration list`](#hopkey-integration-list)
* [`hopkey integration login`](#hopkey-integration-login)
* [`hopkey integration logout`](#hopkey-integration-logout)
* [`hopkey integration sync`](#hopkey-integration-sync)

## `hopkey integration create`

Create a new integration

```
USAGE
  $ hopkey integration create [--integrationAlias <value>] [--integrationPortalUrl <value>] [--integrationRegion <value>]
    [--integrationType AWS-SSO|AZURE] [--integrationTenantId <value>] [--integrationLocation <value>]

FLAGS
  --integrationAlias=<value>      alias that identifies an integration
  --integrationLocation=<value>   Location of an Azure Integration
  --integrationPortalUrl=<value>  url that identifies the integration portal where you authenticate
  --integrationRegion=<value>     an AWS valid region code for the integration
  --integrationTenantId=<value>   Tenant ID of an Azure Integration
  --integrationType=<option>      Identify the type of your integration. Valid types are [AWS-SSO, AZURE]
                                  <options: AWS-SSO|AZURE>

DESCRIPTION
  Create a new integration

EXAMPLES
  $hopkey integration create

  $hopkey integration create --integrationType AWS-SSO --integrationAlias ALIAS --integrationPortalUrl URL --integrationRegion REGION

  $hopkey integration create --integrationType AZURE --integrationAlias ALIAS --integrationTenantId TENANT --integrationLocation LOCATION
```

_See code: [src/commands/integration/create.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/create.ts)_

## `hopkey integration delete`

Delete an integration

```
USAGE
  $ hopkey integration delete [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Hopkey

DESCRIPTION
  Delete an integration

EXAMPLES
  $hopkey integration delete

  $hopkey integration delete --integrationId ID
```

_See code: [src/commands/integration/delete.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/delete.ts)_

## `hopkey integration list`

Show integrations list

```
USAGE
  $ hopkey integration list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
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
  Show integrations list

EXAMPLES
  $hopkey integration list
```

_See code: [src/commands/integration/list.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/list.ts)_

## `hopkey integration login`

Login to synchronize integration sessions

```
USAGE
  $ hopkey integration login [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Hopkey

DESCRIPTION
  Login to synchronize integration sessions

EXAMPLES
  $hopkey integration login

  $hopkey integration login --integrationId ID
```

_See code: [src/commands/integration/login.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/login.ts)_

## `hopkey integration logout`

Logout from an integration

```
USAGE
  $ hopkey integration logout [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Hopkey

DESCRIPTION
  Logout from an integration

EXAMPLES
  $hopkey integration logout

  $hopkey integration logout --integrationId ID
```

_See code: [src/commands/integration/logout.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/logout.ts)_

## `hopkey integration sync`

Synchronize integration sessions

```
USAGE
  $ hopkey integration sync [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Hopkey

DESCRIPTION
  Synchronize integration sessions

EXAMPLES
  $hopkey integration sync

  $hopkey integration sync --integrationId ID
```

_See code: [src/commands/integration/sync.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/integration/sync.ts)_
