# TODO Checklist – CLI Project Generator

## Project Initialization & Setup
- [x] **Initialize Project**
  - [x] Run `npm init` to create a new npm project.
  - [x] Install TypeScript and necessary dependencies.
- [x] **TypeScript Setup**
  - [x] Create a `tsconfig.json` with sensible defaults.
  - [x] Set up scripts in `package.json` for building and running the project.
- [x] **CLI Entry Point**
  - [x] Create `src/index.ts` as the CLI entry point.
  - [x] Set up a command-line argument parser (commander or yargs).
  - [x] Define CLI flags: `--dry-run`, `--config`, `--blueprint`.
  - [x] Integrate a color library (e.g., chalk) for stylized logging.
  - [x] Output “CLI initialized” message on startup.

## Interactive CLI Prompts
- [x] **Prompt for Core Project Data**
  - [x] Prompt for project type: Web (React + TailwindCSS) or Mobile (Expo + NativeWind).
  - [x] Prompt for project name; validate valid folder names.
  - [x] Store responses in a shared configuration object.
- [x] **Feature Selection Prompts**
  - [x] Prompt for feature selection:
    - [x] Authentication
    - [x] User profiles
    - [x] User settings
    - [x] Responsive layout
    - [x] CRUD setup
    - [x] State management (Redux vs Context)
    - [x] Light/Dark theme toggle
    - [x] API choice (REST vs GraphQL)
  - [x] Summarize selected features with stylized output.
- [x] **Backend Stack & Blueprints**
  - [x] Prompt for backend stack choices:
    - [x] MongoDB or PostgreSQL
    - [x] REST vs GraphQL API
    - [x] Role-based auth, JWT, and API versioning
  - [x] Offer option to select a saved blueprint.
  - [x] Implement saving current configuration as a blueprint (save to `~/.mycli/blueprints.json`).

## File & Directory Generation Infrastructure
- [ ] **General File Generation**
  - [ ] Create output directory based on a fixed root folder (e.g., `~/dev/templates/`).
  - [ ] Create subdirectory named after the project name.
  - [ ] Implement dry-run mode to simulate file generation.
- [ ] **Generate Common Files**
  - [ ] Create `.env` file with default variables (PORT, DB URIs, JWT_SECRET, API_URL).
  - [ ] Create `.gitignore` file with basic ignore rules.
  - [ ] Create `prettier.config.js` with preferred configuration.
- [ ] **Project Structure Generation**
  - [ ] **Web App (Hybrid) Structure**
    - [ ] Create folders: `/public`, `/src/app`, `/src/features`, `/src/shared`, `/src/lib`, `/src/utils`.
    - [ ] Create a starter `src/index.tsx`.
  - [ ] **Mobile App (Expo-Optimized) Structure**
    - [ ] Create folders: `/app`, `/components`, `/features`, `/assets`, `/lib`.
  - [ ] **Backend Project Structure (Node/Express)**
    - [ ] Create folders: `/src/config`, `/src/controllers`, `/src/middleware`, `/src/models`, `/src/routes`, `/src/services`, `/src/utils`.
    - [ ] Create starter file `src/index.ts`.

## Scaffolding for Each Generated Project
- [ ] **Frontend – Web Application Boilerplate**
  - [ ] Initialize a minimal React + TypeScript app.
  - [ ] Set up TailwindCSS integration.
  - [ ] Integrate React Router with a placeholder Home page.
  - [ ] Create a sample feature directory (e.g., `/src/features/auth`):
    - [ ] Minimal login form component.
    - [ ] Placeholder service functions.
    - [ ] State management wiring (Redux or Context based on input).
  - [ ] Configure absolute imports (alias e.g., `@/features`).
- [ ] **Frontend – Mobile Application Boilerplate**
  - [ ] Initialize a minimal Expo app with TypeScript.
  - [ ] Set up NativeWind for styling.
  - [ ] Implement Expo Router with at least one placeholder screen.
  - [ ] Create a sample feature directory (e.g., `/features/auth`):
    - [ ] Minimal login screen component.
    - [ ] Placeholder service functions.
    - [ ] Basic state management integration.
  - [ ] Configure absolute imports.
- [ ] **Backend Boilerplate Generation**
  - [ ] Set up an Express server using TypeScript.
  - [ ] Read port and DB configuration from the generated `.env` file.
  - [ ] Implement connection placeholders for both MongoDB and PostgreSQL.
  - [ ] Create auth endpoints (login, register) with JWT-based auth.
  - [ ] Implement role-based auth middleware and API versioning.
  - [ ] Generate placeholder controllers, models, and a CRUD resource.
  - [ ] Ensure a configuration module is in place to read environment variables.

## Post-Generation Actions
- [ ] **Post-Generation Prompts**
  - [ ] Prompt to run `npm install` in the generated projects.
  - [ ] Prompt to open the project in VS Code.
  - [ ] Prompt to start the development servers for frontend and backend.
  - [ ] Wire these commands to their respective directories with error handling.

## CLI Update Mechanism & Final Integration
- [ ] **Update Mechanism**
  - [ ] Implement a simple mechanism to check for newer CLI versions.
  - [ ] Prompt the user with the option to update.
- [ ] **Final Integration & Wiring**
  - [ ] Integrate all CLI prompt flows, configuration object, and blueprint management.
  - [ ] Validate dry-run mode by ensuring no files are written.
  - [ ] Ensure all error handling and logging are integrated.
  - [ ] Perform final tests to make sure every component calls the next, eliminating orphaned code.

## Testing & Manual Verification
- [ ] **Local Testing**
  - [ ] Run the CLI in dry-run mode to verify interactive prompts.
  - [ ] Verify the generated folder structure and file contents for Web, Mobile, and Backend.
  - [ ] Test post-generation commands (dependency installation, VS Code open, server start).
- [ ] **Error Handling**
  - [ ] Simulate errors (e.g., invalid project name, file system failures) and verify proper error logs.
- [ ] **Documentation**
  - [ ] Document usage instructions and include in README file.
  - [ ] Include any troubleshooting notes.