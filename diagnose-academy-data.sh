#!/bin/bash
# User 테이블의 학원장 데이터 확인

echo "🔍 User 테이블 학원장 데이터 분석"
echo "====================================="

# D1 데이터베이스 직접 쿼리 (Cloudflare API 사용)
# 주의: 이 스크립트는 Cloudflare API 토큰이 필요합니다

# 1. academyId별 학원장 수 확인
echo ""
echo "📊 academyId별 학원장 분포:"
echo "SELECT academyId, COUNT(*) as count"
echo "FROM User"
echo "WHERE role = 'DIRECTOR'"
echo "GROUP BY academyId"
echo "ORDER BY count DESC"
echo "LIMIT 20;"
echo ""
echo "예상 결과:"
echo "academyId | count"
echo "1         | 많음 (여러 명이 academyId=1)"
echo "208       | 1"
echo "107       | 1"
echo "..."
echo ""

# 2. 유니크 academyId 수
echo "📊 유니크 academyId 수:"
echo "SELECT COUNT(DISTINCT academyId) as unique_academies"
echo "FROM User"
echo "WHERE role = 'DIRECTOR';"
echo ""
echo "예상 결과: 133 또는 그 이하"
echo ""

# 3. NULL academyId 확인
echo "📊 academyId가 NULL인 학원장:"
echo "SELECT COUNT(*) as null_count"
echo "FROM User"
echo "WHERE role = 'DIRECTOR' AND academyId IS NULL;"
echo ""

echo "⚠️ 문제 진단:"
echo "1. 만약 academyId=1인 학원장이 많다면:"
echo "   → 여러 학원장이 같은 academyId를 공유"
echo "   → 이 경우 Map 중복 제거로 첫 번째만 선택"
echo ""
echo "2. 만약 academyId가 NULL이 많다면:"
echo "   → 학원 정보가 없는 학원장"
echo "   → 이들은 API에서 제외됨"
echo ""
echo "3. 만약 유니크 academyId가 3개뿐이라면:"
echo "   → 실제로 학원이 3개만 있음"
echo "   → 나머지 학원장은 academyId가 NULL이거나 1, 208, 107 중 하나"
echo ""

echo "💡 해결 방법:"
echo "1. Cloudflare Dashboard → D1 Database → webapp-production"
echo "2. SQL 쿼리 실행:"
echo "   SELECT academyId, COUNT(*) FROM User WHERE role = 'DIRECTOR' GROUP BY academyId;"
echo "3. 결과 확인 후 판단"
