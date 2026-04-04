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

# Heildamm

**Professional Next.js Project Scaffolder with Opinionated Architecture Templates**

Heildamm provides a comprehensive toolkit for initializing production-ready Next.js applications with carefully curated folder structures, architectural patterns, and technology stacks. Each template includes functional demonstration files that illustrate best practices and patterns within your chosen architecture.

---

## Overview

Modern application development demands clear architectural patterns and consistent project structure. Heildamm eliminates the setup burden by providing fully-configured templates based on proven architectural approaches, allowing teams to focus on feature development immediately.

### Key Features

- **Four Architectural Patterns**: Feature-based, layer-based, domain-driven, and monorepo structures
- **Multiple Technology Stacks**: From bare essentials to full-featured configurations
- **Production-Ready Templates**: Every template includes functional example files demonstrating patterns
- **Interactive CLI**: User-friendly command-line interface for project configuration
- **Minimal Dependencies**: Lightweight setup with no unnecessary bloat
- **TypeScript Support**: Full TypeScript configuration out of the box

---

## Installation

### Prerequisites

- Node.js version 18.0.0 or higher
- Package manager: pnpm, npm, or yarn

### Quick Start

```bash
npx create-heildamm
```

The interactive CLI will guide you through the project configuration process:

```
   Welcome to Heildamm

   This toolkit assists you in scaffolding Next.js projects
   with carefully designed architectural patterns.

   Documentation: https://github.com/glatztp/create-heildamm

   Project Configuration

   Project name: my-application

   Select your preferred architecture
   > feature-based

   Select your technology stack variant
   > full

   Where would you like to create your project?
   > New subfolder with project name

   Proceed with creating my-application in my-application/?
   > Yes
```

---

## Architectures

Choose the architectural pattern that best aligns with your project requirements and team expertise.

### Feature-Based Architecture

Organizes code around product features and business capabilities. Each feature is self-contained with all necessary layers (components, services, hooks) grouped together.

**Best for**: Medium to large applications, feature-driven teams, applications with many independent features

**Structure**:

```
src/
├── features/
│   ├── authentication/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── settings/
│       ├── components/
│       ├── hooks/
│       └── services/
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

### Layer-Based Architecture

Organizes code by technical responsibility layers (presentation, business logic, data access). Each layer contains all functionality of that type across the entire application.

**Best for**: Applications with clear separation of concerns, teams preferring traditional layered architecture, applications with complex business logic

**Structure**:

```
src/
├── components/
│   ├── common/
│   ├── layouts/
│   └── pages/
├── hooks/
│   ├── useAuth/
│   ├── useFetch/
│   └── useForm/
├── services/
│   ├── api/
│   ├── auth/
│   └── storage/
├── utils/
│   ├── formatters/
│   ├── validators/
│   └── helpers/
└── types/
    └── domain/
```

### Domain-Driven Design Architecture

Organizes code around business domains and concepts. Each domain encompasses all functionality related to a specific business area, promoting strategic design and bounded contexts.

**Best for**: Complex business domains, enterprise applications, teams practicing domain-driven design, applications with distinct business subdomains

**Structure**:

```
src/
├── domain/
│   ├── product/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── order/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── user/
│       ├── components/
│       ├── services/
│       ├── hooks/
│       └── types/
└── shared/
    ├── ui/
    ├── utils/
    └── hooks/
```

### Monorepo Architecture

Manages multiple applications and shared packages within a single repository using pnpm workspaces. Ideal for large-scale projects with code sharing requirements.

**Best for**: Multi-application projects, shared component libraries, large teams, organizations with multiple related products

**Structure**:

```
root/
├── pnpm-workspace.yaml
├── packages/
│   ├── ui/
│   │   └── components/
│   ├── types/
│   │   └── shared types/
│   ├── api/
│   │   └── API utilities/
│   └── database/
│       └── database utilities/
└── apps/
    ├── web/
    │   └── Next.js web application
    ├── admin/
    │   └── Next.js admin panel
    └── api/
        └── API server
