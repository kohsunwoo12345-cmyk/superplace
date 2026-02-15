# 🔧 학생 "Sjss" 정보 수정 가이드

## 📋 문제 상황

**학생 정보**:
- 이름: `Sjss`
- 전화번호: `01085328`
- 이메일: `student_01085328_1771126812909@temp.student.local`

**표시 상태**:
- ❌ 이메일: 미등록
- ❌ 소속 학교: 미등록
- ❌ 학년: 미등록
- ❌ 소속 학원: 미등록
- ❌ 소속 반: 미등록

**원인**:
이 학생은 `school`, `grade`, `diagnostic_memo` 컬럼이 **추가되기 전**에 생성되어 해당 필드가 모두 `NULL`입니다.

---

## ✅ 해결 방법 1: D1 콘솔에서 직접 수정

### 1단계: Cloudflare D1 콘솔 접속
```
Cloudflare Dashboard → Workers & Pages → D1 → superplace 데이터베이스 → Console
```

### 2단계: 학생 ID 확인
```sql
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id
FROM users 
WHERE email LIKE '%student_01085328_%' 
  AND role = 'STUDENT';
```

### 3단계: 정보 업데이트
```sql
UPDATE users 
SET 
  school = '서울고등학교',        -- 실제 학교명으로 변경
  grade = '고2',                  -- 실제 학년으로 변경
  diagnostic_memo = '진단 메모',  -- 진단 메모 (선택사항)
  academy_id = 120                -- 소속 학원 ID
WHERE email = 'student_01085328_1771126812909@temp.student.local';
```

### 4단계: 확인
```sql
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id
FROM users 
WHERE email = 'student_01085328_1771126812909@temp.student.local';
```

---

## ✅ 해결 방법 2: 학생 편집 API 생성 (영구적 해결책)

### 새 API 생성: `functions/api/students/edit.ts`

```typescript
interface Env {
  DB: D1Database;
}

interface EditStudentRequest {
  studentId: number;
  name?: string;
  phone?: string;
  email?: string;
  school?: string;
  grade?: string;
  diagnosticMemo?: string;
  password?: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const requestBody: EditStudentRequest = await context.request.json();
    const { studentId, name, phone, email, school, grade, diagnosticMemo, password } = requestBody;

    // 필수 필드 검증
    if (!studentId) {
      return new Response(JSON.stringify({ error: "Student ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 업데이트할 필드만 포함
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (school !== undefined) {
      updates.push("school = ?");
      values.push(school);
    }
    if (grade !== undefined) {
      updates.push("grade = ?");
      values.push(grade);
    }
    if (diagnosticMemo !== undefined) {
      updates.push("diagnostic_memo = ?");
      values.push(diagnosticMemo);
    }
    if (password !== undefined) {
      updates.push("password = ?");
      values.push(password);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // UPDATE 쿼리 실행
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND role = 'STUDENT'`;
    values.push(studentId);

    console.log("🔄 Updating student:", { studentId, updates });
    
    await DB.prepare(query).bind(...values).run();

    console.log("✅ Student updated successfully:", studentId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생 정보가 수정되었습니다",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Student edit error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to edit student",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### API 테스트
```bash
curl -X PUT "https://superplacestudy.pages.dev/api/students/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 123,
    "school": "서울고등학교",
    "grade": "고2",
    "diagnosticMemo": "수학 보강 필요"
  }'
```

---

## ✅ 해결 방법 3: 프론트엔드 편집 페이지 추가

### 새 페이지: `src/app/dashboard/students/edit/page.tsx`

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

function EditStudentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams?.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [diagnosticMemo, setDiagnosticMemo] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/admin/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const student = data.user || data;

        setName(student.name || "");
        setPhone(student.phone || "");
        setEmail(student.email || "");
        setSchool(student.school || "");
        setGrade(student.grade || "");
        setDiagnosticMemo(student.diagnostic_memo || "");
        setPassword(student.password || "");
      }
    } catch (error) {
      console.error("Failed to load student:", error);
      alert("학생 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(studentId!),
          name,
          phone,
          email,
          school,
          grade,
          diagnosticMemo,
          password: password || undefined,
        }),
      });

      if (response.ok) {
        alert("✅ 학생 정보가 수정되었습니다!");
        router.push(`/dashboard/students/detail?id=${studentId}`);
      } else {
        throw new Error("Failed to save student");
      }
    } catch (error) {
      console.error("Failed to save student:", error);
      alert("❌ 학생 정보 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <h1 className="text-3xl font-bold">학생 정보 수정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>학생의 정보를 수정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
            />
          </div>

          <div>
            <Label htmlFor="phone">전화번호 *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
            />
          </div>

          <div>
            <Label htmlFor="school">소속 학교</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="서울고등학교"
            />
          </div>

          <div>
            <Label htmlFor="grade">학년</Label>
            <Input
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="고2"
            />
          </div>

          <div>
            <Label htmlFor="diagnosticMemo">진단 메모</Label>
            <Textarea
              id="diagnosticMemo"
              value={diagnosticMemo}
              onChange={(e) => setDiagnosticMemo(e.target.value)}
              placeholder="학생에 대한 특이사항이나 진단 메모를 입력하세요"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="password">비밀번호 (변경 시에만 입력)</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving || !name || !phone}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditStudentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <EditStudentContent />
    </Suspense>
  );
}
```

---

## 🎯 즉시 해결 방법 (권장)

**가장 빠른 방법: D1 콘솔에서 직접 UPDATE**

### 1. Cloudflare D1 콘솔 접속
```
https://dash.cloudflare.com/ → Workers & Pages → D1 → superplace → Console
```

### 2. 다음 SQL 실행
```sql
-- 1. 먼저 학생 ID 확인
SELECT id, name, email, phone, school, grade 
FROM users 
WHERE email = 'student_01085328_1771126812909@temp.student.local';

-- 2. 정보 업데이트 (실제 정보로 변경)
UPDATE users 
SET 
  school = '입력할 학교명',
  grade = '입력할 학년',
  diagnostic_memo = '진단 메모 (선택사항)',
  academy_id = 120
WHERE email = 'student_01085328_1771126812909@temp.student.local';

-- 3. 결과 확인
SELECT id, name, email, phone, school, grade, diagnostic_memo 
FROM users 
WHERE email = 'student_01085328_1771126812909@temp.student.local';
```

### 3. 브라우저에서 확인
- 브라우저 새로고침 (`F5`)
- 학생 상세 페이지 재확인

---

## 📝 참고 사항

### 자동 이메일 표시 로직
```typescript
// src/app/dashboard/students/detail/page.tsx
const displayEmail = (email: string | undefined) => {
  if (!email) return '미등록';
  // 자동생성 이메일 패턴 체크
  if (email.includes('@temp.student.local') || 
      email.includes('@phone.generated') ||
      email.startsWith('student_')) {
    return '미등록';
  }
  return email;
};
```

**해결책**: 실제 이메일 주소를 입력하거나, 코드를 수정하여 자동생성 이메일도 표시하도록 변경

---

## ✅ 최종 확인 사항

업데이트 후 다음 항목을 확인하세요:
- ✅ 소속 학교가 표시되는지
- ✅ 학년이 표시되는지
- ✅ 진단 메모가 표시되는지 (입력한 경우)
- ✅ 소속 학원이 표시되는지 (academy_id 설정 시)

---

**작성일**: 2026-02-15
**문서**: FIX_SJSS_STUDENT.md
