export interface ProjectConfig {
  type: "web" | "mobile" | "backend";
  name: string;
  features: {
    authentication: boolean;
    userProfiles: boolean;
    userSettings: boolean;
    responsiveLayout: boolean;
    crudSetup: boolean;
  };
  stateManagement: "redux" | "context" | "none";
  themeToggle: boolean;
  apiType: "rest" | "graphql";
  backend: {
    database: "mongodb" | "postgres" | "mysql";
    roleBasedAuth: boolean;
    jwtSetup: boolean;
    apiVersioning: boolean;
  };
}

export interface Blueprint {
  name: string;
  description: string;
  config: Omit<ProjectConfig, "name">;
  createdAt: string;
}

export interface FeatureSelections {
  features?: {
    authentication?: boolean;
    userProfiles?: boolean;
    userSettings?: boolean;
    responsiveLayout?: boolean;
    crudSetup?: boolean;
  };
  stateManagement?: "redux" | "context" | "none";
  themeToggle?: boolean;
  apiType?: "rest" | "graphql";
  backend?: {
    database?: "mongodb" | "postgres" | "mysql";
    roleBasedAuth?: boolean;
    jwtSetup?: boolean;
    apiVersioning?: boolean;
  };
}
