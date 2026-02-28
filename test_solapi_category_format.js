/**
 * Solapi 카테고리 실제 테스트
 */

// Solapi API 카테고리 응답 예상 형식:
const expectedFormat1 = {
  // 형식 1: 숫자 코드
  code: "002001001",
  name: "어학원"
};

const expectedFormat2 = {
  // 형식 2: 문자열 코드
  categoryCode: "academy",
  categoryName: "학원"
};

const expectedFormat3 = {
  // 형식 3: Kakao 공식 카테고리 코드
  code: "PC00",
  name: "학원"
};

console.log('테스트 필요한 형식들:', {
  format1: expectedFormat1,
  format2: expectedFormat2,
  format3: expectedFormat3
});

// Solapi 문서에 따르면 categoryCode는 카카오의 공식 카테고리 코드를 사용해야 함
// 예: PC00 (학원), PH00 (병원) 등
