#!/bin/bash

# 실제 프로덕션 users 테이블 컬럼 목록 확인
curl -s "https://suplacestudy.com/api/admin/check-users-schema" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'schema' in data:
    columns = [col['name'] for col in data['schema']]
    print('✅ users 테이블 실제 컬럼 목록:')
    for i, col in enumerate(columns, 1):
        print(f'  {i}. {col}')
    
    # approved 컬럼 존재 여부
    if 'approved' in columns:
        print('\n✅ approved 컬럼 존재함')
    else:
        print('\n❌ approved 컬럼 존재하지 않음!')
"

