const https = require('https');

const API_URL = 'superplace-academy.pages.dev';
const API_PATH = '/api/students';

console.log('🔍 Testing Students API Security\n');
console.log('=' .repeat(80));

// Test 1: No Authorization header
function test1_noAuth() {
    return new Promise((resolve) => {
        console.log('\n📝 Test 1: No Authorization Header');
        console.log('-'.repeat(80));
        
        const options = {
            hostname: API_URL,
            path: API_PATH,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (res.statusCode === 401) {
                        console.log('✅ PASSED: Returns 401 Unauthorized');
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    } else if (res.statusCode === 200) {
                        console.log('❌ FAILED: Should require authorization but got 200 OK');
                        console.log('   Student count:', jsonData.students?.length || 0);
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    } else {
                        console.log(`⚠️  Unexpected status: ${res.statusCode}`);
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    }
                } catch (e) {
                    console.log('❌ ERROR parsing response:', e.message);
                    console.log('   Raw data:', data);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

// Test 2: With query parameters (old vulnerable method)
function test2_queryParams() {
    return new Promise((resolve) => {
        console.log('\n📝 Test 2: Query Parameters (Old Vulnerable Method)');
        console.log('-'.repeat(80));
        
        const options = {
            hostname: API_URL,
            path: API_PATH + '?role=ADMIN&academyId=1',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (res.statusCode === 401) {
                        console.log('✅ PASSED: Query params rejected without auth');
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    } else if (res.statusCode === 200 && jsonData.students) {
                        console.log('❌ FAILED: Old vulnerable code still works!');
                        console.log('   Student count:', jsonData.students.length);
                        console.log('   First 3 students:');
                        jsonData.students.slice(0, 3).forEach(s => {
                            console.log(`     - ${s.name} (${s.email}) - Academy ID: ${s.academyId || 'NULL'}`);
                        });
                        
                        // Check unique academy IDs
                        const academyIds = [...new Set(jsonData.students.map(s => s.academyId).filter(id => id))];
                        console.log('   Unique Academy IDs:', academyIds);
                    } else {
                        console.log(`⚠️  Unexpected status: ${res.statusCode}`);
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    }
                } catch (e) {
                    console.log('❌ ERROR parsing response:', e.message);
                    console.log('   Raw data:', data);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

// Test 3: With fake Bearer token
function test3_fakeToken() {
    return new Promise((resolve) => {
        console.log('\n📝 Test 3: Fake Bearer Token');
        console.log('-'.repeat(80));
        
        // Create a fake token (not properly signed)
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5LCJlbWFpbCI6ImhhY2tlckBldmlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImFjYWRlbXlJZCI6bnVsbH0.fake-signature';
        
        const options = {
            hostname: API_URL,
            path: API_PATH,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fakeToken}`
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (res.statusCode === 401) {
                        console.log('✅ PASSED: Fake token rejected');
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    } else if (res.statusCode === 200 && jsonData.students) {
                        console.log('❌ FAILED: Fake token accepted!');
                        console.log('   Student count:', jsonData.students.length);
                        console.log('   This means token validation is NOT working!');
                    } else {
                        console.log(`⚠️  Unexpected status: ${res.statusCode}`);
                        console.log('   Response:', JSON.stringify(jsonData, null, 2));
                    }
                } catch (e) {
                    console.log('❌ ERROR parsing response:', e.message);
                    console.log('   Raw data:', data);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

// Run all tests
(async () => {
    await test1_noAuth();
    await test2_queryParams();
    await test3_fakeToken();
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 Test Suite Complete');
    console.log('='.repeat(80));
    console.log('\nIf any tests FAILED, the security fix is not deployed yet.');
    console.log('Expected: All tests should PASS (return 401 Unauthorized)\n');
})();
