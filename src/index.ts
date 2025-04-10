#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import https from "https";
import { ProjectConfig, Blueprint } from "./types";
import { checkForUpdates } from "./utils/updateChecker";
import { handleFatalError } from "./utils/errorHandler";
import { generateProject } from "./utils/projectGenerator";
import { validateProjectName } from "./utils/validation";
import { loadBlueprints, saveBlueprint } from "./utils/blueprintManager";
import {
  promptForFeatures,
  displayFeatureSummary,
} from "./utils/featurePrompts";

const execAsync = promisify(exec);

// CLI version
const CLI_VERSION = "0.1.0";
const VERSION_CHECK_URL =
  "https://raw.githubusercontent.com/example/cli-project-generator/main/version.json";

// Blueprint storage paths
const BLUEPRINT_DIR = path.join(os.homedir(), ".mycli");
const BLUEPRINT_FILE = path.join(BLUEPRINT_DIR, "blueprints.json");

// Project generation constants
const DEFAULT_TEMPLATES_DIR = path.join(os.homedir(), "dev", "templates");

// Template file contents generator
const getTemplateContent = (
  contentKey: string,
  config: ProjectConfig
): string => {
  const templates: { [key: string]: (config: ProjectConfig) => string } = {
    webIndexContent: (config) => `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App';
import '@/index.css';

${
  config.stateManagement === "redux"
    ? `import { Provider } from 'react-redux';
import { store } from '@/lib/store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);`
    : `const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`
}
`,
    webAppContent: (config) => `import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/features/home/Home';
import Layout from '@/shared/Layout';
${
  config.features.authentication
    ? `import Login from '@/features/auth/components/Login';
import RequireAuth from '@/features/auth/components/RequireAuth';`
    : ""
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        ${
          config.features.authentication
            ? `<Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={
          <RequireAuth>
            <div className="p-4">
              <h2 className="text-xl font-bold">Dashboard</h2>
              <p>This page is protected and requires authentication.</p>
            </div>
          </RequireAuth>
        } />`
            : `<Route index element={<Home />} />`
        }
      </Route>
    </Routes>
  );
};

export default App;
`,
    webCssContent: () => `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`,
    webLayoutContent: () => `import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} My App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
`,
    webNavbarContent: (config) => `import React from 'react';
import { Link } from 'react-router-dom';
${
  config.features.authentication && config.stateManagement === "redux"
    ? `import { useDispatch, useSelector } from 'react-redux';
import { logout, selectAuth } from '@/features/auth/authSlice';`
    : config.features.authentication
    ? `import { useAuth } from '@/features/auth/authContext';`
    : ""
}
${config.themeToggle ? `import { useTheme } from '@/lib/theme';` : ""}

const Navbar: React.FC = () => {
  ${
    config.features.authentication && config.stateManagement === "redux"
      ? `const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(selectAuth);
  
  const handleLogout = () => {
    dispatch(logout());
  };`
      : config.features.authentication
      ? `const { isAuthenticated, user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };`
      : ""
  }
  ${config.themeToggle ? `const { theme, toggleTheme } = useTheme();` : ""}

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">My App</Link>
            <Link to="/" className="hover:text-blue-200">Home</Link>
            ${
              config.features.authentication
                ? `{isAuthenticated && (
              <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
            )}`
                : ""
            }
          </div>
          
          <div className="flex items-center space-x-4">
            ${
              config.themeToggle
                ? `<button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-blue-700"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>`
                : ""
            }
            
            ${
              config.features.authentication
                ? `{isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span>Hi, {user?.name || 'User'}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
              >
                Login
              </Link>
            )}`
                : ""
            }
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
`,
    webHomeContent: () => `import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to My App</h1>
      <p className="mb-4">
        This is a starter template for your React application. It includes:
      </p>
      <ul className="list-disc pl-5 mb-6">
        <li>TypeScript configuration</li>
        <li>TailwindCSS for styling</li>
        <li>React Router for navigation</li>
        <li>Responsive layout structure</li>
        <li>Feature-based folder organization</li>
      </ul>
      <div className="bg-blue-100 p-4 rounded">
        <p className="text-blue-800">
          Get started by editing the files in the <code>src</code> directory.
        </p>
      </div>
    </div>
  );
};

