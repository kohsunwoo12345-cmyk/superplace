const fetch = require('node-fetch');

async function getSchema() {
  const url = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + encodeURIComponent('PRAGMA table_info(homework_submissions)');
  const res = await fetch(url);
  const data = await res.json();
  console.log('homework_submissions 테이블 구조:');
  console.log(JSON.stringify(data, null, 2));
}

getSchema();
