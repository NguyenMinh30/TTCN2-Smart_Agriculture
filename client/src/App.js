import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import FarmerPage from './pages/FarmerPage';
import FarmerNotificationPage from "./pages/FarmerNotificationPage";
import TechnicianPage from './pages/TechnicianPage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import ChangePassword from "./pages/ChangePassword";
import PhotoGallery from './pages/PhotoGallery';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={['Farmer']}>
                <FarmerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-notifications"
            element={
              <ProtectedRoute allowedRoles={['Farmer']}>
                <FarmerNotificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={['Technician']}>
                <TechnicianPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/technician/gallery"
            element={
              <ProtectedRoute allowedRoles={['Technician']}>
                <PhotoGallery />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['Manager']}>
                <ManagerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="/admin-login" element={<AdminLogin />} />

          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;