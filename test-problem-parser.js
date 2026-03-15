#!/usr/bin/env node

/**
 * 문제지 파싱 테스트 스크립트
 * 학생용/강사용 분리 로직 검증
 */

const sampleText = `
**소인수분해 객관식 테스트 (20문제)**

---

**학생용 시험지**

1. 12를 소인수분해하면?
   ① 2² × 3
   ② 2 × 3²
   ③ 2³ × 3
   ④ 2 × 6
   ⑤ 3 × 4

2. 18의 소인수는 몇 개인가?
   ① 1개
   ② 2개
   ③ 3개
   ④ 4개
   ⑤ 5개

3. 24를 소인수분해하면?
   ① 2³ × 3
   ② 2² × 3²
   ③ 2⁴ × 3
   ④ 2² × 6
   ⑤ 4 × 6

---

**강사용 해설지**

**정답 및 해설**

1. 정답: ①
   해설: 12 = 2 × 6 = 2 × 2 × 3 = 2² × 3
   단계별 풀이: 12를 가장 작은 소수 2로 나눈 후, 6을 다시 2와 3으로 분해합니다.

2. 정답: ②
   해설: 18 = 2 × 3²이므로 소인수는 2와 3, 총 2개입니다.
   주의사항: 지수는 개수가 아니라 거듭제곱 횟수입니다.

3. 정답: ①
   해설: 24 = 2 × 12 = 2 × 2 × 6 = 2 × 2 × 2 × 3 = 2³ × 3
   팁: 2로 계속 나누다가 홀수가 나오면 3으로 나눕니다.
`;

