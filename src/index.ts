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
    // Add missing template definitions as needed
    webLoginContent: () => `import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state or default to homepage
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Demo authentication - in a real app, you would make an API call
    if (email === 'demo@example.com' && password === 'password') {
      // Successful login
      navigate(from, { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign In
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Demo credentials: demo@example.com / password
        </p>
      </div>
    </div>
  );
};

export default Login;`,

    webRequireAuthContent: () => `import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Import authentication context or hook based on state management choice
// This should be replaced with actual implementation
const useAuth = () => {
  // This is a mock implementation
  return {
    isAuthenticated: false
  };
};

interface RequireAuthProps {
  children: JSX.Element;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to the login page but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;`,

    webAuthIndexContent: () => `// Export all auth-related components and hooks
export { default as Login } from './components/Login';
export { default as RequireAuth } from './components/RequireAuth';
`,

    backendAuthIndexContent: () => `// Export service functions
export * from './auth.service';
export * from './user.service';
`,

    webAuthSliceContent:
      () => `import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/lib/store';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;`,

    webStoreContent: () => `import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more reducers as needed
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`,

    webAuthContextContent:
      () => `import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock login function - in a real app, this would make an API call
  const login = async (email: string, password: string) => {
    // Demo login
    if (email === 'demo@example.com' && password === 'password') {
      const userData = {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
      };
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};`,

    webThemeContent:
      () => `import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from local storage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Use system preference as fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Update body class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};`,
  };

  return templates[contentKey] ? templates[contentKey](config) : "";
};

// Define project template directories
const TEMPLATE_DIRS = {
  web: {
    root: [
      "src",
      "src/app",
      "src/features",
      "src/features/home",
      "src/shared",
      "src/lib",
      "public",
    ],
    files: {
      "src/index.tsx": "webIndexContent",
      "src/index.css": "webCssContent",
      "src/app/App.tsx": "webAppContent",
      "src/features/home/Home.tsx": "webHomeContent",
      "src/shared/Layout.tsx": "webLayoutContent",
      "src/shared/Navbar.tsx": "webNavbarContent",
    },
  },
  mobile: {
    root: [
      "src",
      "src/app",
      "src/features",
      "src/features/home",
      "src/shared",
      "src/lib",
      "assets",
    ],
    files: {
      // Define mobile template files
    },
  },
  backend: {
    root: [
      "src",
      "src/config",
      "src/controllers",
      "src/middleware",
      "src/models",
      "src/routes",
      "src/services",
      "src/utils",
    ],
    files: {
      "src/index.ts": "backendIndexContent",
      "src/config/index.ts": "backendConfigContent",
      "src/config/database.ts": "backendDatabaseContent",
      "src/config/passport.ts": "backendPassportContent",
    },
  },
};

// Function to configure a new project from user input
const configureProject = async (): Promise<ProjectConfig> => {
  // Get project type
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

  // Get feature selections
  const featureSelections = await promptForFeatures(projectType);

  // Get project name
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter a name for your project:",
      validate: validateProjectName,
    },
  ]);

  return {
    type: projectType,
    name: projectName,
    features: {
      authentication: featureSelections.features?.authentication || false,
      userProfiles: featureSelections.features?.userProfiles || false,
      userSettings: featureSelections.features?.userSettings || false,
      responsiveLayout: featureSelections.features?.responsiveLayout || false,
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
};

/**
 * Handle post-generation actions (install deps, open in VS Code, start server)
 */
const handlePostGenerationActions = async (
  projectPath: string,
  projectType: string
): Promise<void> => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do next?",
      choices: [
        { name: "Install dependencies", value: "install" },
        { name: "Open in VS Code", value: "vscode" },
        { name: "Do nothing", value: "nothing" },
      ],
    },
  ]);

  switch (action) {
    case "install":
      console.log(chalk.blue("\nInstalling dependencies..."));
      try {
        // Change to project directory and run npm install
        process.chdir(projectPath);
        const child = spawn("npm", ["install"], { stdio: "inherit" });

        await new Promise((resolve, reject) => {
          child.on("close", (code) => {
            if (code === 0) {
              console.log(
                chalk.green("\n✅ Dependencies installed successfully!")
              );
              resolve(null);
            } else {
              console.error(chalk.red("\n❌ Failed to install dependencies."));
              reject(new Error(`npm install exited with code ${code}`));
            }
          });
        });
      } catch (error) {
        console.error(chalk.red("\nError installing dependencies:"), error);
      }
      break;

    case "vscode":
      console.log(chalk.blue("\nOpening project in VS Code..."));
      try {
        await execAsync(`code ${projectPath}`);
        console.log(chalk.green("✅ Project opened in VS Code!"));
      } catch (error) {
        console.error(
          chalk.red("\nError opening VS Code:"),
          "Make sure VS Code is installed and the 'code' command is in your PATH."
        );
      }
      break;

    default:
      console.log(chalk.blue("\nYou can now:"));
      console.log(chalk.gray(`- cd ${projectPath}`));
      console.log(chalk.gray("- npm install"));
      console.log(chalk.gray("- npm start"));
      break;
  }
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
            validate: (input) =>
              validateBlueprintName(input, existingBlueprints),
          },
          {
            type: "input",
            name: "blueprintDescription",
            message: "Enter a description:",
            default: `${
              context.config!.type === "web"
                ? "Web"
                : context.config!.type === "mobile"
                ? "Mobile"
                : "Backend"
            } project with custom configuration`,
          },
        ]);

        const blueprint: Blueprint = {
          name: blueprintName,
          description: blueprintDescription,
          config: {
            type: context.config!.type,
            features: context.config!.features,
            stateManagement: context.config!.stateManagement,
            themeToggle: context.config!.themeToggle,
            apiType: context.config!.apiType,
            backend: context.config!.backend,
          },
          createdAt: new Date().toISOString(),
        };

        saveBlueprint(blueprint);
      }
    }
  } catch (error) {
    context.error = error instanceof Error ? error : new Error(String(error));
    handleFatalError("Error in project creation workflow", context.error);
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

// Start the CLI
initCLI().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
