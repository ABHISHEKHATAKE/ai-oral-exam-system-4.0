#!/usr/bin/env python3
"""Quick Groq API Test"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from groq_service import generate_questions_with_groq
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("\n" + "="*60)
    print("GROQ API QUICK TEST")
    print("="*60 + "\n")
    
    # Check API key
    api_key = os.getenv("GROQ_API_KEY", "")
    print(f"1. API Key loaded: {api_key[:15]}...{api_key[-10:] if len(api_key) > 25 else 'TOO SHORT'}\n")
    
    # Test with sample text
    sample_text = """
    Python is a high-level programming language.
    It is widely used for web development, data science, and automation.
    Python has a simple syntax that is easy to learn.
    """
    
    print("2. Testing question generation...\n")
    
    questions = await generate_questions_with_groq(
        pdf_text=sample_text,
        instructions="Create questions about Python programming",
        num_questions=3
    )
    
    print("\n" + "="*60)
    print("RESULTS:")
    print("="*60 + "\n")
    
    for i, q in enumerate(questions, 1):
        print(f"Question {i}: {q['question_text']}")
        print(f"Expected Points: {q['expected_points']}")
        print(f"Max Score: {q['max_score']}")
        print()
    
    # Check if questions are real or fallback
    if "Sample Question" in questions[0]['question_text']:
        print("❌ FAILED: Getting fallback questions")
        print("   Groq API is not working properly!")
        print("\nTroubleshooting:")
        print("1. Check your GROQ_API_KEY in .env file")
        print("2. Make sure it starts with 'gsk_'")
        print("3. Verify the key is valid at https://console.groq.com/keys")
    else:
        print("✅ SUCCESS: Groq API is generating real questions!")
        print("   Your setup is working correctly!")

if __name__ == "__main__":
    asyncio.run(test())