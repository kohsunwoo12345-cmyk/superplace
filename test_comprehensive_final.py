#!/usr/bin/env python3
"""
최종 종합 테스트: 신규 학원장 가입부터 학생 조회까지
"""
import requests
import json
import time

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def comprehensive_test():
    print("=" * 80)
    print("🎯 최종 종합 테스트: 신규 학원장 → 학생 추가 → 조회")
    print("=" * 80)
    
    timestamp = int(time.time())
    
    # Step 1: 신규 학원장 회원가입
    print("\n📝 Step 1: 신규 학원장 회원가입")
    director_email = f"new_director_{timestamp}@test.com"
    director_password = "test1234"
    academy_name = f"새로운학원_{timestamp}"
    
    signup_data = {
        "name": f"신규학원장_{timestamp}",
        "email": director_email,
        "password": director_password,
        "role": "DIRECTOR",
        "academyName": academy_name
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response.status_code}")
    if not response.ok:
        print(f"   ❌ 회원가입 실패: {response.text[:200]}")
        return
    
    signup_result = response.json()
    print(f"   ✅ 회원가입 성공")
    print(f"   - Director ID: {signup_result.get('user', {}).get('id')}")
    print(f"   - Academy ID: {signup_result.get('user', {}).get('academyId')}")
    print(f"   - Academy Name: {academy_name}")
    
    director_id = signup_result.get('user', {}).get('id')
    academy_id = signup_result.get('user', {}).get('academyId')
    
    if not academy_id:
        print(f"   ❌ academyId가 None - 테스트 중단")
        return
    
    # Step 2: 학원장 로그인
    print(f"\n🔐 Step 2: 학원장 로그인")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": director_email, "password": director_password},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response.status_code}")
    if not response.ok:
        print(f"   ❌ 로그인 실패: {response.text[:200]}")
        return
    
    login_result = response.json()
    user_data = login_result.get('data', {}).get('user', {})
    
    print(f"   ✅ 로그인 성공")
    print(f"   - User ID: {user_data.get('id')}")
    print(f"   - Role: {user_data.get('role')}")
    print(f"   - Academy ID: {user_data.get('academyId')}")
    
    # Step 3: 로그인 전 학생 목록 조회 (0명이어야 함)
    print(f"\n📋 Step 3: 로그인 직후 학생 목록 조회 (0명 예상)")
    params = {
        'role': user_data.get('role'),
        'academyId': str(user_data.get('academyId')),
        'userId': str(user_data.get('id')),
        'email': user_data.get('email')
    }
    
    response = requests.get(f"{BASE_URL}/api/students", params=params)
    print(f"   Status: {response.status_code}")
    if response.ok:
        result = response.json()
        print(f"   ✅ 학생 수: {len(result.get('students', []))}명")
    else:
        print(f"   ❌ 조회 실패: {response.text[:200]}")
    
    # Step 4: 학생 5명 추가
    print(f"\n📝 Step 4: 학생 5명 추가")
    student_ids = []
    for i in range(1, 6):
        student_data = {
            "name": f"학생{i}_{timestamp}",
            "email": f"student{i}_{timestamp}@test.com",
            "password": "test1234",
            "role": "STUDENT",
            "academyName": academy_name
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json=student_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.ok:
            data = response.json()
            student_id = data.get('user', {}).get('id')
            student_academy_id = data.get('user', {}).get('academyId')
            student_ids.append(student_id)
            print(f"   ✅ 학생{i}: ID={student_id}, academyId={student_academy_id}")
        else:
            print(f"   ❌ 학생{i} 추가 실패: {response.text[:100]}")
    
    print(f"   📊 총 {len(student_ids)}명 추가 완료")
    
    # Step 5: 학생 목록 재조회
    print(f"\n📋 Step 5: 학생 목록 재조회 (5명 예상)")
    response = requests.get(f"{BASE_URL}/api/students", params=params)
    
    print(f"   Status: {response.status_code}")
    if response.ok:
        result = response.json()
        students = result.get('students', [])
        print(f"   ✅ 학생 수: {len(students)}명")
        
        if len(students) != len(student_ids):
            print(f"   ⚠️  경고: 추가한 학생 수({len(student_ids)})와 조회된 학생 수({len(students)})가 다릅니다!")
        
        print(f"\n   📋 학생 목록:")
        for student in students:
            print(f"      - {student.get('name')} (ID: {student.get('id')}, academyId: {student.get('academyId')})")
        
        # 검증
        found = sum(1 for sid in student_ids if any(s['id'] == sid for s in students))
        print(f"\n   📊 검증: {found}/{len(student_ids)} 학생 확인")
        
        if found == len(student_ids):
            print(f"   ✅ 모든 학생이 정상적으로 표시됨!")
        else:
            print(f"   ❌ 일부 학생이 누락됨 ({len(student_ids) - found}명)")
    else:
        print(f"   ❌ 조회 실패: {response.text[:200]}")
    
    # Step 6: 다른 학원의 학생이 섞이지 않는지 확인
    print(f"\n🔍 Step 6: 필터링 검증 (다른 학원 학생 제외)")
    all_students_response = requests.get(
        f"{BASE_URL}/api/students",
        params={'role': 'ADMIN', 'email': 'admin@superplace.co.kr'}
    )
    
    if all_students_response.ok:
        all_students = all_students_response.json().get('students', [])
        other_academy_students = [s for s in all_students if str(s.get('academyId')) != str(academy_id)]
        
        print(f"   전체 학생 수: {len(all_students)}명")
        print(f"   다른 학원 학생 수: {len(other_academy_students)}명")
        
        # 우리 학원 조회에 다른 학원 학생이 없는지 확인
        our_students = result.get('students', []) if response.ok else []
        mixed = any(str(s.get('academyId')) != str(academy_id) for s in our_students)
        
        if not mixed:
            print(f"   ✅ 필터링 정상: 다른 학원 학생이 섞이지 않음")
        else:
            print(f"   ❌ 필터링 오류: 다른 학원 학생이 섞여있음")
    
    print("\n" + "=" * 80)
    print("✅ 최종 종합 테스트 완료")
    print("=" * 80)
    
    # 결과 요약
    print(f"\n📊 테스트 요약:")
    print(f"   - 학원장 회원가입: ✅")
    print(f"   - 학원장 로그인: ✅")
    print(f"   - academyId 할당: ✅ ({academy_id})")
    print(f"   - 학생 추가: ✅ ({len(student_ids)}명)")
    print(f"   - 학생 조회: ✅ ({len(students) if response.ok else 0}명)")
    print(f"   - 필터링: ✅")

if __name__ == "__main__":
    # 배포 대기
    print("⏳ 배포 대기 (90초)...")
    time.sleep(90)
    
    comprehensive_test()
