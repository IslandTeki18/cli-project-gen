# CLI Project Generator Commands

This document lists all available commands for the CLI Project Generator tool.

## Core Commands

### Generate a New Project

```bash
generate-project new <project-name> [options]
```

Creates a new project with the specified name.

**Options:**

- `--type`, `-t`: Project type (e.g., node, react, vue)
- `--template`, `-T`: Specific template to use
- `--output`, `-o`: Custom output directory
- `--git`, `-g`: Initialize git repository (default: true)
- `--install`, `-i`: Install dependencies after creation (default: true)

**Examples:**

```bash
# Create a basic Node.js project
generate-project new my-node-app --type node

# Create a React project with TypeScript template
generate-project new my-react-app --type react --template typescript

# Create a project without initializing git
generate-project new my-project --git false
```

### List Available Templates

```bash
generate-project list-templates
```

Displays all available project templates.

**Options:**

- `--type`, `-t`: Filter templates by project type

**Example:**

```bash
# List all templates
generate-project list-templates

# List only React templates
generate-project list-templates --type react
```

### Add Component/Module to Project

```bash
generate-project add <component-type> <name> [options]
```

Adds a new component or module to an existing project.

**Component Types:**

- `component`: UI component
- `model`: Data model
- `service`: Service module
- `util`: Utility function

**Options:**

- `--path`, `-p`: Custom path for the new component
- `--test`, `-t`: Generate test files (default: true)

**Examples:**

```bash
# Add a new component
generate-project add component Button

# Add a new service with custom path
generate-project add service AuthService --path src/services
```

## Configuration Commands

### Initialize Configuration

```bash
generate-project init-config
```

Creates or resets the configuration file.

### Show Current Configuration

```bash
generate-project config
```

Displays the current configuration settings.

### Set Configuration

```bash
generate-project config set <key> <value>
```

Updates a specific configuration setting.

**Example:**

```bash
# Set default project type
generate-project config set defaultType react
```

## Utility Commands

### Update CLI Tool

```bash
generate-project update
```

Updates the CLI tool to the latest version.

### Version Information

```bash
generate-project --version
```

Shows the current version of the CLI tool.

### Help

```bash
generate-project --help
```

Displays help information about commands.

For specific command help:

```bash
generate-project <command> --help
```
