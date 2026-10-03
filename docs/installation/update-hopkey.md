# Update Hopkey

## Desktop App

Hopkey checks if a new version is available every **10 minutes** (starting from the application launch). 
If so, a dialog message will pop up and show a `version number`, the `release date` and the `changelog`


![](../../images/screens/newuxui/update.png?style=smaller-img)
In this modal, a user can do the following:

=== "Remind me later"
    
    Hopkey will close the modal and notify the user that a new update
    is available by adding a notification dot
    <img width="55" alt="Hopkey's Dock icon with a notification dot" src="../../images/screens/newuxui/dock-update-badge.png"> 
    to the Dock Bar icon. Users will not be bothered anymore until the next release is available. 
    This option is **convenient for users that want to stick to a specific version**. 
    Note that you can do this for every version and maintain the one you prefer.


=== "Download update"

    Hopkey will open the Release URL in your *default* browser to let the User 
    *manually* download the release for their specific OS and install it.


=== "Click on X"
    
    Hopkey will close the modal and another one will appear in **10 minutes**.

## CLI

If you installed the CLI from [npm](https://www.npmjs.com/package/@hopkey/cli){: target='_blank'}, update it with:

```console
npm update -g @hopkey/cli
```
