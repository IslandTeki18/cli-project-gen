import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { ProjectConfig } from "../types";
import { logger } from "./logger";
import * as os from "os";
import { commonFilesGenerator } from "./commonFilesGenerator";

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
    files["src/features/home/Home.tsx"] = generateWebHomePage();g);
    files["src/features/home/Home.tsx"] = generateWebHomePage();
    if (config.stateManagement === "redux") {
      files["src/lib/store.ts"] = generateReduxStore(config);
    } files["src/lib/store.ts"] = generateReduxStore(config);
    }
    if (config.themeToggle) {
      files["src/lib/theme.tsx"] = generateThemeToggle(config);
    } files["src/lib/theme.tsx"] = generateThemeToggle(config);
  } else if (config.type === "mobile") {
    files["App.tsx"] = generateMobileAppFile(config);
    files["app.json"] = generateMobileAppJson(config);
    files["babel.config.js"] = generateMobileBabelConfig();
  } else if (config.type === "backend") {bileBabelConfig();
    files["src/index.ts"] = generateBackendIndexFile(config);
    files["src/config/index.ts"] = generateBackendConfig(config);
    files["src/routes/index.ts"] = generateBackendRoutes(config);
    files[".env"] = generateEnvFile(config);ackendRoutes(config);
    files[".env.example"] = generateEnvFile(config);
    files[".env.example"] = generateEnvFile(config);
    if (config.features.authentication) {
      files["src/middleware/auth.middleware.ts"] =
        generateAuthMiddleware(config);ware.ts"] =
    }   generateAuthMiddleware(config);
  } }
  }
  return files;
};return files;
};
// Content generation stub functions - in a real implementation,
// these would contain the actual content templatesplementation,
function generateReadmeContent(config: ProjectConfig): string {
  return `# ${config.name}tent(config: ProjectConfig): string {
  return `# ${config.name}
Generated with CLI Project Generator
Generated with CLI Project Generator
## Project Type
${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Application
${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Application
## Features
${Object.entries(config.features)
  .filter(([_, enabled]) => enabled)
  .map(([feature]) => `- ${feature.charAt(0).toUpperCase() + feature.slice(1)}`)
  .join("\n")}re]) => `- ${feature.charAt(0).toUpperCase() + feature.slice(1)}`)
${config.themeToggle ? "- Theme Toggle" : ""}
${config.themeToggle ? "- Theme Toggle" : ""}
## Getting Started
## Getting Started
### Installation
\`\`\`bashlation
npm install
\`\`\`stall
\`\`\`
### Development
\`\`\`bashpment
npm run dev
\`\`\`n dev
`;\`\`
};
}
/**
 * Generate .gitignore file content
 */Generate .gitignore file content
function generateGitignoreContent(): string {
  return `# DependenciesreContent(): string {
node_modules/ependencies
.pnp/modules/
.pnp.js
.pnp.js
# Build outputs
dist/ld outputs
build/
.next/
out/t/
out/
# Testing
coverage/
coverage/
# Environment variables
.envvironment variables
.env.local
.env.development.local
.env.test.localt.local
.env.production.local
.env.production.local
# Logs
logsgs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
lerna-debug.log*
# Editor directories and files
.idea/or directories and files
.vscode/
*.suode/
*.ntvs*
*.njsproj
*.slnproj
*.sw?
*.sw?
# OS files
.DS_Stores
.DS_Store?
._*_Store?
.Spotlight-V100
.Trashesht-V100
ehthumbs.db
Thumbs.dbdb
Thumbs.db
# Debug
.npmbug
.eslintcache
.node_repl_history
*.tsbuildinfostory
`;tsbuildinfo
};
}
/**
 * Generate .env file content
 * @param config Project configuration
 * @param isExample Whether this is for .env.example (hides sensitive values)
 */@param isExample Whether this is for .env.example (hides sensitive values)
function generateEnvFile(config: ProjectConfig, isExample: boolean = false): string {
  const sensitiveValue = isExample ? 'your-secret-value-here' : 'supersecretvalue123';
  const sensitiveValue = isExample ? 'your-secret-value-here' : 'supersecretvalue123';
  let content = `# Server Configuration
PORT=3000tent = `# Server Configuration
NODE_ENV=development
NODE_ENV=development
`;
`;
  // Add database connection strings
  if (config.backend.database === "mongodb") {
    content += `# Databasease === "mongodb") {
MONGODB_URI=mongodb://localhost:27017/${config.name}
MONGODB_URI=mongodb://localhost:27017/${config.name}
`;
  } else if (config.backend.database === "postgresql") {
    content += `# Databased.database === "postgresql") {
