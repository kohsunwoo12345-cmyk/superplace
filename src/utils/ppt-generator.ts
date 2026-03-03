import { PPTVariables } from '@/types/ppt-variables';

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

export function createDetailedPPT(data: PPTVariables) {
  if (typeof window === 'undefined' || !window.PptxGenJS) {
    throw new Error('PptxGenJS가 로드되지 않았습니다');
  }

  const pptx = new window.PptxGenJS();
  
  // 슬라이드 1: 표지
  const titleSlide = pptx.addSlide();
  titleSlide.addText(data.title || '학습 보고서', {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: '363636', align: 'center'
  });
  titleSlide.addText(data.subtitle || '', {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fontSize: 24, color: '666666', align: 'center'
  });
  titleSlide.addText(data.studentName || '', {
    x: 0.5, y: 4.5, w: 9, h: 0.6,
    fontSize: 20, color: '999999', align: 'center'
  });
  titleSlide.addText(`${data.date} | ${data.presenter || ''}`, {
    x: 0.5, y: 6.5, w: 9, h: 0.4,
    fontSize: 14, color: 'AAAAAA', align: 'center'
  });

  // 슬라이드 2: 목차
  const tocSlide = pptx.addSlide();
  tocSlide.addText('목차', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  const tocItems = [
    '1. 학생 소개',
    '2. 성적 분석',
    '3. 강점 및 약점',
    '4. 학습 태도 평가',
    '5. 목표 설정 및 계획',
    '6. 선생님 코멘트'
  ];
  tocSlide.addText(tocItems, {
    x: 1, y: 2, w: 8, h: 4,
    fontSize: 18, bullet: true, color: '555555'
  });

  // 슬라이드 3: 학생 소개
  const introSlide = pptx.addSlide();
  introSlide.addText('학생 소개', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  
  const studentInfo = [
    `이름: ${data.studentName || '-'}`,
    `학년: ${data.studentGrade || '-'}`,
    `반: ${data.studentClass || '-'}`,
    `학번: ${data.studentNumber || '-'}`,
    `출석률: ${data.attendanceRate || '-'}`,
    `총 수업 수: ${data.totalClasses || '-'}회`,
    `등록일: ${data.enrollmentDate || '-'}`
  ];
  
  introSlide.addText(studentInfo, {
    x: 1, y: 2, w: 8, h: 4.5,
    fontSize: 18, bullet: true, color: '555555'
  });

  // 슬라이드 4: 성적 요약 (테이블)
  if (data.koreanScore || data.mathScore || data.englishScore) {
    const scoreSlide = pptx.addSlide();
    scoreSlide.addText('성적 요약', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '363636'
    });
    
    const scoreTable = [
      [
        { text: '과목', options: { bold: true, fill: {color: '4472C4'}, color: 'FFFFFF' } },
        { text: '점수', options: { bold: true, fill: {color: '4472C4'}, color: 'FFFFFF' } },
        { text: '이전 대비', options: { bold: true, fill: {color: '4472C4'}, color: 'FFFFFF' } }
      ],
      ['국어', data.koreanScore || '-', data.scoreChange || '-'],
      ['수학', data.mathScore || '-', data.scoreChange || '-'],
      ['영어', data.englishScore || '-', data.scoreChange || '-'],
      ['과학', data.scienceScore || '-', data.scoreChange || '-'],
      ['사회', data.socialScore || '-', data.scoreChange || '-'],
      [
        { text: '평균', options: { bold: true } },
        { text: data.averageScore || '-', options: { bold: true, color: '0070C0' } },
        { text: data.scoreChange || '-', options: { bold: true, color: data.scoreChange?.startsWith('+') ? '00B050' : 'FF0000' } }
      ]
    ];
    
    scoreSlide.addTable(scoreTable, {
      x: 1.5, y: 2, w: 7, h: 4,
      fontSize: 16, align: 'center', valign: 'middle'
    });
  }

  // 슬라이드 5: 등수 및 등급
  if (data.rank || data.grade) {
    const rankSlide = pptx.addSlide();
    rankSlide.addText('등수 및 등급', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '363636'
    });
    
    rankSlide.addText(`현재 등수: ${data.rank || '-'}등`, {
      x: 1, y: 2.5, w: 8, h: 0.8,
      fontSize: 36, bold: true, color: '0070C0', align: 'center'
    });
    
    rankSlide.addText(`등급: ${data.grade || '-'}`, {
      x: 1, y: 3.5, w: 8, h: 0.6,
      fontSize: 28, color: '00B050', align: 'center'
    });
    
    if (data.rankChange) {
      rankSlide.addText(`변화: ${data.rankChange}`, {
        x: 1, y: 4.5, w: 8, h: 0.5,
        fontSize: 20, color: data.rankChange.startsWith('+') ? '00B050' : 'FF0000', align: 'center'
      });
    }
  }

  // 슬라이드 6: 강점 분석
  if (data.strengths || data.strongestSubject) {
    const strengthSlide = pptx.addSlide();
    strengthSlide.addText('강점 분석', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '00B050'
    });
    
    if (data.strongestSubject) {
      strengthSlide.addText(`가장 강한 과목: ${data.strongestSubject}`, {
        x: 1, y: 1.8, w: 8, h: 0.6,
        fontSize: 22, bold: true, color: '0070C0'
      });
    }
    
    if (data.strengths) {
      const strengths = data.strengths.split('\n').filter(s => s.trim());
      strengthSlide.addText(strengths, {
        x: 1, y: 2.8, w: 8, h: 3.5,
        fontSize: 18, bullet: { code: '2713' }, color: '555555'
      });
    }
  }

  // 슬라이드 7: 약점 분석
  if (data.weaknesses || data.weakestSubject) {
    const weaknessSlide = pptx.addSlide();
    weaknessSlide.addText('개선 필요 영역', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: 'FF6B6B'
    });
    
    if (data.weakestSubject) {
      weaknessSlide.addText(`개선 필요 과목: ${data.weakestSubject}`, {
        x: 1, y: 1.8, w: 8, h: 0.6,
        fontSize: 22, bold: true, color: 'C00000'
      });
    }
    
    if (data.weaknesses) {
      const weaknesses = data.weaknesses.split('\n').filter(w => w.trim());
      weaknessSlide.addText(weaknesses, {
        x: 1, y: 2.8, w: 8, h: 3.5,
        fontSize: 18, bullet: true, color: '555555'
      });
    }
  }

  // 슬라이드 8: 학습 태도 평가
  if (data.participation || data.homework || data.concentration || data.attitude) {
    const attitudeSlide = pptx.addSlide();
    attitudeSlide.addText('학습 태도 평가', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '363636'
    });
    
    const attitudeData = [
      [
        { text: '항목', options: { bold: true, fill: {color: '5B9BD5'}, color: 'FFFFFF' } },
        { text: '평가', options: { bold: true, fill: {color: '5B9BD5'}, color: 'FFFFFF' } }
      ],
      ['참여도', data.participation || '-'],
      ['숙제 완성도', data.homework || '-'],
      ['집중력', data.concentration || '-'],
      ['학습 태도', data.attitude || '-'],
      ['이해도', data.understandingLevel || '-']
    ];
    
    attitudeSlide.addTable(attitudeData, {
      x: 2, y: 2, w: 6, h: 3.5,
      fontSize: 16, align: 'center', valign: 'middle',
      rowH: 0.7
    });
  }

  // 슬라이드 9: 단기 목표
  if (data.shortTermGoal) {
    const shortGoalSlide = pptx.addSlide();
    shortGoalSlide.addText('단기 목표 (1개월)', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '4472C4'
    });
    
    shortGoalSlide.addText(data.shortTermGoal, {
      x: 1, y: 2, w: 8, h: 1,
      fontSize: 24, bold: true, color: '0070C0', align: 'center'
    });
    
    const actionPlans = [
      data.actionPlan1,
      data.actionPlan2,
      data.actionPlan3
    ].filter(p => p && p.trim());
    
    if (actionPlans.length > 0) {
      shortGoalSlide.addText(actionPlans, {
        x: 1, y: 3.5, w: 8, h: 2.5,
        fontSize: 18, bullet: { code: '27A4' }, color: '555555'
      });
    }
  }

  // 슬라이드 10: 중기 목표
  if (data.midTermGoal) {
    const midGoalSlide = pptx.addSlide();
    midGoalSlide.addText('중기 목표 (3개월)', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '70AD47'
    });
    
    midGoalSlide.addText(data.midTermGoal, {
      x: 1, y: 2.5, w: 8, h: 1.2,
      fontSize: 22, bold: true, color: '00B050', align: 'center'
    });
  }

  // 슬라이드 11: 장기 목표
  if (data.longTermGoal) {
    const longGoalSlide = pptx.addSlide();
    longGoalSlide.addText('장기 목표 (6개월)', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: 'FFC000'
    });
    
    longGoalSlide.addText(data.longTermGoal, {
      x: 1, y: 2, w: 8, h: 1.2,
      fontSize: 22, bold: true, color: 'C65911', align: 'center'
    });
    
    if (data.expectedOutcome) {
      longGoalSlide.addText(`기대 성과: ${data.expectedOutcome}`, {
        x: 1, y: 4, w: 8, h: 1,
        fontSize: 18, color: '555555', align: 'center'
      });
    }
  }

  // 슬라이드 12: 선생님 코멘트
  if (data.teacherComment) {
    const commentSlide = pptx.addSlide();
    commentSlide.addText('선생님 코멘트', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '7030A0'
    });
    
    commentSlide.addText(data.teacherComment, {
      x: 1, y: 2, w: 8, h: 2,
      fontSize: 18, color: '555555', italic: true
    });
    
    if (data.encouragement) {
      commentSlide.addText(data.encouragement, {
        x: 1, y: 4.5, w: 8, h: 1.5,
        fontSize: 20, bold: true, color: '0070C0', align: 'center'
      });
    }
  }

  // 슬라이드 13: 학부모 메시지
  if (data.parentAdvice) {
    const parentSlide = pptx.addSlide();
    parentSlide.addText('학부모님께', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: '44546A'
    });
    
    parentSlide.addText(data.parentAdvice, {
      x: 1, y: 2.5, w: 8, h: 3,
      fontSize: 18, color: '555555'
    });
  }

  // 슬라이드 14: 마무리
  const endSlide = pptx.addSlide();
  endSlide.addText('감사합니다', {
    x: 0.5, y: 2.5, w: 9, h: 1,
    fontSize: 44, bold: true, color: '363636', align: 'center'
  });
  
  if (data.academyName) {
    endSlide.addText(data.academyName, {
      x: 0.5, y: 4, w: 9, h: 0.6,
      fontSize: 24, color: '666666', align: 'center'
    });
  }
  
  if (data.presenter) {
    endSlide.addText(data.presenter, {
      x: 0.5, y: 5, w: 9, h: 0.4,
      fontSize: 18, color: '999999', align: 'center'
    });
  }

  // PPT 다운로드
  const filename = `${data.studentName || '학습보고서'}_${data.date.replace(/[^0-9]/g, '') || Date.now()}.pptx`;
  pptx.writeFile({ fileName: filename });
  
  return { success: true, filename };
}
