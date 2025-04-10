import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { ProjectConfig } from "../types";
import { logger } from "./logger";
import * as os from "os";
import { commonFilesGenerator } from "./commonFilesGenerator";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Get template content function is defined in the main index.ts file
// So we'll access it through this declaration
declare function getTemplateContent(
  contentKey: string,
  config: ProjectConfig
): string;

const DEFAULT_TEMPLATES_DIR = path.join(os.homedir(), "dev", "templates");

export const generateProject = async (
  config: ProjectConfig,
  dryRun: boolean = false
): Promise<void> => {
  try {
    // Create the templates directory if it doesn't exist
    if (!fs.existsSync(DEFAULT_TEMPLATES_DIR) && !dryRun) {
      logger.info(`Creating templates directory: ${DEFAULT_TEMPLATES_DIR}`);
      fs.mkdirSync(DEFAULT_TEMPLATES_DIR, { recursive: true });
    }

    // Determine the project path
    const projectPath = path.join(DEFAULT_TEMPLATES_DIR, config.name);

    // Check if project directory already exists
    if (fs.existsSync(projectPath) && !dryRun) {
      throw new Error(`Project directory already exists at ${projectPath}`);
    }

    logger.info(`\nGenerating ${config.type} project: ${config.name}`);
    if (dryRun) {
      console.log(chalk.yellow("DRY RUN MODE: No files will be created"));
    }

    // Create the project directory
    logger.info(`Creating project directory: ${projectPath}`);
    if (!dryRun) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Generate directory structure based on project type
    await createProjectStructure(config, projectPath, dryRun);

    const actionText = dryRun ? "would be" : "has been";
    logger.success(`\n✅ Project ${actionText} generated at: ${projectPath}`);

    return;
  } catch (error) {
    console.error(chalk.red("Error generating project:"), error);
    throw error;
  }
};

/**
 * Create the project directory structure and files
 */
const createProjectStructure = async (
  config: ProjectConfig,
  projectPath: string,
  dryRun: boolean
): Promise<void> => {
  const directories = getProjectDirectories(config);
  const files = getProjectFiles(config);

  // Create directories
  for (const dir of directories) {
    const dirPath = path.join(projectPath, dir);
    console.log(chalk.blue(`Creating directory: ${dirPath}`));
    if (!dryRun) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Create files
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectPath, filePath);
    console.log(chalk.blue(`Creating file: ${fullPath}`));

    if (!dryRun) {
      // Ensure the directory exists (for nested files)
      const dirName = path.dirname(fullPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    } else {
      // In dry run mode, log a limited preview of the content
      const contentPreview =
        content.length > 50 ? `${content.substring(0, 50)}...` : content;
      console.log(chalk.gray(`  Content preview: ${contentPreview}`));
    }
  }
};

/**
 * Get project directories based on project type and features
 */
const getProjectDirectories = (config: ProjectConfig): string[] => {
  const dirs: string[] = ["src", "docs"];

  if (config.type === "web") {
    dirs.push(
      "public",
      "src/app",
      "src/features",
      "src/shared",
      "src/lib",
      "src/assets",
      "src/assets/images",
      "src/assets/styles"
    );

    // Add feature-specific directories
    if (config.features.authentication) {
      dirs.push(
        "src/features/auth",
        "src/features/auth/components",
        "src.features/auth/services"
      );
    }

    if (config.features.userProfiles) {
      dirs.push("src/features/profiles", "src/features/profiles/components");
    }

    if (config.features.crudSetup) {
      dirs.push("src/features/data", "src/features/data/services");
    }

    dirs.push("src/features/home");
  } else if (config.type === "mobile") {
    dirs.push(
      "assets",
      "src/app",
      "src/components",
      "src/features",
      "src/navigation",
      "src/lib",
      "assets/images"
    );
  } else if (config.type === "backend") {
    dirs.push(
      "src/config",
      "src/controllers",
      "src/middleware",
      "src/models",
      "src/routes",
      "src/services",
      "src/utils",
      "tests"
    );

    if (config.backend.apiVersioning) {
      dirs.push("src/routes/v1");
    }
  }

  return dirs;
};

/**
 * Get project files based on project type and features
 */
