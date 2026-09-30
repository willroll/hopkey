# Migrating from Leapp

Hopkey is a fork of [Leapp](https://github.com/Noovolari/leapp){: target='_blank'}, the open-source app of Noovolari,
which closed in 2024. Hopkey keeps its own data next to Leapp's, so both apps can be installed on the same machine:

|                      | Leapp                      | Hopkey                       |
|----------------------|----------------------------|------------------------------|
| Workspace            | `~/.Leapp/Leapp-lock.json` | `~/.hopkey/hopkey-lock.json` |
| System vault service | `Leapp`                    | `Hopkey`                     |
| CLI command          | `leapp`                    | `hopkey`                     |
| Deep links           | `leapp://`                 | `hopkey://`                  |

## What is imported

The first time Hopkey starts without a workspace of its own and finds a Leapp one, it copies:

- the Leapp workspace and its backup: sessions, integrations, named profiles, IdP URLs, segments and options;
- the plugins installed in `~/.Leapp/plugins`;
- the secrets Leapp saved in the system vault: IAM User access keys, AWS IAM Identity Center and Azure tokens.

Leapp's files and secrets are left untouched, and Hopkey never overwrites a secret it already has. A notification
confirms the import. If the system vault cannot be read, for example because it is locked, Hopkey tries again at the
next launch.

!!! info

    On macOS, the system may ask whether Hopkey can access the Leapp items in your keychain: allow it to import them.

## After the import

- **Don't run both apps at the same time.** Leapp and Hopkey both write your AWS profiles to `~/.aws/credentials` and
  `~/.aws/config`, and each stops its sessions when it starts.
- **Credential process.** Profiles that Leapp configured with `credential_process = leapp session generate ...` are
  removed when Hopkey starts, and written again with `hopkey session generate ...` when you start the sessions in Hopkey.
- **CLI.** Install the [Hopkey CLI](install-hopkey.md#install-hopkey-cli) and replace `leapp` with `hopkey` in your
  scripts and shell aliases.
- **Leapp Pro and Team.** Remote workspaces were hosted by Noovolari and are not available in Hopkey: only the local
  workspace is imported.

To skip the import, move `~/.Leapp` away before launching Hopkey for the first time.
