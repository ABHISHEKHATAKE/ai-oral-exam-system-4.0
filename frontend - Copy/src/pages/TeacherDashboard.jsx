import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherService } from '../services/api';
import { format } from 'date-fns';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await teacherService.getExams();
      setExams(data);
    } catch (err) {
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    try {
      await teacherService.deleteExam(examId);
      setExams(exams.filter(exam => exam._id !== examId));
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  if (loading) return <div className="loading">Loading exams...</div>;

  return (
    <div className="dashboard-container fade-in">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p>Manage your oral examinations and track student progress</p>
          </div>
          <Link to="/teacher/create-exam" className="btn btn-primary">
            + Create New Exam
          </Link>
        </div>

        {error && <div className="error">{error}</div>}

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No Exams Yet</h2>
            <p>Create your first oral examination to get started</p>
            <Link to="/teacher/create-exam" className="btn btn-secondary">
              Create Exam
            </Link>
          </div>
        ) : (
          <div className="exams-grid grid grid-2">
            {exams.map((exam) => (
              <div key={exam._id} className="exam-card card slide-in">
                <div className="exam-header">
                  <h3>{exam.title}</h3>
                  <span className="badge badge-info">
                    {exam.questions.length} Questions
                  </span>
                </div>

                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">Scheduled</span>
                    <span className="detail-value">
                      {format(new Date(exam.scheduled_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Students</span>
                    <span className="detail-value">{exam.student_ids.length} assigned</span>
                  </div>
                </div>

                <div className="exam-actions">
                  <Link to={`/teacher/exams/${exam._id}`} className="btn btn-outline">
                    View Details
                  </Link>
                  <Link to={`/teacher/exams/${exam._id}/submissions`} className="btn btn-secondary">
                    View Submissions
                  </Link>
                  <button
                    onClick={() => handleDelete(exam._id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;