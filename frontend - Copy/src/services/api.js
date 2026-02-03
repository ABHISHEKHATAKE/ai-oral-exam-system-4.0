import axios from 'axios';

const API_URL = 'https://ai-oral-exam-system-4-0-2.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Teacher Services
export const teacherService = {
  getStudents: async () => {
    const response = await api.get('/teacher/students');
    return response.data;
  },

  createExam: async (examData) => {
    const formData = new FormData();
    formData.append('title', examData.title);
    formData.append('instructions', examData.instructions);
    formData.append('scheduled_date', examData.scheduled_date);
    formData.append('duration_minutes', examData.duration_minutes);
    formData.append('student_ids', JSON.stringify(examData.student_ids));
    formData.append('pdf_file', examData.pdf_file);

    const response = await api.post('/teacher/exams', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getExams: async () => {
    const response = await api.get('/teacher/exams');
    return response.data;
  },

  getExamDetails: async (examId) => {
    const response = await api.get(`/teacher/exams/${examId}`);
    return response.data;
  },

  getExamSubmissions: async (examId) => {
    const response = await api.get(`/teacher/exams/${examId}/submissions`);
    return response.data;
  },

  updateExam: async (examId, examData) => {
    const response = await api.put(`/teacher/exams/${examId}`, examData);
    return response.data;
  },

  deleteExam: async (examId) => {
    const response = await api.delete(`/teacher/exams/${examId}`);
    return response.data;
  }
};

// Student Services
export const studentService = {
  getExams: async () => {
    const response = await api.get('/student/exams');
    return response.data;
  },

  getExamDetails: async (examId) => {
    const response = await api.get(`/student/exams/${examId}`);
    return response.data;
  },

  submitExam: async (examId, answers) => {
    const response = await api.post(`/student/exams/${examId}/submit`, {
      answers
    });
    return response.data;
  },

  getSubmissionResult: async (submissionId) => {
    const response = await api.get(`/student/submissions/${submissionId}`);
    return response.data;
  }
};

export default api;