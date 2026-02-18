# 폴더 시스템 및 조회수 강조 표시 기능 추가

## 🎯 사용자 요구사항

1. ✅ **폴더 시스템**: 각 사용자들이 제작한 랜딩페이지를 나눠서 모아둘 수 있는 시스템
2. ✅ **조회수 표시**: 각 페이지마다 조회수를 볼 수 있도록

---

## ✅ 구현 완료

### 1️⃣ 폴더별 필터링 시스템

#### 폴더 필터 UI (녹색 강조)
```tsx
// 폴더 필터 카드
<Card className="border-2 border-green-300 bg-green-50">
  <CardHeader>
    <CardTitle>📁 폴더별 필터</CardTitle>
    <CardDescription>
      각 사용자가 제작한 랜딩페이지를 폴더별로 분류하여 확인하세요
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* 필터 버튼들 */}
  </CardContent>
</Card>
```

#### 필터 버튼
1. **전체** (회색 버튼)
   - 모든 랜딩페이지 표시
   - 카운트: `전체 (15)`

2. **미분류** (회색 버튼)
   - 폴더에 속하지 않은 페이지
   - 카운트: `미분류 (3)`

3. **폴더별** (인디고 버튼)
   - 각 폴더의 페이지만 표시
   - 카운트: `📂 1월 리포트 (5)`
   - 카운트: `📂 2월 리포트 (7)`

#### 필터링 로직
```tsx
// 폴더별 필터링
const filteredPages = selectedFolder === "all"
  ? landingPages
  : selectedFolder === "no-folder"
  ? landingPages.filter((page) => !page.folder_id)
  : landingPages.filter((page) => page.folder_id === selectedFolder);
```

---

### 2️⃣ 조회수 강조 표시

#### Before (기존)
```tsx
// 단순 텍스트
<span>조회 {page.viewCount}회</span>
```

#### After (개선) ⭐
```tsx
// 파란색 둥근 배지
<span className="flex items-center gap-1 px-3 py-1 bg-blue-100 border-2 border-blue-300 rounded-full text-blue-800 font-semibold">
  <FileText className="w-4 h-4" />
  👁️ 조회 {page.viewCount}회
</span>
```

**특징**:
- 👁️ **눈 이모지** + 아이콘
- 🔵 **파란색 배지** (bg-blue-100, border-blue-300)
- 🔴 **둥근 형태** (rounded-full)
- 💪 **굵은 글씨** (font-semibold)

---

### 3️⃣ 신청자 수 강조 표시

```tsx
// 보라색 둥근 배지
<span className="flex items-center gap-1 px-3 py-1 bg-purple-100 border-2 border-purple-300 rounded-full text-purple-800 font-semibold">
  <Users className="w-4 h-4" />
  📝 신청 {page.submissions}명
</span>
```

**특징**:
- 📝 **펜 이모지** + 아이콘
- 🟣 **보라색 배지** (bg-purple-100, border-purple-300)

---

### 4️⃣ 폴더명 표시

```tsx
// 녹색 둥근 배지
{page.folderName && (
  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border-2 border-green-300 rounded-full text-green-800 font-semibold">
    <FolderOpen className="w-4 h-4" />
    📁 {page.folderName}
  </span>
)}
```

**특징**:
- 📁 **폴더 이모지** + 아이콘
- 🟢 **녹색 배지** (bg-green-100, border-green-300)

---

### 5️⃣ 필터 결과 요약

```tsx
// 필터 상태 표시
<div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
  <p className="text-gray-700 font-semibold">
    {selectedFolder === "all"
      ? `전체 ${filteredPages.length}개`
      : selectedFolder === "no-folder"
      ? `미분류 ${filteredPages.length}개`
      : `${folderName} 폴더 ${filteredPages.length}개`}
  </p>
  <p className="text-sm text-gray-500">
    총 조회수: <strong className="text-blue-600">{filteredPages.reduce((sum, p) => sum + p.viewCount, 0)}회</strong>
  </p>
</div>
```

**표시 정보**:
- 📊 현재 필터 상태 (전체/미분류/폴더명)
- 📄 필터링된 페이지 개수
- 👁️ 총 조회수 (파란색 강조)

---

## 🎨 UI 개선 사항

### 배지 색상 시스템

