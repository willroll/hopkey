# Workspaces

A **Workspace** is a global configuration that contains all the relevant information about your Hopkey setup (sessions, integrations, app preferences, etc.).

There are two types of workspace: **Local** and **Remote**.

## Local

A **Local workspace** is the **default** workspace that comes with your Hopkey installation. It's a private configuration that contains your personal
preferences and **all sessions and integrations that you created yourself**. 

A local workspace is associated to a **single machine** and if you need to migrate your configuration to another one you will have to do it
manually. 

Alternatively, you can use **Remote workspaces**.

## Remote

!!! warning
    Remote workspaces relied on the Team service run by Noovolari, which closed in 2024: they are not available in Hopkey.

A **Remote workspace** is a Team configuration set **created remotely by a Team manager**. 

When you **sync** a remote workspace, you will receive sessions and integrations **automatically**, without having to configure them yourself. 

A remote workspace is **persisted online** by using **[Zero-Knowledge encryption](https://willroll.github.io/hopkey/latest/security/zero-knowledge/)**.

You will have access to the same configurations **instantly** on any machine, by logging in to your Hopkey Team account after having been invited by your Hopkey Team manager.

!!! Info
    Both your local and remote workspaces are saved on your machine as encrypted files inside your <home>/.hopkey directory.

## Actions

The actions below only applies to Remote workspaces.

| Action     | Description                                                                                                 |
|------------|-------------------------------------------------------------------------------------------------------------|
| `Sign-in`  | :material-login: &nbsp;Connect to a Remote workspace. This action will not switch your Local workspace |
| `Switch`   | :material-check: &nbsp;Switch to the selected workspace by clicking on its name in the workspace menu |
| `Lock`     | :material-lock: &nbsp;Switch back to the Local workspace disabling all the Remote ones         |
| `Sign-out` | :material-logout: &nbsp;Sign-out from a Remote workspace removing all your login details         |


!!! Info
    The Lock action also removes the encrypted files associated to your remote workspaces.
