Once you've opened the Hopkey option menu - which can be accessed by clicking the top right gear icon - you can edit the following settings in the General tab

![](../../images/screens/newuxui/hopkey-options.png?style=center-img)

## Default Regions

This option allows you to set the default AWS or Azure region/location for every new session. 

Each time you create a new session, this will be the default region assigned to it. 
  
You can still change it if you need a different one, by selecting a different region while creating the session or by changing the region once a session is created.

## Terminal Selection

This option is used to select the terminal in which to open an SSM session. 

!!! Info

    This setting is currently only available on MacOS. If you want to contribute and add a new terminal for a specific OS, please refer to the [contributing guide](https://github.com/willroll/hopkey/blob/master/CONTRIBUTING.md){: target='_blank'}

## Color Theme

Hopkey now comes with a slick new Dark Theme! 

With this option, you can switch between light and dark theme, or use your system default.

![](../../images/screens/newuxui/hopkey-dark.png?style=center-img)

## Proxy

If your network reaches the internet through a proxy, set it here: the proxy's own protocol (HTTP or HTTPS), its host
and port, and, when it asks for a user and password, turn on **Use authentication**.

Hopkey uses the proxy as soon as you save:

- the app sends its AWS calls, its sign-in windows and its update check through it;
- the [Hopkey CLI](../cli/index.md) reads it each time it runs, and asks the app for the password;
- the programs Hopkey runs in the background, such as the Azure CLI, get it in their `HTTPS_PROXY` and `HTTP_PROXY`
  environment variables.

The password is kept in the [System Vault](../security/system-vault.md), not in the workspace file. Without a proxy,
the app follows your system's proxy settings and the CLI connects directly.

## Default Webconsole Duration

This option is used to set the default Webconsole session duration in hours.

!!! Info

    The minimum session duration is 1 hour, and can be set to a maximum of 12 hours. [Set session duration](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtosessionduration.html){: target='_blank'}


