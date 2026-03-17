const fetch = require('node-fetch');

async function checkImages() {
  // homework_images 테이블 스키마
  const schemaUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + encodeURIComponent('PRAGMA table_info(homework_images)');
  const schemaRes = await fetch(schemaUrl);
  const schemaData = await schemaRes.json();
  console.log('homework_images 스키마:');
  console.log(JSON.stringify(schemaData, null, 2));
  
  // homework_images 샘플 데이터
  const dataUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + encodeURIComponent('SELECT * FROM homework_images LIMIT 5');
  const dataRes = await fetch(dataUrl);
  const data = await dataRes.json();
  console.log('\nhomework_images 샘플:');
  console.log(JSON.stringify(data, null, 2));
}

checkImages();
