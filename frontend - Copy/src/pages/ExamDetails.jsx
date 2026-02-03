import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teacherService } from '../services/api';
import { format } from 'date-fns';
import './ExamDetails.css';

const ExamDetails = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const data = await teacherService.getExamDetails(examId);
      setExam(data);
    } catch (err) {
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await teacherService.deleteExam(examId);
      navigate('/teacher/dashboard');
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  if (loading) return <div className="loading">Loading exam details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!exam) return <div className="error">Exam not found</div>;

  return (
    <div className="exam-details-container fade-in">
      <div className="container">
        <div className="details-header">
          <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-outline">
            ← Back to Dashboard
          </button>
          <div className="header-actions">
            <Link to={`/teacher/exams/${examId}/submissions`} className="btn btn-secondary">
              View Submissions
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Exam
            </button>
          </div>
        </div>

        {/* Exam Info Card */}
        <div className="exam-info-card card">
          <div className="exam-title-section">
            <h1>{exam.title}</h1>
            <div className="exam-meta">
              <span className="meta-item">
                📅 {format(new Date(exam.scheduled_date), 'MMMM dd, yyyy')}
              </span>
              <span className="meta-item">
                🕐 {format(new Date(exam.scheduled_date), 'HH:mm')}
              </span>
              <span className="meta-item">
                ⏱️ {exam.duration_minutes} minutes
              </span>
              <span className="meta-item">
                👥 {exam.student_ids.length} students assigned
              </span>
            </div>
          </div>

          {exam.instructions && (
            <div className="instructions-section">
              <h3>Instructions</h3>
              <p>{exam.instructions}</p>
            </div>
          )}

          {exam.pdf_content && (
            <div className="pdf-preview-section">
              <h3>Document Content Preview</h3>
              <div className="pdf-preview">
                {exam.pdf_content.substring(0, 500)}...
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          <h2>Generated Questions ({exam.questions.length})</h2>
          
          {exam.questions.map((question, index) => (
            <div key={question.id} className="question-card card slide-in">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <span className="question-score-badge">
                  Max Score: {question.max_score}
                </span>
              </div>

              <h3 className="question-text">{question.question_text}</h3>

              {question.expected_points && question.expected_points.length > 0 && (
                <div className="expected-points">
                  <h4>Expected Points to Cover:</h4>
                  <ul>
                    {question.expected_points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="exam-actions-footer">
          <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
          <Link to={`/teacher/exams/${examId}/submissions`} className="btn btn-primary">
            View All Submissions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;