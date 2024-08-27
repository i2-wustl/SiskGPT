import CredentialsProvider from "next-auth/providers/credentials";
import { hashValue } from "./helpers";
import https from "https";
import querystring from "querystring";

///Add this configuration to your .env
// Adjust field names as needed
//
// #REDCap Login config
// REDCAP_API_KEY={your token}
// REDCAP_API_URL=redcap.wustl.edu
// REDCAP_EMAIL_FIELD="creds_email"
// REDCAP_PASS_FIELD="creds_pass"
// REDCAP_ENABLED_FIELD="creds_enabled"
// REDCAP_ADMIN_FIELD="creds_is_admin"
// REDCAP_NAME_FIELD="demo_name"

const redcapCredentialsProvider = CredentialsProvider({
  name: "redcap",
  credentials: {
    username: { label: "Email Address", type: "text", placeholder: "Email Address" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials): Promise<any> {
    console.log("Signing in with REDCap....");
    if (!credentials?.password || !credentials?.username) return false;

    const host = process.env.REDCAP_API_URL ?? "redcapdev.wustl.edu";
    const passwordField = process.env.REDCAP_PASS_FIELD ?? "creds_pass";
    const enabledField = process.env.REDCAP_ENABLED_FIELD ?? "creds_enabled";
    const emailField = process.env.REDCAP_EMAIL_FIELD ?? "creds_email";
    const nameField = process.env.REDCAP_NAME_FIELD ?? "creds_email";
    const isAdminField = process.env.REDCAP_ADMIN_FIELD ?? "creds_is_admin";

    const formData = {
      token: process.env.REDCAP_API_KEY,
      content: "record",
      action: "export",
      format: "json",
      type: "flat",
      //NOTE: REDCap uses a non-standard way to handle arrays in form data.
      // We cannot use a typical array like =>  fields: ["creds_email", "creds_enabled"],
      // Instead we need to define the array like this:
      "fields[0]": emailField,
      "fields[1]": enabledField,
      "fields[2]": nameField,
      "fields[3]": isAdminField,
      rawOrLabel: "raw",
      rawOrLabelHeaders: "raw",
      exportCheckboxLabel: "false",
      exportSurveyFields: "false",
      exportDataAccessGroups: "false",
      returnFormat: "json",
      filterLogic:
        `[${emailField}]='${credentials?.username}'` +
        ` AND [${passwordField}] = '${credentials?.password}'` +
        ` AND [${enabledField}] = 1`,
    };

    let formDataString = querystring.stringify(formData);
    const options = {
      hostname: host,
      port: 443,
      path: "/redcap/api/",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(formDataString),
      },
    };

    return await new Promise((resolve, reject) => {
      const apiRequest = https.request(options, async (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", async () => {
          if (
            res.statusCode != undefined &&
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {
            const data = JSON.parse(body);
            if (data.length == 1) {
              
              let email = data[0][emailField].toString();
              let isAdmin = false;
              if (data[0][isAdminField] == true) isAdmin = true;

              const user = {
                id: hashValue(email),
                name: data[0][nameField],
                email: email,
                isAdmin,
                image: "",
              };

              console.log("Logged in", user);
              resolve(user);
            } else {
              console.warn("Invalid login attempt");
              resolve(null);
            }
          } else {
            console.error("Bad Response", res.statusCode, res);
            reject(new Error(`Bad Response: ${res.statusCode}`));
          }
        });
      });

      apiRequest.on("error", (error) => {
        console.error(error);
        reject(new Error(error.message));
      });

      apiRequest.write(formDataString);
      apiRequest.end();
    });
  },
});

export { redcapCredentialsProvider };
