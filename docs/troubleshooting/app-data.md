## Default Hopkey directories

Here the user can find all the directories that Hopkey uses **directly** or **indirectly**.

### Installation path
By default, Hopkey is installed in the following locations:

=== "MacOS"

    ```
    /Applications
    ```

=== "Linux"

    ```
    /opt/Hopkey
    ```

=== "Windows"

    ```
    C:\Users\<USER>\AppData\Local\Programs\Hopkey
    ```

### Configuration files
By default, Hopkey stores the configuration files in the following locations:

=== "MacOS"

    ```
    ~/.hopkey
    ```

=== "Linux"

    ```
    ~/.hopkey
    ```

=== "Windows"

    ```
    C:\Users\<USER>\.hopkey
    ```

!!! Info

    - **hopkey-lock.json** stores the Hopkey configuration and is **encrypted**.
        - On startup, if hopkey-lock.json is not found, Hopkey will create an empty version of it.
    - **hopkey-lock.backup.bin** stores a backup of hopkey-lock.json and is updated on startup if hopkey-lock.json is considered valid.
        - On startup, if hopkey-lock.json is corrupted, hopkey-lock.backup.bin will be used to restore it.
        - If both files are corrupted, a new empty configuration will be created.
    - **.latest** contains the latest version number of Hopkey. If missing, it will be created again on startup.

### Credentials file
By default, Hopkey writes the credentials file in the following locations:

=== "MacOS"

    ```
    ~/.aws
    ```

=== "Linux"

    ```
    ~/.aws
    ```

=== "Windows"

    ```
    C:\Users\<USER>\.aws
    ```
### Logs file
By default, Hopkey writes logs to the following locations:

=== "MacOS"

    ```
    ~/Library/Logs/Hopkey/log.electronService.log
    ```

=== "Linux"

    ```
    ~/.config/Hopkey/logs/log.electronService.log
    ```

=== "Windows"

    ```
    C:\Users\<USER>\AppData\Roaming\Hopkey\log.electronService.log
    ```
!!! Info

    Logs are structured in the following way:

    ```
    [YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [rendered/system] [COMPONENT] MESSAGE {Useful Object / Stacktrace Err Object}
    ```

!!! Warning

    Please always add logs to any issue you want to fill whenever possible, so you can help the team identify 
    the problem quickly
