# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy example env file
cp .env.local.example .env.local

# Edit .env.local with your credentials:
# - MONGO_URI: Your MongoDB connection string
# - GOOGLE_CLIENT_ID: From Google Cloud Console
# - GOOGLE_CLIENT_SECRET: From Google Cloud Console
# - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32
# - ENCRYPTION_KEY: Generate with: openssl rand -hex 16
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Login
- Click "Sign In"
- Authenticate with Google
- Start using the app!

## 📋 First Steps

### Add Bank Account
1. Go to "Linked Accounts"
2. Click "Link Account"
3. Enter bank details
4. Click "Link Account"

### Add Income
1. Go to "Income Sources"
2. Click "Add New Source"
3. Enter income details
4. Click "Add"

### Add Expense
1. Go to "Outflows"
2. Click "Log New Expense"
3. Enter expense details
4. Click "Record Expense"

### Add Credit Card
1. Go to "Liability Management"
2. Select "Credit Card" tab
3. Enter card details
4. Click "Register Credit Card"

### Add EMI
1. Go to "Liability Management"
2. Select "EMI Loan" tab
3. Enter EMI details
4. Click "Register EMI"

### Make Payment
1. Go to "Liability Management"
2. Click "Pay Bill" (for cards) or "Pay EMI" (for loans)
3. Select amount and bank account
4. Click "Confirm Payment"

## 🧪 Run Tests

```bash
# All tests
npm test

# Security tests only
npm test -- security.test.ts

# E2E tests only
npm test -- e2e.test.ts
```

## 🔒 Security Features

✅ **Encrypted Data**: All sensitive data encrypted with AES-256
✅ **Input Validation**: XSS and injection prevention
✅ **Rate Limiting**: 100 requests per minute
✅ **User Isolation**: Strict data isolation per user
✅ **Secure Sessions**: JWT-based authentication

## 📊 Dashboard Features

- **KPI Cards**: Total savings, income, expenses, EMI
- **Cashflow Chart**: Income vs expenses trend
- **Smart Insights**: AI-like financial recommendations
- **Predictive Analytics**: End-of-month projections
- **Financial Assistant**: Chat-based query system

## 🎨 UI Features

- **Dark Theme**: Premium fintech design
- **Responsive**: Works on desktop, tablet, mobile
- **Animations**: Smooth Framer Motion transitions
- **Charts**: Interactive Recharts visualizations
- **Real-time**: Live updates across all pages

## 🔧 Configuration

### Change API Base URL
Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
```

### Adjust Rate Limiting
Edit `.env.local`:
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Change Encryption Key
Edit `.env.local`:
```env
ENCRYPTION_KEY=your-32-character-key
```

## 📱 Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### MongoDB Connection Error
- Check MONGO_URI in .env.local
- Verify MongoDB is running
- Check network connectivity

### Google OAuth Error
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check OAuth redirect URI in Google Console
- Ensure NEXTAUTH_URL matches your domain

### Tests Failing
```bash
# Clear cache and reinstall
npm run clean
npm install
npm test
```

## 📚 Documentation

- **SECURITY.md**: Comprehensive security guide
- **TESTING_GUIDE.md**: Testing procedures
- **IMPLEMENTATION_SUMMARY.md**: Complete feature list

## 🚀 Deploy to Production

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t fintech-app .

# Run container
docker run -p 3000:3000 fintech-app
```

### Manual Deployment
1. Build: `npm run build`
2. Start: `npm start`
3. Configure reverse proxy (nginx/Apache)
4. Setup SSL certificate
5. Configure environment variables

## 🔐 Production Checklist

- [ ] Update all environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Run security audit
- [ ] Test all features
- [ ] Setup error tracking
- [ ] Configure rate limiting
- [ ] Enable logging

## 📞 Support

- **Issues**: Create GitHub issue
- **Security**: Email security@example.com
- **Questions**: Email support@example.com

## 🎉 You're Ready!

Your fintech application is now running. Start managing finances securely! 🚀

---

**Need help?** Check the documentation files or create an issue on GitHub.
