# AI_RULES.md

## Tech Stack
- React 19 with TypeScript
- React Router v2 for routing
- Shadcn UI for UI components
- Tailwind CSS for styling
- TanStack Query for state management
- Supabase for database integration
- Vite for build system
- ESLint/Prettier for code formatting
- Zod for type validation
- Lucide React for icons

## Library Usage Rules
1. **UI Components**: Always use Shadcn UI components instead of custom implementations
2. **Styling**: Use Tailwind CSS classes exclusively - no inline styles or CSS modules
3. **State Management**: Use TanStack Query for all data fetching and state
4. **Routing**: Use React Router v2 with `useRouter` hook - no manual route handling
5. **Database**: Use Supabase for all database operations - no direct SQL queries
6. **Type Safety**: Use Zod for all schema validation
7. **Icons**: Use Lucide React icons - no SVG imports
8. **Build System**: Use Vite configuration - no Webpack or Babel
9. **Code Formatting**: Use ESLint/Prettier - no manual formatting
10. **Third-Party Libraries**: Only use libraries listed in package.json dependencies

## File Structure
- All components in `src/components/`
- All pages in `src/pages/`
- All hooks in `src/hooks/`
- All utilities in `src/lib/utils/`
- All routes in `src/App.tsx`
- All database operations in `src/lib/supabase.js`
- All type definitions in `src/types/`