import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../services/api';
import './CreateExam.css';

const CreateExam = () => {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    instructions: '',
    scheduled_date: '',
    duration_minutes: 30,
    student_ids: [],
    pdf_file: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await teacherService.getStudents();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      pdf_file: e.target.files[0]
    });
  };

  const handleStudentToggle = (studentId) => {
    setFormData({
      ...formData,
      student_ids: formData.student_ids.includes(studentId)
        ? formData.student_ids.filter(id => id !== studentId)
        : [...formData.student_ids, studentId]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.pdf_file) {
      setError('Please upload a PDF file');
      return;
    }

    if (formData.student_ids.length === 0) {
      setError('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      await teacherService.createExam(formData);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-exam-container fade-in">
      <div className="container">
        <div className="page-header">
          <h1>Create New Exam</h1>
          <p>Upload a PDF document and let AI generate examination questions</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="exam-form">
          <div className="form-section card">
            <h2>Exam Details</h2>

            <div className="input-group">
              <label htmlFor="title">Exam Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Midterm Oral Examination"
              />
            </div>

            <div className="input-group">
              <label htmlFor="instructions">Instructions for AI</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                required
                placeholder="Provide specific instructions for question generation, e.g., 'Focus on key concepts, create analytical questions, difficulty level: intermediate'"
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="scheduled_date">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  id="scheduled_date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="duration_minutes">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="15"
                  max="180"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="pdf_file">Upload PDF Document</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="pdf_file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <label htmlFor="pdf_file" className="file-upload-label">
                  {formData.pdf_file ? (
                    <span className="file-name">📄 {formData.pdf_file.name}</span>
                  ) : (
                    <span className="file-placeholder">Click to upload PDF</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="form-section card">
            <h2>Assign Students</h2>
            <p className="section-description">
              Select students who will take this exam
            </p>

            {students.length === 0 ? (
              <div className="empty-students">
                <p>No students registered yet</p>
              </div>
            ) : (
              <div className="students-list">
                {students.map((student) => (
                  <label key={student._id} className="student-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.student_ids.includes(student._id)}
                      onChange={() => handleStudentToggle(student._id)}
                    />
                    <div className="student-info">
                      <span className="student-name">{student.full_name}</span>
                      <span className="student-email">{student.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="selected-count">
              {formData.student_ids.length} student(s) selected
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/teacher/dashboard')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;