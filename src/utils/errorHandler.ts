import chalk from "chalk";

/**
 * Handle fatal errors in the application
 */
export function handleFatalError(message: string, error: unknown): void {
  console.error(chalk.red("\n❌ " + message));

  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.stack) {
      console.error(chalk.gray(error.stack.split("\n").slice(1).join("\n")));
    }
  } else {
    console.error(chalk.red(`Unknown error: ${String(error)}`));
  }

  console.log(
    chalk.yellow(
      "\nIf this issue persists, please report it at https://github.com/example/cli-project-generator/issues\n"
    )
  );
}
