import chalk from "chalk";

export const handleFatalError = (message: string, error: unknown): void => {
  console.error(chalk.red(`${message}:`));

  if (error instanceof Error) {
    console.error(chalk.red(`${error.message}`));
    if (error.stack) {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        console.error(chalk.gray(error.stack.split("\n").slice(1).join("\n")));
      }
    }
  } else {
    console.error(chalk.red(String(error)));
  }

  console.log(
    chalk.yellow("\nThe CLI encountered a critical error and cannot continue.")
  );
  console.log(chalk.yellow("Please fix the issues above and try again."));
  process.exit(1);
};