export default Home;
`,
    backendIndexContent: (config) => `import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import config from './config';
import { errorConverter, errorHandler } from './middleware/error.middleware';
import routes from './routes';
${
  config.backend.database === "mongodb"
    ? "import { connectMongoDB } from './config/database';"
    : "import { connectPostgres } from './config/database';"
}
import './config/passport';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// Enable cors
app.use(cors());
app.options('*', cors());

// JWT authentication
app.use(passport.initialize());

// API routes
app.use('/api', routes);

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(\`Server running on port \${PORT}\`);
  
  // Connect to database
  ${
    config.backend.database === "mongodb"
      ? "await connectMongoDB();"
      : "await connectPostgres();"
  }
});

export default app;
`,
    backendConfigContent: (config) => `import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/${config.name}',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  postgres: {
    url: process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/${config.name}',
    options: {},
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    accessExpirationMinutes: 30,
    refreshExpirationDays: 30,
  },
};

export default config;
`,
    backendDatabaseContent: (config) => {
      if (config.backend.database === "mongodb") {
        return `import mongoose from 'mongoose';
import config from './index';

/**
 * Connect to MongoDB
 */
export const connectMongoDB = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url);
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Close MongoDB connection
 */
export const closeMongoDB = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
};
`;
      } else {
        return `import { Sequelize } from 'sequelize';
import config from './index';

const sequelize = new Sequelize(config.postgres.url, {
  dialect: 'postgres',
  logging: false,
  // Additional options can be added here
});

/**
 * Connect to PostgreSQL
 */
export const connectPostgres = async (): Promise<void> => {
  try {
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL!');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

/**
 * Close PostgreSQL connection
 */
export const closePostgres = async (): Promise<void> => {
  await sequelize.close();
  console.log('PostgreSQL connection closed');
};

export default sequelize;
`;
      }
    },
    backendPassportContent: (
      config
    ) => `import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import config from './index';
${
  config.backend.database === "mongodb"
    ? "import { User } from '../models/user.model';"
    : "import { User } from '../models/user.model';"
}

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      ${
        config.backend.database === "mongodb"
          ? "const user = await User.findById(payload.sub);"
          : "const user = await User.findByPk(payload.sub);"
      }
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  })
);
`,
  };

  return templates[contentKey] ? templates[contentKey](config) : "";
};

// Ensure blueprint directory exists
const ensureBlueprintDir = (): void => {
  if (!fs.existsSync(BLUEPRINT_DIR)) {
    fs.mkdirSync(BLUEPRINT_DIR, { recursive: true });
  }

  if (!fs.existsSync(BLUEPRINT_FILE)) {
    fs.writeFileSync(BLUEPRINT_FILE, JSON.stringify([], null, 2));
  }
};

// Load blueprints
const loadBlueprints = (): Blueprint[] => {
  ensureBlueprintDir();
  try {
    const data = fs.readFileSync(BLUEPRINT_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("Error loading blueprints:"), error);
    return [];
  }
};

// Save blueprint
const saveBlueprint = (blueprint: Blueprint): void => {
  ensureBlueprintDir();
  try {
    const blueprints = loadBlueprints();
    blueprints.push(blueprint);
    fs.writeFileSync(BLUEPRINT_FILE, JSON.stringify(blueprints, null, 2));
    console.log(
      chalk.green(`Blueprint "${blueprint.name}" saved successfully!`)
    );
  } catch (error) {
    console.error(chalk.red("Error saving blueprint:"), error);
  }
};

// Validate project name
const validateProjectName = (input: string): boolean | string => {
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  const reservedNames = [
    "con",
    "prn",
    "aux",
    "nul",
    "com1",
    "com2",
    "com3",
    "com4",
    "com5",
    "com6",
    "com7",
    "com8",
    "com9",
    "lpt1",
    "lpt2",
    "lpt3",
    "lpt4",
    "lpt5",
    "lpt6",
    "lpt7",
    "lpt8",
    "lpt9",
  ];

  if (!input || input.trim() === "") {
    return "Project name is required";
  }

  if (invalidChars.test(input)) {
    return "Project name contains invalid characters";
  }

  if (reservedNames.includes(input.toLowerCase())) {
    return "Project name is a reserved name";
  }

  if (fs.existsSync(path.resolve(process.cwd(), input))) {
    return "A directory with this name already exists";
  }

  return true;
};