| 항목 | 색상 | 배경 | 테두리 | 텍스트 |
|------|------|------|--------|--------|
| **조회수** | 파란색 | bg-blue-100 | border-blue-300 | text-blue-800 |
| **신청자** | 보라색 | bg-purple-100 | border-purple-300 | text-purple-800 |
| **폴더명** | 녹색 | bg-green-100 | border-green-300 | text-green-800 |

### 폴더 필터 카드
```
┌──────────────────────────────────────┐
│ 📁 폴더별 필터                        │
│ 각 사용자가 제작한 랜딩페이지를...    │
├──────────────────────────────────────┤
│ [전체 (15)] [미분류 (3)]             │
│ [📂 1월 리포트 (5)] [📂 2월 리포트 (7)]│
└──────────────────────────────────────┘
```

### 랜딩페이지 카드
```
┌──────────────────────────────────────┐
│ 김철수 학생의 학습 리포트             │
│ [활성]                                │
│                                       │
│ 👤 김철수                             │
│ 📅 2024-02-18                         │
│ [👁️ 조회 150회] [📝 신청 5명] [📁 1월]│
└──────────────────────────────────────┘
```

---

## 📊 사용 흐름

### 1️⃣ 폴더 생성 (관리자)
```
랜딩페이지 목록 → "📁 폴더 관리" 버튼
→ "새 폴더 만들기"
→ 폴더 이름: "1월 학습 리포트"
→ 설명: "2024년 1월 학생들의 리포트"
→ 저장
```

### 2️⃣ 랜딩페이지 생성 시 폴더 선택
```
"✨ 새 학습 리포트 만들기"
→ 학생 선택
→ 제목 입력
→ ...
→ 5️⃣ 폴더 선택: "1월 학습 리포트" 선택
→ ...
→ 생성
```

### 3️⃣ 폴더별 필터링
```
랜딩페이지 목록 페이지
→ "📁 폴더별 필터" 카드
→ "📂 1월 학습 리포트 (5)" 버튼 클릭
→ 해당 폴더의 페이지만 표시
→ 총 조회수 확인
```

### 4️⃣ 조회수 확인
```
각 랜딩페이지 카드에서:
- [👁️ 조회 150회] 배지 확인
- [📝 신청 5명] 배지 확인
- 전체 통계에서 총 조회수 확인
```

---

## 🔧 기술 구현

### State 관리
```tsx
const [folders, setFolders] = useState<Folder[]>([]);
const [selectedFolder, setSelectedFolder] = useState<string>("all");
```

### API 연동
```tsx
// 폴더 목록 조회
const fetchFolders = async () => {
  const response = await fetch("/api/landing/folders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  setFolders(data.folders || []);
};
```

### 필터링 로직
```tsx
const filteredPages = selectedFolder === "all"
  ? landingPages
  : selectedFolder === "no-folder"
  ? landingPages.filter((page) => !page.folder_id)
  : landingPages.filter((page) => page.folder_id === selectedFolder);
```

---

## 📈 통계 카드 (기존 유지)

| 항목 | 색상 | 값 |
|------|------|-----|
| 총 랜딩페이지 | 인디고 | 15개 |
| 활성 페이지 | 녹색 | 12개 |
| **총 조회수** | **파란색** | **1,234회** ⭐ |
| 총 신청자 | 보라색 | 45명 |

---

## 🚀 배포 상태

### GitHub
- ✅ **커밋 해시**: `bb3fa41`
- ✅ **커밋 메시지**: "feat: 폴더별 필터링 및 조회수 강조 표시 추가"
- ✅ **푸시 완료**: `origin/main`
- 📎 **리포지토리**: https://github.com/kohsunwoo12345-cmyk/superplace

### 빌드
```bash
$ npm run build
✓ Compiled successfully in 15.0s
✓ Generating static pages (75/75)
```
- ✅ 빌드 성공
- ✅ 75개 페이지 정상 생성

### Cloudflare Pages
- 🚀 **자동 배포 진행 중** (5-10분 소요)
- 🌐 **배포 URL**: https://superplacestudy.pages.dev

---

## 🧪 테스트 가이드 (5-10분 후)

### 1단계: 폴더 생성
```
1. 랜딩페이지 목록 접속
2. "📁 폴더 관리" 버튼 클릭
3. "새 폴더 만들기" 클릭
4. 폴더 이름: "1월 학습 리포트"
5. 저장
```

### 2단계: 랜딩페이지 생성 (폴더 지정)
```
1. "✨ 새 학습 리포트 만들기" 클릭
2. 학생 선택
3. 제목 입력
4. ...
5. 5️⃣ 폴더 선택: "1월 학습 리포트" 선택
6. ...
7. 생성
```

