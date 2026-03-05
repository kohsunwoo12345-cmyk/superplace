const https = require('https');

const BASE_URL = 'superplacestudy.pages.dev';

// Test 1: Get products to find a real product ID
console.log('🔍 Step 1: Fetching products...\n');

const getProducts = new Promise((resolve, reject) => {
  const options = {
    hostname: BASE_URL,
    path: '/api/admin/store-products?activeOnly=true',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log('Response:', JSON.stringify(json, null, 2));
        resolve(json);
      } catch (e) {
        console.error('Parse error:', e);
        reject(e);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
    reject(error);
  });

  req.end();
});

getProducts.then(productData => {
  console.log('\n✅ Products retrieved\n');
  
  if (productData.products && productData.products.length > 0) {
    const product = productData.products[0];
    console.log('Using product:', {
      id: product.id,
      name: product.name,
      pricePerStudent: product.pricePerStudent,
      monthlyPrice: product.monthlyPrice
    });
    
    // Test 2: Create purchase request
    console.log('\n🔍 Step 2: Creating purchase request...\n');
    
    const purchaseData = {
      productId: product.id,
      productName: product.name,
      studentCount: 10,
      months: 3,
      pricePerStudent: product.pricePerStudent || product.monthlyPrice || 10000,
      totalPrice: 10 * 3 * (product.pricePerStudent || product.monthlyPrice || 10000),
      email: 'test@example.com',
      name: '테스트 구매자',
      academyName: '테스트 학원',
      phoneNumber: '010-1234-5678',
      requestMessage: 'Automated test purchase'
    };
    
    console.log('Purchase data:', JSON.stringify(purchaseData, null, 2));
    
    const postData = JSON.stringify(purchaseData);
    
    const options = {
      hostname: BASE_URL,
      path: '/api/bot-purchase-requests/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\nStatus: ${res.statusCode}`);
        console.log('Response:', data);
        
        if (res.statusCode === 200) {
          console.log('\n✅ Purchase request created successfully!');
        } else {
          console.log('\n❌ Purchase request failed');
          try {
            const error = JSON.parse(data);
            console.log('\nError details:', JSON.stringify(error, null, 2));
          } catch (e) {
            console.log('Raw error:', data);
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Request error:', error);
    });
    
    req.write(postData);
    req.end();
    
  } else {
    console.log('❌ No products found');
  }
}).catch(err => {
  console.error('Failed to get products:', err);
});
