# 회원가입 UX 개선 완료

## 구현 내용

### 1. 전화번호 자동 포맷팅
**기능**: 01012341234 입력 시 자동으로 010-1234-1234로 변환

**구현 방법**:
```typescript
const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }
};
```

**사용자 경험**:
- 숫자만 입력해도 자동으로 하이픈 추가
- 최대 13자 (010-1234-5678)
- 실시간 포맷팅

### 2. 학원 위치 필드 추가
**위치**: 학원장 가입 시에만 표시

**필드 정보**:
- **라벨**: 학원 위치
- **플레이스홀더**: 예: 인천 서구 당하동
- **필수 입력**: required
- **저장 위치**: Academy 모델의 `address` 필드

### 3. 학원 이름 예시 변경
**Before**: 예: 명문 학원
**After**: 예: 꾸메땅학원

### 4. 카드 설명 문구 변경
**Before**: "14일 무료 체험으로 시작하세요"
**After**: "슈퍼플레이스와 함께 시작하세요"

## 화면 구성

### 학원장 가입 시
```
┌─────────────────────────────────┐
│ 가입 유형: [학원장] 선택        │
├─────────────────────────────────┤
│ 학원 이름                       │
│ [예: 꾸메땅학원]                │
├─────────────────────────────────┤
│ 학원 위치                       │
│ [예: 인천 서구 당하동]          │
├─────────────────────────────────┤
│ 안내: 학원을 생성하고...        │
└─────────────────────────────────┘
```

### 전화번호 입력
```
┌─────────────────────────────────┐
│ 전화번호 (선택)                 │
│ [010-1234-5678]                 │
│                                 │
│ 입력: 01012341234               │
│ 자동: 010-1234-1234 ✓           │
└─────────────────────────────────┘
```

## 백엔드 변경사항

### API Schema 업데이트
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['DIRECTOR', 'TEACHER', 'STUDENT']),
  academyName: z.string().optional(),
  academyLocation: z.string().optional(),  // 추가
  academyCode: z.string().optional(),
});
```

### Academy 생성 로직
```typescript
// 학원 위치 필수 체크
if (!validatedData.academyLocation) {
  return NextResponse.json(
    { error: "학원 위치를 입력해주세요" },
    { status: 400 }
  );
}

// Academy 생성 시 address 필드에 저장
const academy = await tx.academy.create({
  data: {
    name: validatedData.academyName!,
    address: validatedData.academyLocation!,  // 위치 저장
    code: academyCode,
    subscriptionTier: 'FREE',
    maxStudents: 10,
    maxTeachers: 2,
    maxAIUsage: 100,
  },
});
```

## Before vs After

### Before
```
┌─────────────────────────────────┐
│ 14일 무료 체험으로 시작하세요   │
├─────────────────────────────────┤
│ 전화번호: [01012341234]         │
│ → 포맷팅 없음                   │
├─────────────────────────────────┤
│ 학원 이름: [예: 명문 학원]      │
│ 학원 위치: 없음 ❌              │
└─────────────────────────────────┘
```

### After
```
┌─────────────────────────────────┐
│ 슈퍼플레이스와 함께 시작하세요  │
├─────────────────────────────────┤
│ 전화번호: [010-1234-1234]       │
│ → 자동 포맷팅 ✓                 │
├─────────────────────────────────┤
│ 학원 이름: [예: 꾸메땅학원]     │
│ 학원 위치: [예: 인천 서구 당하동]│
│ → 위치 필드 추가 ✓              │
└─────────────────────────────────┘
```

## 기술 상세

### 전화번호 포맷팅
**입력 처리**:
1. 모든 비숫자 문자 제거 (`\D`)
2. 길이에 따라 하이픈 삽입:
   - 1-3자: 그대로 (010)
   - 4-7자: 3-4 구분 (010-1234)
   - 8-11자: 3-4-4 구분 (010-1234-5678)

**상태 관리**:
```typescript
const [phone, setPhone] = useState("");

