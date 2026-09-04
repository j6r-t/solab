#!/usr/bin/env node

/**
 * Simple User Creation Test
 */

const API_BASE = 'http://localhost:3000/api'

// Colors
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

async function testSimpleUserCreation() {
    log('👥 Simple User Creation Test', 'green')
    log('==============================\n', 'green')
    
    // Step 1: Get admin token
    log('Step 1: Getting admin token...', 'blue')
    
    try {
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'owner@sofien.tn',
                password: 'admin123'
            })
        })
        
        const loginData = await loginResponse.json()
        
        if (loginResponse.status !== 200 || !loginData.token) {
            log('❌ Failed to get admin token', 'red')
            log('Response:', JSON.stringify(loginData, null, 2), 'red')
            log('\n⚠️  First, reset your admin password:', 'yellow')
            log('curl -X POST http://localhost:3000/api/dev/reset-admin-password -H "Content-Type: application/json" -d \'{"newPassword":"admin123"}\'', 'yellow')
            return
        }
        
        const adminToken = loginData.token
        log(`✅ Admin token obtained`, 'green')
        
        // Step 2: Create shop user
        log('\nStep 2: Creating shop user...', 'blue')
        
        const shopResponse = await fetch(`${API_BASE}/users`, {
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
        
        log(`Status: ${shopResponse.status}`, shopResponse.status === 201 ? 'green' : 'red')
        
        const shopData = await shopResponse.json()
        log('Response:', JSON.stringify(shopData, null, 2))
        
        if (shopResponse.status === 201) {
            log('✅ Shop user created successfully!', 'green')
            log('   Email: shop@sofien.tn', 'yellow')
            log('   Password: shop123', 'yellow')
            log('   Role: shop', 'yellow')
        } else if (shopResponse.status === 400 && shopData.message?.includes('already exists')) {
            log('ℹ️  Shop user already exists (skipping)', 'yellow')
        } else {
            log('❌ Failed to create shop user', 'red')
            log('Response:', JSON.stringify(shopData, null, 2), 'red')
        }
        
        // Step 3: Create atelier user
        log('\nStep 3: Creating atelier user...', 'blue')
        
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
        
        log(`Status: ${atelierResponse.status}`, atelierResponse.status === 201 ? 'green' : 'red')
        
        const atelierData = await atelierResponse.json()
        log('Response:', JSON.stringify(atelierData, null, 2))
        
        if (atelierResponse.status === 201) {
            log('✅ Atelier user created successfully!', 'green')
            log('   Email: atelier@sofien.tn', 'yellow')
            log('   Password: atelier123', 'yellow')
            log('   Role: atelier', 'yellow')
        } else if (atelierResponse.status === 400 && atelierData.message?.includes('already exists')) {
            log('ℹ️  Atelier user already exists (skipping)', 'yellow')
        } else {
            log('❌ Failed to create atelier user', 'red')
            log('Response:', JSON.stringify(atelierData, null, 2), 'red')
        }
        
        // Step 4: List all users
        log('\nStep 4: Listing all users...', 'blue')
        
        const listResponse = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        })
        
        const listData = await listResponse.json()
        log(`Status: ${listResponse.status}`, listResponse.status === 200 ? 'green' : 'red')
        
        if (listResponse.status === 200) {
            // ok() returns data directly, not wrapped in { data: ... }
            const users = Array.isArray(listData) ? listData : listData.data || []
            log(`Found ${users.length} users:`, 'green')
            users.forEach((u, i) => {
                log(`   ${i + 1}. ${u.email} (${u.role})${u.name ? ' - ' + u.name : ''}`, 'yellow')
            })
        } else {
            log('Error:', JSON.stringify(listData, null, 2), 'red')
        }
        
        // Summary
        log('\n==============================', 'green')
        
        const shopOk = shopResponse.status === 201 || (shopResponse.status === 400 && shopData.message?.includes('already exists'))
        const atelierOk = atelierResponse.status === 201 || (atelierResponse.status === 400 && atelierData.message?.includes('already exists'))
        const listOk = listResponse.status === 200

        if (shopOk && atelierOk && listOk) {
            log('✅ User Management Working Perfectly!', 'green')
            log('\n👥 Created Users:', 'yellow')
            log('   1. owner@sofien.tn (admin) - password: admin123', 'yellow')
            log('   2. shop@sofien.tn (shop) - password: shop123', 'yellow')
            log('   3. atelier@sofien.tn (atelier) - password: atelier123', 'yellow')
        } else {
            log('⚠️  Some users failed to create', 'yellow')
            log('Check the error messages above for details', 'yellow')
        }
        
        log('==============================\n', 'green')
        
    } catch (error) {
        log(`\n❌ Test failed: ${error.message}`, 'red')
        log('Stack:', error.stack, 'red')
    }
}

testSimpleUserCreation()