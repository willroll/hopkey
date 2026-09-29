## Install Hopkey App

### MacOS, Windows, and Linux

You can install Hopkey by downloading the pre-built binaries for your OS on the website release page:

[Download Hopkey ⇩](https://www.leapp.cloud/releases){ .md-button .md-button--primary }

**Unzip** the package and **double-click the executable** to install.

### macOS (Homebrew)

Hopkey can also be installed on **macOS** via [Homebrew Cask](https://brew.sh/){: target='_blank'} with:

```console
brew install hopkey
```

!!! info

    In addition, Hopkey can also be installed with Linuxbrew on Windows via [WSL](https://docs.microsoft.com/en-us/windows/wsl/about){: target='_blank'}

## Install Hopkey CLI

You can install Hopkey CLI through a Homebrew Formula:

```console
brew install Noovolari/brew/leapp-cli
```

In Linux it may happen that the command ```hopkey``` is not recognized. In that case we suggest to run the following
command:

```console
brew link hopkey-cli
```

## Install Hopkey CLI on macOS with ARM64 chip (M1, M2)

On macOS with ARM64 chip you can use the Homebrew Formula:

```console
brew install Noovolari/brew/leapp-cli-darwin-arm64
```

All the available commands are listed in the [Hopkey CLI section of the documentation](../../cli/).

!!! warning

    Hopkey CLI will work only if the Desktop App is installed and running.
