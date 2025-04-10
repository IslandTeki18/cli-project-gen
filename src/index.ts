import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs";
import os from "os";

// Initialize Commander
const program = new Command();

// Define CLI version and description
program
  .name("project-generator")
  .description("CLI tool to generate project scaffolding")
  .version("1.0.0");

// Define CLI options
program
  .option("-d, --dry-run", "Simulate file generation without writing files")
  .option("-c, --config <path>", "Path to custom configuration file")
  .option("-b, --blueprint <name>", "Use a saved blueprint");

// Parse command-line arguments
program.parse(process.argv);

// Get the parsed options
const options = program.opts();

// Define the default root directory for generated projects
const DEFAULT_OUTPUT_DIR = path.join(os.homedir(), "dev", "templates");

// Project configuration that will store all user choices
const projectConfig: {
  projectType?: "web" | "mobile";
  projectName?: string;
  outputDir?: string;
  features?: string[];
  backend?: {
    database?: "mongodb" | "postgresql";
    apiType?: "rest" | "graphql";
    auth?: {
      roleBased: boolean;
      jwt: boolean;
    };
    apiVersioning?: boolean;
  };
  // Additional config properties will be added as we implement more prompts
} = {};

// Define the blueprint directory and file path
const BLUEPRINTS_DIR = path.join(os.homedir(), ".mycli");
const BLUEPRINTS_FILE = path.join(BLUEPRINTS_DIR, "blueprints.json");

/**
 * Interface for Blueprint data structure
 */
interface Blueprint {
  name: string;
  description?: string;
  config: typeof projectConfig;
  createdAt: string;
}

/**
 * Load saved blueprints from the blueprints file
 */
