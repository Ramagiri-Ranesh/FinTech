# Testing & Security Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 3. Run Tests
```bash
# All tests
npm test

# Security tests only
npm test -- security.test.ts

# E2E tests only
npm test -- e2e.test.ts

# Watch mode
npm test -- --watch
```

## Test Coverage

### Security Tests (`src/__tests__/security.test.ts`)
- ✅ Input sanitization (XSS prevention)
- ✅ Email validation
- ✅ Amount validation
- ✅ Date validation
- ✅ MongoDB ObjectId validation
- ✅ Query sanitization
- ✅ Secure token generation

### E2E Tests (`src/__tests__/e2e.test.ts`)
- ✅ Authentication flow
- ✅ Bank account management
- ✅ Credit card operations
- ✅ EMI management
- ✅ Expense tracking
- ✅ Income management
- ✅ Dashboard analytics
- ✅ Data integrity
- ✅ Error handling

## Manual Testing Checklist

### Authentication
- [ ] User can sign in with Google
- [ ] Session persists across page reloads
- [ ] User can sign out
- [ ] Unauthorized users cannot access protected routes

### Bank Accounts
- [ ] Add new bank account
- [ ] View all bank accounts
- [ ] Add money to account
- [ ] Withdraw money from account
- [ ] Adjust balance
- [ ] View transaction history
- [ ] Filter transactions by type
- [ ] Delete bank account

### Credit Cards
- [ ] Add credit card
- [ ] View card details
- [ ] Make card payment
- [ ] Edit card billing amount
- [ ] View payment history
- [ ] Card due amount updates correctly

### EMI
- [ ] Add EMI loan
- [ ] View EMI details
- [ ] Pay EMI installment
- [ ] View payment timeline
- [ ] Track remaining months
- [ ] View payment history

### Expenses
- [ ] Add expense
- [ ] View expenses by date
- [ ] Filter by category
- [ ] View calendar view
- [ ] Delete expense
- [ ] Expense deducts from bank balance

### Income
- [ ] Add income source
- [ ] Edit income
- [ ] Delete income
- [ ] Calculate total monthly income
- [ ] Handle different frequencies

### Dashboard
- [ ] View KPI cards
- [ ] View cashflow chart
- [ ] View smart insights
- [ ] View predictive analytics
- [ ] Chat with financial assistant
- [ ] Quick action buttons work

### Security
- [ ] Cannot inject XSS in input fields
- [ ] Cannot access other user's data
- [ ] Rate limiting works (100 requests/min)
- [ ] Invalid amounts rejected
- [ ] Invalid dates rejected
- [ ] Negative amounts rejected

## Performance Testing

### Load Testing
```bash
# Test with 100 concurrent users
npm run test:load
```

### Response Time Targets
- Dashboard load: < 2 seconds
- API response: < 500ms
- Chart rendering: < 1 second

## Security Scanning

### Dependency Vulnerabilities
```bash
npm audit
npm audit fix
```

### Code Quality
```bash
npm run lint
npm run type-check
```

## Browser Testing

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Test Scenarios
1. **Desktop**: 1920x1080
2. **Tablet**: 768x1024
3. **Mobile**: 375x667

## API Testing

### Using cURL
```bash
# Get dashboard summary
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/dashboard/summary

# Add expense
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "category": "Food", "date": "2024-01-15"}'
```

### Using Postman
1. Import collection from `postman_collection.json`
2. Set environment variables
3. Run requests

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Push to main branch
- Pull requests
- Scheduled daily at 2 AM UTC

### Pre-commit Hooks
```bash
npm run prepare
```

## Troubleshooting

### Tests Failing
1. Clear cache: `npm run clean`
2. Reinstall: `npm install`
3. Check environment: `npm run env:check`

### Security Warnings
1. Update dependencies: `npm update`
2. Fix vulnerabilities: `npm audit fix`
3. Review SECURITY.md

### Performance Issues
1. Check network tab in DevTools
2. Profile with Chrome DevTools
3. Check database indexes

## Reporting Issues

### Bug Report Template
```
Title: [BUG] Brief description

Environment:
- Browser: 
- OS: 
- Node version: 

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:

Actual behavior:

Screenshots/Logs:
```

### Security Issue
Email: security@example.com
Include: Description, reproduction steps, impact

## Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example)

## Support

For testing questions: testing@example.com
For security concerns: security@example.com
