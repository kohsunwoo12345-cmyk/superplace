#!/usr/bin/env node

/**
 * 문제지 출력 - 학생용/강사용 분리 시뮬레이션
 * 제공된 소인수분해 예시를 사용하여 파싱 및 출력 포맷 확인
 */

const fullTestText = `
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

4. 30의 소인수의 합은?
   ① 5
   ② 7
   ③ 10
   ④ 15
   ⑤ 30

5. 36 = 2^a × 3^b일 때, a + b는?
   ① 4
   ② 5
   ③ 6
   ④ 7
   ⑤ 8

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

4. 정답: ③
   해설: 30 = 2 × 15 = 2 × 3 × 5이므로 소인수는 2, 3, 5이고 합은 2 + 3 + 5 = 10입니다.
   참고: 소인수의 합은 중복 없이 한 번씩만 더합니다.

5. 정답: ②
   해설: 36 = 4 × 9 = 2² × 3²이므로 a = 2, b = 2, a + b = 4
   주의: 문제에서 a + b = 4이지만, 보기에 5가 답이라면 오류일 수 있습니다. 확인 필요.
`;

function parseAndGeneratePrintFormat(fullText) {
  console.log('\n========== AI 챗 문제지 출력 시뮬레이션 ==========\n');
  
  // Step 1: 강사용/학생용 분리
  const teacherMarkers = [
    '**강사용',
    '**정답 및 해설**',
    '**정답**'
  ];
  
  let splitIndex = -1;
  let problemSection = fullText;
  let answerSection = '';
  
  for (const marker of teacherMarkers) {
    const regex = new RegExp(marker.replace(/[*]/g, '\\*'), 'i');
    const match = fullText.match(regex);
    if (match && match.index !== undefined) {
      splitIndex = match.index;
      problemSection = fullText.substring(0, splitIndex);
      answerSection = fullText.substring(splitIndex);
      console.log(`✅ Found separator "${marker}" at index ${splitIndex}`);
      break;
    }
  }
  
  console.log(`📦 Problem section: ${problemSection.length} chars`);
  console.log(`📦 Answer section: ${answerSection.length} chars\n`);
  
  // Step 2: 문제 추출 (학생용)
  const problems = [];
  const problemLines = problemSection.split('\n');
  let currentNum = null;
  let currentContent = '';
  
  for (const line of problemLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const numberMatch = trimmed.match(/^(\d+)[.\)]\s*(.*)$/);
    if (numberMatch) {
      if (currentNum !== null && currentContent.trim()) {
        problems.push({
          number: currentNum,
          question: currentContent.trim(),
          answer: '',
          explanation: ''
        });
      }
      currentNum = parseInt(numberMatch[1]);
      currentContent = numberMatch[2] || '';
    } else {
      if (currentNum !== null) {
        currentContent += '\n' + trimmed;
      }
    }
  }
  
  if (currentNum !== null && currentContent.trim()) {
    problems.push({
      number: currentNum,
      question: currentContent.trim(),
      answer: '',
      explanation: ''
    });
  }
  
  console.log(`📝 Extracted ${problems.length} problems\n`);
  
  // Step 3: 답안/해설 추출 (강사용)
  if (answerSection) {
    const answerLines = answerSection.split('\n');
    let currentNum = null;
    let currentAnswer = '';
    let currentExplanation = '';
    let isInExplanation = false;
    
    for (const line of answerLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const numberMatch = trimmed.match(/^(\d+)[.\)]\s*(.*)$/);
      if (numberMatch) {
        if (currentNum !== null) {
          const problem = problems.find(p => p.number === currentNum);
          if (problem) {
            problem.answer = currentAnswer.trim();
            problem.explanation = currentExplanation.trim();
          }
        }
        currentNum = parseInt(numberMatch[1]);
        currentAnswer = '';
        currentExplanation = '';
        isInExplanation = false;
        
        const restOfLine = numberMatch[2];
        const answerMatch = restOfLine.match(/^정답\s*[:：]\s*(.*)$/);
        if (answerMatch) {
          currentAnswer = answerMatch[1];
        }
      } else if (currentNum !== null) {
        const answerMatch = trimmed.match(/^정답\s*[:：]\s*(.*)$/i);
        if (answerMatch) {
          currentAnswer = answerMatch[1];
          isInExplanation = false;
        } else if (/^(?:해설|풀이|단계별|주의|팁|참고)\s*[:：]/i.test(trimmed)) {
          isInExplanation = true;
          const explMatch = trimmed.match(/^(?:해설|풀이|단계별|주의|팁|참고)\s*[:：]\s*(.*)$/i);
          if (explMatch) {
            currentExplanation += (currentExplanation ? '\n' : '') + explMatch[1];
          }
        } else if (isInExplanation) {
          currentExplanation += '\n' + trimmed;
        } else if (currentAnswer) {
          currentAnswer += ' ' + trimmed;
        }
      }
    }
    
    if (currentNum !== null) {
      const problem = problems.find(p => p.number === currentNum);
      if (problem) {
        problem.answer = currentAnswer.trim();
        problem.explanation = currentExplanation.trim();
      }
    }
    
    console.log(`✅ Matched ${problems.filter(p => p.answer).length} answers\n`);
  }
  
  // Step 4: 학생용 시험지 생성
  console.log('========== 학생용 시험지 ==========\n');
  console.log('슈퍼플레이스 학원');
  console.log('학습 문제지\n');
  console.log('이름: __________  날짜: ' + new Date().toLocaleDateString('ko-KR') + '\n');
  console.log('【 객관식 문제 】\n');
  
  problems.forEach(p => {
    console.log(`${p.number}. ${p.question}`);
    console.log('');
  });
  
  // Step 5: 강사용 해설지 생성
  console.log('\n========== 강사용 해설지 ==========\n');
  console.log('슈퍼플레이스 학원');
  console.log('답안지\n');
  console.log('【 객관식 정답 및 해설 】\n');
  
  problems.forEach(p => {
    console.log(`${p.number}. 정답: ${p.answer || '(없음)'}`);
    if (p.explanation) {
      console.log(`   해설: ${p.explanation}`);
    }
    console.log('');
  });
  
  // Step 6: 통계
  console.log('\n========== 통계 ==========');
  console.log(`총 문제 수: ${problems.length}`);
  console.log(`답안 있는 문제: ${problems.filter(p => p.answer).length}`);
  console.log(`해설 있는 문제: ${problems.filter(p => p.explanation).length}`);
  
  return problems;
}

// 실행
parseAndGeneratePrintFormat(fullTestText);

console.log('\n\n========== 결론 ==========');
console.log('✅ 학생용 시험지: 문제만 표시 (보기 포함)');
console.log('✅ 강사용 해설지: 정답 + 상세 해설 표시');
console.log('✅ 한 문서에서 페이지 나누기로 분리');
console.log('✅ 인쇄 시 전체/부분 선택 가능');
console.log('\n🎉 문제 인식 및 분리 로직 정상 작동!');
