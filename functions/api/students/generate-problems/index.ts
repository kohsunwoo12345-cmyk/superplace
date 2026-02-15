interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface Problem {
  concept: string;
  type: string;
  question: string;
  options?: string[];
  answerSpace: boolean;
  answer: string;
  explanation: string;
  difficulty: string;
}

/**
 * POST /api/students/generate-problems
 * Gemini API를 사용하여 학생의 부족한 개념 기반 유사문제 생성
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { GOOGLE_GEMINI_API_KEY } = env;

  try {
    const body = await request.json();
    const { studentId, concepts, problemTypes, questionFormats, problemCount, studentName, studentGrade, subject } = body;

    if (!studentId || !concepts || concepts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId and concepts are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!problemTypes || problemTypes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "problemTypes is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기본값: 둘 다 선택
    const formats = questionFormats && questionFormats.length > 0 
      ? questionFormats 
      : ['multiple_choice', 'open_ended'];

    console.log('📝 Generating problems for student:', studentId);
    console.log('🎯 Concepts:', concepts);
    console.log('📚 Problem types:', problemTypes);
    console.log('📋 Question formats:', formats);
    console.log('🔢 Problem count:', problemCount);
    console.log('🎓 Student grade:', studentGrade);
    console.log('📘 Selected subject:', subject);

    // 학생의 숙제 데이터에서 과목 추출 (subject가 없으면)
    const { DB } = env;
    let finalSubject = subject || null; // 사용자 선택 과목 우선 (필수)
    let gradeLevel = studentGrade || null;
    
    // 과목이 선택되지 않은 경우 에러 (프론트엔드에서 필수로 만들었지만 안전장치)
    if (!finalSubject) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "과목을 선택해주세요. (수학/영어/국어 중 선택)" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (DB) {
      try {
        // 학생 테이블에서 학년 정보 조회 (프론트에서 전달되지 않은 경우)
        if (!gradeLevel) {
          const studentQuery = `
            SELECT grade
            FROM users
            WHERE id = ?
          `;
          const studentResult = await DB.prepare(studentQuery).bind(parseInt(studentId)).first();
          if (studentResult && studentResult.grade) {
            gradeLevel = studentResult.grade;
            console.log('🎓 Grade from DB:', gradeLevel);
          }
        }
      } catch (dbError: any) {
        console.warn('⚠️ Failed to fetch grade info:', dbError.message);
      }
    }
    
    console.log('✅ Final subject (REQUIRED):', finalSubject);

    // 문제 유형별 설명
    const typeDescriptions: { [key: string]: string } = {
      concept: '개념을 정확히 이해했는지 확인하는 기본 문제',
      pattern: '실제 시험에 자주 나오는 유형의 문제',
      advanced: '개념을 응용하고 확장한 심화 문제'
    };

    const typeExamples: { [key: string]: string } = {
      concept: '개념의 정의를 묻거나 간단한 계산 문제',
      pattern: '여러 단계를 거쳐 풀어야 하는 응용 문제',
      advanced: '창의적 사고가 필요한 종합 문제'
    };

    // Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    // 형식별 설명 - 명확하게 구분
    const formatDescriptions: { [key: string]: string } = {
      multiple_choice: '객관식 (4지선다 - 1번~4번 중 하나를 고르는 형식)',
      open_ended: '주관식 (서술형 - 답을 직접 쓰는 형식)'
    };

    const formatInstructions = formats.length === 2
      ? 'Mix both multiple choice (numbered options: ①, ②, ③, ④) and open-ended (write answer) questions evenly (~50/50)'
      : formats.includes('multiple_choice')
      ? 'ALL problems MUST be multiple choice with exactly 4 numbered options (①, ②, ③, ④) where student selects ONE correct answer'
      : 'ALL problems MUST be open-ended (essay/short answer) where student writes the answer directly - NO options';

    // 학년별 난이도 설정
    const gradeLevelInfo = gradeLevel 
      ? `Grade Level: ${gradeLevel} (adjust difficulty accordingly - higher grades need more complex problems)`
      : 'Grade Level: Not specified (use medium difficulty)';

    // 과목별 문제 유형 설정 - 과목은 필수!
    const subjectInfo = `**MANDATORY Subject: ${finalSubject}**`;
    const subjectInstruction = finalSubject === '수학' 
      ? 'ALL problems MUST be mathematics (수식, 계산, 도형, 함수 등). NO other subjects.'
      : finalSubject === '영어'
      ? 'ALL problems MUST be English (문법, 어휘, 독해, 작문 등). NO other subjects.'
      : finalSubject === '국어'
      ? 'ALL problems MUST be Korean language (문법, 어휘, 독해, 작문, 문학 등). NO other subjects.'
      : `ALL problems MUST be ${finalSubject} subject. NO other subjects.`;

    const prompt = `You are an educational content creator. Generate ${problemCount} practice problems for a student.

**CRITICAL: SUBJECT RESTRICTION**
${subjectInfo}
${subjectInstruction}
Every single problem MUST be related to ${finalSubject}. If you generate problems from other subjects, the system will REJECT them.

Student Information:
- Name: ${studentName}
- ${gradeLevelInfo}
- **Subject (MANDATORY): ${finalSubject}** ← ALL PROBLEMS MUST BE THIS SUBJECT
- Weak Concepts: ${concepts.join(', ')} (these are ${finalSubject} concepts)
- Problem Types to Include: ${problemTypes.map((t: string) => typeDescriptions[t]).join(', ')}
- Question Formats: ${formats.map((f: string) => formatDescriptions[f]).join(', ')}
- Total Problems: ${problemCount}

**🚨🚨🚨 CRITICAL FORMAT REQUIREMENTS - MUST FOLLOW EXACTLY 🚨🚨🚨**

${formats.includes('multiple_choice') ? `
**FOR 객관식 (MULTIPLE CHOICE) - MANDATORY FORMAT:**
- MUST have "options": ["① 첫번째선택지", "② 두번째선택지", "③ 세번째선택지", "④ 네번째선택지"]
- MUST have "answerSpace": false
- MUST have "answer": ONE of "①" or "②" or "③" or "④" (NOT "1", "2", "3", "4")
- Question MUST ask "다음 중 올바른 것은?" or "다음 중 옳은 것을 고르시오."
- Example:
  {
    "concept": "이차방정식",
    "type": "concept",
    "question": "다음 중 이차방정식의 근의 공식으로 옳은 것은?",
    "options": ["① x = (-b ± √(b²-4ac)) / 2a", "② x = (-b ± √(b²+4ac)) / 2a", "③ x = (b ± √(b²-4ac)) / 2a", "④ x = (-b ± √(b²-ac)) / a"],
    "answerSpace": false,
    "answer": "①",
    "explanation": "이차방정식 ax²+bx+c=0의 근의 공식은 x = (-b ± √(b²-4ac)) / 2a 입니다.",
    "difficulty": "medium"
  }
` : ''}

${formats.includes('open_ended') ? `
**FOR 주관식 (OPEN-ENDED) - MANDATORY FORMAT:**
- MUST have "options": null (NO OPTIONS)
- MUST have "answerSpace": true
- MUST have "answer": actual text answer (NOT a number like "①")
- Question MUST ask "~을/를 쓰시오" or "~을/를 설명하시오" or "~을/를 풀이하시오"
- Example:
  {
    "concept": "이차방정식",
    "type": "concept",
    "question": "이차방정식 x² - 5x + 6 = 0을 풀이하시오.",
    "options": null,
    "answerSpace": true,
    "answer": "x = 2 또는 x = 3",
    "explanation": "(x-2)(x-3) = 0으로 인수분해하면 x = 2 또는 x = 3입니다.",
    "difficulty": "medium"
  }
` : ''}

Distribution Requirements:
- Generate EXACTLY ${problemCount} problems (NOT ${problemCount - 1}, NOT ${problemCount + 1}, EXACTLY ${problemCount})
- Mix problems evenly across types: ${problemTypes.join(', ')}
- Each problem focuses on one concept: ${concepts.join(', ')}
- ${formatInstructions}
- Grade level: ${gradeLevel || 'medium'}
- **Subject: ${finalSubject} - EVERY SINGLE PROBLEM MUST BE THIS SUBJECT**

Requirements for EACH problem:
1. Set "type" field to one of: ${problemTypes.map((t: string) => `"${t}"`).join(', ')}
2. Set "concept" to the specific weak concept being tested
3. Set "difficulty" to "easy", "medium", or "hard" based on type AND grade level
4. Provide clear "question" text in Korean
5. For multiple choice (객관식):
   - Provide exactly 4 options in "options" array
   - Use numbered format: ①, ②, ③, ④
   - Set "answerSpace" to false
   - Set "answer" to ONLY the option number (e.g., "①", "②", "③", or "④")
6. For open-ended (주관식):
   - Set "options" to null (NO OPTIONS)
   - Set "answerSpace" to true
   - Set "answer" to the correct written answer
7. ALWAYS provide "explanation" with detailed step-by-step solution

Return this EXACT JSON structure:
{
  "problems": [
    {
      "concept": "개념명",
      "type": "${problemTypes[0]}" or "${problemTypes[1] || problemTypes[0]}" or "${problemTypes[2] || problemTypes[0]}",
      "question": "문제 내용 (명확하고 구체적으로)",
      "options": ["① 선택지1", "② 선택지2", "③ 선택지3", "④ 선택지4"] or null,
      "answerSpace": true or false,
      "answer": "① or ② or ③ or ④ (객관식)" or "정답 내용 (주관식)",
      "explanation": "상세한 풀이 과정 (단계별로 설명)",
      "difficulty": "easy/medium/hard"
    }
  ]
}

**🚨 ABSOLUTE REQUIREMENTS - FAILURE TO COMPLY WILL RESULT IN REJECTION 🚨**
1. Generate EXACTLY ${problemCount} problems - count them before returning!
2. ${formats.length === 1 && formats.includes('multiple_choice') ? `EVERY PROBLEM MUST BE 객관식 with 4 options ["①...", "②...", "③...", "④..."], answerSpace: false, answer: "①"/"②"/"③"/"④"` : ''}
3. ${formats.length === 1 && formats.includes('open_ended') ? `EVERY PROBLEM MUST BE 주관식 with options: null, answerSpace: true, answer: "text answer"` : ''}
4. ${formats.length === 2 ? `Mix 객관식 (4 options, answerSpace: false, answer: "①") and 주관식 (options: null, answerSpace: true, answer: "text") approximately 50/50` : ''}
5. ALL problems MUST be ${finalSubject} subject - verify each one!
6. Use ONLY Korean for question, options, answer, explanation
7. Provide 3-5 sentence explanations for each problem
8. NO markdown, NO code blocks, ONLY pure JSON
9. Difficulty: ${gradeLevel ? `adjust to grade ${gradeLevel}` : 'medium level'}
10. For 객관식: answer is "①" or "②" or "③" or "④" (NOT 1, 2, 3, 4, NOT text)
11. For 주관식: answer is actual text (NOT "①", NOT a number)

**FINAL CHECK BEFORE RETURNING:**
- Count problems array length = ${problemCount}? ✓
- All 객관식 have 4 options? ✓
- All 객관식 have answerSpace: false? ✓
- All 객관식 answers are "①"/"②"/"③"/"④"? ✓
- All 주관식 have options: null? ✓
- All 주관식 have answerSpace: true? ✓
- All 주관식 answers are text? ✓
- All subjects are ${finalSubject}? ✓`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for problem generation...');

    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 응답 파싱
    let problemsResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('📝 Gemini response (first 500 chars):', responseText.substring(0, 500));

      // JSON 추출
      let jsonString = responseText.trim();
      jsonString = jsonString.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```\s*$/gm, '');

      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('JSON 객체를 찾을 수 없습니다');
      }

      jsonString = jsonString.substring(firstBrace, lastBrace + 1);

      try {
        problemsResult = JSON.parse(jsonString);
      } catch (e1) {
        // 정제 후 재시도
        const cleaned = jsonString
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/\s+/g, ' ')
          .trim();

        problemsResult = JSON.parse(cleaned);
      }

      if (!problemsResult.problems || !Array.isArray(problemsResult.problems)) {
        throw new Error('문제 배열을 찾을 수 없습니다');
      }

      // 문제 수 검증 및 조정
      console.log(`📊 Generated ${problemsResult.problems.length} problems, requested ${problemCount}`);
      
      if (problemsResult.problems.length < problemCount) {
        console.warn(`⚠️ Not enough problems generated (${problemsResult.problems.length}/${problemCount})`);
        // 부족한 경우 기본 문제로 채움
        const remaining = problemCount - problemsResult.problems.length;
        for (let i = 0; i < remaining; i++) {
          const conceptIndex = i % concepts.length;
          const isMultipleChoice = formats.includes('multiple_choice') && (formats.length === 1 || i % 2 === 0);
          
          problemsResult.problems.push({
            concept: concepts[conceptIndex],
            type: problemTypes[i % problemTypes.length],
            question: `${concepts[conceptIndex]}에 대한 추가 문제 ${i + 1}`,
            options: isMultipleChoice ? ["① 선택지 1", "② 선택지 2", "③ 선택지 3", "④ 선택지 4"] : null,
            answerSpace: !isMultipleChoice,
            answer: isMultipleChoice ? "①" : "답안 참조",
            explanation: "해당 개념을 복습하고 문제를 풀어보세요.",
            difficulty: "medium"
          });
        }
      } else if (problemsResult.problems.length > problemCount) {
        // 초과된 경우 자름
        console.warn(`⚠️ Too many problems generated (${problemsResult.problems.length}/${problemCount}), trimming...`);
        problemsResult.problems = problemsResult.problems.slice(0, problemCount);
      }

      // 문제 형식 및 답안 검증 강화
      problemsResult.problems = problemsResult.problems.map((problem: any, idx: number) => {
        // 객관식/주관식 형식 결정
        let isMultipleChoice = false;
        
        // 1. options가 있으면 객관식
        if (problem.options && Array.isArray(problem.options) && problem.options.length > 0) {
          isMultipleChoice = true;
        }
        // 2. formats에서 결정 (혼합일 경우 번갈아가며)
        else if (formats.length === 1) {
          isMultipleChoice = formats.includes('multiple_choice');
        } else if (formats.length === 2) {
          isMultipleChoice = idx % 2 === 0 && formats.includes('multiple_choice');
        }
        
        // 객관식 형식 보정
        if (isMultipleChoice) {
          const validOptions = problem.options && Array.isArray(problem.options) && problem.options.length === 4
            ? problem.options
            : ["① 선택지 1", "② 선택지 2", "③ 선택지 3", "④ 선택지 4"];
          
          // 답안이 ①②③④ 형식이 아니면 보정
          let validAnswer = problem.answer;
          if (!['①', '②', '③', '④'].includes(validAnswer)) {
            // 숫자면 변환 (1→①, 2→②, 3→③, 4→④)
            if (validAnswer === '1' || validAnswer === 1) validAnswer = '①';
            else if (validAnswer === '2' || validAnswer === 2) validAnswer = '②';
            else if (validAnswer === '3' || validAnswer === 3) validAnswer = '③';
            else if (validAnswer === '4' || validAnswer === 4) validAnswer = '④';
            else validAnswer = '①'; // 기본값
          }
          
          return {
            ...problem,
            options: validOptions,
            answerSpace: false,
            answer: validAnswer,
            explanation: problem.explanation || '문제를 단계적으로 풀어보세요.',
            type: problem.type || problemTypes[0]
          };
        }
        // 주관식 형식 보정
        else {
          return {
            ...problem,
            options: null,
            answerSpace: true,
            answer: problem.answer || '답안 참조',
            explanation: problem.explanation || '문제를 단계적으로 풀어보세요.',
            type: problem.type || problemTypes[0]
          };
        }
      });
      
      // 최종 로그
      const mcCount = problemsResult.problems.filter((p: any) => p.options && p.options.length > 0).length;
      const oeCount = problemsResult.problems.filter((p: any) => !p.options).length;
      console.log(`✅ Successfully prepared ${problemsResult.problems.length} problems`);
      console.log(`   - 객관식: ${mcCount}개, 주관식: ${oeCount}개`);

    } catch (parseError: any) {
      console.error('❌ Failed to parse Gemini response:', parseError);

      // 기본 문제 생성 - problemCount 만큼 정확히 생성
      const defaultProblems = [];
      for (let i = 0; i < problemCount; i++) {
        const conceptIndex = i % concepts.length;
        const isMultipleChoice = formats.includes('multiple_choice') && (formats.length === 1 || i % 2 === 0);
        
        defaultProblems.push({
          concept: concepts[conceptIndex],
          type: problemTypes[i % problemTypes.length],
          question: isMultipleChoice 
            ? `${concepts[conceptIndex]}에 대한 다음 중 올바른 것은?`
            : `${concepts[conceptIndex]}에 대한 문제 ${i + 1}: 이 개념을 설명하고 예시를 들어보세요.`,
          options: isMultipleChoice ? ["① 선택지 1", "② 선택지 2", "③ 선택지 3", "④ 선택지 4"] : null,
          answerSpace: !isMultipleChoice,
          answer: isMultipleChoice ? '①' : '개념 설명 및 예시 참조',
          explanation: '해당 개념의 정의와 실생활 예시를 들어 설명해주세요.',
          difficulty: 'medium'
        });
      }
      
      problemsResult = {
        problems: defaultProblems
      };
      
      console.log(`⚠️ Fallback: Generated ${defaultProblems.length} default problems`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        problems: problemsResult.problems,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Problem generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "문제 생성 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
