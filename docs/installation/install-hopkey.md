## Install Hopkey App

### macOS, Windows, and Linux

Download the build for your operating system from the GitHub releases page:

[Download Hopkey ⇩](https://github.com/willroll/hopkey/releases){ .md-button .md-button--primary }

**Unzip** the package and **double-click the executable** to install.

!!! warning

    Until code signing is set up, macOS Gatekeeper and Windows SmartScreen warn that Hopkey comes from an unidentified
    developer. You can also [build Hopkey from source](https://github.com/willroll/hopkey/blob/master/DEVELOPMENT.md){: target='_blank'}.

!!! info

    Coming from Leapp? Hopkey imports your Leapp workspace and secrets on first launch: see [Migrating from Leapp](migrating-from-leapp.md). <!-- rebrand:keep -->

## Install Hopkey CLI

The CLI is distributed on npm as `@hopkey/cli`:

```console
npm install -g @hopkey/cli
```

Until its first release is published, build it from source following
[DEVELOPMENT.md](https://github.com/willroll/hopkey/blob/master/DEVELOPMENT.md){: target='_blank'}, then run
`npm link` from `packages/cli` to make the `hopkey` command available.

All the available commands are listed in the [Hopkey CLI section of the documentation](../../cli/).

!!! warning

    Hopkey CLI will work only if the Desktop App is installed and running.
