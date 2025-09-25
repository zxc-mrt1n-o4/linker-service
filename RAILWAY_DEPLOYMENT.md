# Railway Deployment Guide

## Environment Variables Required

Set these environment variables in your Railway project settings:

### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string (Railway provides this automatically)
- `JWT_SECRET` - A secure random string for JWT token signing
- `NODE_ENV` - Set to "production"

### Optional Variables:
- `PORT` - Railway sets this automatically, but you can override if needed

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**: Add the required environment variables in Railway dashboard
3. **Deploy**: Railway will automatically build and deploy your application

## Database Setup

Railway will automatically provide a PostgreSQL database. The Prisma schema will be applied automatically during deployment.

## Build Process

Railway will:
1. Install dependencies (`npm ci`)
2. Generate Prisma client (`prisma generate`)
3. Build the Next.js application (`npm run build`)
4. Start the server (`npm start`)

## Health Check

The application includes a health check endpoint at `/` that Railway will use to verify the deployment.

## Custom Server

This application uses a custom Node.js server with Socket.io integration, which is fully supported by Railway.