function parseProblemSheet(fullText) {
  console.log('\n========== 문제지 파싱 시작 ==========\n');
  
  // Step 1: 학생용/강사용 섹션 분리
  const sections = {
    student: '',
    teacher: ''
  };
  
  // 패턴 1: "**강사용 해설지**" 또는 "**정답 및 해설**" 찾기
  const teacherMarkers = [
    /\*\*강사용[\s\S]*?\*\*/i,
    /\*\*정답\s*및\s*해설\*\*/i,
    /\*\*정답\*\*/i,
    /^##\s*정답/mi,
    /^##\s*해설/mi,
    /^정답\s*및\s*해설/mi
  ];
  
  let splitIndex = -1;
  let usedMarker = '';
  
  for (const marker of teacherMarkers) {
    const match = fullText.match(marker);
    if (match) {
      splitIndex = match.index;
      usedMarker = match[0];
      break;
    }
  }
  
  if (splitIndex !== -1) {
    sections.student = fullText.substring(0, splitIndex).trim();
    sections.teacher = fullText.substring(splitIndex).trim();
    console.log(`✅ Found separator: "${usedMarker}" at index ${splitIndex}`);
    console.log(`📦 Student section: ${sections.student.length} chars`);
    console.log(`📦 Teacher section: ${sections.teacher.length} chars\n`);
  } else {
    // 구분자를 못 찾으면 전체를 학생용으로 간주
    sections.student = fullText;
    console.log('⚠️  No separator found, treating entire text as student section\n');
  }
  
  // Step 2: 학생용 섹션에서 문제 추출
  const problems = [];
  const studentLines = sections.student.split('\n');
  let currentNum = null;
  let currentContent = '';
  
  for (const line of studentLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 문제 번호 패턴: "1. ", "1) ", "**1.**" 등
    const numberMatch = trimmed.match(/^(?:\*\*)?(\d+)[.\)](?:\*\*)?\s*(.*)$/);
    
    if (numberMatch) {
      // 이전 문제 저장
      if (currentNum !== null && currentContent.trim()) {
        problems.push({
          number: currentNum,
          question: currentContent.trim(),
          answer: '',
          explanation: ''
        });
      }
      // 새 문제 시작
      currentNum = parseInt(numberMatch[1]);
      currentContent = numberMatch[2] || '';
    } else {
      // 현재 문제에 내용 추가 (보기 등)
      if (currentNum !== null) {
        currentContent += '\n' + trimmed;
      }
    }
  }
  
  // 마지막 문제 저장
  if (currentNum !== null && currentContent.trim()) {
    problems.push({
      number: currentNum,
      question: currentContent.trim(),
      answer: '',
      explanation: ''
    });
  }
  
  console.log(`📝 Extracted ${problems.length} problems from student section\n`);
  
  // Step 3: 강사용 섹션에서 답안/해설 추출
  if (sections.teacher) {
    const teacherLines = sections.teacher.split('\n');
    let currentNum = null;
    let currentAnswer = '';
    let currentExplanation = '';
    let isInExplanation = false;
    
    for (const line of teacherLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // 문제 번호 패턴
      const numberMatch = trimmed.match(/^(?:\*\*)?(\d+)[.\)](?:\*\*)?\s*(.*)$/);
      
      if (numberMatch) {
        // 이전 답안/해설 저장
        if (currentNum !== null) {
          const problem = problems.find(p => p.number === currentNum);
          if (problem) {
            problem.answer = currentAnswer.trim();
            problem.explanation = currentExplanation.trim();
          }
        }
        // 새 답안 시작
        currentNum = parseInt(numberMatch[1]);
        currentAnswer = '';
        currentExplanation = '';
        isInExplanation = false;
        
        const restOfLine = numberMatch[2];
        // "정답: ①" 형태 처리
        const answerMatch = restOfLine.match(/^정답\s*[:：]\s*(.*)$/);
        if (answerMatch) {
          currentAnswer = answerMatch[1];
        }
      } else if (currentNum !== null) {
        // "정답: ①" 별도 줄
        const answerMatch = trimmed.match(/^정답\s*[:：]\s*(.*)$/i);
        if (answerMatch) {
          currentAnswer = answerMatch[1];
          isInExplanation = false;
        }
        // "해설:", "풀이:", "단계별 풀이:" 등
        else if (/^(?:해설|풀이|단계별|주의|팁|참고)\s*[:：]/i.test(trimmed)) {
          isInExplanation = true;
          const explMatch = trimmed.match(/^(?:해설|풀이|단계별|주의|팁|참고)\s*[:：]\s*(.*)$/i);
          if (explMatch) {
            currentExplanation += (currentExplanation ? '\n' : '') + explMatch[1];
          }
        }
        // 해설 내용 계속
        else if (isInExplanation) {
          currentExplanation += '\n' + trimmed;
        }
        // 정답 내용 계속
        else if (currentAnswer) {
          currentAnswer += ' ' + trimmed;
        }
      }
    }
    
    // 마지막 답안/해설 저장
    if (currentNum !== null) {
      const problem = problems.find(p => p.number === currentNum);
      if (problem) {
        problem.answer = currentAnswer.trim();
        problem.explanation = currentExplanation.trim();
      }
    }
    
    const answeredCount = problems.filter(p => p.answer).length;
    console.log(`✅ Matched ${answeredCount} answers from teacher section\n`);
  }
  
  // Step 4: 결과 출력
  console.log('========== 파싱 결과 ==========\n');
  problems.forEach(p => {
    console.log(`문제 ${p.number}:`);
    console.log(`  질문: ${p.question.substring(0, 60)}...`);
    console.log(`  정답: ${p.answer || '(없음)'}`);
    console.log(`  해설: ${p.explanation ? p.explanation.substring(0, 60) + '...' : '(없음)'}`);
    console.log('');
  });
  
  return {
    problems,
    studentSection: sections.student,
    teacherSection: sections.teacher
  };
}

// 테스트 실행
const result = parseProblemSheet(sampleText);

console.log('\n========== 통계 ==========');
console.log(`총 문제 수: ${result.problems.length}`);
console.log(`답안 있는 문제: ${result.problems.filter(p => p.answer).length}`);
console.log(`해설 있는 문제: ${result.problems.filter(p => p.explanation).length}`);

// 학생용 시험지 생성 테스트
console.log('\n========== 학생용 시험지 생성 ==========');
const studentSheet = result.problems.map(p => 
  `${p.number}. ${p.question}`
).join('\n\n');
console.log(studentSheet.substring(0, 300) + '...\n');

// 강사용 해설지 생성 테스트
console.log('========== 강사용 해설지 생성 ==========');
const teacherSheet = result.problems.map(p => 
  `${p.number}. 정답: ${p.answer}\n   해설: ${p.explanation || '해설 없음'}`
).join('\n\n');
console.log(teacherSheet.substring(0, 300) + '...\n');

console.log('✅ 테스트 완료!');
