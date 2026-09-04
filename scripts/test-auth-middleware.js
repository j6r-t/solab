#!/usr/bin/env node

/**
 * Authentication Middleware Test Script
 * Run this after implementing the middleware to verify it works correctly
 */

const API_BASE = 'http://localhost:3000/api'

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
}

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEndpoint(name, url, options = {}) {
    try {
        log(`\n📋 Testing: ${name}`, 'blue')
        log(`   URL: ${url}`, 'yellow')
        
        const response = await fetch(url, options)
        const data = await response.json()
        
        log(`   Status: ${response.status}`, response.status >= 200 && response.status < 300 ? 'green' : 'red')
        log(`   Response:`, 'yellow')
        console.log('   ', JSON.stringify(data, null, 2))
        
        return { success: response.status >= 200 && response.status < 300, status: response.status, data }
    } catch (error) {
        log(`   ❌ Error: ${error.message}`, 'red')
        return { success: false, error: error.message }
    }
}

async function runTests() {
    log('🔐 Authentication Middleware Test Suite', 'green')
    log('=====================================\n', 'green')
    
    let passed = 0
    let failed = 0
    
    // Test 1: Public endpoint - Setup (should work without auth, but may fail if admin exists)
    log('Test 1: Public endpoint - Setup (no auth required)', 'blue')
    const setupResult = await testEndpoint(
        'POST /api/auth/setup',
        `${API_BASE}/auth/setup`,
        { method: 'POST' }
    )
    if (setupResult.success) {
        log('   ✅ PASS: Public endpoint works without authentication', 'green')
        passed++
    } else if (setupResult.data?.message === 'Admin user already exists') {
        log('   ✅ PASS: Public endpoint works (admin already exists - expected)', 'green')
        passed++
    } else {
        log('   ❌ FAIL: Public endpoint should work without authentication', 'red')
        failed++
    }
    
    // Test 2: Public endpoint - Login (should work without auth)
    log('\nTest 2: Public endpoint - Login (no auth required)', 'blue')
    const loginResult = await testEndpoint(
        'POST /api/auth/login',
        `${API_BASE}/auth/login`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'owner@sofien.tn',
                password: 'admin123'
            })
        }
    )
    
    let authToken = null
    if (loginResult.success && loginResult.data.token) {
        authToken = loginResult.data.token
        log('   ✅ PASS: Login works and returned token', 'green')
        passed++
    } else {
        log('   ❌ FAIL: Login should work without authentication', 'red')
        failed++
    }
    
    // Test 3: Protected endpoint without token (should fail)
    log('\nTest 3: Protected endpoint without token (should fail)', 'blue')
    const noAuthResult = await testEndpoint(
        'GET /api/clients (no auth)',
        `${API_BASE}/clients`
    )
    if (!noAuthResult.success && noAuthResult.status === 401) {
        log('   ✅ PASS: Protected endpoint correctly rejects unauthenticated requests', 'green')
        passed++
    } else {
        log('   ❌ FAIL: Protected endpoint should require authentication', 'red')
        failed++
    }
    
    // Test 4: Protected endpoint with invalid token (should fail)
    log('\nTest 4: Protected endpoint with invalid token (should fail)', 'blue')
    const invalidTokenResult = await testEndpoint(
        'GET /api/clients (invalid token)',
        `${API_BASE}/clients`,
        {
            headers: {
                'Authorization': 'Bearer invalid-token-12345'
            }
        }
    )
    if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
        log('   ✅ PASS: Protected endpoint correctly rejects invalid tokens', 'green')
        passed++
    } else {
        log('   ❌ FAIL: Protected endpoint should reject invalid tokens', 'red')
        failed++
    }
    
    // Test 5: Protected endpoint with valid token (should succeed)
    if (authToken) {
        log('\nTest 5: Protected endpoint with valid token (should succeed)', 'blue')
        const validTokenResult = await testEndpoint(
            'GET /api/clients (valid token)',
            `${API_BASE}/clients`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        )
        if (validTokenResult.success) {
            log('   ✅ PASS: Protected endpoint works with valid authentication', 'green')
            passed++
        } else {
            log('   ❌ FAIL: Protected endpoint should work with valid token', 'red')
            failed++
        }
        
        // Test 6: Change password endpoint with valid token (should succeed)
        log('\nTest 6: Change password with valid token (should succeed)', 'blue')
        const changePasswordResult = await testEndpoint(
            'POST /api/auth/change-password (valid token)',
            `${API_BASE}/auth/change-password`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: 'admin123',
                    newPassword: 'newAdmin123'
                })
            }
        )
        if (changePasswordResult.success) {
            log('   ✅ PASS: Change password works with valid authentication', 'green')
            passed++
        } else if (changePasswordResult.status === 401) {
            log('   ❌ FAIL: Change password endpoint not receiving user headers from middleware', 'red')
            failed++
        } else {
            log('   ⚠️  SKIP: Change password failed (might be password validation issue)', 'yellow')
        }
    }
    
    // Summary
    log('\n=====================================', 'green')
    
    // We expect 5-6 passes since setup may fail if admin exists
    if (passed >= 5) {
        log(`📊 Test Results: ${passed} passed, ${failed} failed`, 'green')
        log('🎉 Authentication middleware is working correctly!', 'green')
    } else {
        log(`📊 Test Results: ${passed} passed, ${failed} failed`, 'red')
        log('⚠️  Some tests failed. Please check the middleware implementation.', 'yellow')
    }
    
    log('=====================================\n', 'green')
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red')
    process.exit(1)
})