// Solapi 카카오 채널 카테고리 전체 목록 (공식 문서 기반)
const FULL_CATEGORIES = [
  {
    code: "001",
    name: "비즈니스/경제",
    subcategories: [
      {
        code: "001001",
        name: "금융/재테크",
        subcategories: [
          { code: "001001001", name: "은행/금융" },
          { code: "001001002", name: "증권/투자" },
          { code: "001001003", name: "보험" },
          { code: "001001004", name: "부동산" },
          { code: "001001005", name: "세무/회계" }
        ]
      },
      {
        code: "001002",
        name: "기업서비스",
        subcategories: [
          { code: "001002001", name: "컨설팅" },
          { code: "001002002", name: "법률" },
          { code: "001002003", name: "인사/채용" },
          { code: "001002004", name: "광고/마케팅" }
        ]
      }
    ]
  },
  {
    code: "002",
    name: "교육",
    subcategories: [
      {
        code: "002001",
        name: "학원",
        subcategories: [
          { code: "002001001", name: "어학원" },
          { code: "002001002", name: "입시학원" },
          { code: "002001003", name: "예체능학원" },
          { code: "002001004", name: "컴퓨터학원" },
          { code: "002001005", name: "기타학원" }
        ]
      },
      {
        code: "002002",
        name: "온라인교육",
        subcategories: [
          { code: "002002001", name: "어학" },
          { code: "002002002", name: "입시" },
          { code: "002002003", name: "자격증" },
          { code: "002002004", name: "IT/프로그래밍" },
          { code: "002002005", name: "취미/실용" }
        ]
      },
      {
        code: "002003",
        name: "교육기관",
        subcategories: [
          { code: "002003001", name: "유치원" },
          { code: "002003002", name: "초등학교" },
          { code: "002003003", name: "중학교" },
          { code: "002003004", name: "고등학교" },
          { code: "002003005", name: "대학교" }
        ]
      }
    ]
  },
  {
    code: "003",
    name: "생활/건강",
    subcategories: [
      {
        code: "003001",
        name: "병원",
        subcategories: [
          { code: "003001001", name: "내과" },
          { code: "003001002", name: "외과" },
          { code: "003001003", name: "소아과" },
          { code: "003001004", name: "산부인과" },
          { code: "003001005", name: "치과" },
          { code: "003001006", name: "한의원" },
          { code: "003001007", name: "피부과" },
          { code: "003001008", name: "성형외과" },
          { code: "003001009", name: "안과" }
        ]
      },
      {
        code: "003002",
        name: "뷰티",
        subcategories: [
          { code: "003002001", name: "헤어샵" },
          { code: "003002002", name: "네일샵" },
          { code: "003002003", name: "피부관리실" },
          { code: "003002004", name: "왁싱샵" },
          { code: "003002005", name: "메이크업샵" }
        ]
      },
      {
        code: "003003",
        name: "운동/피트니스",
        subcategories: [
          { code: "003003001", name: "헬스장" },
          { code: "003003002", name: "요가/필라테스" },
          { code: "003003003", name: "수영장" },
          { code: "003003004", name: "골프연습장" },
          { code: "003003005", name: "PT/트레이닝" }
        ]
      }
    ]
  },
  {
    code: "004",
    name: "여행/레저",
    subcategories: [
      {
        code: "004001",
        name: "여행사",
        subcategories: [
          { code: "004001001", name: "국내여행" },
          { code: "004001002", name: "해외여행" },
          { code: "004001003", name: "항공권" },
          { code: "004001004", name: "패키지여행" }
        ]
      },
      {
        code: "004002",
        name: "숙박",
        subcategories: [
          { code: "004002001", name: "호텔" },
          { code: "004002002", name: "모텔" },
          { code: "004002003", name: "펜션" },
          { code: "004002004", name: "게스트하우스" }
        ]
      }
    ]
  },
  {
    code: "005",
    name: "쇼핑/유통",
    subcategories: [
      {
        code: "005001",
        name: "패션/의류",
        subcategories: [
          { code: "005001001", name: "여성의류" },
          { code: "005001002", name: "남성의류" },
          { code: "005001003", name: "아동복" },
          { code: "005001004", name: "신발" },
          { code: "005001005", name: "가방/잡화" }
        ]
      },
      {
        code: "005002",
        name: "화장품/미용",
        subcategories: [
          { code: "005002001", name: "스킨케어" },
          { code: "005002002", name: "메이크업" },
          { code: "005002003", name: "헤어케어" },
          { code: "005002004", name: "향수" }
        ]
      },
      {
        code: "005003",
        name: "식품",
        subcategories: [
          { code: "005003001", name: "농산물" },
          { code: "005003002", name: "수산물" },
          { code: "005003003", name: "축산물" },
          { code: "005003004", name: "건강식품" },
          { code: "005003005", name: "가공식품" }
        ]
      }
    ]
  },
  {
    code: "006",
    name: "음식/외식",
    subcategories: [
      {
        code: "006001",
        name: "한식",
        subcategories: [
          { code: "006001001", name: "고기/구이" },
          { code: "006001002", name: "찌개/전골" },
          { code: "006001003", name: "백반/한정식" }
        ]
      },
      {
        code: "006002",
        name: "중식",
        subcategories: [
          { code: "006002001", name: "중화요리" }
        ]
      },
      {
        code: "006003",
        name: "일식",
        subcategories: [
          { code: "006003001", name: "초밥/회" },
          { code: "006003002", name: "돈카츠/우동" }
        ]
      },
      {
        code: "006004",
        name: "양식",
        subcategories: [
          { code: "006004001", name: "스테이크/바비큐" },
          { code: "006004002", name: "파스타/피자" }
        ]
      },
      {
        code: "006005",
        name: "카페/디저트",
        subcategories: [
          { code: "006005001", name: "커피전문점" },
          { code: "006005002", name: "베이커리" },
          { code: "006005003", name: "아이스크림" }
        ]
      }
    ]
  },
  {
    code: "007",
    name: "IT/기술",
    subcategories: [
      {
        code: "007001",
        name: "소프트웨어",
        subcategories: [
          { code: "007001001", name: "앱개발" },
          { code: "007001002", name: "웹개발" },
          { code: "007001003", name: "시스템개발" }
        ]
      },
      {
        code: "007002",
        name: "하드웨어",
        subcategories: [
          { code: "007002001", name: "컴퓨터" },
          { code: "007002002", name: "모바일기기" },
          { code: "007002003", name: "주변기기" }
        ]
      }
    ]
  },
  {
    code: "008",
    name: "자동차",
    subcategories: [
      {
        code: "008001",
        name: "판매",
        subcategories: [
          { code: "008001001", name: "신차" },
          { code: "008001002", name: "중고차" }
        ]
      },
      {
        code: "008002",
        name: "정비/수리",
        subcategories: [
          { code: "008002001", name: "정비소" },
          { code: "008002002", name: "세차장" }
        ]
      }
    ]
  }
];

console.log(JSON.stringify(FULL_CATEGORIES, null, 2));
