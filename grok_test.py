#!/usr/bin/env python3
"""
Test Grok API Connection
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv
import json

load_dotenv()

GROK_API_KEY = os.getenv("GROK_API_KEY", "")
GROK_API_URL = os.getenv("GROK_API_URL", "https://api.x.ai/v1/chat/completions")

async def test_grok_api():
    print("="*60)
    print("Grok API Connection Test")
    print("="*60)
    print()
    
    # Check API key
    print(f"1. Checking API Key...")
    if not GROK_API_KEY or GROK_API_KEY == "dummy-key-for-now":
        print("   ❌ INVALID API KEY!")
        print(f"   Current value: {GROK_API_KEY}")
        print()
        print("   To fix:")
        print("   1. Get your Grok API key from https://console.x.ai")
        print("   2. Update backend/.env file:")
        print("      GROK_API_KEY=xai-your-actual-key-here")
        return False
    else:
        print(f"   ✓ API Key present: {GROK_API_KEY[:10]}...{GROK_API_KEY[-10:]}")
    
    print()
    print(f"2. Testing API Connection...")
    print(f"   URL: {GROK_API_URL}")
    
    # Simple test request
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROK_API_KEY}"
    }
    
    payload = {
        "model": "grok-beta",
        "messages": [
            {
                "role": "user",
                "content": "Say 'Hello, I am working!' in JSON format like {\"message\": \"...\"}"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GROK_API_URL, headers=headers, json=payload)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"   ✓ API Response: {content[:100]}")
                print()
                print("="*60)
                print("✅ SUCCESS! Grok API is working!")
                print("="*60)
                return True
            else:
                print(f"   ❌ Error Response:")
                print(f"   {response.text}")
                return False
                
    except httpx.ConnectError as e:
        print(f"   ❌ Connection Error: Cannot reach API")
        print(f"   {e}")
        return False
    except httpx.TimeoutException:
        print(f"   ❌ Timeout: API took too long to respond")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

async def test_question_generation():
    print()
    print("="*60)
    print("Testing Question Generation")
    print("="*60)
    print()
    
    sample_text = """
    Artificial Intelligence (AI) is transforming modern technology.
    Machine learning enables computers to learn from data.
    Neural networks are inspired by the human brain.
    """
    
    prompt = f"""Based on this text, generate 2 questions in JSON format:
{sample_text}

Format:
[
  {{
    "question_text": "question here",
    "expected_points": ["point 1", "point 2"],
    "max_score": 10
  }}
]

Return ONLY the JSON array."""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROK_API_KEY}"
    }
    
    payload = {
        "model": "grok-beta",
        "messages": [
            {"role": "system", "content": "You are an educational assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(GROK_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                questions = json.loads(content)
                
                print("✓ Generated Questions:")
                for i, q in enumerate(questions, 1):
                    print(f"\n   Question {i}:")
                    print(f"   {q['question_text']}")
                    print(f"   Points: {q['expected_points']}")
                
                print()
                print("="*60)
                print("✅ Question generation working!")
                print("="*60)
                return True
            else:
                print(f"❌ Failed with status: {response.status_code}")
                print(response.text)
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print()
    result1 = asyncio.run(test_grok_api())
    
    if result1:
        result2 = asyncio.run(test_question_generation())
        
        if result2:
            print()
            print("🎉 All tests passed! Your Grok API is ready to use!")
        else:
            print()
            print("⚠️  Basic connection works but question generation failed.")
            print("   This might be a formatting issue.")
    else:
        print()
        print("❌ Grok API is not configured correctly.")
        print()
        print("Steps to fix:")
        print("1. Get API key from https://console.x.ai")
        print("2. Update backend/.env:")
        print("   GROK_API_KEY=xai-your-key-here")
        print("3. Restart backend server")
        print("4. Run this test again")