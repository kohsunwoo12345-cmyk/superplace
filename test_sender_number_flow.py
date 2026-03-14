import requests
import json
import base64
from pathlib import Path

# API 기본 URL
BASE_URL = "https://superplacestudy.pages.dev"

print("🔍 발신번호 등록 전체 플로우 테스트 시작\n")

# 1. 테스트 토큰 생성 (실제 사용자 정보로 교체 필요)
test_user_id = "test-user-001"
test_email = "test@superplace.com"
test_role = "DIRECTOR"

# 토큰 형식: id|email|role
test_token = f"{test_user_id}|{test_email}|{test_role}"
headers = {
    "Authorization": f"Bearer {test_token}"
}

print(f"📝 테스트 사용자:")
print(f"   ID: {test_user_id}")
print(f"   Email: {test_email}")
print(f"   Role: {test_role}")
print(f"   Token: {test_token}\n")

# 2. FormData로 발신번호 등록 요청
print("📤 발신번호 등록 신청 중...\n")

# FormData 준비
files = {
    'telecomCertificate': ('telecom_cert.pdf', open('test_files/telecom_cert.pdf', 'rb'), 'application/pdf'),
    'businessRegistration': ('business_reg.pdf', open('test_files/business_reg.pdf', 'rb'), 'application/pdf'),
    'serviceAgreement': ('service_agreement.pdf', open('test_files/service_agreement.pdf', 'rb'), 'application/pdf'),
    'privacyAgreement': ('privacy_agreement.pdf', open('test_files/privacy_agreement.pdf', 'rb'), 'application/pdf'),
}

data = {
    'companyName': '테스트 학원',
    'businessNumber': '123-45-67890',
    'address': '서울시 강남구 테스트로 123',
    'senderNumbers': '010-1234-5678',
    'representativeName': '홍길동',
    'phone': '010-9876-5432',
    'email': test_email
}

try:
    response = requests.post(
        f"{BASE_URL}/api/sender-number/register",
        headers={"Authorization": f"Bearer {test_token}"},
        files=files,
        data=data,
        timeout=30
    )
    
    print(f"📡 응답 상태: {response.status_code}")
    print(f"📊 응답 본문:")
    
    if response.status_code == 200:
        result = response.json()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        request_id = result.get('requestId')
        print(f"\n✅ 신청 완료! Request ID: {request_id}")
    else:
        print(f"❌ 오류: {response.text}")
        exit(1)
        
except Exception as e:
    print(f"❌ 요청 실패: {e}")
    exit(1)

# 파일 닫기
for f in files.values():
    f[1].close()

print("\n" + "="*80 + "\n")

# 3. 관리자 페이지에서 신청 목록 조회
print("📋 신청 목록 조회 중...\n")

try:
    response = requests.get(
        f"{BASE_URL}/api/admin/sender-number-requests",
        headers={"Authorization": f"Bearer {test_user_id}|{test_email}|SUPER_ADMIN"},
        timeout=30
    )
    
    print(f"📡 응답 상태: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"📊 신청 건수: {result.get('total', 0)}건")
        
        if result.get('requests'):
            latest = result['requests'][0]
            print(f"\n📄 최신 신청:")
            print(f"   Request ID: {latest.get('id')}")
            print(f"   회사명: {latest.get('companyName')}")
            print(f"   발신번호: {latest.get('senderNumbers')}")
            print(f"   상태: {latest.get('status')}")
            print(f"\n📎 첨부 파일 URL:")
            
            file_urls = latest.get('fileUrls', {})
            for key, url in file_urls.items():
                print(f"   {key}: {url}")
                
            request_id = latest.get('id')
    else:
        print(f"❌ 오류: {response.text}")
        
except Exception as e:
    print(f"❌ 요청 실패: {e}")

print("\n" + "="*80 + "\n")

# 4. 승인 처리
print("✅ 발신번호 승인 처리 중...\n")

admin_token = f"{test_user_id}|{test_email}|SUPER_ADMIN"

try:
    response = requests.post(
        f"{BASE_URL}/api/admin/sender-number-requests/approve",
        headers={
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        },
        json={"requestId": request_id},
        timeout=30
    )
    
    print(f"📡 응답 상태: {response.status_code}")
    print(f"📊 응답 본문:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    if response.status_code == 200:
        print("\n✅ 승인 완료!")
    else:
        print(f"\n❌ 승인 실패")
        
except Exception as e:
    print(f"❌ 요청 실패: {e}")

print("\n" + "="*80 + "\n")

# 5. 승인된 발신번호 조회
print("📱 승인된 발신번호 조회 중...\n")

try:
    response = requests.get(
        f"{BASE_URL}/api/sender-numbers/approved",
        headers={"Authorization": f"Bearer {test_token}"},
        timeout=30
    )
    
    print(f"📡 응답 상태: {response.status_code}")
    print(f"📊 응답 본문:")
    result = response.json()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if response.status_code == 200 and result.get('senderNumbers'):
        print(f"\n✅ 승인된 발신번호: {', '.join(result['senderNumbers'])}")
    else:
        print("\n❌ 승인된 발신번호가 없습니다")
        
except Exception as e:
    print(f"❌ 요청 실패: {e}")

print("\n" + "="*80)
print("🎉 테스트 완료!")
