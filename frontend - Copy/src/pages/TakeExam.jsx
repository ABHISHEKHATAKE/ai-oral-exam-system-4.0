import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import './TakeExam.css';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const data = await studentService.getExamDetails(examId);
      setExam(data);
      
      // Initialize answers
      const initialAnswers = {};
      data.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError('Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions are answered
    const unanswered = Object.values(answers).filter(a => !a.trim());
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting');
      return;
    }

    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answerText]) => ({
        question_id: questionId,
        answer_text: answerText
      }));

      const result = await studentService.submitExam(examId, formattedAnswers);
      navigate(`/student/results/${result._id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading exam...</div>;
  if (!exam) return <div className="error">Exam not found</div>;

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const totalQuestions = exam.questions.length;

  return (
    <div className="take-exam-container fade-in">
      <div className="container">
        <div className="exam-header-section">
          <h1>{exam.title}</h1>
          <div className="exam-info">
            <span className="info-item">
              Duration: {exam.duration_minutes} minutes
            </span>
            <span className="info-item">
              Questions: {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>

        {exam.instructions && (
          <div className="instructions-box card">
            <h3>Instructions</h3>
            <p>{exam.instructions}</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="exam-form">
          {exam.questions.map((question, index) => (
            <div key={question.id} className="question-card card slide-in">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <span className="question-score">Max Score: {question.max_score}</span>
              </div>

              <h3 className="question-text">{question.question_text}</h3>

              {question.expected_points && question.expected_points.length > 0 && (
                <div className="expected-points">
                  <h4>Points to Cover:</h4>
                  <ul>
                    {question.expected_points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="answer-section">
                <label htmlFor={`answer-${question.id}`}>Your Answer</label>
                <textarea
                  id={`answer-${question.id}`}
                  value={answers[question.id]}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer here..."
                  rows="6"
                  required
                />
                <div className="character-count">
                  {answers[question.id].length} characters
                </div>
              </div>
            </div>
          ))}

          <div className="submit-section card">
            <div className="submit-info">
              <h3>Ready to Submit?</h3>
              <p>
                Make sure you've answered all questions. You cannot change your answers after submission.
              </p>
              <div className="progress-info">
                <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions answered
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeExam;