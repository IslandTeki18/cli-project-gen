# CLI Project Generator

A command-line tool for generating full-stack projects with customizable features.

## Installation

To install the CLI tool locally for development:

```bash
# Clone the repository
git clone <repository-url>
cd cli-project-generator

# Install dependencies
npm install

# Build the project
npm run build

# Link the package locally
npm link
```

## Usage

Once installed, you can use the CLI tool with the following commands:

```bash
# Create a new project
project-gen create

# List saved blueprints
project-gen list-blueprints

# Delete a saved blueprint
project-gen delete-blueprint <name>
```

## Features

- Generate web, mobile, or backend projects
- Customize project features (authentication, user profiles, etc.)
- Choose state management solutions
- Pick API architecture and database
- Save and reuse project configurations as blueprints

## Development

To run the project in development mode:

```bash
npm run dev
```

## Testing

To manually test:

```bash
# Build the project
npm run build

# Link the package locally
npm link

# Run the CLI
project-gen create
```

## License

MIT
