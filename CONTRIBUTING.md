# Contributing to Rival Outranker

Thank you for your interest in contributing to Rival Outranker! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be collaborative**: Work together towards common goals
- **Be inclusive**: Welcome newcomers and diverse perspectives
- **Be professional**: Maintain professionalism in all interactions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Git knowledge

### Development Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/yourusername/rival-outranker.git
   cd rival-outranker
   ```

2. **Install dependencies**:

   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**:

   ```bash
   # With Docker (recommended)
   docker-compose up --build

   # Or without Docker
   cd backend && npm run dev &
   npm run dev
   ```

5. **Verify setup**:
   - Frontend: <http://localhost:3000>
   - Backend: <http://localhost:4000>
   - API Docs: <http://localhost:4000/api-docs>

## 🔄 Development Process

### Workflow

1. **Create an issue** for bugs or feature requests
2. **Fork the repository** and create a feature branch
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Run the test suite** to ensure nothing breaks
6. **Submit a pull request** with clear description

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

## 📝 Coding Standards

### General Principles

- **Code Clarity**: Write self-documenting code
- **Consistency**: Follow existing patterns and conventions
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

### TypeScript/JavaScript

```typescript
// ✅ Good: Clear, typed, and well-structured
interface ProjectData {
  id: string;
  name: string;
  url: string;
  score?: number;
}

const createProject = async (data: ProjectData): Promise<Project> => {
  const result = await projectService.create(data);
  return result;
};

// ❌ Bad: Unclear types and structure
const createProject = async (data: any) => {
  return await projectService.create(data);
};
```

### React Components

```typescript
// ✅ Good: Proper types and structure
interface ProjectCardProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onUpdate 
}) => {
  const handleUpdate = useCallback(() => {
    onUpdate(project);
  }, [project, onUpdate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

### API Development

```typescript
// ✅ Good: Proper error handling and validation
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const projects = await projectService.findByUserId(userId);
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    handleError(error, res);
  }
};
```

### File Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── pages/               # Next.js pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows

### Testing Commands

```bash
# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- auth.test.ts
```

### Writing Tests

```typescript
// ✅ Good: Clear test structure
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project with valid data', async () => {
      // Arrange
      const projectData = {
        name: 'Test Project',
        url: 'https://example.com'
      };

      // Act
      const result = await projectService.create(projectData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.url).toBe(projectData.url);
    });

    it('should throw error with invalid URL', async () => {
      // Arrange
      const invalidData = {
        name: 'Test Project',
        url: 'invalid-url'
      };

      // Act & Assert
      await expect(projectService.create(invalidData))
        .rejects
        .toThrow('Invalid URL format');
    });
  });
});
```

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat(auth): add JWT refresh token functionality

# Bug fix
fix(dashboard): resolve memory leak in real-time updates

# Documentation
docs(api): update authentication examples

# Breaking change
feat(api)!: redesign project API structure

BREAKING CHANGE: Project API now uses different response format
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run linting and tests**:

   ```bash
   npm run lint
   npm run format
   npm test
   ```

4. **Update CHANGELOG.md** if applicable

### PR Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Relevant error messages

### Feature Requests

Use the feature request template and include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Use cases**: How would this be used?

## 📖 Documentation

### Documentation Standards

- **Clear and concise**: Easy to understand
- **Code examples**: Include practical examples
- **Up-to-date**: Keep synchronized with code changes
- **Accessible**: Written for different skill levels

### Contributing to Docs

1. Documentation lives in `/docs` directory
2. Use Markdown format
3. Include code examples where helpful
4. Test documentation instructions
5. Update navigation as needed

### Documentation Types

- **API Documentation**: Auto-generated from OpenAPI spec
- **User Guides**: Step-by-step instructions
- **Developer Guides**: Technical implementation details
- **Architecture**: System design and decisions

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.0.1): Bug fixes (backward compatible)

## 📞 Getting Help

- **Documentation**: Check the [docs](docs/) directory
- **Discussions**: [GitHub Discussions](../../discussions)
- **Issues**: [GitHub Issues](../../issues)
- **Discord**: [Community Discord](#) (if available)

## 🎉 Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md**: All contributors listed
- **Release notes**: Major contributions highlighted
- **Documentation**: Author credits where appropriate

---

Thank you for contributing to Rival Outranker! 🚀
