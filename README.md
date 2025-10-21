# 🌦️ ET Weather App

A React TypeScript weather application that provides evapotranspiration (ET₀) data and precipitation forecasts with email notification capabilities.

## Features

### 🌍 Multi-Location Management
- Add and manage multiple weather monitoring locations
- Save favorite locations for quick access
- Individual location refresh and management
- GPS-based current location detection

### 📧 Email Notifications
- Weekly weather report subscriptions
- Customizable scheduling (day and time)
- Beautiful HTML email templates
- Multiple location support per subscription
- Test email functionality

### 📊 Weather Data
- 14-day precipitation and ET₀ forecasts
- Interactive charts and visualizations
- Real-time weather data from Open Meteo API
- NCEP GFS Seamless Model integration

### 🎨 Modern Interface
- GitHub-inspired design system
- Dark/Light mode support
- Responsive design for all devices
- Intuitive sidebar navigation

## Live Demo

Visit the app at: [https://gerbriel.github.io/Weatherapp/](https://gerbriel.github.io/Weatherapp/)

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/gerbriel/Weatherapp.git
cd Weatherapp
npm install
npm run dev
\`\`\`

### 2. Configure Email Notifications (Optional)

To enable email notifications, you'll need to set up EmailJS:

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account
2. Create a new email service (Gmail, Outlook, etc.)
3. Create a new email template with these variables:
   - \`{{to_email}}\` - Recipient email
   - \`{{to_name}}\` - Recipient name
   - \`{{subject}}\` - Email subject
   - \`{{{html_content}}}\` - Weather report HTML (use triple braces)
   - \`{{location_count}}\` - Number of locations
   - \`{{report_date}}\` - Report date

4. Update \`src/config/emailConfig.ts\` with your EmailJS credentials

### 3. Deploy to GitHub Pages

The app is configured for automatic deployment to GitHub Pages:

1. Push your code to the \`main\` branch
2. Go to your GitHub repository settings
3. Navigate to Pages section
4. Select "GitHub Actions" as the source
5. The app will automatically deploy on every push to main

## Technologies Used

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with GitHub-inspired design
- **EmailJS** for client-side email sending
- **Open Meteo API** for weather data
- **Recharts** for data visualization
- **Lucide React** for icons

## API Data Source

Weather data is provided by [Open Meteo](https://open-meteo.com/):
- **Model**: NCEP GFS Seamless
- **Forecast**: 14-day precipitation and evapotranspiration
- **Updates**: Multiple times daily
- **Coverage**: Global

---

Built with ❤️ for agricultural and weather monitoring applications.
