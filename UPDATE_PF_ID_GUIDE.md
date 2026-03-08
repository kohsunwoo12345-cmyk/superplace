# 카카오 채널 pfId 업데이트 가이드

## 문제 상황
현재 DB에 저장된 `solapiChannelId`가 한글 채널명("꾸메땅학원")으로 되어 있어 Solapi API 호출이 실패합니다.
실제 pfId는 `KA01PF...` 형식의 32~40자 영문/숫자 코드여야 합니다.

## 해결 방법

### 1단계: Solapi 콘솔에서 pfId 확인

1. https://solapi.com 로그인
2. **좌측 메뉴** → **카카오톡** → **카카오톡 채널** 클릭
3. 등록된 채널 목록에서 "꾸메땅학원" 찾기
4. **PF ID** 열에서 값 복사 (예: `KA01PF240301AB12CD34EF56GH78IJ90KL`)

### 2단계: Cloudflare D1에서 DB 업데이트

1. https://dash.cloudflare.com/ 접속
2. **Workers & Pages** → `superplacestudy` 선택
3. **Settings** → **Bindings** → **D1** → `webapp-production` 클릭
4. **Console** 탭 열기
5. 다음 SQL 실행:

```sql
-- 현재 데이터 확인
SELECT 
    id,
    channelName,
    solapiChannelId as current_pfId,
    LENGTH(solapiChannelId) as length,
    phoneNumber,
    userId
FROM KakaoChannel 
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- pfId 업데이트 (아래 YOUR_REAL_PFID_HERE를 실제 pfId로 교체)
UPDATE KakaoChannel 
SET solapiChannelId = 'YOUR_REAL_PFID_HERE',
    updatedAt = CURRENT_TIMESTAMP
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- 업데이트 확인
SELECT 
    id,
    channelName,
    solapiChannelId as updated_pfId,
    LENGTH(solapiChannelId) as length
FROM KakaoChannel 
WHERE id = 'ch_1772359215883_fk4otb5hv';
```

### 3단계: 템플릿 등록 테스트

업데이트 후:
1. https://superplacestudy.pages.dev/dashboard/kakao-alimtalk/templates/create/ 접속
2. 새로고침 (Ctrl+F5)
3. 채널 선택: "꾸메땅학원"
4. 내용 입력 (템플릿 코드와 이름은 자동 생성됨):
   - 내용: `안녕하세요 #{학생이름}님, 이번 달 성과리포트입니다.`
   - 카테고리: 교육 (012)
5. **등록하기** 클릭
6. F12 콘솔 확인:
   ```
   ✅ DB에서 pfId 조회 성공: { pfId: "KA01PF...", length: 32 }
   🚀 Solapi API 호출: { pfId: "KA01PF...", templateId: "TPL_...", ... }
   📥 Solapi 응답: { status: 201, ok: true }
   ```

## 예상 결과

- ✅ 템플릿 등록 성공 팝업
- ✅ 템플릿 코드: `TPL_1709876543210_A3F8Z2`
- ✅ 템플릿 이름: `report_1709876543210_B4C9`
- ✅ 상태: 검수 대기 (REG)
- ✅ 템플릿 목록 페이지로 이동

## pfId 형식

- **형식**: `KA01PF` + 숫자/영문 조합
- **길이**: 30~40자
- **예시**: `KA01PF240301AB12CD34EF56GH78IJ90KL` (32자)

## 문제 해결

### pfId가 보이지 않는 경우
- Solapi 콘솔에서 카카오 채널이 정상 연동되었는지 확인
- 채널 상태가 "정상"인지 확인

### 여전히 실패하는 경우
1. 브라우저 콘솔(F12) 확인
2. Network 탭에서 `/api/kakao/templates/register` 응답 확인
3. Cloudflare Workers 로그 확인

## 자동화된 방법 (향후 개선)

현재는 수동으로 pfId를 입력해야 하지만, 향후 다음 기능을 추가할 예정:
1. 채널 연동 시 Solapi API에서 자동으로 pfId 조회
2. DB에 자동 저장
3. 주기적 동기화

---

**참고**: 템플릿 코드와 이름은 서버에서 자동 생성되므로 입력할 필요가 없습니다.
- 템플릿 코드: `TPL_<timestamp>_<random>`
- 템플릿 이름: `report_<timestamp>_<random>`
