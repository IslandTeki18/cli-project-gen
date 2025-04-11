# CLI Project Generator

A powerful command-line tool for generating fully-structured web and mobile project scaffolding with TypeScript support.

## Features

- Generate complete starter projects for Web (React + TypeScript) or Mobile (Expo + React Native)
- Configure backend API with MongoDB or PostgreSQL database support
- Automatically set up frontend-backend communication with proper configurations
- Save your favorite project configurations as blueprints for reuse
- Comprehensive scaffolding with best practices baked in
- Well-organized project structure with separate frontend and backend

## Installation

### Global Installation (Recommended)

To use the CLI tool globally:

```bash
# Install globally
npm install -g cli-project-generator

# Run the tool
project-generator
```

### Local Development

For contributing to the project or local testing:

```bash
# Clone the repository
git clone https://github.com/your-username/cli-project-generator.git

# Navigate to project directory
cd cli-project-generator

# Install dependencies
npm install

# Link the project for global use
npm link

# Or run directly
npm start
```

## Usage

### Basic Usage

```bash
# Run with interactive prompts
project-generator

# Use a saved blueprint
project-generator -b my-blueprint

# Generate without writing files (dry run)
project-generator -d
```

### Command-line Options

| Option                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `-b, --blueprint <name>` | Use a saved blueprint                          |
| `-d, --dry-run`          | Simulate file generation without writing files |
| `-c, --config <path>`    | Path to custom configuration file              |
| `--help`                 | Display help information                       |
| `--version`              | Display version information                    |

## Project Structure

The generated project will have the following structure:

```
project-name/
├── frontend/                # React frontend application
│   ├── public/              # Public assets
│   ├── src/                 # Source files
│   │   ├── app/             # App-specific components
│   │   ├── components/      # Shared components
│   │   ├── features/        # Feature-specific components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── index.tsx        # Main entry point
│   ├── .env                 # Environment variables
│   ├── package.json         # Frontend dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build configuration
│
├── backend/                 # Express backend API
│   ├── src/                 # Source files
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Main entry point
│   ├── .env                 # Environment variables
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
├── .env                     # Root environment variables
├── .gitignore               # Git ignore file
├── package.json             # Workspace configuration
└── README.md                # Project documentation
```

## Blueprints

Blueprints allow you to save and reuse project configurations:

1. Configure your project using the interactive prompts
2. Choose to save your configuration as a blueprint
3. Reuse the blueprint in future projects with the `-b` flag

Blueprints are stored in `~/.mycli/blueprints.json`.

## Configuration Options

### Project Types

- **Web**: React + TypeScript + Vite with TailwindCSS
- **Mobile**: Expo + React Native with NativeWind

### Backend Options

- **Database**: MongoDB or PostgreSQL
- **API Style**: REST or GraphQL
- **Authentication**: JWT and/or Role-based
- **API Versioning**: Enable/disable versioned endpoints

## Development

### Building the Project

```bash
# Build the project
npm run build

# Run tests
npm test
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Commander.js](https://github.com/tj/commander.js/) for CLI argument parsing
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts
- [Chalk](https://github.com/chalk/chalk) for terminal styling
