#!/usr/bin/env python3
"""
학생 추가 및 학원별 필터링 문제 진단 스크립트
"""
import requests
import json
import time

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def test_student_add_and_list():
    print("=" * 80)
    print("🔍 학생 추가 및 학원별 필터링 문제 진단")
    print("=" * 80)
    
    # 1. 학원 A에 학생 추가
    print("\n📝 Step 1: 학원 A에 학생 추가")
    timestamp = int(time.time())
    student_a_data = {
        "name": f"테스트학생A_{timestamp}",
        "email": f"student_a_{timestamp}@test.com",
        "password": "test1234",
        "role": "STUDENT",
        "academyName": "테스트학원A"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=student_a_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   ✅ Success: {data.get('success')}")
        print(f"   User ID: {data.get('user', {}).get('id')}")
        print(f"   Academy ID: {data.get('user', {}).get('academyId')}")
        print(f"   Academy Name: {student_a_data['academyName']}")
        student_a_id = data.get('user', {}).get('id')
        academy_a_id = data.get('user', {}).get('academyId')
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    # 2. 학원 B에 학생 추가
    print("\n📝 Step 2: 학원 B에 학생 추가")
    student_b_data = {
        "name": f"테스트학생B_{timestamp}",
        "email": f"student_b_{timestamp}@test.com",
        "password": "test1234",
        "role": "STUDENT",
        "academyName": "테스트학원B"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=student_b_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   ✅ Success: {data.get('success')}")
        print(f"   User ID: {data.get('user', {}).get('id')}")
        print(f"   Academy ID: {data.get('user', {}).get('academyId')}")
        print(f"   Academy Name: {student_b_data['academyName']}")
        student_b_id = data.get('user', {}).get('id')
        academy_b_id = data.get('user', {}).get('academyId')
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    # 3. 관리자로 모든 학생 조회
    print("\n📋 Step 3: 관리자로 전체 학생 조회")
    response = requests.get(
        f"{BASE_URL}/api/students?role=ADMIN&email=admin@superplace.co.kr"
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   ✅ Total students: {data.get('count')}")
        
        # 방금 추가한 학생 찾기
        students = data.get('students', [])
        student_a_found = next((s for s in students if s['email'] == student_a_data['email']), None)
        student_b_found = next((s for s in students if s['email'] == student_b_data['email']), None)
        
        if student_a_found:
            print(f"   ✅ 학생 A 발견: {student_a_found['name']}, academyId: {student_a_found.get('academyId')}, academyName: {student_a_found.get('academyName')}")
        else:
            print(f"   ❌ 학생 A 미발견: {student_a_data['email']}")
        
        if student_b_found:
            print(f"   ✅ 학생 B 발견: {student_b_found['name']}, academyId: {student_b_found.get('academyId')}, academyName: {student_b_found.get('academyName')}")
        else:
            print(f"   ❌ 학생 B 미발견: {student_b_data['email']}")
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    # 4. 학원 A 필터링으로 조회 (원장/교사 시뮬레이션)
    if academy_a_id:
        print(f"\n🏫 Step 4: 학원 A (ID: {academy_a_id}) 학생만 조회")
        response = requests.get(
            f"{BASE_URL}/api/students?role=DIRECTOR&academyId={academy_a_id}"
        )
        print(f"   Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"   ✅ Total students in Academy A: {data.get('count')}")
            
            students = data.get('students', [])
            student_a_found = next((s for s in students if s['email'] == student_a_data['email']), None)
            student_b_found = next((s for s in students if s['email'] == student_b_data['email']), None)
            
            if student_a_found:
                print(f"   ✅ 학생 A 정상 표시: {student_a_found['name']}")
            else:
                print(f"   ❌ 학생 A가 학원 A 목록에 없음 (문제!)")
            
            if not student_b_found:
                print(f"   ✅ 학생 B 정상 제외 (학원 B 소속)")
            else:
                print(f"   ⚠️  학생 B가 학원 A 목록에 나타남 (필터링 오류!)")
        else:
            print(f"   ❌ Failed: {response.text}")
    
    # 5. 학원 B 필터링으로 조회
    if academy_b_id:
        print(f"\n🏫 Step 5: 학원 B (ID: {academy_b_id}) 학생만 조회")
        response = requests.get(
            f"{BASE_URL}/api/students?role=DIRECTOR&academyId={academy_b_id}"
        )
        print(f"   Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"   ✅ Total students in Academy B: {data.get('count')}")
            
            students = data.get('students', [])
            student_a_found = next((s for s in students if s['email'] == student_a_data['email']), None)
            student_b_found = next((s for s in students if s['email'] == student_b_data['email']), None)
            
            if not student_a_found:
                print(f"   ✅ 학생 A 정상 제외 (학원 A 소속)")
            else:
                print(f"   ⚠️  학생 A가 학원 B 목록에 나타남 (필터링 오류!)")
            
            if student_b_found:
                print(f"   ✅ 학생 B 정상 표시: {student_b_found['name']}")
            else:
                print(f"   ❌ 학생 B가 학원 B 목록에 없음 (문제!)")
        else:
            print(f"   ❌ Failed: {response.text}")
    
    print("\n" + "=" * 80)
    print("✅ 진단 완료")
    print("=" * 80)

if __name__ == "__main__":
    test_student_add_and_list()
