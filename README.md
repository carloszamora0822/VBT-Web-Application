# Vestaboard Flight & Event Tracker (VBT)

This application manages flight and event information and displays it on Vestaboard devices. This directory contains only the essential files needed to run the application.

## Directory Structure

```
/VBT
├── api
│   ├── events
│   │   └── index.js    # Event management API
│   ├── flights
│   │   └── index.js    # Flight management API
│   └── power-automate
│       └── index.js    # Power Automate integration
├── client
│   ├── public          # Static assets
│   ├── src
│   │   ├── components  # UI components
│   │   ├── App.js      # Main React application
│   │   └── index.js    # React entry point
│   └── package.json    # Client dependencies
├── lib
│   └── mongodb.js      # MongoDB connection
├── vestaboard          # Vestaboard integration
│   ├── eventConversion.js
│   ├── flightConversion.js
│   └── vestaboard.js
├── .env                # Environment variables
├── package.json        # Server dependencies
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## Running Locally

1. Install dependencies:
   ```
   npm install
   cd client && npm install
   ```

2. Start the application:
   ```
   # For development (requires vercel CLI)
   npm install -g vercel
   vercel dev
   
   # In another terminal window
   cd client && npm start
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Deploying to Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy:
   ```
   vercel
   ```

## API Endpoints

- `/api/events` - CRUD operations for events
- `/api/flights` - CRUD operations for flights
- `/api/power-automate` - Power Automate integration

## Environment Variables

Ensure your `.env` file contains:
- `MONGODB_URI` - MongoDB connection string
- `VESTABOARD_API_KEY` - Vestaboard API key (if used)
- `VESTABOARD_SUBSCRIPTION_ID` - Vestaboard subscription ID
