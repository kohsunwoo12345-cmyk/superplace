#!/bin/bash

echo "=========================================="
echo "🔧 모든 Admin 페이지 권한 체크 제거"
echo "=========================================="

FILES=(
  "src/app/dashboard/admin/bot-management/page.tsx"
  "src/app/dashboard/admin/payment-approvals/page.tsx"
  "src/app/dashboard/admin/pricing/page.tsx"
  "src/app/dashboard/admin/revenue/page.tsx"
  "src/app/dashboard/admin/users/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo ""
    echo "처리 중: $file"
    
    # 권한 체크 코드 패턴 검색
    if grep -q "role.*ADMIN\|접근 권한" "$file"; then
      echo "  ✓ 권한 체크 발견"
      
      # 백업
      cp "$file" "${file}.backup"
      
      # Python으로 복잡한 교체 수행
      python3 << 'PYTHON'
import re
import sys

file_path = sys.argv[1]

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 권한 체크 패턴 찾기 및 제거
patterns = [
    # 패턴 1: if (userData.role !== "ADMIN" ...) { alert...; router.push...; return; }
    r'if\s*\([^)]*role[^)]*!==\s*["\']ADMIN["\'][^{]*\)\s*\{[^}]*alert\([^)]*접근[^)]*\);[^}]*router\.push[^}]*;[^}]*return;[^}]*\}',
    # 패턴 2: // 관리자 체크 부터 return; 까지
    r'//\s*관리자\s*체크[\s\S]*?return;\s*\}',
]

for pattern in patterns:
    content = re.sub(pattern, '// 권한 체크 제거됨', content, flags=re.MULTILINE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"  ✓ 수정 완료: {file_path}")
PYTHON "$file"
      
    else
      echo "  - 권한 체크 없음"
    fi
  fi
done

echo ""
echo "=========================================="
echo "✅ 완료"
echo "=========================================="

