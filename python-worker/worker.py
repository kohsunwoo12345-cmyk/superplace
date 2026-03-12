from js import Response, fetch, Headers
import json
import asyncio
import re

async def on_fetch(request, env):
    """
    숙제 채점 Python Worker
    
    프로세스:
    1. DeepSeek OCR로 이미지에서 텍스트 추출
    2. RAG 검색으로 관련 학원 자료 찾기
    3. 과목별 라우팅 (수학: SymPy 계산, 영어: 문법 검증)
    4. 최종 LLM으로 채점 결과 생성
    """
    
    # CORS 헤더
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    }
    
    # OPTIONS 요청 처리
    if request.method == 'OPTIONS':
        return Response.new('', status=204, headers=headers)
    
    # API 키 검증
    api_key = request.headers.get('X-API-Key')
    if api_key != 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u':
        return Response.json({'error': 'Unauthorized'}, status=401, headers=headers)
    
    try:
        # 요청 파싱
        body = await request.json()
        images = body.get('images', [])
        user_id = body.get('userId')
        user_name = body.get('userName', '학생')
        system_prompt = body.get('systemPrompt', '')
        model = body.get('model', 'gemini-2.5-flash')
        temperature = body.get('temperature', 0.3)
        enable_rag = body.get('enableRAG', False)
        academy_id = body.get('academyId')
        
        print(f"📚 채점 시작: {user_name} ({user_id}), 이미지 {len(images)}장")
        
        results = []
        
        # 각 이미지 처리
        for idx, image_base64 in enumerate(images):
            print(f"📄 이미지 {idx + 1}/{len(images)} 처리 중...")
            
            # 1. OCR with DeepSeek/Gemini (설정된 모델 및 프롬프트 사용)
            ocr_text = await ocr_with_llm(image_base64, model, system_prompt, env)
            print(f"✅ OCR 완료: {len(ocr_text)} 글자")
            
            # 2. RAG 검색 (활성화된 경우)
            rag_context = []
            if enable_rag and academy_id and hasattr(env, 'VECTORIZE'):
                rag_context = await search_rag(ocr_text, academy_id, env)
                print(f"✅ RAG 검색 완료: {len(rag_context)}개 결과")
            
            # 3. 과목 감지
            subject = detect_subject(ocr_text)
            print(f"✅ 과목 감지: {subject}")
            
            # 4. 과목별 처리
            calculation = None
            if subject == 'math':
                calculation = calculate_math_simple(ocr_text)
                print(f"✅ 수학 계산 완료")
            
            # 5. 최종 채점
            grading = await final_grading(
                ocr_text=ocr_text,
                calculation_result=calculation,
                rag_context=rag_context,
                system_prompt=system_prompt,
                model=model,
                temperature=temperature,
                env=env
            )
            print(f"✅ 채점 완료: {grading.get('correctAnswers', 0)}/{grading.get('totalQuestions', 0)} 정답")
            
            results.append({
                'imageIndex': idx,
                'ocrText': ocr_text,
                'subject': subject,
                'calculation': calculation,
                'ragContext': rag_context,
                'grading': grading,
            })
        
        print(f"🎉 전체 채점 완료: {len(results)}개 이미지")
        
        return Response.json({
            'success': True,
            'results': results
        }, headers=headers)
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response.json({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500, headers=headers)


async def ocr_with_llm(image_base64: str, model: str, env) -> str:
    """
    DeepSeek OCR 또는 Gemini로 이미지에서 텍스트 추출
    """
    try:
        # 이미지 데이터 준비 (base64에서 data:image 부분 제거)
        if image_base64.startswith('data:image'):
            image_data = image_base64.split(',')[1]
        else:
            image_data = image_base64
        
        # DeepSeek OCR 모델 사용
        if model == 'deepseek-ocr-2':
            print("🔍 DeepSeek OCR 2 사용")
            # Novita_AI_API 우선, 없으면 ALL_AI_API_KEY 사용
            api_key = None
            if hasattr(env, 'Novita_AI_API') and env.Novita_AI_API:
                api_key = env.Novita_AI_API
                print("✅ Novita_AI_API 키 사용")
            elif hasattr(env, 'ALL_AI_API_KEY') and env.ALL_AI_API_KEY:
                api_key = env.ALL_AI_API_KEY
                print("✅ ALL_AI_API_KEY 키 사용")
            
            if not api_key:
                print("⚠️ DeepSeek API 키 없음, Gemini로 폴백")
                return await ocr_with_gemini(image_data, env)
            
            url = "https://api.deepseek.com/v1/chat/completions"
            
            payload = {
                "model": "deepseek-chat",
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "이 이미지의 모든 텍스트와 수식을 정확하게 읽어서 그대로 텍스트로 변환해주세요. 수학 수식, 손글씨, 프린트된 텍스트 모두 포함해주세요."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }],
                "max_tokens": 2048,
                "temperature": 0.1
            }
            
            headers = Headers.new({
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }.items())
            
            response = await fetch(url,
                method='POST',
                headers=headers,
                body=json.dumps(payload)
            )
            
            result = await response.json()
            
            if result.get('choices') and len(result['choices']) > 0:
                text = result['choices'][0]['message']['content']
                print(f"✅ DeepSeek OCR 완료: {len(text)} 글자")
                return text
            
            print(f"⚠️ DeepSeek OCR 응답 없음, Gemini로 폴백")
            return await ocr_with_gemini(image_data, system_prompt, env)
        
        # Gemini API 사용 (기본)
        else:
            return await ocr_with_gemini(image_data, system_prompt, env)
        
    except Exception as e:
        print(f"OCR 오류: {str(e)}, Gemini로 폴백")
        return await ocr_with_gemini(image_data, system_prompt, env)


