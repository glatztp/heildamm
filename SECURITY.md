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

# Security Policy

**Last Updated**: April 4, 2026

The Heildamm project takes security seriously. This document outlines our security policy and process for reporting vulnerabilities.

---

## Supported Versions

| Version | Status             | Support Until              |
| ------- | ------------------ | -------------------------- |
| 1.0.0+  | Actively Supported | Current + 2 minor versions |
| < 1.0.0 | Not Supported      | N/A                        |

We recommend using the latest version of Heildamm to ensure you have access to all security patches and improvements.

---

## Reporting Security Vulnerabilities

### Responsible Disclosure

If you discover a security vulnerability in Heildamm, please report it responsibly. Do not publicly disclose the vulnerability until it has been addressed by the maintainers.

### Reporting Process

1. **Identification**
   - Identify and confirm the security vulnerability
   - Document the vulnerability clearly
   - Test the vulnerability to understand its scope

2. **Documentation**
   - Prepare a detailed report including:
     - Description of the vulnerability
     - Affected versions
     - Steps to reproduce (if applicable)
     - Potential impact or severity
     - Suggested remediation (if available)

3. **Confidential Submission**
   - Email security report to: [security@email.com] (to be configured)
   - Mark the email subject as "SECURITY: [Brief description]"
   - Include relevant evidence or proof of concept
   - Optionally include your contact information for follow-up

4. **Acknowledgment**
   - Acknowledge receipt of security report within 48 hours
   - Provide initial assessment of the vulnerability
   - Establish timeline for resolution

5. **Resolution**
   - Work with reporters to understand and fix the vulnerability
   - Develop and test security patches
   - Coordinate disclosure timing
   - Credit reporter appropriately (if desired)

### Timeline Expectations

- **Critical Vulnerabilities**: Resolution within 24-72 hours
- **High Severity**: Resolution within 7 days
- **Medium Severity**: Resolution within 14 days
- **Low Severity**: Resolution within 30 days

These timelines are guidelines and may vary based on complexity and circumstances.

---

## Security Considerations

### Dependency Management

- Heildamm maintains minimal dependencies
- All dependencies are regularly updated
- Security advisories are monitored and addressed
- Lock files ensure reproducible installations

### Code Quality

- TypeScript strict mode enforces type safety
- ESLint configuration prevents common issues
- Code reviews include security considerations
- Regular security audits are performed

### Template Security

- Generated templates follow security best practices
- Example code demonstrates secure patterns
- Configuration defaults are secure by default
- Security documentation is included in templates

---

## Security Best Practices for Users

### When Using Heildamm

1. **Keep Dependencies Updated**

   ```bash
   pnpm update
   pnpm audit
   ```

2. **Monitor Security Advisories**
   - Subscribe to npm security notifications
   - Review advisory emails regularly
   - Apply patches promptly

3. **Secure Your Environment**
   - Use Node.js LTS versions
   - Keep your operating system updated
   - Use secure development practices

4. **Review Generated Code**
   - Understand the generated template structure
   - Review all example code before deployment
   - Implement your own security policies

5. **Template-Specific Considerations**
   - Database: Secure PostgreSQL credentials and connections
   - API: Implement proper authentication and authorization
   - Environment: Never commit sensitive data to repositories
   - Validation: Always validate user input

---

## Security Contact

For security-related inquiries:

- **Email**: [security@example.com] (to be configured)
- **GitHub Security Advisory**: Use GitHub's security advisory feature
- **PGP Key**: [To be provided if needed]

---

## Changelog

Security patches and updates are documented in [CHANGELOG.md](CHANGELOG.md). Refer to that file for information about security-related changes.

---

## Disclaimer

While we take security seriously, no software is completely free of vulnerabilities. Users are responsible for reviewing and testing generated projects in their own environments before deployment.

---

**Thank you for helping keep Heildamm secure.**
