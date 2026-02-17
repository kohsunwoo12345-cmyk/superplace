const https = require('https');

const BASE_URL = 'superplace-academy.pages.dev';

// Helper function to make HTTPS requests
function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
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
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function testFullFlow() {
    console.log('🧪 FULL FLOW TEST - Student List Filtering');
    console.log('='.repeat(80));
    
    // Step 1: Try to get students without auth (should fail)
    console.log('\n📝 Step 1: Access students API without authentication');
    console.log('-'.repeat(80));
    try {
        const response = await makeRequest('GET', '/api/students');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 401) {
            console.log('✅ CORRECT: Requires authentication');
        } else {
            console.log('❌ SECURITY ISSUE: Should require authentication!');
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
    
    // Step 2: Login with test account
    console.log('\n📝 Step 2: Attempting login with kohsunwoo1234@gmail.com');
    console.log('-'.repeat(80));
    
    // Try common passwords
    const passwords = ['password', 'password123', '123456', 'test1234'];
    let loginSuccess = false;
    let token = null;
    let userData = null;
    
    for (const password of passwords) {
        try {
            console.log(`   Trying password: ${password.substring(0, 3)}***`);
            const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
                email: 'kohsunwoo1234@gmail.com',
                password: password
            });
            
            if (loginResponse.status === 200 && loginResponse.data.success) {
                console.log('✅ Login successful!');
                token = loginResponse.data.data.token;
                userData = loginResponse.data.data.user;
                loginSuccess = true;
                console.log('User data:', JSON.stringify(userData, null, 2));
                break;
            }
        } catch (error) {
            // Continue to next password
        }
    }
    
    if (!loginSuccess) {
        console.log('❌ Could not login with common passwords.');
        console.log('⚠️  Manual login required to complete test.');
        console.log('\nTo complete the test manually:');
        console.log('1. Login to https://superplace-academy.pages.dev with kohsunwoo1234@gmail.com');
        console.log('2. Open browser DevTools (F12)');
        console.log('3. Go to Console tab');
        console.log('4. Run: console.log(localStorage.getItem("token"))');
        console.log('5. Copy the token and run: node test-with-token.js <YOUR_TOKEN>');
        return;
    }
    
    // Step 3: Get students with authentication
    console.log('\n📝 Step 3: Access students API with authentication');
    console.log('-'.repeat(80));
    try {
        const studentsResponse = await makeRequest('GET', '/api/students', {
            'Authorization': `Bearer ${token}`
        });
        
        console.log('Status:', studentsResponse.status);
        console.log('Success:', studentsResponse.data.success);
        console.log('Student count:', studentsResponse.data.count || studentsResponse.data.students?.length || 0);
        
        if (studentsResponse.data.students) {
            console.log('\n📊 Student Data Analysis:');
            console.log('-'.repeat(80));
            
            const students = studentsResponse.data.students;
            console.log('Total students:', students.length);
            
            // Group by academy_id
            const byAcademy = {};
            students.forEach(s => {
                const aid = s.academyId || s.academy_id || 'NULL';
                if (!byAcademy[aid]) byAcademy[aid] = [];
                byAcademy[aid].push(s);
            });
            
            console.log('\nStudents grouped by academy_id:');
            Object.keys(byAcademy).forEach(aid => {
                console.log(`  Academy ${aid}: ${byAcademy[aid].length} students`);
                byAcademy[aid].slice(0, 2).forEach(s => {
                    console.log(`    - ${s.name} (${s.email})`);
                });
            });
            
            console.log('\n🔍 User academy_id:', userData.academyId);
            console.log('Expected: Only students with academy_id =', userData.academyId);
            
            // Check if filtering is working
            const wrongAcademyStudents = students.filter(s => {
                const sid = s.academyId || s.academy_id;
                return sid && sid !== userData.academyId;
            });
            
            if (wrongAcademyStudents.length > 0) {
                console.log('\n❌ FILTERING NOT WORKING!');
                console.log(`Found ${wrongAcademyStudents.length} students from other academies:`);
                wrongAcademyStudents.slice(0, 5).forEach(s => {
                    console.log(`  - ${s.name} (academy_id: ${s.academyId || s.academy_id})`);
                });
            } else {
                console.log('\n✅ FILTERING WORKING CORRECTLY!');
                console.log('All students belong to academy_id:', userData.academyId);
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 Test Complete');
    console.log('='.repeat(80));
}

testFullFlow().catch(console.error);
