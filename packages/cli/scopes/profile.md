`hopkey profile`
===============

Hopkey AWS Multi-profile management

* [`hopkey profile create`](#hopkey-profile-create)
* [`hopkey profile delete`](#hopkey-profile-delete)
* [`hopkey profile edit`](#hopkey-profile-edit)
* [`hopkey profile list`](#hopkey-profile-list)

## `hopkey profile create`

Create a new AWS named profile

```
USAGE
  $ hopkey profile create [--profileName <value>]

FLAGS
  --profileName=<value>  an AWS named profile Alias used to identify the profile in both config and credential file

DESCRIPTION
  Create a new AWS named profile

EXAMPLES
  $hopkey profile create

  $hopkey profile create --profileName PROFILENAME
```

_See code: [src/commands/profile/create.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/profile/create.ts)_

## `hopkey profile delete`

Delete an AWS named profile

```
USAGE
  $ hopkey profile delete [--profileId <value>] [-f]

FLAGS
  -f, --force              force a command without asking for confirmation (-f, --force)
      --profileId=<value>  an AWS named profile ID in Hopkey

DESCRIPTION
  Delete an AWS named profile

EXAMPLES
  $hopkey profile delete

  $hopkey profile delete --profileId PROFILEID

  $hopkey profile delete --profileId PROFILEID [--force, -f]
```

_See code: [src/commands/profile/delete.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/profile/delete.ts)_

## `hopkey profile edit`

Rename an AWS named profile

```
USAGE
  $ hopkey profile edit [--profileId <value>] [--profileName <value>]

FLAGS
  --profileId=<value>    an AWS named profile ID in Hopkey
  --profileName=<value>  an AWS named profile Alias used to identify the profile in both config and credential file

DESCRIPTION
  Rename an AWS named profile

EXAMPLES
  $hopkey profile edit

  $hopkey profile edit --profileId ID --profileName PROFILENAME
```

_See code: [src/commands/profile/edit.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/profile/edit.ts)_

## `hopkey profile list`

Show profile list

```
USAGE
  $ hopkey profile list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
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
  Show profile list

EXAMPLES
  $hopkey profile list
```

_See code: [src/commands/profile/list.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/profile/list.ts)_
