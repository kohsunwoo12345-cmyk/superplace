#!/bin/bash

# 반응형 개선을 위한 패턴 리스트
declare -A PATTERNS=(
  # 컨테이너
  ["className=\"max-w-"]="className=\"max-w-"
  ["className=\"w-full max-w-md"]="className=\"w-full max-w-md sm:max-w-lg"
  ["className=\"w-full max-w-lg"]="className=\"w-full max-w-lg md:max-w-xl"
  
  # 패딩
  ["p-4\""]="p-4 sm:p-6\""
  ["p-6\""]="p-4 sm:p-6 md:p-8\""
  ["px-4 py-"]="px-4 sm:px-6 py-"
  
  # 텍스트 크기
  ["text-3xl font-bold"]="text-2xl sm:text-3xl font-bold"
  ["text-2xl font-bold"]="text-xl sm:text-2xl font-bold"
  ["text-xl font"]="text-lg sm:text-xl font"
  
  # 아이콘 크기
  ["h-10 w-10"]="h-8 w-8 sm:h-10 sm:w-10"
  ["h-8 w-8"]="h-6 w-6 sm:h-8 sm:w-8"
  
  # 간격
  ["space-y-4"]="space-y-3 sm:space-y-4"
  ["space-y-6"]="space-y-4 sm:space-y-6"
  ["gap-4"]="gap-3 sm:gap-4 md:gap-6"
  
  # 버튼/입력 높이
  ["className=\"w-full bg-"]="className=\"w-full h-11 sm:h-12 bg-"
)

echo "반응형 패턴 적용 스크립트"
echo "=========================="
