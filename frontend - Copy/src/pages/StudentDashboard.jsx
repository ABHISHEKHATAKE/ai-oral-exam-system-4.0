import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../services/api';
import { format } from 'date-fns';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await studentService.getExams();
      setExams(data);
    } catch (err) {
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam) => {
    if (exam.submitted) {
      return { text: 'Completed', className: 'badge-success' };
    } else {
      return { text: 'Available', className: 'badge-info' };
    }
  };

  if (loading) return <div className="loading">Loading exams...</div>;

  return (
    <div className="dashboard-container fade-in">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>View your assigned examinations and track your progress</p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No Exams Assigned</h2>
            <p>You don't have any examinations assigned yet. Check back later!</p>
          </div>
        ) : (
          <div className="exams-grid grid grid-2">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              const examDate = new Date(exam.scheduled_date);
              
              // For testing: Allow taking exam anytime if not submitted
              const canTakeExam = !exam.submitted;

              return (
                <div key={exam._id} className="exam-card card slide-in">
                  <div className="exam-header">
                    <h3>{exam.title}</h3>
                    <span className={`badge ${status.className}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="exam-details">
                    <div className="detail-item">
                      <span className="detail-label">Scheduled</span>
                      <span className="detail-value">
                        {format(examDate, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{exam.duration_minutes} minutes</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Questions</span>
                      <span className="detail-value">{exam.questions.length} questions</span>
                    </div>
                  </div>

                  <div className="exam-actions">
                    {exam.submitted ? (
                      <Link
                        to={`/student/results/${exam.submission_id}`}
                        className="btn btn-primary"
                      >
                        View Results
                      </Link>
                    ) : canTakeExam ? (
                      <Link
                        to={`/student/exam/${exam._id}`}
                        className="btn btn-secondary"
                      >
                        Take Exam
                      </Link>
                    ) : (
                      <button className="btn btn-outline" disabled>
                        Exam Closed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;