-- SMS 발신번호 등록 신청 시스템

-- SMS Registration (발신번호 등록 신청)
CREATE TABLE IF NOT EXISTS SMSRegistration (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  business_number TEXT,
  representative_name TEXT NOT NULL,
  representative_phone TEXT NOT NULL,
  
  -- 서류 파일 경로 (R2에 저장)
  telecom_certificate_url TEXT,  -- 통신사가입증명원
  employment_certificate_url TEXT,  -- 재직증명서
  usage_agreement_url TEXT,  -- 문자메시지 이용계약서
  proxy_application_url TEXT,  -- 발신번호 사전등록 대리 신청서
  
  -- 승인 상태
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  rejection_reason TEXT,
  
  -- 승인자 정보
  approvedById TEXT,
  approvedAt TEXT,
  
  -- 생성자 정보
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (createdById) REFERENCES User(id),
  FOREIGN KEY (approvedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_registration_status ON SMSRegistration(status);
CREATE INDEX IF NOT EXISTS idx_sms_registration_creator ON SMSRegistration(createdById);
CREATE INDEX IF NOT EXISTS idx_sms_registration_phone ON SMSRegistration(phone_number);
