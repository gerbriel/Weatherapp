# 🔒 Secure Resend API Configuration

## Security Implementation

✅ **API Key Protection**: Resend API key is now server-side only
✅ **No Client Exposure**: API key never sent to browser
✅ **Secure Backend**: Express server handles all Resend operations
✅ **Environment Isolation**: Keys stored in .env (server-side only)

## Quick Start

### 1. Run Both Frontend & Backend
```bash
npm run dev:all
```
This starts:
- Frontend: `http://localhost:5177/Weatherapp/`
- Backend API: `http://localhost:3001/api/resend/*`

### 2. Alternative - Run Separately
```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend
npm run dev
```

## Environment Variables

Your `.env` file is now secure:
```env
# ✅ SECURE - Server-side only (no VITE_ prefix)
RESEND_API_KEY=re_your_actual_key_here
FROM_EMAIL=weather@resend.dev

# ✅ Client-side (OK to expose)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## API Endpoints

### Secure Backend Routes:
- `GET /api/resend/stats` - Email statistics
- `GET /api/resend/domains` - Domain information  
- `GET /api/health` - Health check

### Frontend Integration:
The admin panel now calls your secure backend instead of Resend directly.

## What Changed

### Before (❌ Insecure):
```typescript
// API key exposed to browser
VITE_RESEND_API_KEY=re_key_here

// Direct frontend → Resend API calls
fetch('https://api.resend.com/emails', {
  headers: { Authorization: `Bearer ${apiKey}` }
})
```

### After (✅ Secure):
```typescript
// API key server-side only
RESEND_API_KEY=re_key_here

// Frontend → Your Backend → Resend API
fetch('http://localhost:3001/api/resend/stats')
```

## Features Still Working

✅ **Admin Panel**: All Resend stats and analytics
✅ **Email Tracking**: Delivery, opens, clicks, bounces
✅ **Domain Management**: Resend domain information
✅ **Error Handling**: Graceful fallback to mock data
✅ **Development**: Automatic fallback when API not configured

## Production Deployment

For production, update the frontend service:

```typescript
// In src/services/resendService.ts
private baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api/resend'
  : 'http://localhost:3001/api/resend';
```

## Troubleshooting

**Backend not starting?**
```bash
# Check if port 3001 is available
lsof -ti:3001

# Start backend only
npm run server
```

**Frontend API calls failing?**
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify `.env` has RESEND_API_KEY (no VITE_ prefix)

**Mock data showing instead of real data?**
- Backend logs will show "API key not configured" 
- Double-check RESEND_API_KEY in `.env`
- Restart backend after changing `.env`