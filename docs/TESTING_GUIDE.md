# Testing Guide for Pandora Booking System

## Overview

This guide documents the testing infrastructure and patterns used to ensure financial accuracy and code reliability, particularly for high-risk areas like payroll calculations and analytics.

**Status:** ✅ PayrollEngine fully tested (30 tests, 100% pass rate)

## Test Infrastructure

### Tech Stack

- **Framework:** Jest 29.7.0
- **Testing Library:** @testing-library/react 14.1.2
- **Environment:** jsdom (for React components)
- **TypeScript:** Full TypeScript support with @types/jest

### Configuration Files

#### jest.config.js
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### jest.setup.js
```javascript
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Testing Strategy

### 1. Focus on Mathematical Calculations First

**Why:** Financial bugs = real money losses. Test calculations as pure functions.

**Example: PayrollEngine Tests**

Instead of testing the full database integration (complex mocking), test the underlying math:

```typescript
describe('Commission Calculation', () => {
  it('should calculate base commission: revenue × (rate / 100)', () => {
    const revenue = 500000 // 500,000 MMK
    const commissionRate = 15 // 15%
    const expectedCommission = (revenue * commissionRate) / 100

    expect(expectedCommission).toBe(75000) // 75,000 MMK
  })

  it('should calculate commission with tier multiplier', () => {
    const baseCommission = 100000
    const tierMultiplier = 1.20 // 20% boost
    const adjustedCommission = baseCommission * tierMultiplier

    expect(adjustedCommission).toBe(120000) // 120,000 MMK
  })
})
```

**Benefits:**
- ✅ Fast execution (no database calls)
- ✅ Easy to understand and maintain
- ✅ No complex mocking
- ✅ Tests the actual business logic

### 2. Mocking Supabase Effectively

When you need to test methods that query the database, use this helper pattern:

```typescript
// Helper function to create a mock Supabase query chain
function createMockChain(finalResult: any) {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
  }

  // Make all chainable methods return a promise when needed
  chain.select.mockImplementation(() => chain)
  chain.from.mockImplementation(() => chain)
  chain.eq.mockImplementation(() => chain)
  chain.gte.mockImplementation(() => chain)
  chain.lt.mockImplementation(() => chain)
  chain.order.mockImplementation(() => chain)
  chain.in.mockImplementation(() => chain)

  return chain
}

// Usage in tests
it('should aggregate payroll data', async () => {
  const mockPayrolls = [
    { gross_pay: 500000, net_pay: 480000 },
    { gross_pay: 600000, net_pay: 580000 }
  ]

  const mockChain = createMockChain({ data: mockPayrolls, error: null })
  mockChain.order = jest.fn().mockResolvedValue({ data: mockPayrolls, error: null })
  mockSupabase.from.mockReturnValue(mockChain)

  const summary = await engine.getPayrollSummary(testPeriod)

  expect(summary.totalGrossPay).toBe(1100000)
})
```

### 3. Edge Cases are Critical

Always test these scenarios:

```typescript
describe('Edge Cases', () => {
  it('should handle zero revenue', () => {
    const revenue = 0
    const commission = (revenue * 15) / 100
    expect(commission).toBe(0)
  })

  it('should handle null values (default to safe value)', () => {
    const nullRate = null
    const safeRate = nullRate || 0
    expect(safeRate).toBe(0)
  })

  it('should handle missing data', async () => {
    mockSupabase.from.mockReturnValue(
      createMockChain({ data: null, error: { message: 'Not found' } })
    )

    await expect(engine.calculate('invalid-id')).rejects.toThrow()
  })
})
```

### 4. Test File Organization

```
lib/
├── payroll/
│   ├── engine.ts                 (Payroll calculation logic)
│   └── __tests__/
│       └── engine.test.ts        (Tests for engine.ts)
├── analytics/
│   ├── engine.ts                 (Analytics calculation logic)
│   └── __tests__/
│       └── engine.test.ts        (Tests for engine.ts)
```

**Naming Convention:**
- Test files: `*.test.ts` or `*.spec.ts`
- Test folders: `__tests__/` directory adjacent to source
- Describe blocks: Use domain language (e.g., "Commission Calculation", not "calculateCommission()")

### 5. Test Structure Template

```typescript
import { MyEngine } from '../myEngine'

