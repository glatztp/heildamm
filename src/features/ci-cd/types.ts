export type CICDPlatform = "github" | "gitlab" | "azure" | "none";

export interface CICDConfig {
  enabled: boolean;
  platform?: CICDPlatform;
}

export interface CICDOption {
  value: CICDPlatform;
  label: string;
  description?: string;
}
