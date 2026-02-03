import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateExam from './pages/CreateExam';
import StudentDashboard from './pages/StudentDashboard';
import TakeExam from './pages/TakeExam';
import ExamResults from './pages/ExamResults';
import ExamDetails from './pages/ExamDetails';
import ExamSubmissions from './pages/ExamSubmissions';
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return children;
};

const HomePage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return (
    <div className="home-page">
      <div className="container">
        <div className="hero-section fade-in">
          <h1>AI-Powered Oral Examination System</h1>
          <p>
            Revolutionize your assessment process with intelligent question generation
            and automated evaluation powered by AI
          </p>
          <div className="hero-actions">
            <a href="/register" className="btn btn-primary btn-lg">
              Get Started
            </a>
            <a href="/login" className="btn btn-outline btn-lg">
              Sign In
            </a>
          </div>
        </div>

        <div className="features-grid grid grid-3">
          <div className="feature-card card slide-in">
            <div className="feature-icon">🤖</div>
            <h3>AI Question Generation</h3>
            <p>Upload PDF documents and let AI generate relevant oral examination questions</p>
          </div>
          <div className="feature-card card slide-in">
            <div className="feature-icon">✍️</div>
            <h3>Real-time Evaluation</h3>
            <p>Get instant feedback and scores with AI-powered answer evaluation</p>
          </div>
          <div className="feature-card card slide-in">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor student performance and exam completion with detailed analytics</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          padding: 80px 0;
          min-height: calc(100vh - 80px);
        }

        .hero-section {
          text-align: center;
          margin-bottom: 80px;
        }

        .hero-section h1 {
          font-size: 56px;
          margin-bottom: 24px;
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-section p {
          font-size: 20px;
          color: var(--text-medium);
          max-width: 700px;
          margin: 0 auto 40px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 16px 36px;
          font-size: 16px;
        }

        .feature-card {
          text-align: center;
          padding: 40px 28px;
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 22px;
          margin-bottom: 12px;
          color: var(--text-dark);
        }

        .feature-card p {
          color: var(--text-medium);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 36px;
          }

          .hero-section p {
            font-size: 16px;
          }

          .hero-actions {
            flex-direction: column;
          }

          .btn-lg {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-exam"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <CreateExam />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exam/:examId"
              element={
                <ProtectedRoute allowedRole="student">
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:submissionId"
              element={
                <ProtectedRoute allowedRole="student">
                  <ExamResults />
                </ProtectedRoute>
              }
            />
            <Route
  path="/teacher/exams/:examId"
  element={
    <ProtectedRoute allowedRole="teacher">
      <ExamDetails />
    </ProtectedRoute>
  }
/>
<Route
  path="/teacher/exams/:examId/submissions"
  element={
    <ProtectedRoute allowedRole="teacher">
      <ExamSubmissions />
    </ProtectedRoute>
  }
/>
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
      
    </Router>
  );
  
}

export default App;