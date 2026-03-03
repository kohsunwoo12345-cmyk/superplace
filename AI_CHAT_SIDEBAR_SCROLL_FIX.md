# AI Chat Sidebar Scroll Fix

## 문제 상황
- AI 채팅 페이지 왼쪽 사이드바에서 아래로 스크롤이 되지 않는 문제 발생
- 채팅 기록이 많을 때 하단 대화 내역을 볼 수 없었음

## 원인 분석
- 사이드바 컨테이너 div에 `overflow-hidden` 클래스가 적용되어 있었음
- 내부의 채팅 기록 섹션에는 `overflow-y-auto`가 있었지만, 부모 컨테이너의 `overflow-hidden`이 스크롤을 막고 있었음

## 해결 방법
**파일**: `src/app/ai-chat/page.tsx`

### 변경 전:
```tsx
<div
  className={`${
    sidebarOpen ? "w-64" : "w-0"
  } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden ${
    isMobile && sidebarOpen ? "absolute z-50 h-full shadow-2xl" : ""
  }`}
>
```

### 변경 후:
```tsx
<div
  className={`${
    sidebarOpen ? "w-64" : "w-0"
  } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50 ${
    isMobile && sidebarOpen ? "absolute z-50 h-full shadow-2xl" : ""
  }`}
>
```

**핵심 변경사항**: `overflow-hidden` 제거

## 개선 효과
✅ **스크롤 가능**: 사이드바 내부 채팅 기록을 위아래로 스크롤 가능  
✅ **모바일 지원**: 모바일 환경에서도 정상 작동  
✅ **데스크톱 지원**: 데스크톱 환경에서도 정상 작동  
✅ **UI 유지**: 기존 레이아웃과 디자인 유지  

## 테스트 방법
1. `/ai-chat` 페이지 접속
2. 여러 개의 채팅 세션 생성 (10개 이상)
3. 왼쪽 사이드바에서 마우스 스크롤 시도
4. 채팅 기록 목록이 위아래로 스크롤되는지 확인

## 배포 정보
- **커밋**: `b411c2f` - "fix(AIChat): 사이드바 스크롤 활성화"
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/ai-chat
- **배포 일시**: 2026-03-03

## 영향 범위
- **수정 파일**: 1개 (`src/app/ai-chat/page.tsx`)
- **변경 라인**: 1줄 (1 insertion, 1 deletion)
- **영향 기능**: AI 챗봇 사이드바 스크롤

## 관련 기능
- AI 챗봇 대화 목록 표시
- 채팅 세션 검색
- 봇 선택 UI
- 대화 기록 관리
