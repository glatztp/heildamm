<div align="center">
<pre style="color: #8e61c6; background: transparent; border: none; font-weight: bold; line-height: 1.2;">
                                         ░▒▓▓▒░                                                    
                                        ░▒▓▓▓▓░    ▒▓▓▓▒                                           
                                        ░▒▓▓▓▓░    ▒▓▓▓▓░                                          
                                        ░▒▓▓▓▓▓▒░  ▒▓▓▓▓░                                          
                                        ░▒▓▓▓▓▓▓▓▓▒▒▓▓▓▓░                                          
                                        ░▒▓▓▓▓▒▓▓▓▓▓▓▓▓▓░                                          
                                        ░▒▓▓▓▓  ░▓▓▓▓▓▓▓░                                          
                                        ░▒▓▓▓▓    ░▒▓▓▓▓░                                          
                                        ░▒▓▓▓▓░    ▒▓▓▓▓░                                          
                                        ░▒▓▓▓▓     ▒▓▓▓▓░                                          
                                         ░▓▓▓▓░    ▒▓▓▓▓░                                          
                                             ░░     ▒▓▒▒░                                          
</pre>
</div>


Scaffold Next.js projects with opinionated, fully-demonstrated folder architectures.

```bash
npx create-heildamm
```

## Architectures

| Architecture   | Description                                          |
|----------------|------------------------------------------------------|
| `feature-based`  | Code grouped by product feature (`features/auth/`) |
| `layer-based`    | Code grouped by technical role (`hooks/`, `services/`) |
| `domain-driven`  | Code grouped by business domain (`domain/product/`) |
| `monorepo`       | `apps/` + `packages/` via pnpm workspaces           |

## Variants

| Variant  | Stack                                    |
|----------|------------------------------------------|
| `bare`   | Next.js 14 + Tailwind CSS                |
| `trpc`   | + tRPC v11 + Zod                         |
| `prisma` | + Prisma + PostgreSQL                    |
| `full`   | tRPC + Prisma + Zod                      |

## What you get

Every template ships with **functional placeholder files** that demonstrate how the architecture works in practice — not empty folders with a single `index.ts`. Open the project and immediately understand the structure.

## CLI flow

```
? Project name       › my-app
? Where to create?   › New folder ./my-app/  |  Current directory
? Architecture       › feature-based
? Stack variant      › trpc
? Package manager    › pnpm
✔ Scaffolding...
✔ Dependencies installed
✔ VS Code opened
```

If anything fails after the project folder is created, the folder is automatically removed — no leftover directories.

## Requirements

- Node.js ≥ 18
- pnpm / npm / yarn