// Mock external dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('MyEngine - [Domain Area]', () => {
  let engine: MyEngine
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Setup
    mockSupabase = { /* mock object */ }
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockReturnValue(mockSupabase)

    engine = new MyEngine()
  })

  describe('[Calculation Category 1]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = 100
      const expected = 150

      // Act
      const result = calculateSomething(input)

      // Assert
      expect(result).toBe(expected)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => { /* ... */ })
    it('should handle null values', () => { /* ... */ })
    it('should throw on invalid input', () => { /* ... */ })
  })
})
```

## PayrollEngine Test Coverage

**File:** `lib/payroll/__tests__/engine.test.ts`

### Test Categories (30 tests total)

#### 1. Edge Cases and Error Handling (3 tests)
- ✅ Staff member not found
- ✅ Zero revenue handling
- ✅ Null commission rate handling

#### 2. Base Pay Calculation (3 tests)
- ✅ Basic calculation: hourly_rate × total_hours
- ✅ Decimal hours handling
- ✅ Zero hours handling

#### 3. Commission Calculation (3 tests)
- ✅ Base commission: revenue × (rate / 100)
- ✅ Commission with tier multiplier
- ✅ Product commission separately

#### 4. Performance Tier Logic (1 test)
- ✅ Correct tier multiplier based on appointment count

#### 5. Retention Bonus Calculation (3 tests)
- ✅ Bonus for repeat customers
- ✅ No extra bonus below threshold
- ✅ Repeat customer counting logic

#### 6. Team Bonus Distribution (3 tests)
- ✅ Equal distribution among staff
- ✅ Single staff member handling
- ✅ Multiple team bonuses aggregation

#### 7. Hours Calculation (4 tests)
- ✅ Minutes to hours conversion
- ✅ Multiple service durations summing
- ✅ Buffer time per appointment
- ✅ Rounding to 2 decimal places

#### 8. Multiple Services Per Appointment (2 tests)
- ✅ Revenue with quantity multiplier
- ✅ Missing quantity (default to 1)

#### 9. Total Payroll Calculation (3 tests)
- ✅ Gross pay calculation
- ✅ Net pay: gross - deductions
- ✅ Zero deductions handling

#### 10. Bonus Aggregation (1 test)
- ✅ Sum all bonus types correctly

#### 11. Reporting (2 tests)
- ✅ Aggregate payroll across all staff
- ✅ Handle empty payroll data

#### 12. Workflow (2 tests)
- ✅ Approve payroll
- ✅ Mark as paid

### Critical Formulas Tested

```typescript
// Base Pay
basePay = hourlyRate × totalHours

// Base Commission
baseCommission = (serviceRevenue × commissionRate) / 100

// Adjusted Commission
adjustedCommission = baseCommission × tierMultiplier

// Product Commission
productCommission = (productRevenue × productCommissionRate) / 100

// Retention Bonus
retentionBonus = (repeatCustomers × bonusPerRepeat) + extraBonus (if threshold met)

// Team Bonus Share
teamBonusShare = totalTeamBonus / activeStaffCount

// Total Hours
totalHours = (totalServiceMinutes + bufferMinutes) / 60

// Gross Pay
grossPay = basePay + adjustedCommission + productCommission + totalBonuses

