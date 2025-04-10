import chalk from "chalk";

export const logger = {
  info: (message: string): void => {
    console.log(chalk.blue("INFO: ") + message);
  },

  success: (message: string): void => {
    console.log(chalk.green("SUCCESS: ") + message);
  },

  warning: (message: string): void => {
    console.log(chalk.yellow("WARNING: ") + message);
  },

  error: (message: string): void => {
    console.error(chalk.red("ERROR: ") + message);
  },

  debug: (message: string): void => {
    if (process.env.DEBUG) {
      console.log(chalk.gray("DEBUG: ") + message);
    }
  },

  dryRun: (message: string): void => {
    console.log(chalk.yellow("DRY RUN: ") + message);
  },

  fileOp: (operation: string, path: string, dryRun: boolean): void => {
    const prefix = dryRun ? chalk.yellow("[DRY RUN] ") : "";
    console.log(`${prefix}${chalk.cyan(operation)}: ${path}`);
  },
};
