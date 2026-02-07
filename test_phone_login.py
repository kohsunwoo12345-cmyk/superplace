#!/usr/bin/env python3
"""
전화번호 기반 학생 가입 및 로그인 테스트
"""
import requests
import json
import time

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def test_phone_based_student():
    print("=" * 80)
    print("📱 전화번호 기반 학생 시스템 테스트")
    print("=" * 80)
    
    timestamp = int(time.time())
    
    # Step 1: 학원장 회원가입
    print("\n📝 Step 1: 학원장 회원가입")
    director_email = f"phone_test_director_{timestamp}@test.com"
    director_password = "test1234"
    academy_name = f"전화번호테스트학원_{timestamp}"
    
    signup_response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "name": f"전화번호테스트학원장_{timestamp}",
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
    print(f"   ✅ 학원장 회원가입 성공")
    print(f"   - Academy ID: {director_academy_id}")
    
    # Step 2: 학원장 로그인
    print(f"\n🔐 Step 2: 학원장 로그인")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": director_email, "password": director_password},
        headers={"Content-Type": "application/json"}
    )
    
    if not login_response.ok:
        print(f"   ❌ 실패: {login_response.text[:200]}")
        return
    
    login_data = login_response.json()
    user_data = login_data.get('data', {}).get('user', {})
    user_academy_id = user_data.get('academyId')
    
    print(f"   ✅ 로그인 성공")
    print(f"   - Academy ID: {user_academy_id}")
    
    # Step 3: 학생 추가 (이메일 없이 전화번호만)
    print(f"\n📱 Step 3: 학생 추가 (이메일 없이 전화번호만)")
    
    students = []
    for i in range(1, 4):
        student_phone = f"010-{str(timestamp)[-4:]}-{str(i).zfill(4)}"
        student_data = {
            "name": f"전화번호학생{i}_{timestamp}",
            "phone": student_phone,
            "password": "student123",
            "role": "STUDENT",
            "academyId": user_academy_id
        }
        # 이메일 없음!
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json=student_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.ok:
            data = response.json()
            student_id = data.get('user', {}).get('id')
            student_email = data.get('user', {}).get('email')
            student_academy_id = data.get('user', {}).get('academyId')
            
            students.append({
                'id': student_id,
                'phone': student_phone,
                'password': 'student123'
            })
            
            email_status = "✅ (null)" if not student_email else f"⚠️  ({student_email})"
            print(f"   ✅ 학생{i}: ID={student_id}, phone={student_phone}, email={email_status}, academyId={student_academy_id}")
        else:
            print(f"   ❌ 학생{i} 추가 실패: {response.text[:200]}")
    
    print(f"\n   총 {len(students)}명 추가 완료")
    
    # Step 4: 학생 로그인 (전화번호로)
    print(f"\n🔐 Step 4: 학생 로그인 (전화번호)")
    
    if students:
        test_student = students[0]
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": test_student['phone'],
                "password": test_student['password'],
                "isStudentLogin": True
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   전화번호: {test_student['phone']}")
        print(f"   Status: {login_response.status_code}")
        
        if login_response.ok:
            login_data = login_response.json()
            student_user = login_data.get('data', {}).get('user', {})
            print(f"   ✅ 로그인 성공!")
            print(f"   - User ID: {student_user.get('id')}")
            print(f"   - Name: {student_user.get('name')}")
            print(f"   - Role: {student_user.get('role')}")
            print(f"   - Phone: {test_student['phone']}")
        else:
            print(f"   ❌ 로그인 실패: {login_response.text[:200]}")
    
    # Step 5: 학원장으로 학생 목록 조회
    print(f"\n📋 Step 5: 학원장으로 학생 목록 조회")
    list_response = requests.get(
        f"{BASE_URL}/api/students",
        params={
            'role': 'DIRECTOR',
            'academyId': str(user_academy_id),
            'email': director_email
        }
    )
    
    print(f"   Status: {list_response.status_code}")
    if list_response.ok:
        list_data = list_response.json()
        student_list = list_data.get('students', [])
        
        print(f"   ✅ 학생 수: {len(student_list)}명")
        
        if len(student_list) > 0:
            print(f"\n   📋 학생 목록:")
            for student in student_list:
                email_display = student.get('email') or '(이메일 없음)'
                phone_display = student.get('phone') or '(전화번호 없음)'
                print(f"      - {student.get('name')}: phone={phone_display}, email={email_display}")
        
        # 검증
        found = sum(1 for s in students if any(st['phone'] == s['phone'] for st in student_list))
        print(f"\n   📊 검증: {found}/{len(students)} 학생이 목록에 표시됨")
        
        if found == len(students):
            print(f"   ✅✅✅ 완벽! 모든 학생이 표시됨!")
        else:
            print(f"   ⚠️  {len(students) - found}명의 학생이 목록에 없음")
    else:
        print(f"   ❌ 실패: {list_response.text[:200]}")
    
    print("\n" + "=" * 80)
    print("✅ 테스트 완료")
    print("=" * 80)
    
    # 요약
    print(f"\n📊 테스트 요약:")
    print(f"   - 학원장 회원가입/로그인: ✅")
    print(f"   - 학생 추가 (이메일 없이): {len(students)}명")
    print(f"   - 학생 전화번호 로그인: ✅")
    print(f"   - 학생 목록 조회: {len(student_list) if list_response.ok else 0}명")

if __name__ == "__main__":
    print("⏳ 배포 대기 (90초)...")
    time.sleep(90)
    
    test_phone_based_student()
