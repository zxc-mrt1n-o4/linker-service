# Migration Guide: External Database API

This guide explains how to migrate the linker-service from direct Prisma database access to using the external database API server.

## Changes Made

### 1. Removed Prisma Dependencies
- Removed `@prisma/client`, `@prisma/extension-accelerate`, `prisma`, and `@next-auth/prisma-adapter`
- Removed Prisma-related scripts from package.json
- Removed Prisma schema and seed files

### 2. Added Database Client
- Created `src/lib/db-client.ts` - A TypeScript client for the external database API
- Provides methods for all database operations (users, chat, issues, proxies)
- Handles authentication tokens automatically

### 3. Updated Server Configuration
- Modified `server.js` to test database API connection instead of direct Prisma connection
- Updated health check to work with external database

### 4. Environment Variables
- Added `DB_API_URL` environment variable (defaults to `https://linkerdb.up.railway.app`)
- Removed `DATABASE_URL` dependency

## API Route Migration

To migrate existing API routes to use the external database API:

### Before (Prisma):
```typescript
import { prisma } from '@/lib/prisma'

const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

### After (Database API):
```typescript
import { dbClient } from '@/lib/db-client'

const response = await dbClient.getUser(userId)
if (response.error) {
  return NextResponse.json({ error: response.error }, { status: 500 })
}
const user = response.data.user
```

## Required Updates for API Routes

The following API routes need to be updated to use the database client:

1. **Authentication Routes** (`/api/auth/*`)
   - Update login/register to use `dbClient.login()` and `dbClient.createUser()`
   - Update token verification to use `dbClient.verifyToken()`

2. **User Routes** (`/api/users/*`, `/api/admin/users/*`)
   - Update to use `dbClient.getUsers()`, `dbClient.getUser()`, `dbClient.updateUser()`

3. **Chat Routes** (`/api/chat/*`)
   - Update to use `dbClient.getMessages()`, `dbClient.createMessage()`

4. **Issue Routes** (`/api/issues/*`)
   - Update to use `dbClient.getIssues()`, `dbClient.createIssue()`, `dbClient.updateIssue()`

5. **Proxy Routes** (`/api/proxies/*`)
   - Update to use `dbClient.getProxies()`, `dbClient.createProxy()`, `dbClient.updateProxy()`

6. **Admin Routes** (`/api/admin/stats`)
   - Update to use `dbClient.getStats()`

## Error Handling

The database client returns responses in the format:
```typescript
{
  data?: T,      // Success response data
  error?: string // Error message if request failed
}
```

Always check for errors before using the data:
```typescript
const response = await dbClient.getUsers()
if (response.error) {
  return NextResponse.json({ error: response.error }, { status: 500 })
}
// Use response.data.users
```

## Authentication

The database client automatically handles JWT tokens:
- Set token after login: `dbClient.setToken(token)`
- Token is automatically included in subsequent requests
- No need to manually handle cookies or headers

## Deployment

1. Deploy the database server to Railway first
2. Update linker-service environment variables:
   - Set `DB_API_URL` to the deployed database API URL
   - Remove `DATABASE_URL` (no longer needed)
3. Deploy the updated linker-service

## Testing

Test the migration by:
1. Verifying all API endpoints work correctly
2. Checking that authentication flows properly
3. Ensuring chat, issues, and proxy functionality works
4. Testing admin functions and statistics
