#!/usr/bin/env node

/**
 * Quick login test to debug authentication issues
 */

const API_BASE = 'http://localhost:3000/api'

async function testLogin() {
    console.log('🔐 Testing Login Authentication')
    console.log('==============================\n')
    
    // Test 1: Try login with admin credentials
    console.log('Test 1: Admin login attempt')
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'owner@sofien.tn',
                password: 'admin123' // Try the default password first
            })
        })
        
        console.log(`Status: ${response.status}`)
        const data = await response.json()
        console.log('Response:', JSON.stringify(data, null, 2))
        
        if (response.status === 200 && data.token) {
            console.log('\n✅ SUCCESS: Login works!')
            console.log('Token:', data.token.substring(0, 20) + '...')
        } else {
            console.log('\n❌ FAILED: Login returned error')
            console.log('Possible issues:')
            console.log('1. Wrong password')
            console.log('2. Admin user doesn\'t exist')
            console.log('3. JWT_SECRET not loaded properly')
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message)
    }
    
    // Test 2: Check if admin setup is needed
    console.log('\n\nTest 2: Check if admin exists')
    try {
        const response = await fetch(`${API_BASE}/auth/setup`, {
            method: 'POST'
        })
        
        const data = await response.json()
        
        if (response.status === 200) {
            console.log('✅ Admin created successfully!')
            console.log('Email:', data.data.user.email)
            console.log('Password:', data.data.defaultPassword)
            console.log('\n🔑 Use this password to login!')
        } else if (response.status === 400 && data.message === 'Admin user already exists') {
            console.log('✅ Admin already exists')
            console.log('Try resetting the password or check your credentials')
        } else {
            console.log('Status:', response.status)
            console.log('Response:', data)
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message)
    }
}

testLogin()