# Unit Test Execution

## Backend Unit Tests

### Run All Backend Tests
```bash
cd backend
npm test
```

### Run with Coverage
```bash
cd backend
npm run test:coverage
```

### Run Tests for a Specific Unit
```bash
cd backend
npx jest --testPathPattern=src/auth        # Unit 1: Auth
npx jest --testPathPattern=src/campaigns   # Unit 2: Campaigns
npx jest --testPathPattern=src/ideas       # Unit 3: Ideas
npx jest --testPathPattern=src/evaluations # Unit 4: Evaluations
npx jest --testPathPattern=src/dashboard   # Unit 5: Dashboard
npx jest --testPathPattern=src/analytics   # Unit 5: Analytics
npx jest --testPathPattern=src/notifications # Unit 6: Notifications
npx jest --testPathPattern=src/recognition # Unit 7: Recognition
```

### Expected Results
- All tests pass with 0 failures
- Test reports output to console

## Frontend Unit Tests

### Run All Frontend Tests
```bash
cd frontend
npm test
```

### Run in Watch Mode (Development)
```bash
cd frontend
npm run test:watch
```

### Expected Results
- All tests pass with 0 failures
- Uses Vitest + jsdom + React Testing Library

## Fix Failing Tests

1. Review test output for specific error messages
2. Check if the test expects a specific mock setup
3. Verify imports and type compatibility
4. Rerun individual test file: `npx jest path/to/test.ts` (backend) or `npx vitest path/to/test.tsx` (frontend)
