## How to export your Pro Workspace

1. create a backup of your ~/.hopkey/hopkey-lock.json file;
   ```shell
   // From ~/.hopkey directory run the following command:
   cp hopkey-lock.json hopkey-lock.json.bkp
   ```
2. log into you Pro Workspace using the Desktop App;
   ![](../../images/tutorials/export-pro-workspace/export-pro-workspace-2.png?style=center-img)
3. from the Hopkey Options "General" tab, click the button next to the "Export Pro/Team workspace" label;
   ![](../../images/tutorials/export-pro-workspace/export-pro-workspace.png?style=center-img)
4. close the Hopkey Options dialog;
5. Lock the Hopkey Pro workspace;
6. switch to the Local workspace;
7. close Hopkey (on macOS ⌘+Q);
8. you should see a **hopkey-lock.json.exported** file in the ~/.hopkey folder;
9. remove the hopkey-lock.json file and rename hopkey-lock.json.exported to hopkey-lock.json;
   ```shell
   rm hopkey-lock.json
   mv hopkey-lock.json.exported hopkey-lock.json
   ```
10. re-open Hopkey;
11. switch to the Local Workspace; 
12. you should now see your Pro Workspace migrated into the Local one.
