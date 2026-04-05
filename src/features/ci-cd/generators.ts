import {
  getInstallCommand,
  getLintCommand,
  getBuildCommand,
  getTestCommand,
} from "./commands.js";

export function generateGitHubWorkflow(
  projectName: string,
  packageManager: string
): string {
  return `name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: '${packageManager === "pnpm" ? "pnpm" : packageManager}'
    
    - name: Install dependencies
      run: ${getInstallCommand(packageManager)}
    
    - name: Lint
      run: ${getLintCommand(packageManager)}
    
    - name: Build
      run: ${getBuildCommand(packageManager)}
    
    - name: Test
      run: ${getTestCommand(packageManager)}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: '${packageManager === "pnpm" ? "pnpm" : packageManager}'
    
    - name: Install dependencies
      run: ${getInstallCommand(packageManager)}
    
    - name: Build
      run: ${getBuildCommand(packageManager)}
    
    # Add your deployment steps here
    # Example: Deploy to Vercel, Netlify, etc.
`;
}

export function generateGitLabCI(
  projectName: string,
  packageManager: string
): string {
  return `stages:
  - install
  - lint
  - build
  - test
  - deploy

cache:
  paths:
    - node_modules/

variables:
  NODE_VERSION: '18'
  PACKAGE_MANAGER: '${packageManager}'

install:
  stage: install
  image: node:\${NODE_VERSION}
  script:
    - ${getInstallCommand(packageManager)}
  artifacts:
    paths:
      - node_modules/

lint:
  stage: lint
  image: node:\${NODE_VERSION}
  script:
    - ${getLintCommand(packageManager)}
  dependencies:
    - install

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - ${getBuildCommand(packageManager)}
  artifacts:
    paths:
      - .next/
  dependencies:
    - install

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - ${getTestCommand(packageManager)}
  dependencies:
    - install

deploy:
  stage: deploy
  image: node:\${NODE_VERSION}
  script:
    - echo "Deploying to production..."
    # Add your deployment steps here
  only:
    - main
  when: manual
`;
}

export function generateAzurePipeline(
  projectName: string,
  packageManager: string
): string {
  return `trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'
          
          - script: ${getInstallCommand(packageManager)}
            displayName: 'Install dependencies'
          
          - script: ${getLintCommand(packageManager)}
            displayName: 'Run linting'
          
          - script: ${getBuildCommand(packageManager)}
            displayName: 'Build project'
          
          - script: ${getTestCommand(packageManager)}
            displayName: 'Run tests'

  - stage: Deploy
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: DeployJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'
          
          - script: ${getInstallCommand(packageManager)}
            displayName: 'Install dependencies'
          
          - script: ${getBuildCommand(packageManager)}
            displayName: 'Build project'
          
          - script: echo "Deploying to production..."
            displayName: 'Deploy'
`;
}
