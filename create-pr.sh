#!/bin/bash

# GitHub CLI를 사용하여 PR 생성
gh pr create \
  --title "fix: UI 복구 및 발신번호 API 토큰 파서 개선 (5개 파트 토큰 지원)" \
  --body "## 🎯 변경 사항

### ✅ UI 완전 복구
- 안정적인 커밋(656e1e55)으로 리셋하여 UI 완전 복구
- 모든 페이지 정상 렌더링 확인 (메인, 로그인, 대시보드 등)
- HTML/CSS/JavaScript 정상 로드 확인

### ✅ 발신번호 API 개선
- **3개 파트 토큰** (기존): \`ID|email|role\`
- **5개 파트 토큰** (신규): \`ID|email|role|academyId|timestamp\`
- 신규 회원가입 후 로그인 사용자 403 에러 해결

### 📝 수정된 파일
1. \`/functions/api/sender-number/register.ts\` - 토큰 파서 개선
2. \`/functions/api/sender-numbers/approved.ts\` - 토큰 파서 개선 및 컬럼명 수정
3. \`/functions/api/admin/sender-number-requests/approve.ts\` - 토큰 파서 개선

### ✅ 테스트 완료
- ✅ 메인 페이지 정상 로드 (45.4KB, HTML/CSS/JS 모두 정상)
- ✅ 로그인 페이지 정상 로드 (14.3KB)
- ✅ 발신번호 등록 페이지 정상 로드 (10.7KB)
- ✅ 3개 파트 토큰으로 발신번호 등록 성공
- ✅ 5개 파트 토큰으로 발신번호 등록 성공

### 🔗 관련 이슈
- 사용자 보고: 전체 웹 UI가 이상한 글자로만 보이는 문제
- 발신번호 등록 시 403 에러 발생 (신규 가입 사용자)

## 📊 영향 범위
- **긍정적 영향**: UI 완전 복구, 신규 사용자 발신번호 등록 가능
- **부정적 영향**: 없음 (기존 3개 파트 토큰 100% 호환)

## 🚀 배포 상태
- Commit: 05101fcb
- 배포: Cloudflare Pages (자동 배포 완료)
- 검증: 모든 테스트 통과 ✅" \
  --head main \
  --base main

