# Railway Deployment Guide

## Environment Variables Required

Set these environment variables in your Railway project settings:

### Required Variables:
- `DB_API_URL` - Database API server URL (set to `https://linkerdb.up.railway.app`)
- `JWT_SECRET` - A secure random string for JWT token signing
- `NODE_ENV` - Set to "production"

### Optional Variables:
- `PORT` - Railway sets this automatically, but you can override if needed

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**: Add the required environment variables in Railway dashboard
3. **Deploy**: Railway will automatically build and deploy your application

## Database Setup

The application now uses an external database API server. The database server should be deployed separately and the `DB_API_URL` environment variable should point to the deployed database API.

## Build Process

Railway will:
1. Install dependencies (`npm ci`)
2. Build the Next.js application (`npm run build`)
3. Start the server (`npm start`)

## Health Check

The application includes a health check endpoint at `/` that Railway will use to verify the deployment.

## Custom Server

This application uses a custom Node.js server with Socket.io integration, which is fully supported by Railway.
