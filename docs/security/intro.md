**Hopkey is built with a security-first approach.** Every piece of information that has to be persisted is encrypted and saved on your workstation.

We devised two main methods to store data, based on its sensitiveness.

| Data | Persistence and encryption | Examples |
| ----------- | --------- | ---- |
| Operational | All information used to make Hopkey work, not strictly tied to direct access to cloud environments. Stored and encrypted in a configuration file within the user workspace.  | Named profiles, proxy configurations, etc. |
| Sensitive   | Information that can be used, or potentially exploited, to gain access to cloud environments. Stored in the System Vault, leveraging its own integrated encryption. | Static credentials, access tokens, cached data, etc. |
