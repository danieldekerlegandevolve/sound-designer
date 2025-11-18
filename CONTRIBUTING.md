# Contributing to Sound Designer

Thank you for your interest in contributing to Sound Designer! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/sound-designer.git
   cd sound-designer
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the App

```bash
npm run dev
```

This starts both the Vite dev server and Electron app with hot reload.

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Run ESLint before committing:
  ```bash
  npm run lint
  ```

### Type Checking

```bash
npm run type-check
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch
```

## What to Contribute

### Bug Fixes
- Check existing issues first
- Create an issue if one doesn't exist
- Reference the issue in your PR

### New Features
- Discuss in an issue before starting
- Update documentation
- Add tests
- Update CHANGELOG.md

### Documentation
- Fix typos and errors
- Improve clarity
- Add examples
- Update guides

### Performance Improvements
- Profile before and after
- Document the improvement
- Include benchmarks

## Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run checks**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use a clear title
   - Describe what changed and why
   - Reference related issues
   - Add screenshots if relevant

## Commit Message Format

Use conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(ui-designer): add grid snapping
fix(dsp-designer): correct node connection validation
docs(readme): update installation instructions
```

## Project Structure

```
sound-designer/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React application
│   └── shared/         # Shared types
├── build-tools/        # Build and export utilities
├── examples/           # Example plugins
└── docs/              # Documentation
```

## Areas to Contribute

### High Priority
- Plugin export implementation
- JUCE integration
- Audio processing with Web Audio API
- File save/load functionality
- Testing framework

### Medium Priority
- UI component library expansion
- DSP node implementations
- Code editor enhancements
- Documentation improvements

### Low Priority
- Visual polish
- Performance optimizations
- Additional export formats
- Advanced features

## Getting Help

- **Discord**: [Join our Discord](#)
- **Issues**: Check existing issues
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the about dialog

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Review Process

1. **Automated Checks** - CI runs tests and linting
2. **Code Review** - Maintainer reviews code
3. **Discussion** - Feedback and iteration
4. **Approval** - Once approved, PR is merged

## Tips for Success

- Start small - fix a typo or add a test
- Ask questions - no question is too simple
- Be patient - reviews take time
- Have fun! - We're building something cool

## Development Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JUCE Framework](https://juce.com)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

Thank you for contributing to Sound Designer! 🎵
