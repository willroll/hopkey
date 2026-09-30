`hopkey region`
==============

Hopkey regions management

* [`hopkey region get-default`](#hopkey-region-get-default)
* [`hopkey region set-default`](#hopkey-region-set-default)

## `hopkey region get-default`

Displays the default region

```
USAGE
  $ hopkey region get-default

DESCRIPTION
  Displays the default region

EXAMPLES
  $hopkey region get-default
```

_See code: [src/commands/region/get-default.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/region/get-default.ts)_

## `hopkey region set-default`

Change the default region

```
USAGE
  $ hopkey region set-default [--region <value>]

FLAGS
  --region=<value>  Session Region for AWS sessions in Hopkey

DESCRIPTION
  Change the default region

EXAMPLES
  $hopkey region set-default

  $hopkey region set-default --region AWSREGION
```

_See code: [src/commands/region/set-default.ts](https://github.com/willroll/hopkey/blob/v0.1.65/src/commands/region/set-default.ts)_