POSTGRES_HOST=localhostase
POSTGRES_PORT=5432lhost
POSTGRES_DB=${config.name}
POSTGRES_USER=postgresame}
POSTGRES_PASSWORD=${isExample ? 'your-password-here' : 'postgres'}
POSTGRES_PASSWORD=${isExample ? 'your-password-here' : 'postgres'}
`;
  }
  }
  // Add authentication variables if needed
  if (config.features.authentication) {eded
    content += `# Authenticationtion) {
JWT_SECRET=${sensitiveValue}tion
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=3030
JWT_REFRESH_EXPIRATION_DAYS=30
`;
  }
  }
  // Add API URL for front-end projects
  if (config.type === "web" || config.type === "mobile") {
    content += `# API Configurationig.type === "mobile") {
API_URL=http://localhost:3000/apion
API_TIMEOUT=30000calhost:3000/api
API_TIMEOUT=30000
`;
  }
  }
  // Add staging/production variables
  content += `# For Production/Staging (examples)
# PORT=8080= `# For Production/Staging (examples)
# API_URL=https://api.${config.name}.com
${config.features.authentication ? `# JWT_SECRET=${isExample ? 'your-production-secret' : 'production-secret-value-123'}\n` : ''}`;
${config.features.authentication ? `# JWT_SECRET=${isExample ? 'your-production-secret' : 'production-secret-value-123'}\n` : ''}`;
  return content;
} return content;
}
/**
 * Generate prettier.config.js file content
 */Generate prettier.config.js file content
function generatePrettierConfig(): string {
  return `module.exports = {fig(): string {
  printWidth: 80,exports = {
  tabWidth: 2,80,
  useTabs: false,
  semi: true,lse,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,',
  trailingComma: 'es5',,
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'avoid',alse,
  endOfLine: 'lf',oid',
  overrides: [lf',
    {rrides: [
      files: '*.md',
      options: {md',
        tabWidth: 2,
      },tabWidth: 2,
    },},
    {,
      files: '*.json',
      options: {json',
        printWidth: 200,
      },printWidth: 200,
    },},
  ],},
};],
`;
};
}
function generatePackageJson(config: ProjectConfig): string {
  const dependencies: Record<string, string> = {};): string {
  const devDependencies: Record<string, string> = {
    "typescript": "^4.9.5",Record<string, string> = {
    "prettier": "^2.8.7"typescript: "^4.9.5",
  };  };
  
  // Add type-specific dependenciesncies
  if (config.type === "web") {
    Object.assign(dependencies, {dencies, {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.10.0",react-router-dom": "^6.10.0",
    });    });

    Object.assign(devDependencies, {, {
      "@types/react": "^18.0.28",
      "@types/react-dom": "^18.0.11",@types/react-dom": "^18.0.11",
    });
  } else if (config.type === "mobile") {ile") {
    Object.assign(dependencies, {dencies, {
      expo: "~48.0.15",
      "expo-status-bar": "~1.4.4",": "~1.4.4",
      react: "18.2.0",
      "react-native": "0.71.7",react-native": "0.71.7",
    });
  } else if (config.type === "backend") {kend") {
    Object.assign(dependencies, {ncies, {
      express: "^4.18.2",.2",
      cors: "^2.8.5",
      helmet: "^6.1.5",
      dotenv: "^16.0.3",otenv: "^16.0.3",
    });    });

    Object.assign(devDependencies, {{
      "@types/express": "^4.17.17",17",
      "@types/cors": "^2.8.13",
      "@types/node": "^18.16.0",@types/node": "^18.16.0",
    }); });
  }  }

  // Add feature-specific dependencies
  if (config.features.authentication) {) {
    if (config.type === "backend") {
      dependencies["jsonwebtoken"] = "^9.0.0";.0";
      dependencies["passport"] = "^0.6.0";
      dependencies["passport-jwt"] = "^4.0.1";      dependencies["passport-jwt"] = "^4.0.1";

      devDependencies["@types/jsonwebtoken"] = "^9.0.1";1";
      devDependencies["@types/passport"] = "^1.0.12";
      devDependencies["@types/passport-jwt"] = "^3.0.8";endencies["@types/passport-jwt"] = "^3.0.8";
    } else {
      dependencies["axios"] = "^1.3.6"; dependencies["axios"] = "^1.3.6";
    } }
  }  }

  if (
    config.stateManagement === "redux" &&
    (config.type === "web" || config.type === "mobile")config.type === "web" || config.type === "mobile")
  ) {
    dependencies["@reduxjs/toolkit"] = "^1.9.5";9.5";
    dependencies["react-redux"] = "^8.0.5"; dependencies["react-redux"] = "^8.0.5";
  }  }

  // Add scripts for formatting with prettier{
  const scripts = {,
    "dev": config.type === "backend" ? "ts-node-dev --respawn src/index.ts" : 0",
           config.type === "web" ? "vite" : "expo start",rue,
    "build": config.type === "backend" ? "tsc" : s: {
            config.type === "web" ? "tsc && vite build" : "expo build",
    "start": config.type === "backend" ? "node dist/index.js" : 
            config.type === "web" ? "vite preview" : "expo start",n src/index.ts"
    "format": "prettier --write \"**/*.{js,ts,tsx,json,md}\"".type === "web"
  };
  "expo start",
  const packageJson = {
    name: config.name,pe === "backend"
    version: "0.1.0",
    private: true,b"
    scripts,build"
    dependencies,"expo build",
    devDependencies
  };"
  
  return JSON.stringify(packageJson, null, 2);= "web"
}"
    : "expo start",
