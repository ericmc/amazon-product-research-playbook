# Contributing to Amazon Product Research Playbook

We welcome contributions to make this tool even better for the Amazon FBA community!

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Git

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/amazon-product-research-playbook.git
   cd amazon-product-research-playbook
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests** to ensure everything works:
   ```bash
   npm run test
   npm run test:e2e
   ```

## Coding Standards

### TypeScript & React
- Use TypeScript for all new code
- Prefer functional components with hooks
- Use proper TypeScript types (avoid `any`)
- Follow React best practices (proper key props, avoid inline functions in JSX, etc.)

### Code Style
- We use **Prettier** for code formatting
- We use **ESLint** for code linting
- Run `npm run format` before committing
- Run `npm run lint` to check for issues

### Component Guidelines
- Create small, focused components
- Use the established design system (`src/index.css`)
- Follow accessibility guidelines (proper labels, semantic HTML)
- Add proper TypeScript interfaces for props

### Testing
- Write unit tests for utility functions
- Write component tests for complex interactions
- Update E2E tests when adding new workflows
- Maintain test coverage above 80%

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(scoring): add seasonal risk calculation
fix(import): handle empty CSV rows gracefully
docs(readme): update installation instructions
test(scoring): add edge case tests for gates logic
```

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the coding standards above

3. **Add tests** for new functionality

4. **Run the full test suite**:
   ```bash
   npm run lint
   npm run test
   npm run test:e2e
   npm run build
   ```

5. **Commit your changes** using conventional commits

6. **Push to your fork** and create a Pull Request

7. **Fill out the PR template** with:
   - Description of changes
   - Screenshots for UI changes
   - Testing notes
   - Breaking changes (if any)

## Areas for Contribution

### High Priority
- **Accessibility improvements**: Help us achieve full WCAG AA compliance
- **Performance optimizations**: Bundle size, loading times, etc.
- **Test coverage**: Unit tests, integration tests, E2E scenarios
- **Documentation**: User guides, API docs, inline comments

### Medium Priority  
- **New import formats**: Support for additional research tools
- **Enhanced visualizations**: Charts, graphs, trend analysis
- **Export capabilities**: PDF improvements, Excel exports
- **Mobile experience**: Responsive design enhancements

### Future Ideas
- **Dark mode**: Complete dark theme implementation
- **Keyboard shortcuts**: Power user efficiency features
- **Bulk operations**: Multi-product actions
- **Advanced analytics**: Cohort analysis, forecasting

## Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Screenshots** if relevant
5. **Environment details**: Browser, OS, screen size
6. **Console errors** if applicable

## Feature Requests

For new features, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with user stories
4. **Consider accessibility** and performance implications
5. **Mockups or examples** are helpful but not required

## Code Review Process

All submissions go through code review:

- ✅ **Functionality**: Does it work as intended?
- ✅ **Code quality**: Is it readable and maintainable?
- ✅ **Performance**: Does it impact load times or memory?
- ✅ **Accessibility**: Can all users access the feature?
- ✅ **Testing**: Are there adequate tests?
- ✅ **Documentation**: Is it properly documented?

## Questions?

- 💬 **GitHub Discussions**: For general questions and ideas
- 🐛 **GitHub Issues**: For bug reports and feature requests
- 📧 **Email**: For security concerns or private matters

Thank you for contributing to the Amazon FBA community! 🚀