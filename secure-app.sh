#!/bin/bash

# 🔐 Security Hardening Script
# Run this script to secure your Weather App repository

echo "🔐 Weather App Security Hardening"
echo "================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    echo "Please run this script from the root of your weather-app directory"
    exit 1
fi

echo "✅ Git repository detected"

# Check if .env file exists and warn about it
if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file exists"
    echo "   Make sure it contains only development keys"
    echo "   It will NOT be committed to git (protected by .gitignore)"
fi

# Remove the actual .env file from git tracking if it was previously committed
echo "🧹 Removing .env from git tracking (if previously committed)..."
git rm --cached .env 2>/dev/null || echo "   .env was not previously tracked"

# Add and commit the security changes
echo "📝 Staging security improvements..."
git add .gitignore
git add .env.example
git add test-email-send.js
git add simple-test-email.js  
git add test-consolidated-email.js
git add SECURITY_SETUP.md
git add SECRETS_SETUP.md
git add .github/workflows/

echo "💾 Committing security hardening..."
git commit -m "🔐 Security: Remove hardcoded API keys and implement proper secret management

- Remove hardcoded Resend API key from test files
- Add comprehensive .env.example template
- Update .gitignore to exclude .env files
- Create SECURITY_SETUP.md guide
- Update documentation to remove exposed secrets
- Implement proper environment variable validation

Fixes: GitGuardian security alerts for exposed secrets"

echo ""
echo "✅ Security hardening complete!"
echo ""
echo "🚀 Next Steps:"
echo "1. Push changes: git push origin main"
echo "2. Set up GitHub repository secrets (see SECURITY_SETUP.md)"
echo "3. Rotate your Resend API key in the Resend dashboard"
echo "4. Configure Supabase Edge Function environment variables"
echo "5. Test deployment and email automation"
echo ""
echo "📖 For detailed instructions, see: SECURITY_SETUP.md"