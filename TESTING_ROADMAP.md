# Testing Implementation Roadmap

## Quick Start Checklist

### Week 1: Setup (5 hours)
- [ ] Install Jest and testing dependencies
- [ ] Configure jest.config.js
- [ ] Create jest.setup.js with global configuration
- [ ] Update package.json with test scripts
- [ ] Create __tests__ directory structure
- [ ] Set up GitHub Actions CI/CD pipeline

**Installation:**
```bash
npm install --save-dev \
  @testing-library/react@14 \
  @testing-library/jest-dom@6 \
  @testing-library/user-event@14 \
  jest@29 \
  jest-environment-jsdom@29 \
  @types/jest@29 \
  ts-jest@29 \
  @testing-library/next@14
```

### Week 2-3: Critical Tests (30 hours)

Priority 1 - Authentication (6 hours)
- [ ] `__tests__/lib/auth-helpers.test.ts` - Auth functions
- [ ] `__tests__/middleware.test.ts` - Route protection

Priority 2 - Analytics Engine (12 hours)
- [ ] `__tests__/lib/analytics/engine.test.ts`
  - [ ] getRevenueMetrics() with edge cases
  - [ ] getCustomerMetrics() with calculations
  - [ ] getOperationalMetrics() with rates
  - [ ] getServicePerformance() with null checks
  - [ ] getStaffPerformance() with missing data
  - [ ] exportAnalyticsData() CSV/JSON
  - [ ] getDashboardSummary() daily metrics

Priority 3 - API Routes (12 hours)
- [ ] `__tests__/app/api/bookings.test.ts` (6 hours)
- [ ] `__tests__/app/api/check-availability.test.ts` (3 hours)
- [ ] `__tests__/app/api/auth/signout.test.ts` (2 hours)
- [ ] `__tests__/app/api/analytics/route.test.ts` (3 hours - optional, complex)

**Target Coverage After Phase 2:** 25-30%

### Week 4-5: Component Tests (36 hours)

Priority 4 - Form Components (8 hours)
- [ ] `__tests__/components/SinglePageBookingForm.test.tsx`
  - [ ] Data loading on mount
  - [ ] Service selection
  - [ ] Staff/Date/Time selection
  - [ ] Product selection and total calculation
  - [ ] Form validation
  - [ ] Submission and error handling

Priority 5 - Manager Components (20 hours)
- [ ] `__tests__/components/AppointmentManager.test.tsx` (3 hours)
- [ ] `__tests__/components/StaffManager.test.tsx` (3 hours)
- [ ] `__tests__/components/ServiceManager.test.tsx` (2 hours)
- [ ] `__tests__/components/ProductManager.test.tsx` (2 hours)
- [ ] `__tests__/components/TimeSlotManager.test.tsx` (2 hours)
- [ ] Other managers (8 hours total)

Tests for each manager should cover:
  - [ ] Data loading and display
  - [ ] Create/Read/Update/Delete operations
  - [ ] Filter and sort functionality
  - [ ] Error handling
  - [ ] Loading states

Priority 6 - Analytics Components (8 hours)
- [ ] `__tests__/components/AnalyticsInsights.test.tsx`
- [ ] `__tests__/components/AnalyticsDashboardWidget.test.tsx`

**Target Coverage After Phase 3:** 55-65%

### Week 6+: Maintenance & Expansion (ongoing)

- [ ] Add E2E tests with Playwright (optional)
- [ ] Integration tests for user workflows
- [ ] Performance regression tests
- [ ] End-to-end booking flow tests
- [ ] Admin dashboard workflow tests
- [ ] Analytics export tests

**Target Coverage:** 80%+

---

## File Structure to Create

```
__tests__/
├── lib/
│   ├── auth-helpers.test.ts
│   ├── middleware.test.ts
│   └── analytics/
│       └── engine.test.ts
├── app/
│   └── api/
│       ├── bookings.test.ts
│       ├── check-availability.test.ts
│       ├── auth/
│       │   └── signout.test.ts
│       └── analytics/
│           └── route.test.ts
├── components/
│   ├── SinglePageBookingForm.test.tsx
│   ├── AppointmentManager.test.tsx
│   ├── StaffManager.test.tsx
│   ├── ServiceManager.test.tsx
│   ├── ProductManager.test.tsx
│   ├── TimeSlotManager.test.tsx
│   ├── AnalyticsInsights.test.tsx
│   └── ... (other components)
└── mocks/
    ├── supabase.ts
    ├── handlers.ts
    └── fixtures.ts

jest.config.js
jest.setup.js
```

---

## Test Priority Matrix

| Priority | Component | Files | LOC | Risk | Effort | Hours |
|----------|-----------|-------|-----|------|--------|-------|
| CRITICAL | Authentication | 3 | 230 | HIGH | LOW | 6 |
| CRITICAL | Analytics Engine | 1 | 411 | CRITICAL | HIGH | 12 |
| CRITICAL | Booking API | 1 | 85 | CRITICAL | MEDIUM | 6 |
| CRITICAL | Availability | 1 | 32 | HIGH | LOW | 3 |
| HIGH | SinglePageForm | 1 | 1074 | HIGH | MEDIUM | 8 |
| HIGH | AppointmentManager | 1 | 1261 | HIGH | MEDIUM | 3 |
| HIGH | StaffManager | 1 | 1355 | HIGH | MEDIUM | 3 |
| HIGH | ServiceManager | 1 | 1042 | HIGH | MEDIUM | 2 |
| HIGH | Other Managers | 6 | 5600+ | HIGH | MEDIUM | 12 |
| MEDIUM | Analytics Components | 2 | 500+ | MEDIUM | MEDIUM | 8 |
| MEDIUM | Page Components | 8 | 900+ | MEDIUM | MEDIUM | 10 |
| LOW | Utilities | 4 | 300+ | LOW | LOW | 3 |

---

## Success Criteria

### Phase 1 Complete (Week 1)
- [ ] Jest installed and configured
- [ ] Test scripts working (`npm test`, `npm run test:coverage`)
- [ ] CI/CD pipeline set up
- [ ] First test file created and passing

### Phase 2 Complete (Week 3)
- [ ] 20+ test cases written
- [ ] Auth logic tested
- [ ] Analytics engine tests written
- [ ] API routes tested
- [ ] Coverage: 25%+

### Phase 3 Complete (Week 5)
- [ ] Form component tests
- [ ] Manager components tested
- [ ] 50+ total test cases
- [ ] Coverage: 55%+

### Phase 4 Complete (Ongoing)
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] Integration tests passing
- [ ] E2E tests (optional)
- [ ] Zero test regressions

---

## Common Test Patterns

### Testing API Routes
```typescript
import { POST } from '@/app/api/bookings/route'

describe('POST /api/bookings', () => {
  it('should create booking', async () => {
    const mockRequest = {
      json: async () => ({ /* test data */ })
    } as any
    
    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
  })
})
```

### Testing React Components
```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Component from '@/components/Component'

describe('Component', () => {
  it('should load data', async () => {
    render(<Component />)
    
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })
})
```

### Mocking Supabase
```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [] })
    }))
  }))
}))
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

## Questions?

Refer to the detailed TEST_COVERAGE_ANALYSIS.md for complete information on:
- Current test coverage status
- Risk assessment
- Specific test case examples
- Complete testing recommendations
