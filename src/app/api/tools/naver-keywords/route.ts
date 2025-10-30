import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 네이버 광고 API 설정
const NAVER_AD_API_URL = "https://api.searchad.naver.com";
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "키워드를 입력해주세요" },
        { status: 400 }
      );
    }

    // 네이버 API 키 확인
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.warn("네이버 API 키가 설정되지 않았습니다. Mock 데이터를 반환합니다.");
      return NextResponse.json(getMockData(keyword));
    }

    try {
      // 실제 네이버 광고 API 호출
      const keywordData = await getNaverKeywordData(keyword);
      return NextResponse.json(keywordData);
    } catch (apiError) {
      console.error("네이버 API 호출 실패:", apiError);
      
      // API 호출 실패 시 Mock 데이터 반환
      return NextResponse.json({
        ...getMockData(keyword),
        warning: "네이버 API 연결 실패. 샘플 데이터를 표시합니다.",
        isRealData: false,
      });
    }
  } catch (error) {
    console.error("Keyword search error:", error);
    return NextResponse.json(
      { error: "키워드 검색 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 실제 네이버 광고 API 호출 함수
async function getNaverKeywordData(keyword: string) {
  // 네이버 광고 API - 키워드 도구 API
  // https://naver.github.io/searchad-apidoc/#/operations/GET/keywordstool
  
  const timestamp = Date.now().toString();
  const signature = generateSignature(timestamp);

  // 1. 키워드 검색량 조회
  const searchVolumeResponse = await fetch(
    `${NAVER_AD_API_URL}/keywordstool?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`,
    {
      method: "GET",
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": NAVER_CLIENT_ID!,
        "X-Customer": NAVER_CLIENT_ID!,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchVolumeResponse.ok) {
    throw new Error(`네이버 API 오류: ${searchVolumeResponse.status}`);
  }

  const data = await searchVolumeResponse.json();
  
  // 네이버 API 응답 형식에 맞게 파싱
  const keywordList = data.keywordList || [];
  const mainKeyword = keywordList.find((k: any) => 
    k.relKeyword.toLowerCase() === keyword.toLowerCase()
  ) || keywordList[0];

  if (!mainKeyword) {
    throw new Error("키워드 데이터를 찾을 수 없습니다");
  }

  // 월간 검색량 (PC + 모바일)
  const monthlyPcQcCnt = parseInt(mainKeyword.monthlyPcQcCnt) || 0;
  const monthlyMobileQcCnt = parseInt(mainKeyword.monthlyMobileQcCnt) || 0;
  const monthlySearchVolume = monthlyPcQcCnt + monthlyMobileQcCnt;

  // 연간 검색량 (월간 * 12)
  const yearlySearchVolume = monthlySearchVolume * 12;

  // 경쟁 강도
  const compLevel = mainKeyword.compIdx;
  let competition = "중간";
  if (compLevel === "높음" || compLevel > 70) competition = "높음";
  else if (compLevel === "낮음" || compLevel < 30) competition = "낮음";

  // 연관 키워드 추출
  const relatedKeywords = keywordList
    .filter((k: any) => k.relKeyword !== keyword)
    .slice(0, 5)
    .map((k: any) => ({
      keyword: k.relKeyword,
      searchVolume: parseInt(k.monthlyPcQcCnt || 0) + parseInt(k.monthlyMobileQcCnt || 0),
      competition: k.compIdx,
    }));

  return {
    keyword,
    monthlySearchVolume,
    yearlySearchVolume,
    competition,
    relatedKeywords,
    isRealData: true,
    additionalInfo: {
      pcSearchVolume: monthlyPcQcCnt,
      mobileSearchVolume: monthlyMobileQcCnt,
      competitionIndex: compLevel,
    },
  };
}

// HMAC 서명 생성 (네이버 API 인증용)
function generateSignature(timestamp: string): string {
  const crypto = require("crypto");
  const message = `${timestamp}.GET./keywordstool`;
  const signature = crypto
    .createHmac("sha256", NAVER_CLIENT_SECRET!)
    .update(message)
    .digest("base64");
  return signature;
}

// Mock 데이터 생성 함수
function getMockData(keyword: string) {
  return {
    keyword: keyword,
    monthlySearchVolume: Math.floor(Math.random() * 50000) + 1000,
    yearlySearchVolume: Math.floor(Math.random() * 600000) + 12000,
    competition: ["높음", "중간", "낮음"][Math.floor(Math.random() * 3)],
    relatedKeywords: [
      {
        keyword: `${keyword} 방법`,
        searchVolume: Math.floor(Math.random() * 10000) + 500,
      },
      {
        keyword: `${keyword} 추천`,
        searchVolume: Math.floor(Math.random() * 8000) + 400,
      },
      {
        keyword: `${keyword} 비용`,
        searchVolume: Math.floor(Math.random() * 6000) + 300,
      },
      {
        keyword: `${keyword} 후기`,
        searchVolume: Math.floor(Math.random() * 5000) + 200,
      },
      {
        keyword: `${keyword} 업체`,
        searchVolume: Math.floor(Math.random() * 4000) + 100,
      },
    ],
    isRealData: false,
    warning: "네이버 API 키가 설정되지 않았습니다. 샘플 데이터를 표시합니다.",
  };
}
