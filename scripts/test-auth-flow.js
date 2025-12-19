import fetch from 'node-fetch';

const API_BASE_URL = 'https://hollywood-andrew-cycle-genre.trycloudflare.com';
const USERNAME = 'programinglive';
const PASSWORD = 'mcpdevserver';

async function testAuthFlow() {
    console.log('🚀 Starting Auth Flow Test...');
    console.log(`Target: ${API_BASE_URL}\n`);

    try {
        // 1. Login
        console.log('1️⃣  Attempting Login...');
        const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
        });

        console.log(`   Status: ${loginRes.status}`);
        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;

        if (token) {
            console.log('   ✅ Login Successful! JWT Token received.');
            console.log(`   Token: ${token.substring(0, 20)}...`);
        } else {
            console.log('   ⚠️  Login successful but NO TOKEN returned (Legacy Session mode?)');
        }

        // 2. Access Protected Route (GET /me)
        console.log('\n2️⃣  Verifying Session/Token (GET /api/auth/me)...');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('   Using Authorization: Bearer header');
        } else {
            console.log('   Using Cookies (if any)');
        }

        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers,
        });

        console.log(`   Status: ${meRes.status}`);
        if (meRes.ok) {
            const meData = await meRes.json();
            console.log(`   ✅ Authorized! User: ${meData.username} (${meData.email})`);
        } else {
            console.error('   ❌ Authorization Failed!');
            console.error(await meRes.text());
        }

        // 3. Access History (GET /api/history)
        console.log('\n3️⃣  Fetching History...');
        const historyRes = await fetch(`${API_BASE_URL}/api/history`, { headers });
        console.log(`   Status: ${historyRes.status}`);

        if (historyRes.ok) {
            const historyData = await historyRes.json();
            console.log(`   ✅ History fetched! Count: ${historyData.history ? historyData.history.length : 0}`);
        } else {
            console.log('   ❌ History fetch failed.');
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

testAuthFlow();
