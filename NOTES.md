# General Developer notes

- Key Vault Data Access Admin role must be assigned to the user running the deployment script. Otherwise you will receive a permission denied error when running `azd up`.
- Need to add I2-Devops app registration as a contributor on the resource group
- Create a new client secret for I2-Devops and create the AZURE_CREDENTIALS json object:

    ```json
    {
        "clientSecret":  "xyz",
        "subscriptionId":  "dac4e116-47c0-444f-90db-458318df78e6",
        "tenantId":  "4ccca3b5-71cd-4e6d-974b-4d9beb96c6d6",
        "clientId":  "448dbb07-10ee-4c6a-91fd-a92f6bc8b987"
    }
    ```

    Ref: https://github.com/Azure/login?tab=readme-ov-file#login-with-a-service-principal-secret

## Environment Variables

REDCAP_API_KEY="Issued from REDCap project"
REDCAP_API_URL=redcap.wustl.edu
REDCAP_EMAIL_FIELD="creds_email"
REDCAP_PASS_FIELD="creds_pass"
REDCAP_ENABLED_FIELD="creds_enabled"
REDCAP_ADMIN_FIELD="creds_is_admin"
REDCAP_NAME_FIELD="creds_name"
