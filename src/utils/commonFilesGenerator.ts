import { ProjectConfig } from "../types";

/**
 * Generates common project configuration files
 */
export const commonFilesGenerator = {
  /**
   * Generate .env file with environment variables
   */
  generateEnvFile: (
    config: ProjectConfig,
    isExample: boolean = false
  ): string => {
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
    } else if (config.backend.database === "postgres") {
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

    // Add feature flags
    content += `# Feature Flags
ENABLE_LOGGING=true
${config.features.authentication ? "ENABLE_AUTH=true\n" : ""}
${config.features.crudSetup ? "ENABLE_CRUD_API=true\n" : ""}

`;

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
  },

  /**
   * Generate .gitignore file content
   */
  generateGitignoreContent: (): string => {
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
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
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
.npm
.eslintcache
.node_repl_history
*.tsbuildinfo
`;
  },

  /**
   * Generate prettier.config.js file content
   */
  generatePrettierConfig: (): string => {
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
  },
};
