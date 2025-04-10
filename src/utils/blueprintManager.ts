import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { Blueprint } from "../types";

const BLUEPRINT_DIR = path.join(require("os").homedir(), ".mycli");
const BLUEPRINT_FILE = path.join(BLUEPRINT_DIR, "blueprints.json");

export const ensureBlueprintDir = (): void => {
  if (!fs.existsSync(BLUEPRINT_DIR)) {
    fs.mkdirSync(BLUEPRINT_DIR, { recursive: true });
  }

  if (!fs.existsSync(BLUEPRINT_FILE)) {
    fs.writeFileSync(BLUEPRINT_FILE, JSON.stringify([], null, 2));
  }
};

export const loadBlueprints = (): Blueprint[] => {
  ensureBlueprintDir();
  try {
    const data = fs.readFileSync(BLUEPRINT_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("Error loading blueprints:"), error);
    return [];
  }
};

export const saveBlueprint = (blueprint: Blueprint): void => {
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

/**
 * Get a specific blueprint by name
 */
export const getBlueprintByName = (name: string): Blueprint | undefined => {
  const blueprints = loadBlueprints();
  return blueprints.find((bp) => bp.name === name);
};

/**
 * Update an existing blueprint
 */
export const updateBlueprint = (
  name: string,
  updatedBlueprint: Blueprint
): boolean => {
  ensureBlueprintDir();
  try {
    const blueprints = loadBlueprints();
    const index = blueprints.findIndex((bp) => bp.name === name);

    if (index === -1) {
      return false;
    }

    blueprints[index] = updatedBlueprint;
    fs.writeFileSync(BLUEPRINT_FILE, JSON.stringify(blueprints, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red("Error updating blueprint:"), error);
    return false;
  }
};

/**
 * Delete a blueprint by name
 */
export const deleteBlueprint = (name: string): boolean => {
  ensureBlueprintDir();
  try {
    const blueprints = loadBlueprints();
    const filteredBlueprints = blueprints.filter((bp) => bp.name !== name);

    if (filteredBlueprints.length === blueprints.length) {
      return false; // No blueprint was removed
    }

    fs.writeFileSync(
      BLUEPRINT_FILE,
      JSON.stringify(filteredBlueprints, null, 2)
    );
    return true;
  } catch (error) {
    console.error(chalk.red("Error deleting blueprint:"), error);
    return false;
  }
};

/**
 * Export blueprints to a file
 */
export const exportBlueprints = (filePath: string): boolean => {
  try {
    const blueprints = loadBlueprints();
    fs.writeFileSync(filePath, JSON.stringify(blueprints, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red("Error exporting blueprints:"), error);
    return false;
  }
};

/**
 * Import blueprints from a file
 * @param filePath Path to the JSON file containing blueprints
 * @param overwrite Whether to overwrite existing blueprints with the same names
 */
export const importBlueprints = (
  filePath: string,
  overwrite: boolean = false
): number => {
  try {
    const importedData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!Array.isArray(importedData)) {
      throw new Error("Invalid blueprint format");
    }

    const existingBlueprints = loadBlueprints();
    let importCount = 0;

    const updatedBlueprints = overwrite
      ? [...existingBlueprints]
      : [...existingBlueprints];

    importedData.forEach((blueprint) => {
      if (!blueprint.name || !blueprint.config || !blueprint.createdAt) {
        return; // Skip invalid blueprints
      }

      const existingIndex = updatedBlueprints.findIndex(
        (bp) => bp.name === blueprint.name
      );

      if (existingIndex >= 0 && overwrite) {
        updatedBlueprints[existingIndex] = blueprint;
        importCount++;
      } else if (existingIndex === -1) {
        updatedBlueprints.push(blueprint);
        importCount++;
      }
    });

    fs.writeFileSync(
      BLUEPRINT_FILE,
      JSON.stringify(updatedBlueprints, null, 2)
    );
    return importCount;
  } catch (error) {
    console.error(chalk.red("Error importing blueprints:"), error);
    return 0;
  }
};