function loadBlueprints(): Blueprint[] {
  try {
    if (!fs.existsSync(BLUEPRINTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BLUEPRINTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.yellow("Warning:"), "Could not load blueprints", error);
    return [];
  }
}

/**
 * Save a blueprint to the blueprints file
 */
function saveBlueprint(name: string, description?: string): void {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(BLUEPRINTS_DIR)) {
      fs.mkdirSync(BLUEPRINTS_DIR, { recursive: true });
    }

    // Load existing blueprints
    const blueprints = loadBlueprints();

    // Create new blueprint
    const newBlueprint: Blueprint = {
      name,
      description,
      config: { ...projectConfig },
      createdAt: new Date().toISOString(),
    };

    // Add or update blueprint
    const existingIndex = blueprints.findIndex((bp) => bp.name === name);
    if (existingIndex >= 0) {
      blueprints[existingIndex] = newBlueprint;
    } else {
      blueprints.push(newBlueprint);
    }

    // Write updated blueprints back to file
    fs.writeFileSync(
      BLUEPRINTS_FILE,
      JSON.stringify(blueprints, null, 2),
      "utf-8"
    );

    console.log(
      chalk.green(
        `Blueprint "${name}" saved successfully to ${BLUEPRINTS_FILE}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red("Error:"),
      "Could not save blueprint",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Prompt to select a blueprint
 */
async function promptForBlueprint(): Promise<boolean> {
  const blueprints = loadBlueprints();

  if (blueprints.length === 0) {
    console.log(chalk.yellow("No saved blueprints found."));
    return false;
  }

  const { useBlueprint } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useBlueprint",
      message: "Do you want to use a saved blueprint?",
      default: false,
    },
  ]);

  if (!useBlueprint) {
    return false;
  }

  const { blueprint } = await inquirer.prompt([
    {
      type: "list",
      name: "blueprint",
      message: "Select a blueprint:",
      choices: blueprints.map((bp) => ({
        name: `${bp.name}${bp.description ? ` - ${bp.description}` : ""}`,
        value: bp.name,
      })),
    },
  ]);

  // Find the selected blueprint
  const selectedBlueprint = blueprints.find((bp) => bp.name === blueprint);

  if (selectedBlueprint) {
    // Load configuration from blueprint
    Object.assign(projectConfig, selectedBlueprint.config);

    console.log(
      chalk.green(`\n✓ Blueprint "${selectedBlueprint.name}" loaded`)
    );
    console.log(
      chalk.dim(
        `  Created: ${new Date(selectedBlueprint.createdAt).toLocaleString()}`
      )
    );

    return true;
  }

  return false;
}

/**
 * Prompt to save the current configuration as a blueprint
 */
async function promptToSaveBlueprint(): Promise<void> {
  const { save } = await inquirer.prompt([
    {
      type: "confirm",
      name: "save",
      message:
        "Do you want to save this configuration as a blueprint for future use?",
      default: false,
    },
  ]);

  if (!save) return;

  const { name, description } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Enter a name for this blueprint:",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Blueprint name cannot be empty";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "description",
      message: "Enter an optional description:",
    },
  ]);

  saveBlueprint(name.trim(), description.trim() || undefined);
}

// Display welcome message
console.log(chalk.blue.bold("✨ CLI Project Generator initialized ✨"));

// Log options if any were provided
if (Object.keys(options).length > 0) {
  console.log(chalk.yellow("Options:"));
  if (options.dryRun) console.log(chalk.cyan("- Dry run mode enabled"));
  if (options.config)
    console.log(chalk.cyan(`- Using config file: ${options.config}`));
  if (options.blueprint)
    console.log(chalk.cyan(`- Using blueprint: ${options.blueprint}`));
}

/**
 * Validate if the provided name is a valid folder name
 */
function isValidFolderName(name: string): boolean | string {
  // Check if name is not empty
  if (!name || name.trim() === "") {
    return "Project name cannot be empty";
  }

  // Check for invalid characters in folder names (OS-independent validation)
  const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
  if (invalidChars.test(name)) {
    return "Project name contains invalid characters";
  }

  // Check if name starts or ends with a dot or space
  if (/^\.|\.$|\s$|^\s/.test(name)) {
    return "Project name cannot start or end with a dot or space";
  }

  // Check for reserved names in Windows
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];

  if (reservedNames.includes(name.toUpperCase())) {
    return `'${name}' is a reserved name and cannot be used`;
  }

  return true; // Valid folder name
}

/**
 * Prompt for the project type (Web or Mobile)
 */
async function promptForProjectType(): Promise<void> {
  const { projectType } = await inquirer.prompt([
    {
      type: "list",
      name: "projectType",
      message: "What type of project would you like to generate?",
      choices: [
        { name: "Web (React + TailwindCSS)", value: "web" },
        { name: "Mobile (Expo + NativeWind)", value: "mobile" },
      ],
    },
  ]);

  projectConfig.projectType = projectType;

  console.log(
    chalk.green(
      `✓ Selected project type: ${
        projectType === "web"
          ? chalk.blue("Web (React + TailwindCSS)")
          : chalk.blue("Mobile (Expo + NativeWind)")
      }`
    )
  );
}

/**
 * Prompt for the project name with folder name validation
 */
async function promptForProjectName(): Promise<void> {
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is the name of your project?",
      validate: isValidFolderName,
      transformer: (input: string) => {
        // Show how the directory would look
        return path.join(process.cwd(), input);
      },
    },
  ]);

  projectConfig.projectName = projectName.trim();
  console.log(
    chalk.green(`✓ Project will be created as: ${chalk.blue(projectName)}`)
  );
}

/**
 * Get human-readable feature name from feature value
 */
function getFeatureName(featureValue: string): string {
  const featureMap: Record<string, string> = {
    auth: "Authentication",
    "user-profiles": "User Profiles",
    "user-settings": "User Settings",
    "responsive-layout": "Responsive Layout",
    crud: "CRUD Setup",
    "state-management": "State Management",
    "theme-toggle": "Light/Dark Theme Toggle",
    "api-choice": "API Choice (REST vs GraphQL)",
  };

  return featureMap[featureValue] || featureValue;
}

/**
 * Get feature description
 */
function getFeatureDescription(featureValue: string): string {
  const descriptionMap: Record<string, string> = {
    auth: "User login, registration, and authorization",
    "user-profiles": "User profile creation and management",
    "user-settings": "Customizable user preferences",
    "responsive-layout": "Layout adapts to different screen sizes",
    crud: "Create, read, update, delete operations",
    "state-management": "Global state management solution",
    "theme-toggle": "Toggle between light and dark themes",
    "api-choice": "Choose between REST and GraphQL APIs",
  };

  return descriptionMap[featureValue] || "";
}

/**
 * Categorize features for better organization
 */
function categorizeFeatures(features: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    "User Experience": ["responsive-layout", "theme-toggle"],
    "User Management": ["auth", "user-profiles", "user-settings"],
    "Data & API": ["crud", "api-choice", "state-management"],
  };

  const categorized: Record<string, string[]> = {};

  // Initialize categories
  Object.keys(categories).forEach((category) => {
    categorized[category] = [];
  });

  // Sort features into categories
  features.forEach((feature) => {
    for (const [category, categoryFeatures] of Object.entries(categories)) {
      if (categoryFeatures.includes(feature)) {
        categorized[category].push(feature);
        break;
      }
    }
  });

  // Remove empty categories
  Object.keys(categorized).forEach((category) => {
    if (categorized[category].length === 0) {
      delete categorized[category];
    }
  });

  return categorized;
}

/**
 * Display a summary of the selected features in a stylized format
 */
function displayFeatureSummary(features: string[]): void {
  if (features.length === 0) {
    console.log(chalk.yellow("\n⚠️ No features selected\n"));
    return;
  }

  console.log(chalk.green.bold("\n📋 Project Features Summary:"));

  const categorizedFeatures = categorizeFeatures(features);

  // Calculate total selected features count
  const totalFeatures = features.length;

  console.log(
    chalk.cyan(
      `\nSelected ${totalFeatures} feature${totalFeatures !== 1 ? "s" : ""}:`
    )
  );

  // Display features by category
  for (const [category, categoryFeatures] of Object.entries(
    categorizedFeatures
  )) {
    if (categoryFeatures.length > 0) {
      console.log(chalk.yellow(`\n${category}:`));

      categoryFeatures.forEach((feature) => {
        console.log(chalk.green(`  ✓ ${chalk.bold(getFeatureName(feature))}`));
        console.log(`    ${chalk.dim(getFeatureDescription(feature))}`);
      });
    }
  }

  console.log(); // Add empty line at the end for better spacing
}

/**
 * Prompt for feature selection
 */
async function promptForFeatures(): Promise<void> {
  const { features } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "features",
      message: "Select features you want to include:",
      choices: [
        { name: "Authentication", value: "auth", checked: true },
        { name: "User Profiles", value: "user-profiles" },
        { name: "User Settings", value: "user-settings" },
        {
          name: "Responsive layout",
          value: "responsive-layout",
          checked: true,
        },
        { name: "CRUD Setup", value: "crud" },
        { name: "State Management", value: "state-management" },
        { name: "Light/Dark Theme Toggle", value: "theme-toggle" },
        { name: "API Choice (Rest vs GraphQL", value: "api-choice" },
      ],
    },
  ]);

  projectConfig.features = features;

  // Display stylized feature summary
  displayFeatureSummary(features);
}

/**
 * Prompt for backend stack choices
 */
async function promptForBackendStack(): Promise<void> {
  console.log(chalk.blue.bold("\n🛠️ Backend Configuration"));

  // Database selection
  const { database } = await inquirer.prompt([
    {
      type: "list",
      name: "database",
      message: "Select your preferred database:",
      choices: [
        { name: "MongoDB", value: "mongodb" },
        { name: "PostgreSQL", value: "postgresql" },
      ],
    },
  ]);

  // API type selection
  const { apiType } = await inquirer.prompt([
    {
      type: "list",
      name: "apiType",
      message: "Select your preferred API type:",
      choices: [
        { name: "REST API", value: "rest" },
        { name: "GraphQL API", value: "graphql" },
      ],
    },
  ]);

  // Authentication options
  const { authOptions } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "authOptions",
      message: "Select authentication options:",
      choices: [
        {
          name: "Role-based authentication",
          value: "role-based",
          checked: true,
        },
        { name: "JWT authentication", value: "jwt", checked: true },
      ],
    },
  ]);

  // API versioning
  const { apiVersioning } = await inquirer.prompt([
    {
      type: "confirm",
      name: "apiVersioning",
      message: "Enable API versioning?",
      default: true,
    },
  ]);

  // Store selections in config
  projectConfig.backend = {
    database,
    apiType,
    auth: {
      roleBased: authOptions.includes("role-based"),
      jwt: authOptions.includes("jwt"),
    },
    apiVersioning,
  };

  // Display backend stack summary
  displayBackendStackSummary();
}

/**
 * Display a summary of the backend stack choices
 */
function displayBackendStackSummary(): void {
  if (!projectConfig.backend) return;

  console.log(chalk.green.bold("\n📊 Backend Stack Summary:"));

  // Database
  console.log(chalk.yellow("\nDatabase:"));
  console.log(
    chalk.green(
      `  ✓ ${chalk.bold(
        projectConfig.backend.database === "mongodb" ? "MongoDB" : "PostgreSQL"
      )}`
    )
  );
  console.log(
    `    ${chalk.dim(
      projectConfig.backend.database === "mongodb"
        ? "Document-oriented NoSQL database"
        : "Relational SQL database"
    )}`
  );

  // API Type
  console.log(chalk.yellow("\nAPI Type:"));
  console.log(
    chalk.green(
      `  ✓ ${chalk.bold(
        projectConfig.backend.apiType === "rest" ? "REST API" : "GraphQL API"
      )}`
    )
  );
  console.log(
    `    ${chalk.dim(
      projectConfig.backend.apiType === "rest"
        ? "Traditional REST endpoints with HTTP methods"
        : "Single endpoint with type system and queries/mutations"
    )}`
  );

  // Authentication
  console.log(chalk.yellow("\nAuthentication:"));
  if (projectConfig.backend.auth?.roleBased) {
    console.log(chalk.green(`  ✓ ${chalk.bold("Role-based authentication")}`));
    console.log(`    ${chalk.dim("Access control based on user roles")}`);
  }

  if (projectConfig.backend.auth?.jwt) {
    console.log(chalk.green(`  ✓ ${chalk.bold("JWT authentication")}`));
    console.log(`    ${chalk.dim("JSON Web Token based authentication")}`);
  }

  if (
    !projectConfig.backend.auth?.roleBased &&
    !projectConfig.backend.auth?.jwt
  ) {
    console.log(chalk.yellow("  No authentication options selected"));
  }

  // API Versioning
  console.log(chalk.yellow("\nAPI Versioning:"));
  if (projectConfig.backend.apiVersioning) {
    console.log(chalk.green(`  ✓ ${chalk.bold("API versioning enabled")}`));
    console.log(
      `    ${chalk.dim(
        "Support for multiple API versions (e.g., /v1/users, /v2/users)"
      )}`
    );
  } else {
    console.log(chalk.yellow("  API versioning disabled"));
  }

  console.log(); // Add empty line at the end
}

/**
 * Utility function for file operations with dry run support
 */
function fileOperation<T>(
  operation: () => T,
  dryRunMessage: string,
  errorMessage: string
): T | null {
  if (options.dryRun) {
    console.log(chalk.dim(`[Dry run] ${dryRunMessage}`));
    return null;
  }

  try {
    return operation();
  } catch (error) {
    console.error(
      chalk.red(`Error: ${errorMessage}`),
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Create the project output directory
 */
async function createProjectDirectory(): Promise<boolean> {
  if (!projectConfig.projectName) {
    console.error(chalk.red("Error: Project name is not defined."));
    return false;
  }

  // Create the default output directory if not already set
  if (!projectConfig.outputDir) {
    projectConfig.outputDir = path.join(
      DEFAULT_OUTPUT_DIR,
      projectConfig.projectName
    );
  }

  // Make sure output directory exists
  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    const created = fileOperation(
      () => {
        fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
        console.log(
          chalk.green(`✓ Created root directory: ${DEFAULT_OUTPUT_DIR}`)
        );
        return true;
      },
      `Would create directory: ${DEFAULT_OUTPUT_DIR}`,
      `Failed to create directory: ${DEFAULT_OUTPUT_DIR}`
    );

    if (created === null && !options.dryRun) {
      return false;
    }
  }

  // Check if project directory already exists
  if (fs.existsSync(projectConfig.outputDir)) {
    console.log(
      chalk.yellow(
        `\n⚠️ Warning: Project directory already exists: ${projectConfig.outputDir}`
      )
    );

    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "Directory already exists. Do you want to overwrite it?",
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow("Project generation cancelled."));
      return false;
    }

    // Delete existing directory if overwrite confirmed
    const deleted = fileOperation(
      () => {
        fs.rmSync(projectConfig.outputDir!, { recursive: true, force: true });
        console.log(
          chalk.green(
            `✓ Removed existing directory: ${projectConfig.outputDir}`
          )
        );
        return true;
      },
      `Would delete directory: ${projectConfig.outputDir}`,
      `Failed to remove directory: ${projectConfig.outputDir}`
    );

    if (deleted === null && !options.dryRun) {
      return false;
    }
  }

  // Create project directory
  const created = fileOperation(
    () => {
      fs.mkdirSync(projectConfig.outputDir!, { recursive: true });
      console.log(
        chalk.green(`✓ Created project directory: ${projectConfig.outputDir}`)
      );
      return true;
    },
    `Would create project directory: ${projectConfig.outputDir}`,
    `Failed to create project directory: ${projectConfig.outputDir}`
  );

  return options.dryRun || created !== null;
}

/**
 * Create a file in the project with dry run support
 */
function createProjectFile(relativePath: string, content: string): boolean {
  const filePath = path.join(projectConfig.outputDir!, relativePath);
  const dirPath = path.dirname(filePath);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    const dirCreated = fileOperation(
      () => {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
      },
      `Would create directory: ${dirPath}`,
      `Failed to create directory: ${dirPath}`
    );

    if (dirCreated === null && !options.dryRun) {
      return false;
    }
  }

  // Write file
  const fileWritten = fileOperation(
    () => {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(chalk.green(`✓ Created file: ${relativePath}`));
      return true;
    },
    `Would create file: ${relativePath}`,
    `Failed to write file: ${relativePath}`
  );

  return options.dryRun || fileWritten !== null;
}

// Main CLI execution will go here
async function main() {
  try {
    // Check for blueprint flag
    if (options.blueprint) {
      // Load existing blueprints
      const blueprints = loadBlueprints();
      const selectedBlueprint = blueprints.find(
        (bp) => bp.name === options.blueprint
      );

      if (selectedBlueprint) {
        // Load configuration from blueprint
        Object.assign(projectConfig, selectedBlueprint.config);

        console.log(
          chalk.green(
            `\n✓ Blueprint "${selectedBlueprint.name}" loaded from command line argument`
          )
        );
        console.log(
          chalk.dim(
            `  Created: ${new Date(
              selectedBlueprint.createdAt
            ).toLocaleString()}`
          )
        );
      } else {
        console.log(
          chalk.yellow(`\n⚠️ Blueprint "${options.blueprint}" not found`)
        );
        console.log(chalk.dim("  Proceeding with interactive prompts..."));
      }
    } else {
      // Check if user wants to use a saved blueprint
      const usedBlueprint = await promptForBlueprint();

      // If not using a blueprint, do regular prompts
      if (!usedBlueprint) {
        // Prompt for project type
        await promptForProjectType();

        // Prompt for project name
        await promptForProjectName();

        // Prompt for feature selection
        await promptForFeatures();

        // Prompt for backend stack choices
        await promptForBackendStack();

        // Offer to save this configuration as a blueprint
        await promptToSaveBlueprint();
      }
    }

    // Create project directory
    const directoryCreated = await createProjectDirectory();

    if (!directoryCreated) {
      console.log(chalk.red("❌ Failed to create project directory. Exiting."));
      process.exit(1);
    }

    // Example of using the createProjectFile function
    if (projectConfig.projectType === "web") {
      // This is just a placeholder to demonstrate the function
      // In a real implementation, you would generate actual project files
      createProjectFile(
        "README.md",
        `# ${projectConfig.projectName}\n\nA web project generated with CLI Project Generator.`
      );
    }

    console.log(chalk.green("\nProject setup complete!"));
    console.log(
      chalk.cyan(`Project will be generated at: ${projectConfig.outputDir}`)
    );

    if (options.dryRun) {
      console.log(
        chalk.yellow(
          "\n⚠️ Dry run mode enabled - no files were actually created."
        )
      );
    }

    // Show final configuration
    console.log(chalk.green("\nFinal Project configuration:"));
    console.log(JSON.stringify(projectConfig, null, 2));

    // Future implementation will go here
    // - Generate files based on selections
  } catch (error) {
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