// Validate blueprint name
const validateBlueprintName = (
  input: string,
  existingBlueprints: Blueprint[]
): boolean | string => {
  if (!input || input.trim() === "") {
    return "Blueprint name is required";
  }

  if (existingBlueprints.some((bp) => bp.name === input)) {
    return "A blueprint with this name already exists";
  }

  return true;
};

/**
 * Check if a newer version of the CLI is available
 */
const checkForUpdates = async (): Promise<{
  hasUpdate: boolean;
  latestVersion: string | null;
}> => {
  return new Promise((resolve) => {
    try {
      // Simulate HTTP request - in a real app, this would fetch from the VERSION_CHECK_URL
      // For now, we'll simulate a newer version being available
      // setTimeout(() => {
      //   const latestVersion = "0.1.1"; // Simulated newer version
      //   const hasUpdate = latestVersion !== CLI_VERSION;
      //   resolve({ hasUpdate, latestVersion });
      // }, 500);

      // Real implementation would use https.get:
      /*
      https.get(VERSION_CHECK_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const { version } = JSON.parse(data);
            const hasUpdate = version !== CLI_VERSION;
            resolve({ hasUpdate, latestVersion: version });
          } catch (e) {
            console.error(chalk.yellow('Warning: Could not parse version data'));
            resolve({ hasUpdate: false, latestVersion: null });
          }
        });
      }).on('error', (err) => {
        console.error(chalk.yellow('Warning: Could not check for updates'), err.message);
        resolve({ hasUpdate: false, latestVersion: null });
      });
      */
    } catch (error) {
      console.error(chalk.yellow("Warning: Could not check for updates"));
      resolve({ hasUpdate: false, latestVersion: null });
    }
  });
};

/**
 * Prompt the user to update the CLI
 */
const promptForUpdate = async (latestVersion: string): Promise<void> => {
  console.log(
    chalk.yellow(
      `\nA new version (${latestVersion}) of cli-project-generator is available!`
    )
  );
  console.log(chalk.yellow(`You are currently using version ${CLI_VERSION}`));

  const { shouldUpdate } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldUpdate",
      message: "Would you like to update now?",
      default: true,
    },
  ]);

  if (shouldUpdate) {
    console.log(chalk.blue("\nUpdating cli-project-generator..."));
    try {
      // In a real implementation, this would run: npm i -g cli-project-generator@latest
      // For this simulation, we'll just show a message
      console.log(
        chalk.green(
          "Update simulation complete! In a real implementation, this would execute:"
        )
      );
      console.log(chalk.green("npm i -g cli-project-generator@latest"));

      console.log(
        chalk.green("\nPlease restart the CLI to use the new version.")
      );
      process.exit(0);
    } catch (error) {
      console.error(chalk.red("Failed to update. Please update manually:"));
      console.log(chalk.yellow("npm i -g cli-project-generator@latest"));
    }
  }
};

/**
 * Handle fatal errors that should stop the CLI process
 */