```

---

## Technology Stack Variants

Each architecture can be combined with different technology stacks to match your requirements.

### Bare

**Foundation Stack**: Core setup with essentials only

**Includes**:

- Next.js 14
- Tailwind CSS
- TypeScript
- ESLint configuration

**Use when**: You prefer minimal dependencies and maximum control, building custom solutions

---

### tRPC

**Full-Stack Type Safety**: Add end-to-end type-safe API layer

**Includes**:

- Everything in Bare
- tRPC v11
- Zod validation
- Type-safe RPC procedures

**Use when**: You need type-safe communication between client and server

---

### Prisma

**Database Integration**: Add database layer with ORM

**Includes**:

- Everything in Bare
- Prisma ORM
- PostgreSQL configuration
- Database migrations setup

**Use when**: You need database persistence with modern ORM tooling

---

### Full

**Complete Stack**: All technologies integrated and configured

**Includes**:

- Everything in Bare, tRPC, and Prisma
- Full stack type safety
- Complete example implementation
- Best practices demonstration

**Use when**: You need a comprehensive, production-ready setup

---

## Template Contents

Every generated project includes functional placeholder files demonstrating architectural patterns and best practices specific to your chosen architecture:

- **Example Components**: Properly structured React components following clean code principles
- **Service Patterns**: Service layer implementations showing separation of concerns
- **Type Definitions**: TypeScript types and interfaces demonstrating type safety
- **Configuration Files**: Properly configured build, linting, and development tools
- **Example API Routes**: API route examples (in tRPC and Prisma variants)
- **Database Schema**: Example Prisma schema (in Prisma and Full variants)

These files serve as templates to guide your development and can be easily replaced with your own code.

---

## Project Configuration Flow

### Step 1: Project Name

Specify your project name. Must contain only alphanumeric characters, hyphens, and underscores.

### Step 2: Architecture Selection

Choose your preferred architectural pattern based on your application structure needs and team experience.

### Step 3: Technology Stack

Select the appropriate technology stack variant for your requirements.

### Step 4: Project Location

Choose whether to create the project in the current directory or a new subfolder.

### Step 5: Confirmation

Review your selections and confirm project creation.

---

## Usage

### Development

```bash
cd my-application
pnpm install
pnpm dev
```

The development server starts at `http://localhost:3000`

### Building for Production

```bash
pnpm build
pnpm start
```

### Linting and Code Quality

```bash
pnpm lint
```

---

## Supported Package Managers

All templates support the following package managers:

- **pnpm** (recommended): Fast, disk space efficient package manager
- **npm**: Node package manager (default)
- **yarn**: Alternative package manager

Specify your preference during project creation.

---

## System Requirements

| Requirement | Version  |
| ----------- | -------- |
| Node.js     | ≥ 18.0.0 |
| npm         | ≥ 9.0.0  |
| pnpm        | ≥ 8.0.0  |
| yarn        | ≥ 3.0.0  |

---

## File Structure After Generation

```
my-application/
├── src/
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   └── ...            # Architecture-specific folders
├── public/            # Static assets
├── .env.example       # Environment variable template
├── .eslintrc.json     # ESLint configuration
├── next.config.ts     # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies
├── pnpm-lock.yaml     # Dependency lock file
└── README.md          # Project documentation
```

---

## Development Workflow

### 1. Initialize Project

```bash
npx create-heildamm
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Review Example Files

Examine the provided example files to understand the architectural pattern in your chosen structure.

### 4. Replace Examples

Replace example files with your own implementation while maintaining the architectural structure.

### 5. Start Development

```bash
pnpm dev
```

### 6. Build and Deploy

```bash
pnpm build
pnpm start
```

---

## Architecture Decision Guide

| Requirement                                 | Recommended Architecture |
| ------------------------------------------- | ------------------------ |
| Modular, feature-focused organization       | Feature-Based            |
| Clear separation of technical concerns      | Layer-Based              |
| Complex business domains with many concepts | Domain-Driven            |
| Multiple applications with shared code      | Monorepo                 |

---

## Best Practices

### Project Naming

- Use descriptive, lowercase names with hyphens
- Avoid generic names like "app" or "project"
- Consider using your organization's naming convention

### Architecture Selection

- Discuss architecture choice with your team before project creation
- Consider current team expertise and project requirements
- Ensure consistency across team projects

### File Organization

- Maintain consistency with the generated structure
- Avoid mixing architectural patterns within a project
- Document any deviations from the template structure

### Dependencies

- Regularly update dependencies using `pnpm update`
- Review security advisories with `pnpm audit`
- Use lock files for reproducible installations

---

## Troubleshooting

### Project Creation Fails

Ensure you have sufficient disk space and proper file system permissions. Check that your Node.js version meets requirements.

### Dependencies Installation Issues

Clear your package manager cache:

```bash
pnpm install --force
```

### Port Already in Use

The development server defaults to port 3000. Specify an alternative:

```bash
pnpm dev -- -p 3001
```

---

## Contributing

Contributions are welcome. Please review the project repository for contribution guidelines.

---

## License

MIT License - See LICENSE file for details

---

## Coverage

For questions, issues, or suggestions, visit the GitHub repository or contact the maintainers.

**Repository**: https://github.com/glatztp/create-heildamm
