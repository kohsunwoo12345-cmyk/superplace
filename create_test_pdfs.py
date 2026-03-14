from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# 테스트 PDF 파일 생성
def create_test_pdf(filename, title, content):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    # 제목
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, title)
    
    # 내용
    c.setFont("Helvetica", 12)
    y = height - 100
    for line in content:
        c.drawString(50, y, line)
        y -= 20
    
    c.save()
    print(f"✅ Created: {filename}")

# 4개의 테스트 서류 생성
os.makedirs('test_files', exist_ok=True)

create_test_pdf(
    'test_files/telecom_cert.pdf',
    'Telecom Certificate',
    [
        'Test Telecom Certificate',
        'Phone: 010-1234-5678',
        'Company: Test Academy',
        'Date: 2024-03-14'
    ]
)

create_test_pdf(
    'test_files/business_reg.pdf',
    'Business Registration',
    [
        'Test Business Registration',
        'Business No: 123-45-67890',
        'Company: Test Academy',
        'Date: 2024-03-14'
    ]
)

create_test_pdf(
    'test_files/service_agreement.pdf',
    'Service Agreement',
    [
        'Test Service Agreement',
        'Agreement between Test Academy and Service Provider',
        'Date: 2024-03-14',
        'Signed by: Test User'
    ]
)

create_test_pdf(
    'test_files/privacy_agreement.pdf',
    'Privacy Agreement',
    [
        'Test Privacy Agreement',
        'Personal Data Processing Agreement',
        'Date: 2024-03-14',
        'Signed by: Test User'
    ]
)

print("\n✅ All test PDF files created successfully!")