const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatPhoneNumber(e.target.value);
  setPhone(formatted);
};
```

### 학원 위치 필드
**유효성 검사**:
- 프론트엔드: `required` 속성
- 백엔드: Zod schema + 추가 검증

**데이터 흐름**:
```
User Input → Frontend Validation → API Request
→ Backend Validation → Prisma → Database
```

## 배포 정보

- **커밋**: 3159257
- **브랜치**: main
- **Vercel**: https://superplace-study.vercel.app/auth/signup
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace

## 변경 파일

1. **src/app/auth/signup/page.tsx** (+50줄, -12줄)
   - 전화번호 포맷팅 함수 추가
   - 학원 위치 필드 추가
   - 예시 텍스트 변경
   - 카드 설명 변경

2. **src/app/api/register/route.ts** (+9줄)
   - academyLocation 스키마 추가
   - 위치 필수 검증 추가
   - Academy 생성 시 address 저장

## 테스트 시나리오

### 시나리오 1: 전화번호 자동 포맷팅
```
1. 회원가입 페이지 접속
2. 전화번호 필드 클릭
3. "01012341234" 입력
4. 결과: "010-1234-1234" 자동 변환 확인 ✓
```

### 시나리오 2: 학원장 가입 (위치 포함)
```
1. 가입 유형: 학원장 선택
2. 학원 이름: "꾸메땅학원" 입력
3. 학원 위치: "인천 서구 당하동" 입력
4. 회원가입 완료
5. DB 확인: Academy.address = "인천 서구 당하동" ✓
```

### 시나리오 3: 예시 텍스트 확인
```
1. 학원장 선택
2. 학원 이름 필드 확인
   → "예: 꾸메땅학원" 표시 ✓
3. 학원 위치 필드 확인
   → "예: 인천 서구 당하동" 표시 ✓
```

### 시나리오 4: 카드 설명 확인
```
1. 회원가입 페이지 접속
2. 카드 헤더 확인
   → "슈퍼플레이스와 함께 시작하세요" 표시 ✓
3. "14일 무료 체험" 문구 없음 확인 ✓
```

## 사용자 경험 개선

### 전화번호 입력
**개선 전**:
- 수동으로 하이픈 입력 필요
- 포맷 불일치 가능성

**개선 후**:
- 자동으로 하이픈 추가
- 일관된 포맷 (010-1234-5678)
- 입력 편의성 향상

### 학원 정보
**개선 전**:
- 학원 이름만 입력
- 위치 정보 없음

**개선 후**:
- 학원 이름 + 위치 입력
- 더 상세한 학원 정보
- 검색 및 관리 용이

### 브랜딩
**개선 전**:
- "14일 무료 체험" (프로모션 느낌)

**개선 후**:
- "슈퍼플레이스와 함께 시작하세요" (브랜드 중심)
- 더 친근하고 초대하는 느낌

## 데이터베이스 스키마

### Academy Model
```prisma
model Academy {
  id              String    @id @default(cuid())
  name            String    // 학원 이름
  description     String?
  address         String?   // 학원 위치 (새로 활용)
  phone           String?
  email           String?
  // ... 기타 필드
}
```

**활용 필드**: `address`
- 기존 필드 활용 (마이그레이션 불필요)
- 회원가입 시 자동 저장
- 학원 검색 및 관리에 활용 가능

## 최종 결과

### 완료 항목
1. ✅ 전화번호 자동 포맷팅 (010-1234-5678)
2. ✅ 학원 위치 필드 추가
3. ✅ 학원 이름 예시 변경 (꾸메땅학원)
4. ✅ 학원 위치 예시 추가 (인천 서구 당하동)
5. ✅ 카드 설명 문구 변경
6. ✅ 백엔드 API 업데이트
7. ✅ 빌드 성공
8. ✅ 배포 완료

### 사용자 경험 향상
- 📱 전화번호 입력 편의성 증가
- 📍 학원 위치 정보로 완성도 향상
- 🎨 브랜드 일관성 개선
- ✨ 더 친근한 가입 프로세스

프로덕션 배포 후 약 2-3분 내 테스트 가능! 🎉

## 추가 개선 제안

### 단기 (1주)
- 학원 위치 자동완성 (카카오맵 API)
- 전화번호 국제 포맷 지원

### 중기 (1개월)
- 학원 사진 업로드
- 학원 소개 입력 필드
- 학원 영업시간 설정

### 장기 (3개월)
- 학원 검색 기능 (위치 기반)
- 지도 기반 학원 찾기
- 학원 리뷰 시스템
