<p align="center">
  <img src=".github/images/hopkey-icon.png" alt="Hopkey" height="128" />
</p>

<h1 align="center">Hopkey</h1>

<p align="center">Short-lived cloud credentials for every account you work with, one click away.</p>

<p align="center">
  <a href="https://github.com/willroll/hopkey/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/willroll/hopkey/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MPL-2.0" src="https://img.shields.io/badge/license-MPL--2.0-blue"></a>
</p>

Hopkey is a desktop app and CLI for macOS, Windows and Linux that manages access to AWS and Azure across many
accounts. It keeps your access keys and tokens in the system vault and generates short-lived credentials for the AWS
CLI, the SDKs and every tool built on them.

Hopkey is a community fork of [Leapp](https://github.com/Noovolari/leapp), the open-source app of Noovolari, which
closed in 2024. It keeps Leapp's features, drops the services that depended on Noovolari, and moves on under a new
name. See [PORTING.md](PORTING.md) for where the port stands.

## Features

- Cloud credentials in one click, stored encrypted in the system vault
- AWS IAM Users, IAM Roles (federated with SAML 2.0 or chained), AWS IAM Identity Center and Azure
- Sessions provisioned automatically from AWS IAM Identity Center and Azure integrations
- Automatic rotation of short-lived credentials, as credential files or through `credential_process`
- AWS console for several accounts side by side with the multi-console browser extension
- EC2 connections through AWS Systems Manager
- A CLI for scripts and terminals, and a plugin system to extend the app
- [AI agent credentials](docs/configuring-session/ai-agents.md): narrowed, short-lived and recorded, so you see which
  agent used which role

## Coming from Leapp

Hopkey keeps its own data (`~/.hopkey`, the "Hopkey" keychain service, the `hopkey` command), so it can be installed
next to Leapp. On first launch it imports your Leapp workspace, plugins and secrets: see
[Migrating from Leapp](docs/installation/migrating-from-leapp.md).

## Install

Download the app for your operating system from the [releases page](https://github.com/willroll/hopkey/releases).
Builds are not code-signed yet, so macOS and Windows will warn about an unidentified developer.

The CLI will be published on npm as `@hopkey/cli`; until then, [build it from source](DEVELOPMENT.md).

## Documentation

The documentation lives in [docs/](docs/) and is published at <https://willroll.github.io/hopkey/>.

## Contributing

Bug reports, ideas and pull requests are welcome: read the [contributing guidelines](CONTRIBUTING.md) and the
[development guide](DEVELOPMENT.md) to get started, and use [GitHub Discussions](https://github.com/willroll/hopkey/discussions)
for questions.

## License

Hopkey is distributed under the [Mozilla Public License 2.0](LICENSE). It is based on Leapp, © Noovolari and the Leapp
contributors: see [NOTICE.md](NOTICE.md).
