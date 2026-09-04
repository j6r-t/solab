# Authentication Middleware Testing Guide

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, run the test script:**
   ```bash
   node scripts/test-auth-middleware.js
   ```

## What the Tests Do

The test script verifies that the authentication middleware works correctly:

1. ✅ **Public endpoints work without authentication** (login, setup)
2. ✅ **Protected endpoints reject requests without tokens**
3. ✅ **Protected endpoints reject invalid tokens**
4. ✅ **Protected endpoints accept valid tokens**
5. ✅ **User info is correctly passed to controllers**

## Manual Testing

If you prefer manual testing, use these commands:

### 1. Test Public Endpoint (No Auth Required)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}'
```

**Expected:** Returns JWT token

### 2. Test Protected Endpoint Without Token
```bash
curl http://localhost:3000/api/clients
```

**Expected:** `401 Unauthorized`

### 3. Test Protected Endpoint With Invalid Token
```bash
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer invalid-token"
```

**Expected:** `401 Unauthorized`

### 4. Test Protected Endpoint With Valid Token
```bash
# First, get a token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}' \
  | jq -r '.token')

# Then use it
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Returns list of clients

## Troubleshooting

### If all tests fail:
1. Check that the dev server is running on `http://localhost:3000`
2. Verify that `src/middleware.ts` exists and has no syntax errors
3. Check the server console for any errors

### If protected endpoints work without authentication:
1. Verify the middleware `matcher` config includes `/api/:path*`
2. Check that the middleware file is in the correct location (`src/middleware.ts`)
3. Restart the dev server

### If public endpoints require authentication:
1. Check the middleware's public route exceptions
2. Verify the pathname matching logic

## Next Steps

After confirming the middleware works:

1. ✅ Update REFACTORING_PROGRESS.md
2. ✅ Move to Issue #3: Remove hardcoded security secrets
3. ✅ Continue with Phase 1 security fixes

## Notes

- The middleware runs on every API request
- Public routes: `/api/auth/*`, `/login`
- Protected routes: All other `/api/*` routes
- User info is passed to controllers via headers: `x-user-email`, `x-user-role`
