`hopkey idp-url`
===============

SAML 2.0 Identity providers URL management

* [`hopkey idp-url create`](#hopkey-idp-url-create)
* [`hopkey idp-url delete`](#hopkey-idp-url-delete)
* [`hopkey idp-url edit`](#hopkey-idp-url-edit)
* [`hopkey idp-url list`](#hopkey-idp-url-list)

## `hopkey idp-url create`

Create a new identity provider URL

```
USAGE
  $ hopkey idp-url create [--idpUrl <value>]

FLAGS
  --idpUrl=<value>  the idp url address we want to create

DESCRIPTION
  Create a new identity provider URL

EXAMPLES
  $hopkey idp-url create

  $hopkey idp-url create --idpUrl ADDRESS
```

_See code: [src/commands/idp-url/create.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/idp-url/create.ts)_

## `hopkey idp-url delete`

Delete an identity provider URL

```
USAGE
  $ hopkey idp-url delete [--idpUrlId <value>] [-f]

FLAGS
  -f, --force             force a command without asking for confirmation (-f, --force)
      --idpUrlId=<value>  the idp url id that we want to pass to the function like the delete one

DESCRIPTION
  Delete an identity provider URL

EXAMPLES
  $hopkey idp-url delete

  $hopkey idp-url delete --idpUrlId ID

  $hopkey idp-url delete --idpUrlId ID [--force, -f]
```

_See code: [src/commands/idp-url/delete.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/idp-url/delete.ts)_

## `hopkey idp-url edit`

Edit an identity provider URL

```
USAGE
  $ hopkey idp-url edit [--idpUrlId <value>] [--idpUrl <value>]

FLAGS
  --idpUrl=<value>    the idp url address we want to create
  --idpUrlId=<value>  the idp url id that we want to pass to the function like the delete one

DESCRIPTION
  Edit an identity provider URL

EXAMPLES
  $hopkey idp-url edit

  $hopkey idp-url edit --idpUrlId ID --idpUrl ADDRESS
```

_See code: [src/commands/idp-url/edit.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/idp-url/edit.ts)_

## `hopkey idp-url list`

Show identity providers list

```
USAGE
  $ hopkey idp-url list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
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
  Show identity providers list

EXAMPLES
  $hopkey idp-url list
```

_See code: [src/commands/idp-url/list.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/idp-url/list.ts)_
