# Components Directory

This directory contains reusable React Native components for the AR Viewer application.

## Structure

- **UI Components**: Basic UI elements (buttons, cards, etc.)
- **AR Components**: AR-specific components (camera view, object renderer, etc.)
- **Layout Components**: Layout and navigation components
- **Form Components**: Input and form-related components

## Usage

Import components using absolute paths:

```typescript
import { CustomButton } from '@/components/ui/CustomButton';
import { ARCamera } from '@/components/ar/ARCamera';
```

## Guidelines

- Each component should be in its own file
- Include TypeScript interfaces for props
- Use StyleSheet.create for styling
- Include JSDoc comments for complex components
- Follow the established naming conventions