### 3단계: 폴더 필터 확인
```
1. 랜딩페이지 목록 페이지
2. "📁 폴더별 필터" 카드 확인
3. 버튼 확인:
   - [전체 (15)]
   - [미분류 (3)]
   - [📂 1월 학습 리포트 (1)]
4. "📂 1월 학습 리포트" 클릭
5. 필터링된 결과 확인
```

### 4단계: 조회수 확인
```
각 랜딩페이지 카드에서:
✅ [👁️ 조회 0회] 파란색 배지
✅ [📝 신청 0명] 보라색 배지
✅ [📁 1월 학습 리포트] 녹색 배지
```

### 5단계: 필터 결과 요약 확인
```
✅ "1월 학습 리포트 폴더 1개"
✅ "총 조회수: 0회" (파란색 강조)
```

---

## 📊 변경 통계

### 수정된 파일
```
src/app/dashboard/admin/landing-pages/page.tsx
- 111 lines added
- 9 lines deleted
```

### 추가된 기능
1. ✅ **폴더별 필터링** (전체/미분류/폴더별)
2. ✅ **조회수 강조 표시** (파란색 배지)
3. ✅ **신청자 수 강조 표시** (보라색 배지)
4. ✅ **폴더명 표시** (녹색 배지)
5. ✅ **필터 결과 요약** (개수, 조회수)

### UI 개선
- ✅ 폴더 필터 카드 (녹색 테마)
- ✅ 둥근 배지 디자인 (rounded-full)
- ✅ 아이콘 + 이모지 조합
- ✅ 색상 테마 시스템 (파란, 보라, 녹색)

---

## 🎯 사용 시나리오

### 시나리오 1: 월별 리포트 관리
```
1. "1월 리포트" 폴더 생성
2. "2월 리포트" 폴더 생성
3. 각 학생의 1월 리포트 생성 → "1월 리포트" 폴더 선택
4. 각 학생의 2월 리포트 생성 → "2월 리포트" 폴더 선택
5. 목록에서 "📂 1월 리포트" 버튼 클릭 → 1월 리포트만 표시
6. 각 페이지의 조회수 확인: [👁️ 조회 25회]
```

### 시나리오 2: 사용자별 리포트 관리
```
1. "김철수" 폴더 생성
2. "이영희" 폴더 생성
3. 김철수 학생의 리포트들 → "김철수" 폴더
4. 이영희 학생의 리포트들 → "이영희" 폴더
5. 목록에서 "📂 김철수" 버튼 클릭 → 김철수 리포트만 표시
6. 총 조회수 확인
```

### 시나리오 3: 조회수 모니터링
```
1. 목록 페이지에서 각 페이지의 [👁️ 조회 XX회] 확인
2. 상단 통계 카드에서 "총 조회수" 확인
3. 폴더 필터 선택 시 해당 폴더의 총 조회수 확인
4. 조회수가 높은 페이지 식별
```

---

## 🎉 완료!

### 사용자 요구사항
> 1. ✅ 폴더에 각 사용자들이 제작한 랜딩페이지를 나눠서 모아둘 수 있는 시스템
> 2. ✅ 각 페이지마다 조회수를 볼 수 있도록

### 해결
> ✅ **폴더별 필터링 시스템 완성**
> ✅ **조회수 강조 표시 완성**

### 결과
- ✅ 폴더별 필터 버튼 (전체/미분류/폴더별)
- ✅ 실시간 페이지 개수 표시
- ✅ 조회수 파란색 배지로 강조
- ✅ 신청자 수 보라색 배지로 강조
- ✅ 폴더명 녹색 배지로 표시
- ✅ 필터 결과 요약 (개수, 조회수)
- ✅ 빌드 성공, 배포 진행 중

---

## 📁 접근 URL

| 페이지 | URL |
|--------|-----|
| **📋 목록** | https://superplacestudy.pages.dev/dashboard/admin/landing-pages |
| 📁 폴더 관리 | https://superplacestudy.pages.dev/dashboard/admin/landing-pages/folders |
| ✨ 생성 | https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create |

---

**작성일**: 2026-02-18  
**수정자**: GenSpark AI Developer  
**커밋**: bb3fa41  
**상태**: ✅ **폴더 시스템 & 조회수 강조 완료!**
