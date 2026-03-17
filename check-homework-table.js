const fetch = require('node-fetch');

async function checkHomeworkTable() {
  const url = 'https://superplacestudy.pages.dev/api/debug-users?table=homework_submissions&limit=5';
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

checkHomeworkTable();
