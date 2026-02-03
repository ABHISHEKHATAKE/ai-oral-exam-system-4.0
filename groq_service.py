import httpx
import os
from dotenv import load_dotenv
from typing import List
import json

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", os.getenv("GROK_API_KEY", ""))
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def generate_questions_with_groq(pdf_text: str, instructions: str, num_questions: int = 5) -> List[dict]:
    """
    Generate questions using Groq API based on PDF content and instructions
    """
    
    # Truncate PDF text to avoid token limits
    truncated_text = pdf_text[:3000] if len(pdf_text) > 3000 else pdf_text
    
    print(f"\n{'='*60}")
    print(f"Generating questions with Groq API...")
    print(f"PDF text length: {len(pdf_text)} chars (truncated to {len(truncated_text)})")
    print(f"Number of questions: {num_questions}")
    print(f"{'='*60}\n")
    
    prompt = f"""Based on the following document content and instructions, generate {num_questions} oral examination questions.

Document Content:
{truncated_text}

Instructions:
{instructions}

Please generate exactly {num_questions} questions in the following JSON format:
[
  {{
    "question_text": "The question text here",
    "expected_points": ["Point 1 to cover", "Point 2 to cover", "Point 3 to cover"],
    "max_score": 10
  }},
  ...
]

Make sure the questions are:
1. Relevant to the document content
2. Appropriate for oral examination
3. Clear and specific
4. Aligned with the provided instructions

Return ONLY the JSON array, no additional text."""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert educational assistant that creates high-quality oral examination questions."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    # Check if API key is set
    if not GROQ_API_KEY or len(GROQ_API_KEY) < 20:
        print("❌ ERROR: Groq API key not configured!")
        print("Using fallback questions...")
        return generate_fallback_questions(num_questions)
    
    try:
        print("Calling Groq API...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return generate_fallback_questions(num_questions)
            
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            print(f"Received response from Groq (length: {len(content)} chars)")
            
            # Parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            questions = json.loads(content)
            
            # Add unique IDs to questions
            for i, q in enumerate(questions):
                q["id"] = f"q_{i+1}"
            
            print(f"✅ Successfully generated {len(questions)} questions!")
            return questions
            
    except httpx.HTTPError as e:
        print(f"❌ HTTP Error occurred: {e}")
        print("Using fallback questions...")
        return generate_fallback_questions(num_questions)
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Content received: {content[:200] if 'content' in locals() else 'No content'}")
        print("Using fallback questions...")
        return generate_fallback_questions(num_questions)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print("Using fallback questions...")
        return generate_fallback_questions(num_questions)

async def evaluate_answer_with_groq(question: dict, answer: str) -> dict:
    """
    Evaluate a student's answer using Groq API
    """
    
    prompt = f"""Evaluate the following student answer for an oral examination question.

Question: {question['question_text']}

Expected Points to Cover:
{chr(10).join(f"- {point}" for point in question['expected_points'])}

Student's Answer:
{answer}

Maximum Score: {question['max_score']}

Please evaluate the answer and provide:
1. A score out of {question['max_score']}
2. Brief feedback (2-3 sentences)

Return your evaluation in the following JSON format:
{{
  "score": <number>,
  "feedback": "<feedback text>"
}}

Return ONLY the JSON, no additional text."""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert educational evaluator for oral examinations."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 500
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            evaluation = json.loads(content)
            return evaluation
            
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        return {
            "score": question['max_score'] // 2,
            "feedback": "Automatic evaluation unavailable. Manual review required."
        }

def generate_fallback_questions(num_questions: int) -> List[dict]:
    """Generate fallback questions if API fails"""
    fallback = []
    for i in range(num_questions):
        fallback.append({
            "id": f"q_{i+1}",
            "question_text": f"Sample Question {i+1}: Please explain the key concepts from the provided document.",
            "expected_points": [
                "Understanding of main concepts",
                "Ability to explain clearly",
                "Connection to practical applications"
            ],
            "max_score": 10
        })
    return fallback