// Stub implementations for remaining file generators
function generateTsConfig(config: ProjectConfig): string {
  return `{devDependencies,
  "compilerOptions": {  };
    "target": "es2018",
    "module": "${config.type === "backend" ? "commonjs" : "esnext"}", return JSON.stringify(packageJson, null, 2);
    "strict": true,}
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,nerateTsConfig(config: ProjectConfig): string {
    "outDir": "${config.type === "backend" ? "dist" : "build"}",
    "rootDir": "src"
  },
  "include": ["src"]nfig.type === "backend" ? "commonjs" : "esnext"}",
}`;
}ue,

function generateWebIndexFile(config: ProjectConfig): string {
  return `import React from 'react';fig.type === "backend" ? "dist" : "build"}",
import ReactDOM from 'react-dom/client';"rootDir": "src"
import App from './app/App';
import './index.css';include": ["src"]
${`;
  config.stateManagement === "redux"}
    ? "import { store } from './lib/store';\nimport { Provider } from 'react-redux';"
    : "": ProjectConfig): string {
}
dom/client';
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);p/App';
root.render(port './index.css';
  <React.StrictMode>
    ${config.stateManagement === "redux" ? "<Provider store={store}>" : ""}
    <App />mport { store } from './lib/store';\nimport { Provider } from 'react-redux';"
    ${config.stateManagement === "redux" ? "</Provider>" : ""}   : ""
  </React.StrictMode>}
);`;
} ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Other content generator stubs
function generateWebAppFile(config: ProjectConfig): string {g.stateManagement === "redux" ? "<Provider store={store}>" : ""}
  return `// Basic App component implementation`;
}agement === "redux" ? "</Provider>" : ""}
React.StrictMode>
function generateWebCssFile(): string {;`;
  return `/* Base styles */`;}
}

function generateWebHtmlFile(config: ProjectConfig): string {): string {
  return `<!DOCTYPE html> return `// Basic App component implementation`;
<html lang="en">}
  <head>
    <meta charset="utf-8" />: string {
    <title>${config.name}</title> return `/* Base styles */`;
  </head>}
  <body>
    <div id="root"></div>ile(config: ProjectConfig): string {
    <script type="module" src="/src/index.tsx"></script>YPE html>
  </body>ng="en">
</html>`;
}
e>${config.name}</title>
function generateWebLayoutFile(): string {>
  return `// Layout component`;
}
pt type="module" src="/src/index.tsx"></script>
function generateWebNavbarFile(config: ProjectConfig): string {
  return `// Navbar component`;/html>`;
}}

function generateWebHomePage(): string {): string {
  return `// Home page component`; return `// Layout component`;
}}

function generateReduxStore(config: ProjectConfig): string {config: ProjectConfig): string {
  return `// Redux store configuration`; return `// Navbar component`;
}}

function generateThemeToggle(config: ProjectConfig): string {ring {
  return `// Theme toggle implementation`; return `// Home page component`;
}}

function generateMobileAppFile(config: ProjectConfig): string {ectConfig): string {
  return `// Mobile App entry point`; return `// Redux store configuration`;
}}

function generateMobileAppJson(config: ProjectConfig): string {ctConfig): string {
  return JSON.stringify( return `// Theme toggle implementation`;
    { name: config.name, displayName: config.name },}
    null,
    2: ProjectConfig): string {
  ); return `// Mobile App entry point`;
}}

function generateMobileBabelConfig(): string {ppJson(config: ProjectConfig): string {
  return `module.exports = function(api) {
  api.cache(true);e: config.name, displayName: config.name },
  return {ull,
    presets: ['babel-preset-expo']2
  }; );
};`;}
}
ng {
function generateBackendIndexFile(config: ProjectConfig): string {xports = function(api) {
  return `// Backend entry point`;e(true);
}
presets: ['babel-preset-expo']
function generateBackendConfig(config: ProjectConfig): string {
  return `// Backend configuration`;;`;
}}

function generateBackendRoutes(config: ProjectConfig): string {config: ProjectConfig): string {
  return `// API routes`; return `// Backend entry point`;
}}

function generateAuthMiddleware(config: ProjectConfig): string {g: ProjectConfig): string {
  return `// Authentication middleware`; return `// Backend configuration`;
}}