const handleFatalError = (message: string, error: unknown): void => {
  console.error(chalk.red(`${message}:`));

  if (error instanceof Error) {
    console.error(chalk.red(`${error.message}`));
    if (error.stack) {
      // In development mode, you might want to show the stack trace
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

  // Exit with error code
  process.exit(1);
};

/**
 * Main program initialization
 */
const initCLI = async (): Promise<void> => {
  try {
    // Check for updates
    const { hasUpdate, latestVersion } = await checkForUpdates();
    if (hasUpdate && latestVersion) {
      await promptForUpdate(latestVersion);
    }

    const program = new Command();

    program
      .name("project-gen")
      .description("CLI tool for generating full-stack projects")
      .version(CLI_VERSION);

    program
      .command("create")
      .description("Create a new project")
      .option(
        "--dry-run",
        "Show what would be done without actually creating files"
      )
      .option(
        "--output-dir <path>",
        "Specify the output directory (defaults to ~/dev/templates/)"
      )
      .action(async (options) => {
        try {
          await createProjectCommand(options);
        } catch (error) {
          handleFatalError("Error creating project", error);
        }
      });

    program
      .command("list-blueprints")
      .description("List all saved project blueprints")
      .action(async () => {
        try {
          await listBlueprintsCommand();
        } catch (error) {
          handleFatalError("Error listing blueprints", error);
        }
      });

    program
      .command("delete-blueprint <name>")
      .description("Delete a saved project blueprint")
      .action(async (name) => {
        try {
          await deleteBlueprintCommand(name);
        } catch (error) {
          handleFatalError("Error deleting blueprint", error);
        }
      });

    program.parse(process.argv);

    // If no command is provided, show help
    if (!program.args.length) {
      program.outputHelp();
    }
  } catch (error) {
    handleFatalError("Initialization error", error);
  }
};

/**
 * Implementation of the create project command
 */
const createProjectCommand = async (options: {
  dryRun?: boolean;
  outputDir?: string;
}): Promise<void> => {
  const context = {
    dryRun: !!options.dryRun,
    outputDir: options.outputDir || process.env.PROJECT_ROOT || null,
    config: null as ProjectConfig | null,
    projectPath: "",
    error: null as Error | null,
    success: false,
  };

  try {
    console.log(chalk.blue.bold("\n=== Project Generator CLI ==="));
    if (context.dryRun) {
      console.log(chalk.yellow("DRY RUN MODE: No files will be created"));
    }

    // Load available blueprints first
    const blueprints = loadBlueprints();

    // Ask if the user wants to use a blueprint if any exist
    let useBlueprint = false;
    let selectedBlueprint: Blueprint | null = null;

    if (blueprints.length > 0) {
      const { wantToUseBlueprint } = await inquirer.prompt([
        {
          type: "confirm",
          name: "wantToUseBlueprint",
          message: "Do you want to use an existing blueprint?",
          default: false,
        },
      ]);

      if (wantToUseBlueprint) {
        const { blueprint } = await inquirer.prompt([
          {
            type: "list",
            name: "blueprint",
            message: "Select a blueprint:",
            choices: blueprints.map((bp) => ({
              name: `${bp.name} - ${bp.description} (${new Date(
                bp.createdAt
              ).toLocaleDateString()})`,
              value: bp,
            })),
          },
        ]);

        useBlueprint = true;
        selectedBlueprint = blueprint;
      }
    }

    // If not using a blueprint, go through normal project configuration
    if (!useBlueprint) {
      const { projectType } = await inquirer.prompt([
        {
          type: "list",
          name: "projectType",
          message: "Select the type of project to generate:",
          choices: [
            { name: "Web (React + TailwindCSS)", value: "web" },
            { name: "Mobile (Expo + NativeWind)", value: "mobile" },
            { name: "Backend Only", value: "backend" },
          ],
        },
      ]);

      // Get feature selections from user
      const featureSelections = await promptForFeatures(projectType);

      // Ask for project name
      const { projectName } = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Enter a name for your project:",
          validate: validateProjectName,
        },
      ]);

      context.config = {
        type: projectType,
        name: projectName,
        features: {
          authentication: featureSelections.features?.authentication || false,
          userProfiles: featureSelections.features?.userProfiles || false,
          userSettings: featureSelections.features?.userSettings || false,
          responsiveLayout:
            featureSelections.features?.responsiveLayout || false,
          crudSetup: featureSelections.features?.crudSetup || false,
        },
        stateManagement: featureSelections.stateManagement || "redux",
        themeToggle: featureSelections.themeToggle || false,
        apiType: featureSelections.apiType || "rest",
        backend: {
          database: featureSelections.backend?.database || "mongodb",
          roleBasedAuth: featureSelections.backend?.roleBasedAuth || false,
          jwtSetup: featureSelections.backend?.jwtSetup || false,
          apiVersioning: featureSelections.backend?.apiVersioning || false,
        },
      };
    } else {
      // Use the selected blueprint but ask for a project name
      const { projectName } = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Enter a name for your project:",
          validate: validateProjectName,
        },
      ]);

      context.config = {
        ...selectedBlueprint!.config,
        name: projectName,
      };

      console.log(chalk.green(`Using blueprint: ${selectedBlueprint!.name}`));
    }

    // Display feature summary
    displayFeatureSummary(context.config);

    // Ask for confirmation before generating
    const { confirmGeneration } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmGeneration",
        message: "Does this configuration look correct?",
        default: true,
      },
    ]);

    if (!confirmGeneration) {
      console.log(chalk.yellow("Project generation cancelled."));
      return;
    }

    // Override the default output directory if specified
    if (context.outputDir) {
      process.env.PROJECT_ROOT = context.outputDir;
    }

    await generateProject(context.config, context.dryRun);

    // Ask to save as blueprint if not using an existing blueprint and not in dry run mode
    if (!useBlueprint && !context.dryRun) {
      await handleBlueprintSaving(context.config);
    }
  } catch (error) {
    context.error = error instanceof Error ? error : new Error(String(error));
    handleFatalError("Error in project creation workflow", context.error);
  }
};

