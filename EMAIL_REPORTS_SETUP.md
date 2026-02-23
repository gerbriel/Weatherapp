# Email HTML Reports via Resend - Setup Guide

## What You Have Already ✅

1. **Resend API Integration** - Server-side API endpoints in `/api/`
2. **Serverless Function** - `/api/send-report.ts` created to send emails
3. **HTML Report Generation** - `exportChartsAsHTML()` creates beautiful HTML reports
4. **Email UI** - "Email Report" button in the export modal

## What You Need to Enable Email Sending

### 1. Resend API Key & Domain Setup

#### Get Your Resend API Key:
```bash
1. Go to https://resend.com
2. Sign up or log in
3. Navigate to: API Keys → Create API Key
4. Copy the key (starts with `re_`)
```

#### Add to Environment Variables:

**For Development (`.env.local`):**
```bash
RESEND_API_KEY=re_your_actual_key_here
FROM_EMAIL=weather@yourdomain.com
```

**For Production (Vercel):**
```bash
# Go to Vercel Dashboard → Your Project → Settings → Environment Variables
# Add these variables:

RESEND_API_KEY = re_your_actual_key_here
FROM_EMAIL = weather@yourdomain.com
```

### 2. Verify Your Email Domain in Resend

**Option A: Use Resend's Free Domain (Quick Start)**
- Use: `onboarding@resend.dev` or `weather@resend.dev`
- No verification needed
- Limited to 100 emails/day
- Good for testing

**Option B: Add Your Own Domain (Recommended for Production)**
```bash
1. Go to Resend Dashboard → Domains → Add Domain
2. Enter your domain (e.g., yourdomain.com)
3. Add the DNS records Resend provides:
   - SPF Record
   - DKIM Records
   - DMARC Record (optional but recommended)
4. Wait for verification (usually 5-30 minutes)
5. Use emails like: weather@yourdomain.com
```

### 3. Environment Variable Configuration

**Required Variables:**
```bash
# Resend API Key (Get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# From Email Address (must be verified domain)
FROM_EMAIL=weather@yourdomain.com
```

**Optional Variables:**
```bash
# Custom Reply-To Address
REPLY_TO_EMAIL=support@yourdomain.com

# Rate Limiting
MAX_EMAILS_PER_HOUR=50
```

## Current Implementation Status

### ✅ Completed
- [x] Serverless function `/api/send-report.ts` 
- [x] Email validation and error handling
- [x] HTML report generation
- [x] Email button in UI
- [x] Environment variable configuration

### ⏳ Pending (What Needs to Be Done)

#### 1. **Extract HTML Content for Email**
The current `exportChartsAsHTML()` function downloads the HTML file. We need to:

**Option A: Refactor to Return HTML (Recommended)**
```typescript
// In chartExportUtils.ts
export async function generateHTMLForEmail(
  locations: LocationWithWeather[],
  selectedCrops: string[],
  cropInstances: any[],
  additionalData: any
): Promise<string> {
  // Same logic as exportChartsAsHTML but return HTML string
  // instead of downloading
  const htmlContent = `<!DOCTYPE html>...`;
  return htmlContent;
}
```

**Option B: Intercept Blob Before Download**
```typescript
// Modify exportChartsAsHTML to optionally return HTML
export async function exportChartsAsHTML(
  locations: LocationWithWeather[],
  selectedCrops: string[],
  cropInstances: any[],
  additionalData: any,
  returnHtml: boolean = false // Add this parameter
): Promise<string | void> {
  const htmlContent = `...`; // Generated HTML
  
  if (returnHtml) {
    return htmlContent; // Return instead of download
  }
  
  // Download as before
  const blob = new Blob([htmlContent], { type: 'text/html' });
  // ... rest of download logic
}
```

#### 2. **Update handleEmailReport to Call API**
```typescript
// In ReportView.tsx
const handleEmailReport = async (options: ComprehensiveExportOptions) => {
  const email = prompt('Enter email address:');
  if (!email) return;

  try {
    // Generate HTML content
    const htmlContent = await generateHTMLForEmail(
      displayLocations,
      selectedCrops,
      cropInstances,
      { /* all the data */ }
    );

    // Send via API
    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        htmlContent,
        locationNames: displayLocations.map(l => l.name),
        subject: `Weather Report - ${new Date().toLocaleDateString()}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    alert(`✅ Report sent successfully to ${email}!`);
  } catch (error) {
    alert(`❌ Error: ${error.message}`);
  }
};
```

#### 3. **Deploy Updated Code**
```bash
# After making changes:
npm run build
git add .
git commit -m "feat: Enable HTML report email sending via Resend"
git push

# Vercel will auto-deploy
```

## Testing the Email Feature

### 1. Test Locally
```bash
# Set environment variables
export RESEND_API_KEY=re_your_key
export FROM_EMAIL=weather@resend.dev

# Start dev server
npm run dev

# Test email sending
# Go to Reports → Export → Email Report
```

### 2. Test in Production
```bash
# Make sure environment variables are set in Vercel
# Deploy and test with real email addresses
```

### 3. Check Email Delivery
```bash
# Go to Resend Dashboard → Emails
# View delivery status, opens, clicks, bounces
```

## Resend Limits & Pricing

### Free Tier
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ All features included
- ✅ Perfect for testing

### Paid Plans (if needed later)
- **Basic: $20/month** - 50,000 emails
- **Pro: $80/month** - 1,000,000 emails
- Custom enterprise plans available

## Quick Implementation Checklist

- [ ] 1. Get Resend API key from https://resend.com
- [ ] 2. Add `RESEND_API_KEY` to Vercel environment variables
- [ ] 3. Add `FROM_EMAIL` to Vercel environment variables
- [ ] 4. Verify email domain in Resend (or use resend.dev for testing)
- [ ] 5. Refactor `exportChartsAsHTML` to return HTML content
- [ ] 6. Update `handleEmailReport` to call `/api/send-report`
- [ ] 7. Deploy to production
- [ ] 8. Test with real email address

## Current Workaround

Until the API integration is complete, users can:
1. Click "Email Report" button
2. HTML report downloads automatically
3. Manually attach the file to an email
4. Send to desired recipient

## Support & Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/emails
- **API Reference**: https://resend.com/docs/api-reference/emails/send-email
- **Domain Verification**: https://resend.com/docs/dashboard/domains/introduction

## Security Notes

✅ **API Key is server-side only** - Never exposed to client
✅ **Email validation** - Validates format before sending
✅ **Rate limiting** - Can be added to prevent abuse
✅ **CORS protection** - API endpoints protected
✅ **Error handling** - Proper error messages without exposing internals

---

**Status**: Ready for implementation
**Estimated Time**: 1-2 hours to complete the integration
**Difficulty**: Medium (requires refactoring HTML generation)