const getProjectFiles = (config: ProjectConfig): Record<string, string> => {
  const files: Record<string, string> = {};

  // Common files for all project types
  files["README.md"] = generateReadmeContent(config);
  files[".gitignore"] = commonFilesGenerator.generateGitignoreContent();
  files[".env"] = commonFilesGenerator.generateEnvFile(config);
  files[".env.example"] = commonFilesGenerator.generateEnvFile(config, true);
  files["prettier.config.js"] = commonFilesGenerator.generatePrettierConfig();
  files["package.json"] = generatePackageJson(config);
  files["tsconfig.json"] = generateTsConfig(config);

  // Type-specific files
  if (config.type === "web") {
    files["src/index.tsx"] = generateWebIndexFile(config);
    files["src/app/App.tsx"] = generateWebAppFile(config);
    files["src/index.css"] = generateWebCssFile();
    files["src/shared/Layout.tsx"] = generateWebLayoutFile();
    files["src/shared/Navbar.tsx"] = generateWebNavbarFile(config);
    files["src/features/home/Home.tsx"] = generateWebHomePage();
    if (config.stateManagement === "redux") {
      files["src/lib/store.ts"] = generateReduxStore(config);
    }
    if (config.themeToggle) {
      files["src/lib/theme.tsx"] = generateThemeToggle(config);
    }
  } else if (config.type === "mobile") {
    files["App.tsx"] = generateMobileAppFile(config);
    files["app.json"] = generateMobileAppJson(config);
    files["babel.config.js"] = generateMobileBabelConfig();
  } else if (config.type === "backend") {
    files["src/index.ts"] = generateBackendIndexFile(config);
    files["src/config/index.ts"] = generateBackendConfig(config);
    files["src/routes/index.ts"] = generateBackendRoutes(config);
    if (config.features.authentication) {
      files["src/middleware/auth.middleware.ts"] =
        generateAuthMiddleware(config);
    }
  }
  return files;
};

// Content generation stub functions - in a real implementation,
// these would contain the actual content templates
function generateReadmeContent(config: ProjectConfig): string {
  return `# ${config.name}
Generated with CLI Project Generator
## Project Type
${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Application
## Features
${Object.entries(config.features)
  .filter(([_, enabled]) => enabled)
  .map(([feature]) => `- ${feature.charAt(0).toUpperCase() + feature.slice(1)}`)
  .join("\n")}
${config.themeToggle ? "- Theme Toggle" : ""}
## Getting Started
### Installation
\`\`\`bash
npm install
\`\`\`
### Development
\`\`\`bash
npm run dev
\`\`\`
`;
}

/**
 * Generate .gitignore file content
 */
function generateGitignoreContent(): string {
  return `# Dependencies
node_modules/
.pnp/
.pnp.js
# Build outputs
dist/
build/
.next/
out/
# Testing
coverage/
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
# Debug
npm-debug.log*
.eslintcache
.node_repl_history
*.tsbuildinfo
`;
}

/**
 * Generate .env file content
 * @param config Project configuration
 * @param isExample Whether this is for .env.example (hides sensitive values)
 */
function generateEnvFile(
  config: ProjectConfig,
  isExample: boolean = false
): string {
  const sensitiveValue = isExample
    ? "your-secret-value-here"
    : "supersecretvalue123";
  let content = `# Server Configuration
PORT=3000
NODE_ENV=development
`;
  // Add database connection strings
  if (config.backend.database === "mongodb") {
    content += `# Database
MONGODB_URI=mongodb://localhost:27017/${config.name}
`;
  } else if (config.backend.database === "postgresql") {
    content += `# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=${config.name}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${isExample ? "your-password-here" : "postgres"}
`;
  }
  // Add authentication variables if needed
  if (config.features.authentication) {
    content += `# Authentication
JWT_SECRET=${sensitiveValue}
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
`;
  }
  // Add API URL for front-end projects
  if (config.type === "web" || config.type === "mobile") {
    content += `# API Configuration
API_URL=http://localhost:3000/api
API_TIMEOUT=30000
`;
  }
  // Add staging/production variables
  content += `# For Production/Staging (examples)
# PORT=8080
# API_URL=https://api.${config.name}.com
${
  config.features.authentication
    ? `# JWT_SECRET=${
        isExample ? "your-production-secret" : "production-secret-value-123"
      }\n`
    : ""
}`;
  return content;
}

/**
 * Generate prettier.config.js file content
 */
function generatePrettierConfig(): string {
  return `module.exports = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.md',
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
  ],
};
`;
}

