import chalk from "chalk";
import https from "https";

const CLI_VERSION = "0.1.0";
const VERSION_CHECK_URL =
  "https://raw.githubusercontent.com/example/cli-project-generator/main/version.json";

export const checkForUpdates = async (): Promise<{
  hasUpdate: boolean;
  latestVersion: string | null;
}> => {
  return new Promise((resolve) => {
    try {
      https
        .get(VERSION_CHECK_URL, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const { version } = JSON.parse(data);
              const hasUpdate = version !== CLI_VERSION;
              resolve({ hasUpdate, latestVersion: version });
            } catch (e) {
              console.error(
                chalk.yellow("Warning: Could not parse version data")
              );
              resolve({ hasUpdate: false, latestVersion: null });
            }
          });
        })
        .on("error", (err) => {
          console.error(
            chalk.yellow("Warning: Could not check for updates"),
            err.message
          );
          resolve({ hasUpdate: false, latestVersion: null });
        });
    } catch (error) {
      console.error(chalk.yellow("Warning: Could not check for updates"));
      resolve({ hasUpdate: false, latestVersion: null });
    }
  });
};
