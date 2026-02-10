#!/usr/bin/env python3
"""
프론트엔드 localStorage 시뮬레이션
"""
import requests
import json

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def test_frontend_simulation():
    print("=" * 80)
    print("🖥️  프론트엔드 localStorage 시뮬레이션")
    print("=" * 80)
    
    # 기존 A학원장 로그인
    print("\n🔐 Step 1: 기존 A학원장 로그인")
    login_email = "director_a_1770492489@test.com"
    login_password = "test1234"
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": login_email, "password": login_password},
        headers={"Content-Type": "application/json"}
    )
    
    if not response.ok:
        print(f"   ❌ Login failed: {response.text}")
        return
    
    data = response.json()
    print(f"   ✅ Login success")
    
    # localStorage에 저장되는 데이터
    user_from_login = data.get('data', {}).get('user', {})
    print(f"\n📦 localStorage.setItem('user', JSON.stringify(...))")
    print(f"   저장되는 user 객체:")
    print(json.dumps(user_from_login, indent=2, ensure_ascii=False))
    
    # 프론트엔드가 읽는 academyId
    academy_id_variants = {
        'academyId': user_from_login.get('academyId'),
        'academy_id': user_from_login.get('academy_id'),
        'AcademyId': user_from_login.get('AcademyId')
    }
    
    print(f"\n🔍 프론트엔드가 찾는 academyId 변형:")
    for key, value in academy_id_variants.items():
        status = "✅" if value else "❌"
        print(f"   {status} user.{key} = {value}")
    
    # 실제 프론트엔드 코드처럼 academyId 추출
    academy_id = (user_from_login.get('academyId') or 
                  user_from_login.get('academy_id') or 
                  user_from_login.get('AcademyId'))
    
    print(f"\n📊 최종 추출된 academyId: {academy_id}")
    
    if not academy_id:
        print(f"   ❌ 문제 발견: academyId가 None!")
        print(f"   → 프론트엔드가 학원 필터링을 할 수 없음")
        print(f"   → /api/students 호출 시 academyId 파라미터 누락")
        return
    
    # Step 2: 프론트엔드처럼 학생 조회
    print(f"\n📋 Step 2: 프론트엔드처럼 학생 조회")
    params = {
        'role': user_from_login.get('role'),
        'academyId': str(academy_id),
        'userId': str(user_from_login.get('id')),
        'email': user_from_login.get('email')
    }
    
    print(f"   요청 URL: /api/students")
    print(f"   요청 파라미터:")
    for key, value in params.items():
        print(f"      {key}: {value}")
    
    response = requests.get(f"{BASE_URL}/api/students", params=params)
    
    print(f"\n   Status: {response.status_code}")
    if response.ok:
        result = response.json()
        students = result.get('students', [])
        print(f"   ✅ Total students: {len(students)}")
        
        if len(students) > 0:
            print(f"   ✅ 학생 목록:")
            for student in students[:3]:
                print(f"      - {student.get('name')} (academyId: {student.get('academyId')})")
        else:
            print(f"   ❌ 학생 목록이 비어있음!")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    print("\n" + "=" * 80)
    print("✅ 시뮬레이션 완료")
    print("=" * 80)

if __name__ == "__main__":
    test_frontend_simulation()
