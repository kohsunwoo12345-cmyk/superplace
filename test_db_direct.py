#!/usr/bin/env python3
"""
DB에 직접 쿼리해서 academyId 확인
"""
import requests
import json

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

def test_db_query():
    print("=" * 80)
    print("🔍 DB 직접 조회 테스트")
    print("=" * 80)
    
    # admin으로 전체 학생 조회
    print("\n📋 관리자로 전체 학생 조회 (최근 5명)")
    response = requests.get(
        f"{BASE_URL}/api/students?role=ADMIN&email=admin@superplace.co.kr"
    )
    
    if response.ok:
        data = response.json()
        students = data.get('students', [])
        
        print(f"   Total: {len(students)}")
        print("\n   최근 5명:")
        for student in students[:5]:
            print(f"   - ID: {student.get('id')}, Name: {student.get('name')}, "
                  f"Email: {student.get('email')}, "
                  f"academyId: {student.get('academyId')}, "
                  f"academyName: {student.get('academyName')}")
    else:
        print(f"   ❌ Failed: {response.text}")

if __name__ == "__main__":
    test_db_query()
