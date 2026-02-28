# 브라우저 콘솔 에러 확인 방법

페이지에서 정확한 에러를 확인하기 위해 다음을 실행해주세요:

## 1단계: 개발자 도구 열기
- Windows/Linux: `F12` 또는 `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

## 2단계: Console 탭 클릭

## 3단계: 페이지 새로고침
- `F5` 또는 새로고침 버튼 클릭

## 4단계: 빨간색 에러 메시지 복사
- Console에 나타나는 빨간색 에러 메시지 전체를 복사해주세요
- 특히 다음과 같은 내용을 찾아주세요:
  - "Uncaught Error"
  - "TypeError"
  - "ReferenceError"
  - 파일명과 줄번호 (예: page-ca5407d59bcfd501.js:1:2345)

## 5단계: Network 탭 확인
1. 개발자 도구에서 **Network** 탭 클릭
2. 페이지 새로고침
3. 빨간색으로 표시된 실패한 요청이 있는지 확인
4. 실패한 요청을 클릭해서 Response 탭의 내용 복사

## 예시 에러 메시지
```
Uncaught TypeError: Cannot read property 'map' of undefined
    at KakaoChannelListPage (page-ca5407d59bcfd501.js:123:45)
    at ...
```

이런 형식의 에러 메시지를 찾아주세요!
