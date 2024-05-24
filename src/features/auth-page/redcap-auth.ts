import CredentialsProvider from "next-auth/providers/credentials";
import { hashValue } from "./helpers";
import https from "https";

const redcapCredentialsProvider = CredentialsProvider({
  name: "redcap",
  credentials: {
    username: { label: "Username", type: "text", placeholder: "dev" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, req1): Promise<any> {
    console.log("using redcap....");
    if (!credentials?.password || !credentials?.username) return false;

    const host = process.env.REDCAP_API_URL ?? "redcapdev.wustl.edu";

    const queryString =
      `token=${process.env.REDCAP_API_KEY}&content=record&action=export&format=json&type=flat&fields[0]=creds_user&fields[1]=creds_pass&fields[2]=creds_enabled` +
      `&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json` +
      `&filterLogic=[creds_user]='${credentials?.username}' AND [creds_pass] = '${credentials?.password}' AND [creds_enabled] = 1`;

    const options = {
      hostname: host,
      port: 443,
      path: "/redcap/api/",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(queryString),
      },
    };

    return await new Promise((resolve) => {
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
              const user = {
                id: hashValue(data[0].creds_user + "@redcap"),
                name: data[0].creds_user,
                email: data[0].creds_user + "@redcap",
                isAdmin: false,
                image: "",
              };

              console.log("Logged in", user);
              resolve(user);
              return user;
            }
          } else {
            console.log("bad response", res.statusCode, res);
          }
          return false;
        });
      });

      apiRequest.on("error", (error) => {
        console.error(error);
      });

      apiRequest.write(queryString);
      apiRequest.end();
    });
  },
});

export { redcapCredentialsProvider };
