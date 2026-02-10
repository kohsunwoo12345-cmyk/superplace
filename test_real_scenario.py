#!/usr/bin/env python3
"""
실제 시나리오 테스트: 학원장이 학생 추가 → 학생 목록 조회
"""
import requests
import json
import time

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def real_scenario_test():
    print("=" * 80)
    print("🏫 실제 시나리오: 학원장 로그인 → 학생 추가 → 학생 목록 조회")
    print("=" * 80)
    
    timestamp = int(time.time())
    
    # Step 1: 학원장 회원가입
    print("\n📝 Step 1: 학원장 회원가입")
    director_email = f"real_director_{timestamp}@test.com"
    director_password = "test1234"
    academy_name = f"실제테스트학원_{timestamp}"
    
    signup_response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "name": f"실제학원장_{timestamp}",
            "email": director_email,
            "password": director_password,
            "role": "DIRECTOR",
            "academyName": academy_name
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {signup_response.status_code}")
    if not signup_response.ok:
        print(f"   ❌ 실패: {signup_response.text[:200]}")
        return
    
    signup_data = signup_response.json()
    director_academy_id = signup_data.get('user', {}).get('academyId')
    print(f"   ✅ 회원가입 성공")
    print(f"   - Director academyId: {director_academy_id}")
    
    # Step 2: 학원장 로그인
    print(f"\n🔐 Step 2: 학원장 로그인")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": director_email, "password": director_password},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {login_response.status_code}")
    if not login_response.ok:
        print(f"   ❌ 실패: {login_response.text[:200]}")
        return
    
    login_data = login_response.json()
    user_data = login_data.get('data', {}).get('user', {})
    user_academy_id = user_data.get('academyId')
    
    print(f"   ✅ 로그인 성공")
    print(f"   - User academyId: {user_academy_id}")
    print(f"   - Role: {user_data.get('role')}")
    
    # Step 3: 학원장이 학생 3명 추가 (academyId 직접 전달)
    print(f"\n📝 Step 3: 학원장이 학생 3명 추가 (academyId 직접 전달)")
    student_ids = []
    for i in range(1, 4):
        # 학원장이 프론트엔드에서 학생을 추가하는 것처럼 시뮬레이션
        student_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": f"실제학생{i}_{timestamp}",
                "email": f"real_student{i}_{timestamp}@test.com",
                "password": "test1234",
                "role": "STUDENT",
                "academyId": user_academy_id,  # 학원장의 academyId 직접 전달
                "academyName": academy_name
            },
            headers={"Content-Type": "application/json"}
        )
        
        if student_response.ok:
            student_data = student_response.json()
            student_id = student_data.get('user', {}).get('id')
            student_academy_id = student_data.get('user', {}).get('academyId')
            student_ids.append(student_id)
            
            status = "✅" if str(student_academy_id) == str(user_academy_id) else "⚠️"
            print(f"   {status} 학생{i}: ID={student_id}, academyId={student_academy_id} (expected: {user_academy_id})")
        else:
            print(f"   ❌ 학생{i} 추가 실패: {student_response.text[:100]}")
    
    print(f"\n   총 {len(student_ids)}명 추가 완료")
    
    # Step 4: 학원장으로 학생 목록 조회
    print(f"\n📋 Step 4: 학원장으로 학생 목록 조회")
    list_response = requests.get(
        f"{BASE_URL}/api/students",
        params={
            'role': user_data.get('role'),
            'academyId': str(user_academy_id),
            'userId': str(user_data.get('id')),
            'email': user_data.get('email')
        }
    )
    
    print(f"   Status: {list_response.status_code}")
    if list_response.ok:
        list_data = list_response.json()
        students = list_data.get('students', [])
        
        print(f"   ✅ 학생 수: {len(students)}명")
        
        if len(students) != len(student_ids):
            print(f"   ⚠️  경고: 추가한 학생({len(student_ids)})과 조회된 학생({len(students)}) 수가 다릅니다!")
        
        print(f"\n   📋 학생 목록:")
        for student in students:
            print(f"      - {student.get('name')} (ID: {student.get('id')}, academyId: {student.get('academyId')})")
        
        # 검증
        found = sum(1 for sid in student_ids if any(s['id'] == sid for s in students))
        
        print(f"\n   📊 검증: {found}/{len(student_ids)} 학생이 목록에 표시됨")
        
        if found == len(student_ids):
            print(f"   ✅✅✅ 완벽! 모든 학생이 학원장의 학생 목록에 표시됨!")
        else:
            print(f"   ❌ 문제: {len(student_ids) - found}명의 학생이 목록에 없음")
    else:
        print(f"   ❌ 실패: {list_response.text[:200]}")
    
    print("\n" + "=" * 80)
    print("✅ 테스트 완료")
    print("=" * 80)

if __name__ == "__main__":
    print("⏳ 배포 대기 (90초)...")
    time.sleep(90)
    
    real_scenario_test()
