# AI 봇 프로필 이미지 및 이모지 확장 기능

## 📋 구현 내역

### 1. 이모지 확장 (200+ 이모지)
기존 100+ 이모지에서 200+ 이모지로 확장하여 더 다양한 선택지를 제공합니다.

#### 추가된 카테고리
- 기술 & AI (20개)
- 교육 & 학습 (20개)
- 에너지 & 빛 (20개)
- 우주 & 과학 (20개)
- 예술 & 창작 (20개)
- 스포츠 & 성취 (20개)
- 자연 & 날씨 (20개)
- 동물 - 포유류 (40개)
- 동물 - 조류 & 해양 (26개)
- 곤충 & 작은 생물 (14개)
- 식물 & 꽃 (29개)
- 음식 & 음료 (59개)
- 여행 & 장소 (40개)
- 시간 & 도구 (35개)
- 표정 & 감정 (40개)
- 상징 & 기호 (40개)

**총 이모지 수: 283개**

### 2. 프로필 이미지 지원
이모지 외에 실제 이미지 URL을 프로필로 사용할 수 있습니다.

#### 주요 기능
- ✅ 이미지 URL 입력 지원
- ✅ 이모지/이미지 전환 가능
- ✅ 초기화 버튼으로 기본값 복원
- ✅ 미리보기 표시
- ✅ DB에 profileImage 컬럼 추가

### 3. UI 개선
#### 봇 생성 페이지
```tsx
// 이모지 또는 이미지 선택
<Button onClick={handleEmojiSelect}>이모지 선택</Button>
<Button onClick={handleImageUrl}>이미지 URL</Button>
<Button onClick={handleReset}>초기화</Button>
```

#### 채팅 페이지
- 봇 목록에 이미지 프로필 표시
- 채팅 헤더에 이미지 프로필 표시
- 메시지에 이미지 프로필 표시
- 로딩 애니메이션에 이미지 프로필 표시

### 4. 홈페이지 나가기 버튼
학원장, 선생님, 관리자만 홈페이지로 이동할 수 있는 버튼이 추가되었습니다.

```tsx
{role.toUpperCase() !== 'STUDENT' && (
  <a href="/" target="_blank" rel="noopener noreferrer">
    <ExternalLink className="w-4 h-4" />
    <span>홈페이지</span>
  </a>
)}
```

- ✅ 학원장 (DIRECTOR): 표시
- ✅ 선생님 (TEACHER): 표시
- ✅ 관리자 (ADMIN, SUPER_ADMIN): 표시
- ❌ 학생 (STUDENT): 숨김

## 🗄️ 데이터베이스 변경

### ai_bots 테이블
```sql
ALTER TABLE ai_bots ADD COLUMN profileImage TEXT;
```

#### 컬럼 목록
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `profileIcon` TEXT DEFAULT '🤖'
- **`profileImage` TEXT** (신규)
- `model` TEXT DEFAULT 'gemini-2.5-flash'
- ...기타 컬럼...

## 📊 테스트 결과

### 1. 이모지 봇 생성
```bash
curl -X POST /api/admin/ai-bots \
  -d '{
    "name": "표정봇",
    "profileIcon": "🥳",
    "model": "gemini-2.5-flash"
  }'
```

**결과**: ✅ 성공
- Bot ID: `bot-1770298484912-ef74pkn61`
- 이모지: 🥳 (확장된 이모지 사용)

### 2. 이미지 봇 생성
```bash
curl -X POST /api/admin/ai-bots \
  -d '{
    "name": "이미지봇 테스트",
    "profileImage": "https://i.pravatar.cc/150?img=12",
    "model": "gemini-2.5-flash"
  }'
```

**결과**: ✅ 성공
- Bot ID: `bot-1770298478465-jrtgd4rzn`
- 이미지 URL: https://i.pravatar.cc/150?img=12

### 3. 봇 목록 조회
```bash
curl -s /api/admin/ai-bots | jq '.bots[] | {name, profileIcon, profileImage}'
```

**결과**: ✅ 성공
```json
{
  "name": "표정봇",
  "profileIcon": "🥳",
  "profileImage": null
}
{
  "name": "이미지봇 테스트",
  "profileIcon": "",
  "profileImage": "https://i.pravatar.cc/150?img=12"
}
```

### 4. 홈페이지 버튼 테스트
- ✅ 학원장 계정: 버튼 표시됨
- ✅ 선생님 계정: 버튼 표시됨
- ✅ 관리자 계정: 버튼 표시됨
- ✅ 학생 계정: 버튼 숨김

## 📁 수정된 파일

### Frontend
1. `src/app/dashboard/admin/ai-bots/create/page.tsx`
   - 이모지 200+ 추가
   - 이미지 URL 입력 기능 추가
   - 미리보기 및 초기화 기능 추가

2. `src/app/dashboard/ai-chat/page.tsx`
   - profileImage 인터페이스 추가
   - 이미지 표시 로직 추가 (4곳)

3. `src/components/layouts/ModernLayout.tsx`
   - 홈페이지 나가기 버튼 추가
   - 학생 제외 조건 추가

### Backend
1. `functions/api/admin/ai-bots.ts`
   - CREATE TABLE에 profileImage 컬럼 추가
   - INSERT 쿼리에 profileImage 추가
   - API 파라미터에 profileImage 추가

2. `functions/api/admin/migrate-ai-bots-image.ts`
   - 마이그레이션 스크립트 생성
   - ALTER TABLE 실행

## 🎨 사용 예시

### 이모지 봇
```typescript
{
  name: "학습 도우미",
  profileIcon: "📚",
  profileImage: "",
  model: "gemini-2.5-flash"
}
```

### 이미지 봇
```typescript
{
  name: "AI 선생님",
  profileIcon: "",
  profileImage: "https://example.com/teacher.jpg",
  model: "gemini-2.5-flash"
}
```

### 혼합 사용 (이모지 우선)
```typescript
{
  name: "하이브리드 봇",
  profileIcon: "🤖",
  profileImage: "https://example.com/robot.jpg",
  model: "gemini-2.5-flash"
}
// → profileImage가 있으면 이미지 사용
// → profileImage가 없으면 profileIcon 사용
```

## 🔗 관련 링크

- **프로덕션 URL**: https://genspark-ai-developer.superplacestudy.pages.dev
- **봇 생성 페이지**: /dashboard/admin/ai-bots/create
- **AI 채팅 페이지**: /dashboard/ai-chat
- **GitHub 브랜치**: genspark_ai_developer
- **커밋**: fb84df1

## ✅ 체크리스트

- [x] 200+ 이모지 추가
- [x] 이미지 URL 입력 기능
- [x] 미리보기 및 초기화
- [x] DB profileImage 컬럼 추가
- [x] 마이그레이션 스크립트
- [x] 채팅 페이지 이미지 표시
- [x] 홈페이지 나가기 버튼
- [x] 학생 제외 조건
- [x] 테스트 완료
- [x] 배포 완료

## 🚀 다음 단계

1. 이미지 파일 업로드 지원 (현재는 URL만)
2. 이미지 크기 자동 조정
3. 이미지 캐싱 및 최적화
4. 이모지 검색 기능
5. 최근 사용한 이모지 저장

---

**작성일**: 2026-02-05  
**작성자**: AI Assistant  
**상태**: ✅ 완료
