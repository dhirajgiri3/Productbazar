# Lib Directory

This directory contains utility functions, services, and other shared code for the ProductBazar frontend application.

## Directory Structure

- `/api` - API client functions for interacting with the backend
  - API client functions should be organized by domain (e.g., `productApi.js`, `userApi.js`)
  - Each function should handle a specific API endpoint

- `/contexts` - React context providers for global state management
  - Each context should be in its own file
  - Context providers should include both the context and the provider component

- `/hooks` - Custom React hooks
  - Hooks should be named with the `use` prefix (e.g., `useAuth.js`, `useProduct.js`)
  - Each hook should have a single responsibility

- `/services` - Service modules for data fetching and processing
  - Services should be organized by domain (e.g., `productService.js`, `userService.js`)
  - Services should encapsulate business logic

- `/utils` - Utility functions
  - `/auth` - Authentication-related utilities
  - `/image` - Image-related utilities
  - `/product` - Product-related utilities
  - `/ui` - UI-related utilities

- `/validators` - Form validation functions
  - Validation functions should be organized by domain (e.g., `productValidators.js`, `userValidators.js`)

## Naming Conventions

- Files should use camelCase (e.g., `formatDate.js`, `apiClient.js`)
- Functions should use camelCase (e.g., `formatDate()`, `fetchProducts()`)
- Constants should use UPPER_SNAKE_CASE (e.g., `API_URL`, `MAX_FILE_SIZE`)
- Types/interfaces should use PascalCase (e.g., `Product`, `User`)

## Guidelines

1. Each utility function should have a clear, single responsibility
2. Include JSDoc comments for functions
3. Use TypeScript types/interfaces where appropriate
4. Export functions as named exports
5. Write pure functions when possible
6. Keep functions small and focused