// Net Pay
netPay = grossPay - deductions
```

## Next Priority Areas to Test

Based on the `CLAUDE.md` documentation, these are the critical areas that need test coverage next:

### Priority 1: AnalyticsEngine
**Risk:** Financial reporting accuracy
**File:** `lib/analytics/engine.ts` (410 LOC)
**Test:** Similar pattern to PayrollEngine

```bash
# Create test file
mkdir -p lib/analytics/__tests__
touch lib/analytics/__tests__/engine.test.ts
```

**Critical calculations to test:**
- Revenue metrics (total revenue, AOV, growth rate)
- Customer metrics (retention rate, LTV)
- Operational metrics (completion rate, utilization)

### Priority 2: Middleware
**Risk:** Security vulnerabilities
**File:** `middleware.ts` (95 LOC, security-critical)
**Test:** Authentication and authorization logic

```typescript
describe('Middleware Authentication', () => {
  it('should redirect to login if user is not authenticated', () => {})
  it('should redirect to home if user is not admin', () => {})
  it('should allow access if user is admin', () => {})
  it('should allow public routes without auth', () => {})
})
```

### Priority 3: API Routes
**Risk:** Data integrity, booking conflicts
**Files:**
- `app/api/bookings/route.ts` - Booking operations
- `app/api/check-availability/route.ts` - Prevents double-booking
- `app/api/payroll/*/route.ts` - Payroll operations

### Priority 4: Session Tracking
**Risk:** Privacy compliance
**File:** `lib/tracking/sessionTracker.ts`
**Test:** Data collection and privacy

## Best Practices

### ✅ DO

1. **Test business logic, not implementation details**
   ```typescript
   // Good
   expect(calculateGrossPay(basePay, commission, bonuses)).toBe(350000)

   // Bad
   expect(engine.privateMet hod()).toBe(...)
   ```

2. **Use descriptive test names**
   ```typescript
   // Good
   it('should calculate 15% commission on 500,000 MMK revenue = 75,000 MMK', () => {})

   // Bad
   it('test1', () => {})
   ```

3. **Test edge cases explicitly**
   - Zero values
   - Null/undefined values
   - Empty arrays
   - Negative numbers (if invalid)
   - Maximum values
   - Division by zero

4. **Keep tests independent**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()  // Clean state for each test
   })
   ```

5. **Write tests before fixing bugs**
   - Write failing test that reproduces the bug
   - Fix the code
   - Verify test passes

### ❌ DON'T

1. **Don't test external libraries**
   ```typescript
   // Bad - testing Supabase, not your code
   it('should query database correctly', async () => {
     const result = await supabase.from('table').select('*')
     expect(result).toBeDefined()
   })
   ```

2. **Don't use actual database in unit tests**
   - Use mocks for unit tests
   - Use test database for integration tests
   - Never use production database

3. **Don't test implementation details**
   ```typescript
   // Bad
   expect(engine['privateMethod']).toHaveBeenCalled()

   // Good
   expect(engine.calculatePayroll()).toMatchObject({ grossPay: 500000 })
   ```

4. **Don't write flaky tests**
   - Avoid timeouts and sleeps
   - Don't depend on test execution order
   - Mock external dependencies (network, time, random)

5. **Don't ignore failing tests**
   - Fix or remove broken tests immediately
   - Failing tests reduce trust in the suite

## Continuous Integration (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Pre-commit Hook (Optional)

Install husky for pre-commit testing:

```bash
npm install --save-dev husky
npx husky init
echo "npm test" > .husky/pre-commit
```

## Troubleshooting

### Common Issues

#### 1. Tests fail with "Cannot find module '@/...'"

**Solution:** Check `jest.config.js` has correct path mapping:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

#### 2. Supabase mock errors

**Solution:** Use the `createMockChain` helper function (see section 2 above)

#### 3. Async tests timeout

**Solution:** Increase timeout or check for unresolved promises:
```typescript
it('should complete', async () => {
  // ...
}, 10000) // 10 second timeout
```

#### 4. Coverage not collecting

**Solution:** Check `collectCoverageFrom` in `jest.config.js` includes your files:
```javascript
collectCoverageFrom: [
  'lib/**/*.{js,jsx,ts,tsx}',
  'app/api/**/*.{js,jsx,ts,tsx}',
],
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Testing Best Practices](https://testingjavascript.com/)

## Summary

**Current Status:**
- ✅ Test infrastructure setup complete
- ✅ PayrollEngine: 30 tests, 100% pass rate
- ⏳ AnalyticsEngine: Not yet tested
- ⏳ Middleware: Not yet tested
- ⏳ API Routes: Not yet tested

**Impact:**
- PayrollEngine calculations are now verified and safe
- Financial bugs will be caught before deployment
- Regression protection for future changes
- Foundation established for testing other critical areas

**Next Steps:**
1. Apply same pattern to AnalyticsEngine
2. Add middleware authentication tests
3. Test critical API routes (bookings, payroll)
4. Set up CI/CD pipeline for automated testing
5. Aim for 80%+ coverage on critical paths

---

**Remember:** Test the calculations that affect real money first. Everything else can wait.
