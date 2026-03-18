#!/bin/bash

echo "=========================================="
echo "🔍 출석 인증 D1_ERROR 진단"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""

echo "📍 Step 1: D1 데이터베이스 스키마 확인"
echo "----------------------------------------"

# D1 데이터베이스 스키마 확인
echo ""
echo "🔍 'class' 컬럼 관련 테이블 검색..."
grep -r "class" functions/ --include="*.ts" | grep -i "select\|insert\|update" | head -20

echo ""
echo "🔍 출석 관련 파일 검색..."
find functions/ -name "*attendance*" -o -name "*attend*" 2>/dev/null

echo ""
echo "🔍 채점 관련 파일 검색..."
find functions/ -name "*grade*" -o -name "*score*" 2>/dev/null

echo ""
echo "=========================================="
echo "📍 Step 2: 에러 발생 가능 지점 찾기"
echo "=========================================="

# 'class' 컬럼을 사용하는 쿼리 찾기
echo ""
echo "🔍 SQL 쿼리에서 'class' 컬럼 사용 검색..."
grep -r "\.class" functions/ --include="*.ts" | head -10

echo ""
echo "=========================================="
echo "진단 완료"
echo "=========================================="
