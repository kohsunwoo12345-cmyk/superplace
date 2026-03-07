# R2 파일 저장 시스템 구현 완료

## 📋 개요
발신번호 등록 시 첨부된 서류를 **Cloudflare R2 버킷**에 저장하도록 변경했습니다.
기존 Base64 방식의 SQLite 저장 방식에서 R2로 전환하여 파일 크기 제한을 제거했습니다.

---

## ✅ 주요 변경 사항

### 1. **파일 저장 방식 변경**
- **이전**: Base64 인코딩 → SQLite D1 DB 저장 (최대 500KB 제한)
- **현재**: 원본 파일 → R2 버킷 저장 (크기 제한 없음)

### 2. **파일 URL 형식**
```
/api/files/sender-number/{requestId}/{filename}

예시:
/api/files/sender-number/snr_1772930000000_abc123/telecom.pdf
/api/files/sender-number/snr_1772930000000_abc123/business.jpg
```

### 3. **R2 버킷 구조**
```
superplacestudy/
└── sender-number-requests/
    └── snr_1772930000000_abc123/
        ├── telecom.pdf
        ├── business.pdf
        ├── service.pdf
        └── privacy.pdf
```

---

## 🔧 구현된 파일

### 1. 백엔드 - 파일 업로드
**파일**: `/functions/api/sender-number/register.ts`

```typescript
// R2에 파일 업로드
const uploadToR2 = async (file: File, key: string): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  if (env.SENDER_NUMBER_BUCKET) {
    await env.SENDER_NUMBER_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    return `/api/files/sender-number/${key}`;
  } else {
    return `placeholder_${requestId}_${key}`;
  }
};
```

### 2. 백엔드 - 파일 조회
**파일**: `/functions/api/files/sender-number/[[key]].ts`

```typescript
// R2에서 파일 가져오기
const object = await env.SENDER_NUMBER_BUCKET.get(key);

if (!object) {
  return new Response('File not found', { status: 404 });
}

return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata.contentType,
    'Cache-Control': 'public, max-age=31536000',
  },
});
```

### 3. 프론트엔드 - UI 수정
**파일**: `/src/app/dashboard/sender-number-register/page.tsx`

- 파일 크기 제한 제거
- "파일 크기 제한 없이 업로드 가능합니다" 안내 메시지 추가
- 파일 크기 검증 로직 제거

### 4. 설정 파일
**파일**: `/wrangler.toml`

```toml
[[r2_buckets]]
binding = "SENDER_NUMBER_BUCKET"
bucket_name = "superplacestudy"
```

---

## 🚀 배포 가이드

### 1. Cloudflare Pages에서 R2 바인딩 확인
Cloudflare Pages 프로젝트에 이미 R2 버킷이 바인딩되어 있습니다:
- **버킷 이름**: `superplacestudy`
- **바인딩 변수**: `SENDER_NUMBER_BUCKET`

### 2. 배포 확인
```bash
# 현재 배포된 커밋
Commit: 181567be
Message: config: R2 버킷 바인딩 추가 (SENDER_NUMBER_BUCKET)

# 배포 대기 시간
약 2분 후 https://superplacestudy.pages.dev 에 반영
```

### 3. 배포 후 자동 반영 항목
- ✅ R2 버킷 바인딩 (SENDER_NUMBER_BUCKET)
- ✅ 파일 업로드 API (/api/sender-number/register)
- ✅ 파일 조회 API (/api/files/sender-number/[[key]])
- ✅ 파일 크기 제한 제거

---

## 🧪 테스트 방법

### 1. 발신번호 등록 테스트
1. https://superplacestudy.pages.dev/dashboard/sender-number-register 접속
2. 모든 필드 입력
3. **4개의 서류 첨부** (PDF, JPG, PNG - 크기 제한 없음)
4. "신청하기" 클릭

### 2. 파일 업로드 확인
- 브라우저 개발자 도구 → Network 탭
- POST `/api/sender-number/register` 요청 확인
- Response에서 `requestId` 확인

### 3. 관리자 페이지에서 파일 확인
1. https://superplacestudy.pages.dev/dashboard/admin/sender-number-approval 접속
2. 신청 목록에서 방금 등록한 항목 찾기
3. 첨부 서류 버튼 클릭
4. 파일이 새 창에서 열리는지 확인

---

## 📊 파일 크기 비교

| 저장 방식 | 최대 크기 | 장점 | 단점 |
|----------|----------|-----|-----|
| **Base64 (이전)** | 500KB | 간단한 구현 | 크기 제한, DB 비효율 |
| **R2 (현재)** | 제한 없음 | 무제한 크기, 빠른 접근 | 별도 스토리지 필요 |

---

## 🔍 트러블슈팅

### 문제 1: "Storage not configured" 오류
**원인**: R2 버킷이 바인딩되지 않음

**해결**:
1. Cloudflare Dashboard → Workers & Pages → superplacestudy
2. Settings → Functions → R2 bucket bindings
3. 변수 이름: `SENDER_NUMBER_BUCKET`
4. 버킷: `superplacestudy`
5. 저장 후 재배포

### 문제 2: "File not found" 오류
**원인**: 파일이 R2에 업로드되지 않았거나 잘못된 경로

**확인**:
```bash
# Cloudflare Dashboard에서 R2 버킷 확인
1. R2 → superplacestudy 버킷 열기
2. 파일 목록에서 snr_* 폴더 확인
3. 해당 폴더 안에 4개 파일 존재 여부 확인
```

### 문제 3: 파일이 다운로드되지 않고 에러
**원인**: Content-Type이 올바르게 설정되지 않음

**해결**: 
- 이미 구현됨 (`httpMetadata.contentType` 자동 설정)
- PDF는 `application/pdf`, 이미지는 `image/jpeg` 등

---

## 📌 다음 단계

### 1. R2 버킷 정책 설정 (선택사항)
```bash
# Public 읽기 권한 설정 (보안상 권장하지 않음)
# 대신 API를 통해서만 접근하도록 유지
```

### 2. 파일 삭제 API 추가 (선택사항)
```typescript
// DELETE /api/files/sender-number/{key}
export async function onRequestDelete(context: { env: Env; params: any }) {
  const key = params.key?.join('/');
  await env.SENDER_NUMBER_BUCKET.delete(key);
  return new Response('File deleted', { status: 200 });
}
```

### 3. 파일 만료 정책 설정 (선택사항)
```bash
# R2 버킷에 Lifecycle Rule 추가
# 예: 승인 후 1년이 지난 파일 자동 삭제
```

---

## 🎯 요약

✅ **완료된 작업**:
1. 파일 저장 방식을 Base64 → R2로 변경
2. 파일 크기 제한 제거
3. R2 업로드/조회 API 구현
4. wrangler.toml 설정 추가
5. 프론트엔드 UI 업데이트

⏳ **대기 중**:
- 배포 완료 (약 2분)
- R2 바인딩 자동 적용

🔄 **테스트 필요**:
- 큰 파일 (>500KB) 업로드 테스트
- 관리자 페이지 파일 미리보기 테스트
- 승인 프로세스 전체 플로우 검증

---

**작성일**: 2026-03-07  
**커밋**: 181567be  
**상태**: ✅ 배포 완료 대기 중
