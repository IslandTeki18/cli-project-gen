import inquirer from "inquirer";
import chalk from "chalk";
import { ProjectConfig } from "../types";

// Replace the logger with a simpler implementation
const logger = {
  info: (message: string) => console.log(chalk.blue(message)),
  error: (message: string) => console.error(chalk.red(message)),
  success: (message: string) => console.log(chalk.green(message)),
  warn: (message: string) => console.log(chalk.yellow(message)),
};

/**
 * Prompts the user to select project features
 */
export const promptForFeatures = async (
  projectType: string
): Promise<Partial<ProjectConfig>> => {
  logger.info("Let's configure your project features:");

  // Common feature questions
  const commonQuestions: inquirer.QuestionCollection = [
    {
      type: "list",
      name: "apiType",
      message: "Select API type:",
      choices: [
        { name: "REST API", value: "rest" },
        { name: "GraphQL", value: "graphql" },
      ],
      default: "rest",
      when: (answers) =>
        projectType === "backend" ||
        answers.features?.authentication ||
        answers.features?.crudSetup,
    },
  ];

  // Non-backend specific questions
  const frontendQuestions: inquirer.QuestionCollection = [
    {
      type: "confirm",
      name: "features.authentication",
      message: "Include authentication?",
      default: false,
    },
    {
      type: "confirm",
      name: "features.userProfiles",
      message: "Include user profiles?",
      default: false,
      when: (answers) => answers.features?.authentication,
    },
    {
      type: "confirm",
      name: "features.userSettings",
      message: "Include user settings?",
      default: false,
      when: (answers) => answers.features?.authentication,
    },
    {
      type: "confirm",
      name: "features.responsiveLayout",
      message: "Include responsive layout?",
      default: true,
    },
    {
      type: "confirm",
      name: "features.crudSetup",
      message: "Include CRUD operations setup?",
      default: false,
    },
    {
      type: "list",
      name: "stateManagement",
      message: "Select state management solution:",
      choices: [
        { name: "Redux (with Redux Toolkit)", value: "redux" },
        { name: "React Context API", value: "context" },
      ],
      default: "redux",
    },
    {
      type: "confirm",
      name: "themeToggle",
      message: "Include light/dark theme toggle?",
      default: false,
    },
  ];

  // Backend specific questions - always asked for backend type, or conditionally for others
  const backendQuestions: inquirer.QuestionCollection = [
    {
      type: "list",
      name: "backend.database",
      message: "Select database:",
      choices: [
        { name: "MongoDB", value: "mongodb" },
        { name: "PostgreSQL", value: "postgresql" },
      ],
      default: "mongodb",
    },
    {
      type: "confirm",
      name: "backend.roleBasedAuth",
      message: "Include role-based authorization?",
      default: false,
      when: (answers) =>
        answers.features?.authentication || projectType === "backend",
    },
    {
      type: "confirm",
      name: "backend.jwtSetup",
      message: "Setup JWT authentication?",
      default: true,
      when: (answers) =>
        answers.features?.authentication || projectType === "backend",
    },
    {
      type: "confirm",
      name: "backend.apiVersioning",
      message: "Include API versioning?",
      default: false,
    },
  ];

  // Determine which questions to ask based on project type
  let responses = {};

  if (projectType === "backend") {
    // For backend projects, ask backend-specific questions first
    responses = await inquirer.prompt([
      {
        type: "confirm",
        name: "features.authentication",
        message: "Include authentication?",
        default: true,
      },
      ...commonQuestions,
      ...backendQuestions,
    ]);
  } else {
    // For frontend projects (web/mobile), ask frontend questions first
    responses = await inquirer.prompt([
      ...frontendQuestions,
      ...commonQuestions,
    ]);

    // Then conditionally ask backend questions if needed
    if (responses.features?.authentication || responses.features?.crudSetup) {
      const backendResponses = await inquirer.prompt(backendQuestions);
      responses = { ...responses, ...backendResponses };
    }
  }

  return responses;
};

/**
 * Display summary of selected features with styled output
 */
export const displayFeatureSummary = (config: ProjectConfig): void => {
  console.log(chalk.bold("\n✨ Project Configuration Summary ✨\n"));

  console.log(chalk.cyan("📋 General Information:"));
  console.log(
    `${chalk.gray("▸")} Project Type: ${chalk.green(
      config.type.charAt(0).toUpperCase() + config.type.slice(1)
    )}`
  );
  console.log(`${chalk.gray("▸")} Project Name: ${chalk.green(config.name)}\n`);

  console.log(chalk.cyan("🔌 Core Features:"));

  const features = [
    { name: "Authentication", enabled: config.features.authentication },
    { name: "User Profiles", enabled: config.features.userProfiles },
    { name: "User Settings", enabled: config.features.userSettings },
    { name: "Responsive Layout", enabled: config.features.responsiveLayout },
    { name: "CRUD Operations", enabled: config.features.crudSetup },
    { name: "Theme Toggle", enabled: config.themeToggle },
  ];

  features.forEach((feature) => {
    const icon = feature.enabled ? chalk.green("✓") : chalk.red("✗");
    console.log(`${chalk.gray("▸")} ${icon} ${feature.name}`);
  });

  console.log(
    `\n${chalk.gray("▸")} State Management: ${chalk.yellow(
      config.stateManagement === "redux" ? "Redux" : "Context API"
    )}`
  );

  if (config.features.authentication || config.features.crudSetup) {
    console.log(
      `${chalk.gray("▸")} API Type: ${chalk.yellow(
        config.apiType.toUpperCase()
      )}\n`
    );

    console.log(chalk.cyan("🛠️ Backend Configuration:"));
    console.log(
      `${chalk.gray("▸")} Database: ${chalk.blue(config.backend.database)}`
    );

    if (config.features.authentication) {
      const jwtIcon = config.backend.jwtSetup
        ? chalk.green("✓")
        : chalk.red("✗");
      console.log(`${chalk.gray("▸")} ${jwtIcon} JWT Authentication`);

      const rbacIcon = config.backend.roleBasedAuth
        ? chalk.green("✓")
        : chalk.red("✗");
      console.log(`${chalk.gray("▸")} ${rbacIcon} Role-based Authorization`);
    }

    const versioningIcon = config.backend.apiVersioning
      ? chalk.green("✓")
      : chalk.red("✗");
    console.log(`${chalk.gray("▸")} ${versioningIcon} API Versioning`);
  }

  console.log(chalk.bold("\n🚀 Ready to generate your project!\n"));
};
