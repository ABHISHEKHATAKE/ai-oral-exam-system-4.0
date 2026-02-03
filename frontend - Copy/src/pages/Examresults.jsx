import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import './ExamResults.css';

const ExamResults = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      const data = await studentService.getSubmissionResult(submissionId);
      setSubmission(data);
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!submission) return <div className="error">Results not found</div>;

  const percentage = submission.percentage || 0;
  const passed = percentage >= 60;

  return (
    <div className="results-container fade-in">
      <div className="container">
        <div className="results-header">
          <button onClick={() => navigate('/student/dashboard')} className="btn btn-outline">
            ← Back to Dashboard
          </button>
          <h1>Exam Results</h1>
        </div>

        {/* Score Summary Card */}
        <div className="score-summary card">
          <div className="score-circle-container">
            <div className={`score-circle ${passed ? 'passed' : 'failed'}`}>
              <div className="score-percentage">{percentage.toFixed(1)}%</div>
              <div className="score-label">Score</div>
            </div>
          </div>

          <div className="score-details">
            <div className="score-item">
              <span className="score-label-text">Total Score</span>
              <span className="score-value">
                {submission.total_score} / {submission.max_possible_score}
              </span>
            </div>
            <div className="score-item">
              <span className="score-label-text">Status</span>
              <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                {passed ? 'Passed' : 'Needs Improvement'}
              </span>
            </div>
            <div className="score-item">
              <span className="score-label-text">Submitted</span>
              <span className="score-value">
                {new Date(submission.submitted_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Feedback */}
        {submission.feedback && (
          <div className="feedback-card card">
            <h3>Overall Feedback</h3>
            <p>{submission.feedback}</p>
          </div>
        )}

        {/* Question-by-Question Results */}
        <div className="questions-results">
          <h2>Question-by-Question Results</h2>
          
          {submission.scores && submission.scores.map((scoreData, index) => {
            const answer = submission.answers.find(a => a.question_id === scoreData.question_id);
            const maxScore = 10; // Default max score
            const scorePercentage = (scoreData.score / maxScore) * 100;

            return (
              <div key={scoreData.question_id} className="question-result-card card slide-in">
                <div className="question-result-header">
                  <div className="question-number">Question {index + 1}</div>
                  <div className="question-score">
                    <span className="score-earned">{scoreData.score}</span>
                    <span className="score-divider">/</span>
                    <span className="score-max">{maxScore}</span>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="score-bar-container">
                  <div 
                    className="score-bar" 
                    style={{ 
                      width: `${scorePercentage}%`,
                      backgroundColor: scorePercentage >= 70 ? '#2d7a4f' : scorePercentage >= 50 ? '#ffa621' : '#ff6b35'
                    }}
                  ></div>
                </div>

                {/* Your Answer */}
                {answer && (
                  <div className="answer-section">
                    <h4>Your Answer:</h4>
                    <p className="answer-text">{answer.answer_text}</p>
                  </div>
                )}

                {/* Feedback */}
                {scoreData.feedback && (
                  <div className="feedback-section">
                    <h4>Feedback:</h4>
                    <p className="feedback-text">{scoreData.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;