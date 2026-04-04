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

# Support

**Need help with Heildamm?** We are here to assist you. This document outlines the available support resources and how to get help.

---

## Getting Help

### Quick Answers

**Check These Resources First**:

1. **README.md** - Comprehensive documentation and usage guide
2. **Existing Issues** - Search for similar problems already reported
3. **CONTRIBUTING.md** - For contribution-related questions
4. **Troubleshooting Section** - Common issues and solutions in README

---

## Support Channels

### GitHub Issues

For bugs, feature requests, and technical problems:

1. **Before Creating an Issue**
   - Search existing issues to avoid duplicates
   - Review the README and documentation
   - Test with the latest version
   - Gather relevant information about your environment

2. **Creating an Issue**
   - Use the issue template provided
   - Include a clear title describing the problem
   - Provide detailed description and steps to reproduce
   - Include your environment information (OS, Node version, etc.)
   - Attach relevant logs or error messages
   - Share code snippets when applicable

3. **Issue Types**
   - **Bug Report**: Something is not working as expected
   - **Feature Request**: Request for new functionality
   - **Documentation**: Problems or suggestions for documentation
   - **Question**: General questions about usage or architecture

### Direct Contact

**For Sensitive Issues**:

- Security vulnerabilities: See [SECURITY.md](SECURITY.md)
- Private concerns: Contact maintainers directly
- Confidential matters: Email [contact@example.com] (to be configured)

---

## Frequently Asked Questions

### Installation and Setup

**Q: How do I install Heildamm?**
A: Run `npx create-heildamm` and follow the interactive prompts.

**Q: What are the system requirements?**
A: Node.js 18+ and a package manager (pnpm, npm, or yarn).

**Q: Can I use it with npm or yarn instead of pnpm?**
A: Yes, all three package managers are supported.

### Architecture and Templates

**Q: Which architecture should I choose?**
A: See the Architecture Decision Guide in README.md for recommendations.

**Q: Can I mix architectural patterns?**
A: It's recommended to maintain consistency with your chosen pattern.

**Q: Can I modify the template structure?**
A: Yes, the templates are starting points that you can customize.

### Development

**Q: How do I start the development server?**
A: Run `pnpm dev` in your generated project.

**Q: How do I build for production?**
A: Run `pnpm build && pnpm start`.

**Q: How are dependencies managed?**
A: Use your package manager (pnpm/npm/yarn) for dependency management.

### Database and API

**Q: Do I need to use Prisma for database access?**
A: The Prisma variant includes database setup, but it's optional. Use the bare variant if you prefer alternatives.

**Q: What database is supported?**
A: The Prisma variant includes PostgreSQL configuration but can be adapted to other databases.

**Q: Can I use the API routes with tRPC?**
A: Yes, the tRPC variant includes full API setup with type safety.

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Use a different port
pnpm dev -- -p 3001
```

#### Node Version Issues

```bash
# Verify Node version
node --version

# Should be 18.0.0 or higher
```

#### Dependency Installation Fails

```bash
# Clear cache and reinstall
pnpm install --force

# Or with npm
npm cache clean --force
npm install
```

#### Build Errors

```bash
# Ensure TypeScript compiles correctly
pnpm build

# Check for type errors
pnpm exec tsc --noEmit
```

#### Linting Issues

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

---

## Best Practices

### When Asking for Help

1. **Provide Context**
   - Your environment details (OS, Node version, package manager)
   - Steps to reproduce the issue
   - Expected vs. actual behavior
   - Relevant error messages or logs

2. **Be Specific**
   - Include code samples if applicable
   - Describe what you have already tried
   - Mention any modifications to templates

3. **Use Clear Language**
   - Describe the problem in detail
   - Use proper formatting for code blocks
   - Avoid ambiguous or vague descriptions

### Response Times

- **Critical Issues**: Response within 24 hours
- **Standard Issues**: Response within 48-72 hours
- **General Questions**: Response within 7 days

Response times are best-effort and may vary based on maintainer availability.

---

## Contributing to Support

If you have found a solution to a problem:

- Share your solution in the issue
- Help others by answering questions
- Contribute documentation improvements
- Suggest enhancements based on your experience

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

## Resources

### Documentation

- [README.md](../README.md) - Main documentation
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) - Community standards
- [SECURITY.md](SECURITY.md) - Security policy

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Community

- GitHub Issues and Discussions
- Project Repository: https://github.com/glatztp/create-heildamm
- Maintainers and community members

---

## Feedback

Your feedback helps us improve Heildamm:

- Report bugs and issues
- Suggest new features
- Share your experience
- Contribute improvements

**We appreciate your engagement and support.**