// Handle saving the configuration as a blueprint if requested
const handleBlueprintSaving = async (config: ProjectConfig): Promise<void> => {
  try {
    const { saveAsBlueprint } = await inquirer.prompt([
      {
        type: "confirm",
        name: "saveAsBlueprint",
        message:
          "Do you want to save this configuration as a blueprint for future use?",
        default: false,
      },
    ]);

    if (saveAsBlueprint) {
      const existingBlueprints = loadBlueprints();
      const { blueprintName, blueprintDescription } = await inquirer.prompt([
        {
          type: "input",
          name: "blueprintName",
          message: "Enter a name for this blueprint:",
          validate: (input) => {
            if (!input || input.trim() === "") {
              return "Blueprint name is required";
            }

            if (existingBlueprints.some((bp) => bp.name === input)) {
              return "A blueprint with this name already exists";
            }

            return true;
          },
        },
        {
          type: "input",
          name: "blueprintDescription",
          message: "Enter a description:",
          default: `${
            config.type === "web"
              ? "Web"
              : config.type === "mobile"
              ? "Mobile"
              : "Backend"
          } project with custom configuration`,
        },
      ]);

      const blueprint: Blueprint = {
        name: blueprintName,
        description: blueprintDescription,
        config: {
          type: config.type,
          features: config.features,
          stateManagement: config.stateManagement,
          themeToggle: config.themeToggle,
          apiType: config.apiType,
          backend: config.backend,
        },
        createdAt: new Date().toISOString(),
      };

      saveBlueprint(blueprint);
      console.log(
        chalk.green(`Blueprint "${blueprintName}" saved successfully!`)
      );
    }
  } catch (error) {
    console.error(chalk.red("Error saving blueprint:"), error);
    // Continue with the process even if saving blueprint fails
  }
};

/**
 * Get project configuration either from blueprint or user input
 */
const getProjectConfiguration = async (
  blueprints: Blueprint[]
): Promise<ProjectConfig | null> => {
  try {
    let config: ProjectConfig | null = null;

    // Ask if the user wants to use an existing blueprint
    if (blueprints.length > 0) {
      const { useBlueprint } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useBlueprint",
          message: "Do you want to use an existing blueprint?",
          default: false,
        },
      ]);

      if (useBlueprint) {
        const { selectedBlueprint } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedBlueprint",
            message: "Select a blueprint:",
            choices: blueprints.map((bp) => ({
              name: `${bp.name} - ${bp.description} (${new Date(
                bp.createdAt
              ).toLocaleDateString()})`,
              value: bp,
            })),
          },
        ]);

        // Ask for project name since it's not stored in the blueprint
        const { name } = await inquirer.prompt([
          {
            type: "input",
            name: "name",
            message: "Enter a project name:",
            validate: validateProjectName,
          },
        ]);

        // Create config from blueprint
        config = {
          ...selectedBlueprint.config,
          name,
        };

        console.log(chalk.green(`Using blueprint "${selectedBlueprint.name}"`));
      } else {
        // Proceed with normal configuration flow
        config = await configureProject();
      }
    } else {
      // No blueprints exist, proceed with normal configuration flow
      config = await configureProject();
    }

    return config;
  } catch (error) {
    console.error(chalk.red("Error getting project configuration:"), error);
    return null;
  }
};

/**
 * Handle saving the configuration as a blueprint if requested
 */