async def ocr_with_gemini(image_data: str, system_prompt: str, env) -> str:
    """
    Gemini Vision API로 OCR 수행
    """
    try:
        api_key = env.GEMINI_API_KEY if hasattr(env, 'GEMINI_API_KEY') else None
        
        if not api_key:
            return "OCR API 키가 설정되지 않았습니다."
        
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
        
        # OCR 프롬프트 구성: systemPrompt 반영
        ocr_instruction = f"""이 이미지의 모든 텍스트와 수식을 정확하게 읽어서 그대로 텍스트로 변환해주세요. 
수학 수식, 손글씨, 프린트된 텍스트 모두 포함해주세요.

{system_prompt if system_prompt else ''}"""
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": ocr_instruction},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_data
                        }
                    }
                ]
            }]
        }
        
        headers = Headers.new({'Content-Type': 'application/json'}.items())
        response = await fetch(url,
            method='POST',
            headers=headers,
            body=json.dumps(payload)
        )
        
        result = await response.json()
        
        if result.get('candidates') and len(result['candidates']) > 0:
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"✅ Gemini OCR 완료: {len(text)} 글자")
            return text
        
        return "텍스트를 읽을 수 없습니다."
        
    except Exception as e:
        print(f"Gemini OCR 오류: {str(e)}")
        return f"OCR 오류: {str(e)}"


async def search_rag(text: str, academy_id: int, env) -> list:
    """
    Vectorize DB에서 관련 학원 자료 검색
    """
    try:
        if not hasattr(env, 'VECTORIZE'):
            return []
        
        # Vectorize 검색
        vectorize = env.VECTORIZE
        
        # 텍스트 임베딩 후 검색
        results = await vectorize.query(text, topK=5)
        
        # academy_id로 필터링
        filtered = [
            r.get('metadata', {}).get('content', '')
            for r in results.get('matches', [])
            if r.get('metadata', {}).get('academyId') == academy_id
        ]
        
        return filtered[:3]  # 상위 3개만 반환
        
    except Exception as e:
        print(f"RAG 검색 오류: {str(e)}")
        return []


def detect_subject(text: str) -> str:
    """
    과목 자동 감지
    """
    # 수학 키워드
    math_keywords = ['=', '+', '-', '×', '÷', '/', '*', '방정식', '함수', '미분', '적분', 
                     '기하', '대수', '삼각', 'sin', 'cos', 'tan', '²', '³', '√']
    
    # 영어 키워드
    english_keywords = ['be동사', '조동사', '시제', '문법', '어법', 'grammar', 
                        'the', 'is', 'are', 'was', 'were', 'have', 'has']
    
    math_score = sum(1 for keyword in math_keywords if keyword in text)
    english_score = sum(1 for keyword in english_keywords if keyword.lower() in text.lower())
    
    if math_score > english_score:
        return 'math'
    elif english_score > math_score:
        return 'english'
    else:
        return 'other'


