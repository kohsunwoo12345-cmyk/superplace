const fs = require('fs');
const content = fs.readFileSync('src/app/ai-chat/page.tsx', 'utf8');
const lines = content.split('\n');

let openDivs = 0;
let closeDivs = 0;
let issues = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Count opening divs (excluding self-closing)
  const opens = (line.match(/<div(?!\s*\/>)/g) || []).length;
  openDivs += opens;
  
  // Count closing divs
  const closes = (line.match(/<\/div>/g) || []).length;
  closeDivs += closes;
  
  if (opens > 0 || closes > 0) {
    const balance = openDivs - closeDivs;
    if (lineNum >= 840 && lineNum <= 850) {
      console.log(`Line ${lineNum}: opens=${opens}, closes=${closes}, balance=${balance}`);
    }
    if (lineNum >= 1200) {
      console.log(`Line ${lineNum}: opens=${opens}, closes=${closes}, balance=${balance}`);
    }
  }
}

console.log(`\n총 열린 div: ${openDivs}`);
console.log(`총 닫힌 div: ${closeDivs}`);
console.log(`차이: ${openDivs - closeDivs}`);