const handleBlueprintSaving = async (config: ProjectConfig): Promise<void> => {
  try {
    const { saveAsBlueprint } = await inquirer.prompt([
      {
        type: "confirm",
        name: "saveAsBlueprint",
        message:
          "Do you want to save this configuration as a blueprint for future use?",
        default: false,
      },
    ]);

    if (saveAsBlueprint) {
      const existingBlueprints = loadBlueprints();
      const { blueprintName, blueprintDescription } = await inquirer.prompt([
        {
          type: "input",
          name: "blueprintName",
          message: "Enter a name for this blueprint:",
          validate: (input) => validateBlueprintName(input, existingBlueprints),
        },
        {
          type: "input",
          name: "blueprintDescription",
          message: "Enter a description:",
          default: `${
            config.type === "web" ? "Web" : "Mobile"
          } project with custom configuration`,
        },
      ]);

      const blueprint: Blueprint = {
        name: blueprintName,
        description: blueprintDescription,
        config: {
          type: config.type,
          features: config.features,
          stateManagement: config.stateManagement,
          themeToggle: config.themeToggle,
          apiType: config.apiType,
          backend: config.backend,
        },
        createdAt: new Date().toISOString(),
      };

      saveBlueprint(blueprint);
    }
  } catch (error) {
    console.error(chalk.red("Error saving blueprint:"), error);
    // Continue with the process even if saving blueprint fails
  }
};

/**
 * Implementation of the list blueprints command
 */
const listBlueprintsCommand = async (): Promise<void> => {
  try {
    const blueprints = loadBlueprints();

    if (blueprints.length === 0) {
      console.log(chalk.yellow("No blueprints found."));
      return;
    }

    console.log(chalk.green.bold("\nSaved Blueprints:"));
    console.log(chalk.gray("=============================="));

    blueprints.forEach((bp, index) => {
      console.log(chalk.cyan.bold(`\n${index + 1}. ${bp.name}`));
      console.log(chalk.blue("Description:"), bp.description);
      console.log(
        chalk.blue("Created:"),
        new Date(bp.createdAt).toLocaleString()
      );
      console.log(
        chalk.blue("Project Type:"),
        bp.config.type === "web" ? "Web" : "Mobile"
      );
      console.log(
        chalk.blue("Features:"),
        Object.entries(bp.config.features)
          .filter(([_, enabled]) => enabled)
          .map(([key, _]) => key)
          .join(", ") || "None"
      );
      console.log(chalk.blue("Database:"), bp.config.backend.database);
    });

    console.log("\n");
  } catch (error) {
    handleFatalError("Error listing blueprints", error);
  }
};

/**
 * Implementation of the delete blueprint command
 */
const deleteBlueprintCommand = async (name: string): Promise<void> => {
  try {
    const blueprints = loadBlueprints();
    const filteredBlueprints = blueprints.filter((bp) => bp.name !== name);

    if (blueprints.length === filteredBlueprints.length) {
      console.log(chalk.yellow(`Blueprint "${name}" not found.`));
      return;
    }

    fs.writeFileSync(
      BLUEPRINT_FILE,
      JSON.stringify(filteredBlueprints, null, 2)
    );
    console.log(chalk.green(`Blueprint "${name}" deleted successfully!`));
  } catch (error) {
    handleFatalError("Error deleting blueprint", error);
  }
};

// Enhance the generate project function to better handle dry run mode and integration with post-generation actions
const generateProject = async (
  config: ProjectConfig,
  dryRun: boolean = false
): Promise<void> => {
  try {
    // Create the templates directory if it doesn't exist
    if (!fs.existsSync(DEFAULT_TEMPLATES_DIR) && !dryRun) {
      fs.mkdirSync(DEFAULT_TEMPLATES_DIR, { recursive: true });
    }

    // Determine the project path
    const projectPath = path.join(DEFAULT_TEMPLATES_DIR, config.name);

    // Check if project directory already exists
    if (fs.existsSync(projectPath) && !dryRun) {
      throw new Error(`Project directory already exists at ${projectPath}`);
    }

    console.log(
      chalk.blue(`\nGenerating ${config.type} project: ${config.name}`)
    );
    if (dryRun) {
      console.log(chalk.yellow("DRY RUN MODE: No files will be created"));
    }

    // Create the project directory
    console.log(chalk.blue(`\nCreating project directory: ${projectPath}`));
    if (!dryRun) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Generate project structure based on type
    if (config.type === "web" || config.type === "mobile") {
      await generateFrontendProject(config, projectPath, dryRun);
    } else {
      await generateBackendProject(config, projectPath, dryRun);
    }

    console.log(
      chalk.green(
        `\n✅ Project ${
          dryRun ? "would be" : "has been"
        } generated at: ${projectPath}`
      )
    );

    // Only perform post-generation actions if not in dry run mode
    if (!dryRun) {
      await handlePostGeneration(config, projectPath);
    } else {
      console.log(
        chalk.yellow(
          "\nDry run complete. No post-generation actions available in dry run mode."
        )
      );
    }
  } catch (error) {
    console.error(chalk.red("Error generating project:"), error);
    throw error;
  }
};