function generatePackageJson(config: ProjectConfig): string {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {
    typescript: "^4.9.5",
    prettier: "^2.8.7",
  };

  // Add type-specific dependencies
  if (config.type === "web") {
    Object.assign(dependencies, {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.10.0",
    });

    Object.assign(devDependencies, {
      "@types/react": "^18.0.28",
      "@types/react-dom": "^18.0.11",
    });
  } else if (config.type === "mobile") {
    Object.assign(dependencies, {
      expo: "~48.0.15",
      "expo-status-bar": "~1.4.4",
      react: "18.2.0",
      "react-native": "0.71.7",
    });
  } else if (config.type === "backend") {
    Object.assign(dependencies, {
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^6.1.5",
      dotenv: "^16.0.3",
    });

    Object.assign(devDependencies, {
      "@types/express": "^4.17.17",
      "@types/cors": "^2.8.13",
      "@types/node": "^18.16.0",
    });
  }

  // Add feature-specific dependencies
  if (config.features.authentication) {
    if (config.type === "backend") {
      dependencies["jsonwebtoken"] = "^9.0.0";
      dependencies["passport"] = "^0.6.0";
      dependencies["passport-jwt"] = "^4.0.1";

      devDependencies["@types/jsonwebtoken"] = "^9.0.1";
      devDependencies["@types/passport"] = "^1.0.12";
      devDependencies["@types/passport-jwt"] = "^3.0.8";
    } else {
      dependencies["axios"] = "^1.3.6";
    }
  }

  if (
    config.stateManagement === "redux" &&
    (config.type === "web" || config.type === "mobile")
  ) {
    dependencies["@reduxjs/toolkit"] = "^1.9.5";
    dependencies["react-redux"] = "^8.0.5";
  }

  // Add scripts for formatting with prettier
  const scripts = {
    dev:
      config.type === "backend"
        ? "ts-node-dev --respawn src/index.ts"
        : config.type === "web"
        ? "vite"
        : "expo start",
    build:
      config.type === "backend"
        ? "tsc"
        : config.type === "web"
        ? "tsc && vite build"
        : "expo build",
    start:
      config.type === "backend"
        ? "node dist/index.js"
        : config.type === "web"
        ? "vite preview"
        : "expo start",
    format: 'prettier --write "**/*.{js,ts,tsx,json,md}"',
  };

  const packageJson = {
    name: config.name,
    version: "0.1.0",
    private: true,
    scripts,
    dependencies,
    devDependencies,
  };

  return JSON.stringify(packageJson, null, 2);
}

// Stub implementations for remaining file generators
function generateTsConfig(config: ProjectConfig): string {
  return `{
  "compilerOptions": {
    "target": "es2018",
    "module": "${config.type === "backend" ? "commonjs" : "esnext"}",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "${config.type === "backend" ? "dist" : "build"}",
    "rootDir": "src"
  },
  "include": ["src"]
}`;
}

function generateWebIndexFile(config: ProjectConfig): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';
${
  config.stateManagement === "redux"
    ? "import { store } from './lib/store';\nimport { Provider } from 'react-redux';"
    : ""
}
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    ${config.stateManagement === "redux" ? "<Provider store={store}>" : ""}
    <App />
    ${config.stateManagement === "redux" ? "</Provider>" : ""}
  </React.StrictMode>
);
`;
}

// Other content generator stubs
function generateWebAppFile(config: ProjectConfig): string {
  return `// Basic App component implementation`;
}

function generateWebCssFile(): string {
  return `/* Base styles */`;
}

function generateWebHtmlFile(config: ProjectConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`;
}

function generateWebLayoutFile(): string {
  return `// Layout component`;
}

function generateWebNavbarFile(config: ProjectConfig): string {
  return `// Navbar component`;
}

function generateWebHomePage(): string {
  return `// Home page component`;
}

function generateReduxStore(config: ProjectConfig): string {
  return `// Redux store configuration`;
}

function generateThemeToggle(config: ProjectConfig): string {
  return `// Theme toggle implementation`;
}

function generateMobileAppFile(config: ProjectConfig): string {
  return `// Mobile App entry point`;
}

function generateMobileAppJson(config: ProjectConfig): string {
  return JSON.stringify(
    { name: config.name, displayName: config.name },
    null,
    2
  );
}

function generateMobileBabelConfig(): string {
  return `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
  };
};`;
}

function generateBackendIndexFile(config: ProjectConfig): string {
  return `// Backend entry point`;
}

function generateBackendConfig(config: ProjectConfig): string {
  return `// Backend configuration`;
}

function generateBackendRoutes(config: ProjectConfig): string {
  return `// API routes`;
}

function generateAuthMiddleware(config: ProjectConfig): string {
  return `// Authentication middleware`;
}
