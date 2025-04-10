import * as fs from "fs";
import * as path from "path";
import { Blueprint } from "../types";

export const validateProjectName = (input: string): boolean | string => {
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  const reservedNames = [
    "con",
    "prn",
    "aux",
    "nul",
    "com1",
    "com2",
    "com3",
    "com4",
    "com5",
    "com6",
    "com7",
    "com8",
    "com9",
    "lpt1",
    "lpt2",
    "lpt3",
    "lpt4",
    "lpt5",
    "lpt6",
    "lpt7",
    "lpt8",
    "lpt9",
  ];

  if (!input || input.trim() === "") {
    return "Project name is required";
  }

  if (invalidChars.test(input)) {
    return "Project name contains invalid characters";
  }

  if (reservedNames.includes(input.toLowerCase())) {
    return "Project name is a reserved name";
  }

  if (fs.existsSync(path.resolve(process.cwd(), input))) {
    return "A directory with this name already exists";
  }

  return true;
};

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
