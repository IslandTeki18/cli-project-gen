import * as fs from "fs";
import * as path from "path";
import { Blueprint } from "../types";

/**
 * Validate project name to ensure it's a valid npm package name
 */
export function validateProjectName(input: string): boolean | string {
  if (!input || input.trim() === "") {
    return "Project name is required";
  }

  if (!/^[a-z0-9-_]+$/i.test(input)) {
    return "Project name can only contain letters, numbers, dashes, and underscores";
  }

  if (input.length > 214) {
    return "Project name is too long (max 214 characters)";
  }

  return true;
}

export const validateBlueprintName = (
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
