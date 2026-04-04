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

# Contributing to Heildamm

**Thank you for your interest in contributing to Heildamm.** We welcome contributions from the community that help improve the project, enhance functionality, fix bugs, and improve documentation.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js version 18.0.0 or higher
- Git installed and configured
- A GitHub account
- Basic familiarity with Git commands

### Setting Up Your Development Environment

1. **Fork the Repository**

   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/create-heildamm.git
   cd create-heildamm
   ```

3. **Add Upstream Remote**

   ```bash
   git remote add upstream https://github.com/glatztp/create-heildamm.git
   ```

4. **Install Dependencies**

   ```bash
   pnpm install
   ```

5. **Verify Installation**
   ```bash
   pnpm build
   node dist/bin/index.js --help
   ```

---

## Development Workflow

### Creating a Feature Branch

```bash
# Update your local main branch
git fetch upstream
git checkout main
git merge upstream/main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write your code following the project conventions
2. Ensure your changes don't break existing functionality
3. Test thoroughly before committing
4. Run linting and build checks:
   ```bash
   pnpm lint
   pnpm build
   ```

### Committing Your Changes

Following best practices for commit messages:

```bash
git add .
git commit -m "[type]: Brief description of changes"
```

Commit types:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring without feature changes
- `test:` Adding or updating tests
- `chore:` Build, dependency, or tooling changes

Example:

```bash
git commit -m "feat: Add domain-driven architecture template"
git commit -m "fix: Resolve ASCII art rendering issue in CLI"
git commit -m "docs: Update README with architecture examples"
```

### Pushing Your Changes

```bash
git push origin feature/your-feature-name
```

---

## Creating Pull Requests

### Pull Request Process

1. **Sync with Upstream**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name --force-with-lease
   ```

3. **Create Pull Request on GitHub**
   - Provide a clear title describing your changes
   - Reference any related issues using `#issue-number`
   - Complete the pull request template
   - Request review from maintainers

### Pull Request Guidelines

- Keep PRs focused on a single concern
- Break large changes into multiple smaller PRs
- Ensure all commits are meaningful and well-described
- Address review feedback promptly
- Keep your branch updated with main

---

## Code Style and Standards

### TypeScript Guidelines

- Use strict TypeScript settings
- Define types for all function parameters and return values
- Avoid using `any` type unless absolutely necessary
- Use descriptive variable and function names

### Code Organization

- Follow the existing project structure
- Keep functions focused and maintainable
- Comment complex logic clearly
- Extract reusable code into utilities

### Documentation

- Add comments for non-obvious code
- Update README if adding new features
- Add JSDoc comments for exported functions
- Include usage examples where applicable

---

## Types of Contributions

### Bug Reports

- Describe the issue clearly
- Provide steps to reproduce
- Include error messages or logs
- Note your environment (Node version, OS, etc.)

### Feature Requests

- Explain the use case
- Describe expected behavior
- Consider backward compatibility
- Discuss implementation approach

### Template Enhancements

- Improve existing template files
- Add new template variants
- Enhance example implementations
- Update template documentation

### Documentation Improvements

- Fix typos or clarify explanations
- Add missing information
- Improve code examples
- Update outdated content

---

## Testing

Before submitting a pull request:

1. **Build the Project**

   ```bash
   pnpm build
   ```

2. **Test the CLI**

   ```bash
   node dist/bin/index.js
   ```

3. **Test Each Architecture**
   - Verify all four architectures can be created
   - Test all technology stack variants
   - Verify generated projects can build and run

---

## Code Review Process

### What to Expect

- Maintainers will review your PR within a reasonable timeframe
- You may receive feedback or requests for changes
- All conversations should remain professional and constructive
- Approved PRs will be merged into the main branch

### Making Requested Changes

```bash
# Make changes to your branch
git add .
git commit -m "Address review feedback: [description]"
git push origin feature/your-feature-name
```

---

## Community Guidelines

### Conduct

- Be respectful and professional
- Welcome new contributors
- Provide constructive feedback
- Report violations of the Code of Conduct

### Communication

- Use clear and professional language
- Respond to feedback within a reasonable time
- Ask for clarification if comments are unclear
- Keep discussions relevant to the project

---

## Additional Resources

- **Project Repository**: https://github.com/glatztp/create-heildamm
- **Issues Page**: For bug reports and feature requests
- **Code of Conduct**: See CODE_OF_CONDUCT.md for behavioral standards
- **License**: All contributions are made under the MIT License

---

## Questions?

If you have questions about the contribution process, feel free to:

- Open an issue with your question
- Contact the maintainers
- Review existing issues for similar questions

**We appreciate your contributions and thank you for helping improve Heildamm.**
