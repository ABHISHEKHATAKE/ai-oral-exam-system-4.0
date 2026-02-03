from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
import json

from models import (
    UserCreate, UserLogin, User, Token, UserRole,
    ExamCreate, ExamUpdate, Exam, ExamSubmission, Answer
)
from database import (
    users_collection, exams_collection, 
    exam_submissions_collection, questions_collection
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_teacher, get_current_student
)
from pdf_utils import extract_text_from_pdf
from groq_service import generate_questions_with_groq as generate_questions_with_ai
from groq_service import evaluate_answer_with_groq as evaluate_answer_with_ai

app = FastAPI(title="AI Oral Examination System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Authentication Routes
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user_doc["email"],
            "user_id": user_doc["_id"],
            "role": user_data.role
        }
    )
    
    user_response = User(
        _id=user_doc["_id"],
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        role=user_doc["role"],
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = users_collection.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "user_id": str(user["_id"]),
            "role": user["role"]
        }
    )
    
    user_response = User(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

# Teacher Routes
@app.get("/api/teacher/students")
async def get_students(current_user: dict = Depends(get_current_teacher)):
    students = list(users_collection.find({"role": "student"}))
    return [serialize_doc(s) for s in students]

@app.post("/api/teacher/exams")
async def create_exam(
    title: str = Form(...),
    instructions: str = Form(...),
    scheduled_date: str = Form(...),
    duration_minutes: int = Form(...),
    student_ids: str = Form(...),
    pdf_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_teacher)
):
    # Read PDF content
    pdf_content = await pdf_file.read()
    pdf_text = extract_text_from_pdf(pdf_content)
    
    # Parse student IDs
    student_ids_list = json.loads(student_ids)
    
    # Generate questions using Groq
    questions = await generate_questions_with_ai(pdf_text, instructions, num_questions=5)
    
    # Create exam document
    exam_doc = {
        "teacher_id": current_user["user_id"],
        "title": title,
        "instructions": instructions,
        "scheduled_date": datetime.fromisoformat(scheduled_date.replace('Z', '+00:00')),
        "duration_minutes": duration_minutes,
        "student_ids": student_ids_list,
        "pdf_content": pdf_text,
        "questions": questions,
        "created_at": datetime.utcnow()
    }
    
    result = exams_collection.insert_one(exam_doc)
    exam_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(exam_doc)

@app.get("/api/teacher/exams")
async def get_teacher_exams(current_user: dict = Depends(get_current_teacher)):
    exams = list(exams_collection.find({"teacher_id": current_user["user_id"]}))
    return [serialize_doc(exam) for exam in exams]

@app.get("/api/teacher/exams/{exam_id}")
async def get_exam_details(exam_id: str, current_user: dict = Depends(get_current_teacher)):
    exam = exams_collection.find_one({"_id": ObjectId(exam_id), "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return serialize_doc(exam)

@app.get("/api/teacher/exams/{exam_id}/submissions")
async def get_exam_submissions(exam_id: str, current_user: dict = Depends(get_current_teacher)):
    # Verify exam belongs to teacher
    exam = exams_collection.find_one({"_id": ObjectId(exam_id), "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    submissions = list(exam_submissions_collection.find({"exam_id": exam_id}))
    
    # Enrich with student details
    for submission in submissions:
        student = users_collection.find_one({"_id": ObjectId(submission["student_id"])})
        if student:
            submission["student_name"] = student["full_name"]
            submission["student_email"] = student["email"]
    
    return [serialize_doc(s) for s in submissions]

@app.put("/api/teacher/exams/{exam_id}")
async def update_exam(
    exam_id: str,
    exam_update: ExamUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    exam = exams_collection.find_one({"_id": ObjectId(exam_id), "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    update_data = {k: v for k, v in exam_update.dict(exclude_unset=True).items() if v is not None}
    
    if update_data:
        exams_collection.update_one(
            {"_id": ObjectId(exam_id)},
            {"$set": update_data}
        )
    
    updated_exam = exams_collection.find_one({"_id": ObjectId(exam_id)})
    return serialize_doc(updated_exam)

@app.delete("/api/teacher/exams/{exam_id}")
async def delete_exam(exam_id: str, current_user: dict = Depends(get_current_teacher)):
    result = exams_collection.delete_one({"_id": ObjectId(exam_id), "teacher_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted successfully"}

# Student Routes
@app.get("/api/student/exams")
async def get_student_exams(current_user: dict = Depends(get_current_student)):
    # Get exams where student is assigned
    exams = list(exams_collection.find({"student_ids": current_user["user_id"]}))
    
    # Check submission status
    for exam in exams:
        submission = exam_submissions_collection.find_one({
            "exam_id": str(exam["_id"]),
            "student_id": current_user["user_id"]
        })
        exam["submitted"] = submission is not None
        exam["submission_id"] = str(submission["_id"]) if submission else None
    
    return [serialize_doc(exam) for exam in exams]

@app.get("/api/student/exams/{exam_id}")
async def get_student_exam(exam_id: str, current_user: dict = Depends(get_current_student)):
    exam = exams_collection.find_one({
        "_id": ObjectId(exam_id),
        "student_ids": current_user["user_id"]
    })
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not assigned to you")
    
    return serialize_doc(exam)

@app.post("/api/student/exams/{exam_id}/submit")
async def submit_exam(
    exam_id: str,
    submission_data: dict,
    current_user: dict = Depends(get_current_student)
):
    # Verify exam exists and student is assigned
    exam = exams_collection.find_one({
        "_id": ObjectId(exam_id),
        "student_ids": current_user["user_id"]
    })
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not assigned to you")
    
    # Check if already submitted
    existing_submission = exam_submissions_collection.find_one({
        "exam_id": exam_id,
        "student_id": current_user["user_id"]
    })
    
    if existing_submission:
        raise HTTPException(status_code=400, detail="Exam already submitted")
    
    # Evaluate answers using Groq
    scores = []
    total_score = 0
    
    for answer in submission_data["answers"]:
        # Find the corresponding question
        question = next((q for q in exam["questions"] if q["id"] == answer["question_id"]), None)
        
        if question:
            evaluation = await evaluate_answer_with_ai(question, answer["answer_text"])
            scores.append({
                "question_id": answer["question_id"],
                "score": evaluation["score"],
                "feedback": evaluation["feedback"]
            })
            total_score += evaluation["score"]
    
    # Calculate percentage
    max_possible_score = sum(q["max_score"] for q in exam["questions"])
    percentage = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
    
    # Create submission document
    submission_doc = {
        "exam_id": exam_id,
        "student_id": current_user["user_id"],
        "answers": submission_data["answers"],
        "submitted_at": datetime.utcnow(),
        "scores": scores,
        "total_score": total_score,
        "max_possible_score": max_possible_score,
        "percentage": round(percentage, 2),
        "feedback": f"You scored {total_score}/{max_possible_score} ({percentage:.2f}%)"
    }
    
    result = exam_submissions_collection.insert_one(submission_doc)
    submission_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(submission_doc)

@app.get("/api/student/submissions/{submission_id}")
async def get_submission_result(submission_id: str, current_user: dict = Depends(get_current_student)):
    submission = exam_submissions_collection.find_one({
        "_id": ObjectId(submission_id),
        "student_id": current_user["user_id"]
    })
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return serialize_doc(submission)

@app.get("/")
async def root():
    return {
        "message": "AI Oral Examination System API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "teacher": "/api/teacher/*",
            "student": "/api/student/*"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)