def calculate_math_simple(text: str) -> dict:
    """
    간단한 수학 계산 (Python 내장 함수 사용)
    실제 환경에서는 SymPy 사용 권장
    """
    try:
        calculations = {}
        
        # 간단한 수식 찾기 (예: "2 + 2 = 4")
        patterns = [
            r'(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)',  # 덧셈
            r'(\d+)\s*-\s*(\d+)\s*=\s*(\d+)',   # 뺄셈
            r'(\d+)\s*×\s*(\d+)\s*=\s*(\d+)',   # 곱셈
            r'(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)',   # 나눗셈
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                a, b, student_answer = match.groups()
                a, b, student_answer = int(a), int(b), int(student_answer)
                
                # 연산 수행
                if '+' in match.group():
                    correct_answer = a + b
                elif '-' in match.group():
                    correct_answer = a - b
                elif '×' in match.group():
                    correct_answer = a * b
                elif '÷' in match.group():
                    correct_answer = a // b if b != 0 else 0
                else:
                    continue
                
                calculations[match.group()] = {
                    'studentAnswer': student_answer,
                    'correctAnswer': correct_answer,
                    'isCorrect': student_answer == correct_answer
                }
        
        return calculations if calculations else None
        
    except Exception as e:
        print(f"수학 계산 오류: {str(e)}")
        return None


async def final_grading(
    ocr_text: str,
    calculation_result: dict,
    rag_context: list,
    system_prompt: str,
    model: str,
    temperature: float,
    env
) -> dict:
    """
    최종 채점 결과 생성 - 설정된 모델 사용
    """
    try:
        # 컨텍스트 구성
        context = f"""
이미지에서 읽은 내용:
{ocr_text}

"""
        
        if calculation_result:
            context += f"""
수학 계산 검증 결과:
{json.dumps(calculation_result, ensure_ascii=False, indent=2)}

"""
        
        if rag_context:
            context += f"""
학원 지식 베이스 참고 자료:
{chr(10).join(f"- {item}" for item in rag_context)}

"""
        
        # DeepSeek 모델 사용
        if model == 'deepseek-ocr-2' or model.startswith('deepseek'):
            print(f"🤖 DeepSeek 모델 사용: {model}")
            # Novita_AI_API 우선, 없으면 ALL_AI_API_KEY 사용
            api_key = None
            if hasattr(env, 'Novita_AI_API') and env.Novita_AI_API:
                api_key = env.Novita_AI_API
                print("✅ Novita_AI_API 키 사용")
            elif hasattr(env, 'ALL_AI_API_KEY') and env.ALL_AI_API_KEY:
                api_key = env.ALL_AI_API_KEY
                print("✅ ALL_AI_API_KEY 키 사용")
            
            if not api_key:
                print("⚠️ DeepSeek API 키 없음, Gemini로 폴백")
                return await grade_with_gemini(context, system_prompt, temperature, env)
            
            url = "https://api.deepseek.com/v1/chat/completions"
            
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{context}\n\n위 내용을 바탕으로 숙제를 채점하고, 반드시 JSON 형식으로 응답해주세요."}
                ],
                "temperature": temperature,
                "max_tokens": 2048,
                "response_format": {"type": "json_object"}
            }
            
            headers = Headers.new({
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }.items())
            
            response = await fetch(url,
                method='POST',
                headers=headers,
                body=json.dumps(payload)
            )
            
            result = await response.json()
            
            if result.get('choices') and len(result['choices']) > 0:
                response_text = result['choices'][0]['message']['content']
                grading_result = json.loads(response_text)
                print(f"✅ DeepSeek 채점 완료")
                return grading_result
            
            print(f"⚠️ DeepSeek 응답 없음, Gemini로 폴백")
            return await grade_with_gemini(context, system_prompt, temperature, env)
        
        # Gemini API 사용 (기본)
        else:
            return await grade_with_gemini(context, system_prompt, temperature, env)
        
    except Exception as e:
        print(f"최종 채점 오류: {str(e)}, Gemini로 폴백")
        return await grade_with_gemini(context, system_prompt, temperature, env)


async def grade_with_gemini(
    context: str,
    system_prompt: str,
    temperature: float,
    env
) -> dict:
    """
    Gemini로 채점 수행
    """
    try:
        api_key = env.GEMINI_API_KEY if hasattr(env, 'GEMINI_API_KEY') else None
        
        if not api_key:
            return {
                'totalQuestions': 0,
                'correctAnswers': 0,
                'detailedResults': [],
                'overallFeedback': 'API 키가 설정되지 않았습니다.',
                'strengths': '',
                'improvements': ''
            }
        
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"""{system_prompt}

{context}

위 내용을 바탕으로 숙제를 채점하고, 반드시 JSON 형식으로 응답해주세요."""
                }]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            }
        }
        
        headers = Headers.new({'Content-Type': 'application/json'}.items())
        response = await fetch(url,
            method='POST',
            headers=headers,
            body=json.dumps(payload)
        )
        
        result = await response.json()
        
        if result.get('candidates') and len(result['candidates']) > 0:
            response_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # JSON 추출 (```json ... ``` 형식 처리)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            # JSON 파싱
            grading_result = json.loads(response_text)
            print(f"✅ Gemini 채점 완료")
            return grading_result
        
        return {
            'totalQuestions': 0,
            'correctAnswers': 0,
            'detailedResults': [],
            'overallFeedback': 'AI 응답을 받을 수 없습니다.',
            'strengths': '',
            'improvements': ''
        }
        
    except Exception as e:
        print(f"Gemini 채점 오류: {str(e)}")
        return {
            'totalQuestions': 0,
            'correctAnswers': 0,
            'detailedResults': [],
            'overallFeedback': f'채점 오류: {str(e)}',
            'strengths': '',
            'improvements': ''
        }