/**
 * Generate a frontend project (web or mobile)
 */
const generateFrontendProject = async (
  config: ProjectConfig,
  projectPath: string,
  dryRun: boolean
): Promise<void> => {
  try {
    // Create project structure based on type
    const structure =
      config.type === "web" ? TEMPLATE_DIRS.web : TEMPLATE_DIRS.mobile;

    // Create directories
    for (const dir of structure.root) {
      const dirPath = path.join(projectPath, dir);
      console.log(chalk.blue(`Creating directory: ${dirPath}`));
      if (!dryRun) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create files
    for (const [filePath, contentKey] of Object.entries(structure.files)) {
      const fullPath = path.join(projectPath, filePath);
      console.log(chalk.blue(`Creating file: ${fullPath}`));

      const content = getTemplateContent(contentKey, config);
      if (!dryRun) {
        fs.writeFileSync(fullPath, content);
      } else {
        console.log(
          chalk.gray(`Would write ${content.length} bytes to ${fullPath}`)
        );
      }
    }

    // Add feature-specific files based on configuration options
    await addFeatureFiles(config, projectPath, dryRun);
  } catch (error) {
    console.error(chalk.red("Error generating frontend project:"), error);
    throw error;
  }
};

/**
 * Add feature-specific files (auth, theme toggle, etc.)
 */
const addFeatureFiles = async (
  config: ProjectConfig,
  projectPath: string,
  dryRun: boolean
): Promise<void> => {
  // Add auth feature if authentication is enabled
  if (config.type === "web" && config.features.authentication) {
    // Create auth directories
    const authDirs = [
      "src/features/auth",
      "src/features/auth/components",
      "src/features/auth/services",
    ];

    for (const dir of authDirs) {
      const dirPath = path.join(projectPath, dir);
      console.log(chalk.blue(`Creating directory: ${dirPath}`));
      if (!dryRun) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create auth files
    const authFiles = {
      "src/features/auth/components/Login.tsx": "webLoginContent",
      "src/features/auth/components/RequireAuth.tsx": "webRequireAuthContent",
      "src/features/auth/index.ts": "webAuthIndexContent",
    };

    if (config.stateManagement === "redux") {
      authFiles["src/features/auth/authSlice.ts"] = "webAuthSliceContent";
      authFiles["src/lib/store.ts"] = "webStoreContent";
    } else {
      authFiles["src/features/auth/authContext.tsx"] = "webAuthContextContent";
    }

    for (const [filePath, contentKey] of Object.entries(authFiles)) {
      const fullPath = path.join(projectPath, filePath);
      console.log(chalk.blue(`Creating file: ${fullPath}`));

      const content = getTemplateContent(contentKey, config);
      if (!dryRun) {
        fs.writeFileSync(fullPath, content);
      } else {
        console.log(
          chalk.gray(`Would write ${content.length} bytes to ${fullPath}`)
        );
      }
    }
  }

  // Add theme toggle if enabled
  if (config.type === "web" && config.themeToggle) {
    const themeDirPath = path.join(projectPath, "src/lib");
    const themeFilePath = path.join(themeDirPath, "theme.tsx");

    console.log(chalk.blue(`Creating file: ${themeFilePath}`));

    const content = getTemplateContent("webThemeContent", config);
    if (!dryRun) {
      fs.writeFileSync(themeFilePath, content);
    } else {
      console.log(
        chalk.gray(`Would write ${content.length} bytes to ${themeFilePath}`)
      );
    }
  }

  // Add auth feature for mobile if authentication is enabled
  if (config.type === "mobile" && config.features.authentication) {
    // Create additional auth files for mobile
    const mobileAuthFiles = {};

    if (config.stateManagement === "redux") {
      mobileAuthFiles["features/auth/authSlice.ts"] = "mobileAuthSliceContent";
      mobileAuthFiles["lib/store.ts"] = "mobileStoreContent";
    } else {
      mobileAuthFiles["features/auth/authContext.tsx"] =
        "mobileAuthContextContent";
    }

    // Add useColorScheme for theme support
    if (config.themeToggle) {
      mobileAuthFiles["lib/useColorScheme.tsx"] = "mobileUseColorSchemeContent";
    }

    for (const [filePath, contentKey] of Object.entries(mobileAuthFiles)) {
      const fullPath = path.join(projectPath, filePath);
      console.log(chalk.blue(`Creating file: ${fullPath}`));

      const content = getTemplateContent(contentKey, config);
      if (!dryRun) {
        fs.writeFileSync(fullPath, content);
      } else {
        console.log(
          chalk.gray(`Would write ${content.length} bytes to ${fullPath}`)
        );
      }
    }

    // Create empty directory for assets/fonts
    const fontDirPath = path.join(projectPath, "assets/fonts");
    console.log(chalk.blue(`Creating directory: ${fontDirPath}`));
    if (!dryRun) {
      fs.mkdirSync(fontDirPath, { recursive: true });

      // Add placeholder font file
      const fontPath = path.join(fontDirPath, "SpaceMono-Regular.ttf");
      // In a real implementation we'd copy an actual font file here
      fs.writeFileSync(fontPath, "// This is a placeholder for a font file");
    }
  }
};

/**
 * Generate a backend project
 */
const generateBackendProject = async (
  config: ProjectConfig,
  projectPath: string,
  dryRun: boolean
): Promise<void> => {
  try {
    // Create directories
    for (const dir of TEMPLATE_DIRS.backend.root) {
      const dirPath = path.join(projectPath, dir);
      console.log(chalk.blue(`Creating directory: ${dirPath}`));
      if (!dryRun) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create files
    for (const [filePath, contentKey] of Object.entries(
      TEMPLATE_DIRS.backend.files
    )) {
      const fullPath = path.join(projectPath, filePath);
      console.log(chalk.blue(`Creating file: ${fullPath}`));

      const content = getTemplateContent(contentKey, config);
      if (!dryRun) {
        fs.writeFileSync(fullPath, content);
      } else {
        console.log(
          chalk.gray(`Would write ${content.length} bytes to ${fullPath}`)
        );
      }
    }

    // Create index.ts in services directory
    const servicesDir = path.join(projectPath, "src/services");
    const servicesIndexPath = path.join(servicesDir, "index.ts");
    console.log(chalk.blue(`Creating file: ${servicesIndexPath}`));

    if (!dryRun) {
      const content = getTemplateContent("backendAuthIndexContent", config);
      fs.writeFileSync(servicesIndexPath, content);
    } else {
      console.log(chalk.gray(`Would create services index file`));
    }
  } catch (error) {
    console.error(chalk.red("Error generating backend project:"), error);
    throw error;
  }
};

/**
 * Handle post-generation actions (install deps, open in VS Code, start server)
 */
const handlePostGeneration = async (
  config: ProjectConfig,
  projectPath: string
): Promise<void> => {
  try {
    if (config.type === "backend") {
      await handlePostGenerationActions(projectPath, "backend");
    } else {
      await handlePostGenerationActions(projectPath, config.type);

      // If frontend project has a backend subdirectory
      if (
        (config.type === "web" || config.type === "mobile") &&
        (config.features.authentication || config.features.crudSetup)
      ) {
        const backendPath = path.join(projectPath, "backend");

        if (fs.existsSync(backendPath)) {
          // Ask if user wants to set up the backend too
          const { setupBackend } = await inquirer.prompt([
            {
              type: "confirm",
              name: "setupBackend",
              message: "Do you also want to set up the backend dependencies?",
              default: true,
            },
          ]);

          if (setupBackend) {
            await handlePostGenerationActions(backendPath, "backend");
          }
        }
      }
    }
  } catch (error) {
    console.error(chalk.red("Error during post-generation actions:"), error);
    console.log(
      chalk.yellow(
        "You can still use the generated project, but you may need to set it up manually."
      )
    );
  }
};

// Start the CLI
initCLI().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
