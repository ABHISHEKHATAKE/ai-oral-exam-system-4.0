import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../services/api';
import { format } from 'date-fns';
import './ExamSubmissions.css';

const ExamSubmissions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      const [examData, submissionsData] = await Promise.all([
        teacherService.getExamDetails(examId),
        teacherService.getExamSubmissions(examId)
      ]);
      setExam(examData);
      setSubmissions(submissionsData);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmission = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  if (loading) return <div className="loading">Loading submissions...</div>;
  if (error) return <div className="error">{error}</div>;

  const submittedCount = submissions.length;
  const totalStudents = exam?.student_ids?.length || 0;
  const averageScore = submissions.length > 0
    ? submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.length
    : 0;

  return (
    <div className="submissions-container fade-in">
      <div className="container">
        <div className="submissions-header">
          <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-outline">
            ← Back to Dashboard
          </button>
          <h1>Exam Submissions</h1>
        </div>

        {/* Exam Summary */}
        {exam && (
          <div className="exam-summary-card card">
            <h2>{exam.title}</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-value">{submittedCount}/{totalStudents}</div>
                <div className="stat-label">Submissions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{averageScore.toFixed(1)}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{exam.questions.length}</div>
                <div className="stat-label">Questions</div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📝</div>
            <h2>No Submissions Yet</h2>
            <p>Students haven't submitted their responses yet. Check back later!</p>
          </div>
        ) : (
          <div className="submissions-list">
            <h2>Student Submissions ({submissions.length})</h2>
            
            {submissions.map((submission) => (
              <div key={submission._id} className="submission-card card slide-in">
                <div 
                  className="submission-header"
                  onClick={() => toggleSubmission(submission._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="student-info">
                    <h3>{submission.student_name || 'Unknown Student'}</h3>
                    <p className="student-email">{submission.student_email || ''}</p>
                  </div>

                  <div className="submission-summary">
                    <div className="score-display">
                      <span className="score-percentage">{submission.percentage?.toFixed(1)}%</span>
                      <span className="score-fraction">
                        {submission.total_score}/{submission.max_possible_score}
                      </span>
                    </div>
                    <div className="submission-date">
                      Submitted: {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>

                  <button className="expand-btn">
                    {expandedSubmission === submission._id ? '▼' : '▶'}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedSubmission === submission._id && (
                  <div className="submission-details">
                    {/* Question-by-Question Results */}
                    {submission.scores && submission.scores.map((scoreData, index) => {
                      const answer = submission.answers.find(a => a.question_id === scoreData.question_id);
                      const question = exam.questions.find(q => q.id === scoreData.question_id);

                      return (
                        <div key={scoreData.question_id} className="question-result">
                          <div className="result-header">
                            <span className="question-num">Question {index + 1}</span>
                            <span className="question-score">
                              {scoreData.score}/{question?.max_score || 10}
                            </span>
                          </div>

                          {question && (
                            <div className="question-text-display">
                              <strong>Question:</strong> {question.question_text}
                            </div>
                          )}

                          {answer && (
                            <div className="answer-display">
                              <strong>Student's Answer:</strong>
                              <p>{answer.answer_text}</p>
                            </div>
                          )}

                          {scoreData.feedback && (
                            <div className="feedback-display">
                              <strong>AI Feedback:</strong>
                              <p>{scoreData.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Overall Feedback */}
                    {submission.feedback && (
                      <div className="overall-feedback">
                        <strong>Overall Feedback:</strong>
                        <p>{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="submissions-actions">
          <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
          <button onClick={() => navigate(`/teacher/exams/${examId}`)} className="btn btn-secondary">
            View Exam Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmissions;