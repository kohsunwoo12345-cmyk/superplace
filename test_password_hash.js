// Test password hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function test() {
  const passwords = {
    'admin1234': await hashPassword('admin1234'),
    'test1234': await hashPassword('test1234'),
    'director1234': await hashPassword('director1234'),
    'teacher1234': await hashPassword('teacher1234'),
  };
  
  console.log('Password hashes:');
  for (const [pwd, hash] of Object.entries(passwords)) {
    console.log(`${pwd}: ${hash}`);
  }
}

test();
