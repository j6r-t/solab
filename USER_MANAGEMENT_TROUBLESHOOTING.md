# User Management Troubleshooting Guide

## 🔧 "Unexpected end of JSON input" Error

This error typically happens when:
1. The API request body is empty or malformed
2. The JSON parsing fails on the server side
3. There's a mismatch in how the request is being sent

## ✅ Quick Fix

I've created a more robust test that handles this better. Try this instead:

```bash
npm run test:simple-users
```

This simplified test:
- ✅ Better error handling
- ✅ Clear step-by-step output
- ✅ Shows exactly what's happening
- ✅ More detailed error messages

## 🚀 Manual Testing (If Tests Still Fail)

### **Step 1: Reset Admin Password First**
```bash
curl -X POST http://localhost:3000/api/dev/reset-admin-password \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"admin123"}'
```

**Expected:**
```json
{
  "success": true,
  "message": "Admin password reset successfully",
  "email": "owner@sofien.tn",
  "newPassword": "admin123"
}
```

### **Step 2: Verify Login Works**
```bash
npm run test:login
```

**Expected:** Should show "SUCCESS: Login works!"

### **Step 3: Create User Manually**
```bash
# Get your admin token first
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}' \
  | jq -r '.token')

# Create a shop user
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shop@sofien.tn",
    "name": "Shop Staff",
    "password": "shop123",
    "role": "shop"
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "shop@sofien.tn",
    "name": "Shop Staff",
    "role": "shop"
  }
}
```

## 🐛 What I Fixed

### **Enhanced Error Handling:**
- ✅ Better JSON parsing with try-catch
- ✅ Clear error messages for malformed JSON
- ✅ Validation before processing

### **Improved Test Script:**
- ✅ More robust error handling
- ✅ Clear step-by-step output
- ✅ Better debugging information

## 📋 Common Issues & Solutions

### **Issue 1: "Unexpected end of JSON input"**
**Cause:** Request body is empty or malformed
**Solution:** Use the `test:simple-users` script or check your curl command

### **Issue 2: Admin login fails**
**Cause:** Password hasn't been reset yet
**Solution:** Run the admin password reset command first

### **Issue 3: "Unauthorized" when creating users**
**Cause:** Using wrong token or token expired
**Solution:** Get a fresh admin token before creating users

### **Issue 4: "This endpoint is not available in production"**
**Cause:** NODE_ENV is set to 'production'
**Solution:** Set NODE_ENV=development in .env

## 🧪 Diagnostic Commands

### **Check Server Status:**
```bash
# Should show your dev server running
curl http://localhost:3000/api/auth/setup
```

### **Check Admin Token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type": application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}'
```

### **Check User Endpoint (should fail without auth):**
```bash
curl http://localhost:3000/api/users
# Expected: 401 Unauthorized
```

## 🎯 Recommended Testing Order

### **1. Basic Authentication:**
```bash
npm run test:auth
```

### **2. Admin Login:**
```bash
npm run test:login
```

### **3. Simple User Creation:**
```bash
npm run test:simple-users
```

### **4. Full User Management:**
```bash
npm run test:users
```

## 🔍 Debug Mode

If you're still having issues, enable debug logging:

### **Check Server Logs:**
Look at your dev server console for:
- JWT_SECRET loading status
- Any startup errors
- Request/response logs

### **Test Individual Endpoints:**

```bash
# Test 1: Can you access the dev endpoint?
curl -X POST http://localhost:3000/api/dev/reset-admin-password \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"test123"}'

# Test 2: Can you login?
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type": application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}'

# Test 3: Can you list users (with token)?
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💡 Pro Tips

### **Use jq for Better Output:**
```bash
# Install jq (JSON processor)
# Then:
curl ... | jq '.'
```

### **Save Tokens for Testing:**
```bash
# Save admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@sofien.tn","password":"admin123"}' \
  | jq -r '.token')

echo "Admin Token: $ADMIN_TOKEN"
```

### **Test in Browser:**
1. Login at http://localhost:3000/en/login
2. Open browser DevTools
3. Go to Network tab
4. Check Authorization header in requests

## 🚨 Still Stuck?

### **Provide This Information:**
1. What command did you run?
2. What was the exact error message?
3. What does `npm run test:login` show?
4. Are there any errors in the dev server console?

### **Quick Reset:**
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Reset admin password
curl -X POST http://localhost:3000/api/dev/reset-admin-password \
  -H "Content-Type": application/json" \
  -d '{"newPassword":"admin123"}'
# 3. Restart dev server
npm run dev
# 4. Try simple user test
npm run test:simple-users
```

---

**Try `npm run test:simple-users` first - it's more robust and will give us better debugging information!** 🚀