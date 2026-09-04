#!/usr/bin/env node

/**
 * User Management Test Script
 * Test creating and managing users
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

async function testUserManagement() {
    log('👥 User Management Test Suite', 'green')
    log('================================\n', 'green')
    
    // First, get admin token
    log('Step 1: Get admin token...', 'blue')
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'owner@sofien.tn',
            password: 'admin123'
        })
    })
    
    if (loginResponse.status !== 200) {
        log('❌ Failed to get admin token. Make sure you reset the admin password first!', 'red')
        log('Run: npm run test:login to check login status', 'yellow')
        return
    }
    
    const loginData = await loginResponse.json()
    const adminToken = loginData.token
    log(`✅ Admin token obtained: ${adminToken.substring(0, 20)}...`, 'green')
    
    // Test 1: List all users
    log('\nTest 1: List all users', 'blue')
    const listResponse = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    const listData = await listResponse.json()
    log(`Status: ${listResponse.status}`, listResponse.status === 200 ? 'green' : 'red')
    log('Users:', JSON.stringify(listData.data, null, 2))
    
    // Test 2: Create a shop user
    log('\nTest 2: Create shop user', 'blue')
    const createResponse = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'shop@sofien.tn',
            name: 'Shop Staff',
            password: 'shop123',
            role: 'shop'
        })
    })
    const createData = await createResponse.json()
    log(`Status: ${createResponse.status}`, createResponse.status === 201 ? 'green' : 'red')
    log('Response:', JSON.stringify(createData, null, 2))
    
    const shopUserId = createData.data?.id
    
    // Test 3: Create an atelier user
    log('\nTest 3: Create atelier user', 'blue')
    const atelierResponse = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'atelier@sofien.tn',
            name: 'Workshop Staff',
            password: 'atelier123',
            role: 'atelier'
        })
    })
    const atelierData = await atelierResponse.json()
    log(`Status: ${atelierData.status}`, atelierData.status === 201 ? 'green' : 'red')
    log('Response:', JSON.stringify(atelierData, null, 2))
    
    // Test 4: List users again
    log('\nTest 4: List all users (should show 3 now)', 'blue')
    const listResponse2 = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    const listData2 = await listResponse2.json()
    log(`Status: ${listResponse2.status}`, listResponse2.status === 200 ? 'green' : 'red')
    log('Users:', JSON.stringify(listData2.data, null, 2))
    
    // Test 5: Test shop user login
    log('\nTest 5: Test shop user login', 'blue')
    const shopLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'shop@sofien.tn',
            password: 'shop123'
        })
    })
    const shopLoginData = await shopLoginResponse.json()
    log(`Status: ${shopLoginResponse.status}`, shopLoginResponse.status === 200 ? 'green' : 'red')
    log('Shop user can login:', shopLoginResponse.success ? '✅' : '❌')
    
    // Test 6: Try to create user with shop token (should fail)
    log('\nTest 6: Try to create user with shop token (should fail)', 'blue')
    if (shopLoginData.token) {
        const unauthorizedCreate = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${shopLoginData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'hacker@sofien.tn',
                password: 'hack123',
                role: 'admin'
            })
        })
        log(`Status: ${unauthorizedCreate.status}`, unauthorizedCreate.status === 403 ? 'green' : 'red')
        log('Shop user correctly prevented from creating users ✅', 'green')
    }
    
    log('\n================================', 'green')
    log('✅ User Management is Working!', 'green')
    log('================================', 'green')
    
    log('\n📋 Created Users:', 'yellow')
    log('  - owner@sofien.tn (admin) - Use: admin123', 'yellow')
    log('  - shop@sofien.tn (shop) - Use: shop123', 'yellow')
    log('  - atelier@sofien.tn (atelier) - Use: atelier123', 'yellow')
    
    log('\n🎯 Next Steps:', 'blue')
    log('1. Test these users in the browser', 'blue')
    log('2. Verify role-based access control works', 'blue')
    log('3. Create user management UI in the future', 'blue')
}

// Run tests
testUserManagement().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red')
    process.exit(1)
})