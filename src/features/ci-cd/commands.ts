export function getInstallCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm install",
    yarn: "yarn install",
    npm: "npm install",
  };
  return commands[packageManager] || "npm install";
}

export function getLintCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm run lint",
    yarn: "yarn lint",
    npm: "npm run lint",
  };
  return commands[packageManager] || "npm run lint";
}

export function getBuildCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm run build",
    yarn: "yarn build",
    npm: "npm run build",
  };
  return commands[packageManager] || "npm run build";
}

export function getTestCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm run test",
    yarn: "yarn test",
    npm: "npm run test",
  };
  return commands[packageManager] || "npm run test";
}
