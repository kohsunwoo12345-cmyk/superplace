# ⚠️ 중요: 데이터베이스 마이그레이션 필수

## 🚨 즉시 실행해야 할 작업

코드가 배포되었지만, **데이터베이스 마이그레이션**을 실행하지 않으면 수업 기능이 작동하지 않습니다!

## 📋 실행 명령어

### 1단계: 데이터베이스 백업 (안전을 위해)
```bash
wrangler d1 export superplace-db --output backup_before_class_migration.sql
```

### 2단계: 테이블 생성 (필수)
```bash
wrangler d1 execute superplace-db --remote --file=migrations/create_class_tables.sql
```

### 3단계: 확인
```bash
# 테이블이 생성되었는지 확인
wrangler d1 execute superplace-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Class%'"
```

예상 결과:
```
Class
ClassSchedule  
ClassStudent
```

## ✅ 성공 시 화면
```
🌀 Executing on remote database superplace-db (xxxxxxxx):
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
🚣 Executed 6 commands in X.XXXms
```

## ❌ 마이그레이션하지 않으면?
- 수업 목록이 비어있음
- 수업 추가 시 에러 발생
- "Database not configured" 오류

## 🎯 마이그레이션 후
- ✅ 수업 데이터가 영구 저장됨
- ✅ 서버 재시작해도 데이터 유지
- ✅ 수업 자동 삭제 문제 완전 해결

## 📞 도움이 필요하면
`CLASS_MIGRATION_GUIDE.md` 파일을 참조하세요.

---

**긴급도**: 🔴 Critical  
**소요 시간**: 1-2분  
**작업자**: DevOps/Admin
