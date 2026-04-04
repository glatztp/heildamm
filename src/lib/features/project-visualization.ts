import chalk from "chalk";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

export function visualizeArchitecture(
  architecture: string,
  variant: string,
): string {
  const visualizations: Record<string, Record<string, string>> = {
    "feature-based": {
      bare: `
   Feature-Based Architecture
   ├── src/
   │   ├── features/
   │   │   ├── auth/
   │   │   ├── dashboard/
   │   │   └── profile/
   │   ├── components/
   │   ├── app.tsx
   │   └── layout.tsx
   └── package.json
      `,
      trpc: `
   Feature-Based + tRPC
   ├── src/
   │   ├── features/
   │   ├── server/
   │   │   └── trpc/
   │   ├── components/
   │   └── app.tsx
   ├── package.json
   Real-time type-safe APIs
      `,
      prisma: `
   Feature-Based + Prisma
   ├── src/
   │   ├── features/
   │   ├── components/
   │   └── app.tsx
   ├── prisma/
   │   ├── schema.prisma
   │   └── migrations/
   ├── package.json
   Database ORM included
      `,
      full: `
   Feature-Based + Full Stack
   ├── src/
   │   ├── features/
   │   ├── server/
   │   ├── components/
   │   └── app.tsx
   ├── prisma/
   ├── package.json
   tRPC + Prisma + Authentication
      `,
    },
    "layer-based": {
      bare: `
   Layer-Based Architecture
   ├── src/
   │   ├── presentation/
   │   ├── api/
   │   ├── logic/
   │   └── data/
   └── package.json
      `,
      trpc: `
   Layer-Based + tRPC
   ├── src/
   │   ├── presentation/
   │   ├── rpc-routes/
   │   ├── logic/
   │   └── data/
   └── package.json
      `,
      prisma: `
   Layer-Based + Prisma
   ├── src/
   │   ├── presentation/
   │   ├── api/
   │   ├── logic/
   │   └── data/
   ├── prisma/
   └── package.json
      `,
      full: `
   Layer-Based + Full Stack
   ├── src/
   │   ├── presentation/
   │   ├── rpc/
   │   ├── logic/
   │   └── data/
   ├── prisma/
   └── package.json
      `,
    },
    "domain-driven": {
      bare: `
   Domain-Driven Design
   ├── src/
   │   ├── domains/
   │   │   ├── users/
   │   │   ├── products/
   │   │   └── orders/
   │   ├── components/
   │   └── app.tsx
   └── package.json
      `,
      trpc: `
   Domain-Driven + tRPC
   ├── src/
   │   ├── domains/
   │   ├── rpc/
   │   ├── components/
   │   └── app.tsx
   └── package.json
      `,
      prisma: `
   Domain-Driven + Prisma
   ├── src/
   │   ├── domains/
   │   ├── components/
   │   └── app.tsx
   ├── prisma/
   └── package.json
      `,
      full: `
   Domain-Driven + Full Stack
   ├── src/
   │   ├── domains/
   │   ├── rpc/
   │   ├── components/
   │   └── app.tsx
   ├── prisma/
   └── package.json
      `,
    },
    monorepo: {
      bare: `
   Monorepo Structure
   ├── apps/
   │   ├── web/
   │   └── api/
   ├── packages/
   │   ├── ui/
   │   ├── utils/
   │   └── types/
   ├── pnpm-workspace.yaml
   └── package.json
      `,
      trpc: `
   Monorepo + tRPC
   ├── apps/
   │   ├── web/
   │   └── api-server/
   ├── packages/
   │   ├── trpc/
   │   ├── types/
   │   └── ui/
   └── pnpm-workspace.yaml
      `,
      prisma: `
   Monorepo + Prisma
   ├── apps/
   │   └── web/
   ├── packages/
   │   ├── db/
   │   ├── types/
   │   └── ui/
   ├── prisma/
   └── pnpm-workspace.yaml
      `,
      full: `
   Monorepo + Full Stack
   ├── apps/
   │   ├── web/
   │   └── api/
   ├── packages/
   │   ├── db/
   │   ├── trpc/
   │   ├── types/
   │   └── ui/
   └── pnpm-workspace.yaml
      `,
    },
  };

  return (
    visualizations[architecture]?.[variant] || `${architecture} - ${variant}`
  );
}

export function displayProjectStructure(
  architecture: string,
  variant: string,
): void {
  const visualization = visualizeArchitecture(architecture, variant);

  console.log(
    chalk.hex(COLORS.secondary)("\n   Project Structure Visualization:\n"),
  );
  console.log(chalk.hex(COLORS.primary)(visualization));
}
