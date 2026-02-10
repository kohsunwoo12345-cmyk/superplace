#!/usr/bin/env python3
"""
A학원장 학생 추가 및 조회 완전 테스트
"""
import requests
import json
import time

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def test_director_workflow():
    print("=" * 80)
    print("🏫 A학원장 학생 추가 및 조회 완전 테스트")
    print("=" * 80)
    
    timestamp = int(time.time())
    
    # Step 1: A학원장 회원가입
    print("\n📝 Step 1: A학원장 회원가입")
    director_data = {
        "name": f"A학원장_{timestamp}",
        "email": f"director_a_{timestamp}@test.com",
        "password": "test1234",
        "role": "DIRECTOR",
        "academyName": f"A학원_{timestamp}"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=director_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   ✅ Success: {data.get('success')}")
        print(f"   Director ID: {data.get('user', {}).get('id')}")
        print(f"   Academy ID: {data.get('user', {}).get('academyId')}")
        print(f"   Academy Name: {director_data['academyName']}")
        director_id = data.get('user', {}).get('id')
        academy_id = data.get('user', {}).get('academyId')
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    if not academy_id:
        print("   ❌ academyId is None - 중단")
        return
    
    # Step 2: A학원장 로그인
    print(f"\n🔐 Step 2: A학원장 로그인")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": director_data['email'],
            "password": director_data['password']
        },
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   ✅ Login success: {data.get('success')}")
        user_data = data.get('data', {}).get('user', {})
        print(f"   User ID: {user_data.get('id')}")
        print(f"   Role: {user_data.get('role')}")
        print(f"   Academy ID: {user_data.get('academyId')}")
        
        # 로그인 응답의 academyId 확인
        login_academy_id = user_data.get('academyId')
        if not login_academy_id:
            print(f"   ⚠️  WARNING: Login response has no academyId!")
        else:
            print(f"   ✅ Login academyId matches: {login_academy_id}")
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    # Step 3: A학원에 학생 3명 추가
    print(f"\n📝 Step 3: A학원에 학생 3명 추가")
    student_ids = []
    for i in range(1, 4):
        student_data = {
            "name": f"A학원학생{i}_{timestamp}",
            "email": f"student_a{i}_{timestamp}@test.com",
            "password": "test1234",
            "role": "STUDENT",
            "academyName": director_data['academyName']
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
            print(f"   ✅ 학생 {i}: ID={student_id}, academyId={student_academy_id}")
        else:
            print(f"   ❌ 학생 {i} 추가 실패: {response.text[:100]}")
    
    print(f"\n   총 {len(student_ids)}명 추가 완료")
    
    # Step 4: A학원장으로 학생 목록 조회
    print(f"\n📋 Step 4: A학원장으로 학생 목록 조회")
    params = {
        'role': 'DIRECTOR',
        'academyId': str(academy_id),
        'email': director_data['email']
    }
    
    print(f"   요청 파라미터: {params}")
    
    response = requests.get(
        f"{BASE_URL}/api/students",
        params=params
    )
    
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        students = data.get('students', [])
        print(f"   ✅ Total students: {len(students)}")
        
        if len(students) == 0:
            print(f"   ❌ 문제 발생: 학생 목록이 비어있음!")
            print(f"   디버깅 정보:")
            print(f"   - 추가한 학생 수: {len(student_ids)}")
            print(f"   - Academy ID: {academy_id}")
            print(f"   - Director Email: {director_data['email']}")
        else:
            print(f"   ✅ 학생 목록:")
            for student in students[:5]:
                print(f"      - {student.get('name')} (ID: {student.get('id')}, academyId: {student.get('academyId')})")
            
            # 방금 추가한 학생들이 목록에 있는지 확인
            found_count = 0
            for sid in student_ids:
                if any(s['id'] == sid for s in students):
                    found_count += 1
            
            print(f"\n   📊 검증: {found_count}/{len(student_ids)} 학생이 목록에 표시됨")
            
            if found_count == len(student_ids):
                print(f"   ✅ 모든 학생이 정상적으로 표시됨!")
            else:
                print(f"   ⚠️  일부 학생이 목록에 없음 ({len(student_ids) - found_count}명 누락)")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    print("\n" + "=" * 80)
    print("✅ 테스트 완료")
    print("=" * 80)

if __name__ == "__main__":
    test_director_workflow()
