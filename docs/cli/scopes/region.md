`hopkey region`
==============

Hopkey regions management

* [`hopkey region get-default`](#hopkey-region-get-default)
* [`hopkey region set-default`](#hopkey-region-set-default)

## `hopkey region get-default`

Displays the default region

```console
USAGE
  $ hopkey region get-default

DESCRIPTION
  Displays the default region

EXAMPLES
  $hopkey region get-default
```

## `hopkey region set-default`

Change the default region

```console
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
