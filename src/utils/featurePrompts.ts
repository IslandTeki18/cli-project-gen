import inquirer from "inquirer";
import chalk from "chalk";
import { FeatureSelections, ProjectConfig } from "../types";

/**
 * Prompt the user for project features based on project type
 */
export async function promptForFeatures(
  projectType: string
): Promise<FeatureSelections> {
  let features = {};
  let stateManagement, themeToggle, apiType;

  // Common features for web/mobile projects
  if (projectType === "web" || projectType === "mobile") {
    const { selectedFeatures } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedFeatures",
        message: "Select features to include:",
        choices: [
          { name: "Authentication", value: "authentication" },
          { name: "User Profiles", value: "userProfiles" },
          { name: "User Settings", value: "userSettings" },
          { name: "Responsive Layout", value: "responsiveLayout" },
          { name: "CRUD Operations", value: "crudSetup" },
        ],
      },
    ]);

    features = {
      authentication: selectedFeatures.includes("authentication"),
      userProfiles: selectedFeatures.includes("userProfiles"),
      userSettings: selectedFeatures.includes("userSettings"),
      responsiveLayout: selectedFeatures.includes("responsiveLayout"),
      crudSetup: selectedFeatures.includes("crudSetup"),
    };

    // If UI project, ask about state management
    const { stateManagementChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "stateManagementChoice",
        message: "Select state management solution:",
        choices: [
          { name: "Redux + RTK", value: "redux" },
          { name: "React Context", value: "context" },
          { name: "None / Simple Props", value: "none" },
        ],
      },
    ]);

    stateManagement = stateManagementChoice;

    // Ask about theme toggle
    const { includeThemeToggle } = await inquirer.prompt([
      {
        type: "confirm",
        name: "includeThemeToggle",
        message: "Include dark/light theme toggle?",
        default: true,
      },
    ]);

    themeToggle = includeThemeToggle;
  }

  // API type for both frontend and backend
  const { apiTypeChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "apiTypeChoice",
      message: "Select API architecture:",
      choices: [
        { name: "REST API", value: "rest" },
        { name: "GraphQL", value: "graphql" },
      ],
    },
  ]);

  apiType = apiTypeChoice;

  // Backend specific options
  let backend = {};
  if (projectType === "backend" || projectType === "web") {
    const { dbChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "dbChoice",
        message: "Select database:",
        choices: [
          { name: "MongoDB", value: "mongodb" },
          { name: "PostgreSQL", value: "postgres" },
          { name: "MySQL", value: "mysql" },
        ],
      },
    ]);

    const { backendFeatures } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "backendFeatures",
        message: "Select backend features:",
        choices: [
          { name: "Role-based Authorization", value: "roleBasedAuth" },
          { name: "JWT Authentication", value: "jwtSetup" },
          { name: "API Versioning", value: "apiVersioning" },
        ],
      },
    ]);

    backend = {
      database: dbChoice,
      roleBasedAuth: backendFeatures.includes("roleBasedAuth"),
      jwtSetup: backendFeatures.includes("jwtSetup"),
      apiVersioning: backendFeatures.includes("apiVersioning"),
    };
  }

  return {
    features,
    stateManagement,
    themeToggle,
    apiType,
    backend,
  };
}

/**
 * Display a summary of selected features
 */
export function displayFeatureSummary(config: ProjectConfig): void {
  console.log(chalk.green.bold("\n📋 Project Configuration Summary:"));
  console.log(chalk.blue("Project Name:"), config.name);
  console.log(
    chalk.blue("Project Type:"),
    projectTypeToDisplayName(config.type)
  );

  console.log(chalk.green.bold("\n📦 Features:"));

  // Display enabled features
  const enabledFeatures = Object.entries(config.features)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => featureKeyToDisplayName(key));

  if (enabledFeatures.length > 0) {
    console.log(chalk.gray("✅ " + enabledFeatures.join("\n✅ ")));
  } else {
    console.log(chalk.gray("No additional features selected"));
  }

  // State management (for web/mobile)
  if (config.type === "web" || config.type === "mobile") {
    console.log(chalk.green.bold("\n🔄 State Management:"));
    console.log(
      chalk.gray(stateManagementToDisplayName(config.stateManagement))
    );

    console.log(chalk.green.bold("\n🎨 Theme Toggle:"));
    console.log(chalk.gray(config.themeToggle ? "Enabled" : "Disabled"));
  }

  // API and Backend
  console.log(chalk.green.bold("\n🌐 API Architecture:"));
  console.log(chalk.gray(config.apiType === "rest" ? "REST API" : "GraphQL"));

  if (config.type === "backend" || config.type === "web") {
    console.log(chalk.green.bold("\n🗄️ Backend:"));
    console.log(chalk.gray("Database: " + config.backend.database));

    const backendFeatures = [];
    if (config.backend.roleBasedAuth)
      backendFeatures.push("Role-based Authorization");
    if (config.backend.jwtSetup) backendFeatures.push("JWT Authentication");
    if (config.backend.apiVersioning) backendFeatures.push("API Versioning");

    if (backendFeatures.length > 0) {
      console.log(chalk.gray("Additional Backend Features:"));
      console.log(chalk.gray("✅ " + backendFeatures.join("\n✅ ")));
    }
  }
}

// Helper functions to convert keys to display names
function projectTypeToDisplayName(type: string): string {
  const map: Record<string, string> = {
    web: "Web Application (React)",
    mobile: "Mobile Application (React Native)",
    backend: "Backend Service (Node.js)",
  };
  return map[type] || type;
}

function featureKeyToDisplayName(key: string): string {
  const map: Record<string, string> = {
    authentication: "User Authentication",
    userProfiles: "User Profiles",
    userSettings: "User Settings & Preferences",
    responsiveLayout: "Responsive Layout",
    crudSetup: "CRUD Operations",
  };
  return map[key] || key;
}

function stateManagementToDisplayName(key: string): string {
  const map: Record<string, string> = {
    redux: "Redux + Redux Toolkit",
    context: "React Context API",
    none: "No global state management",
  };
  return map[key] || key;
}
