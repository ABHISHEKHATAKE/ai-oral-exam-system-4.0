from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ExamCreate(BaseModel):
    title: str
    instructions: str
    scheduled_date: datetime
    duration_minutes: int
    student_ids: List[str]

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    student_ids: Optional[List[str]] = None

class Exam(BaseModel):
    id: str = Field(alias="_id")
    teacher_id: str
    title: str
    instructions: str
    scheduled_date: datetime
    duration_minutes: int
    student_ids: List[str]
    pdf_content: Optional[str] = None
    questions: List[dict] = []
    created_at: datetime
    
    class Config:
        populate_by_name = True

class Question(BaseModel):
    question_text: str
    expected_points: List[str]
    max_score: int = 10

class QuestionGeneration(BaseModel):
    pdf_text: str
    instructions: str
    num_questions: int = 5

class Answer(BaseModel):
    question_id: str
    answer_text: str

class ExamSubmission(BaseModel):
    exam_id: str
    student_id: str
    answers: List[Answer]
    submitted_at: datetime
    scores: Optional[List[dict]] = None
    total_score: Optional[float] = None
    feedback: Optional[str] = None