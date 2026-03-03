// Test parsing logic
const notes = "이름: 고희준\\n이메일: wangholy1@naver.com\\n연락처: 1232\\n기간: 12months";

console.log("Original notes:", notes);
console.log("\nSplit test:");

// Test 1: split by \\n (escaped)
const lines1 = notes.split("\\n");
console.log("Split by \\\\n:", lines1);

// Test 2: split by regex
const lines2 = notes.split(/\\n|\n/);
console.log("Split by regex /\\\\n|\\n/:", lines2);

// Test actual parsing
const parsed = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
};

lines2.forEach((line) => {
  const trimmedLine = line.trim();
  console.log("Processing line:", trimmedLine);
  
  if (trimmedLine.startsWith("이름:")) {
    parsed.applicantName = trimmedLine.replace("이름:", "").trim();
  } else if (trimmedLine.startsWith("이메일:")) {
    parsed.applicantEmail = trimmedLine.replace("이메일:", "").trim();
  } else if (trimmedLine.startsWith("연락처:")) {
    parsed.applicantPhone = trimmedLine.replace("연락처:", "").trim();
  }
});

console.log("\nParsed result:", parsed);
