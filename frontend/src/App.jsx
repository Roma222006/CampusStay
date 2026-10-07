import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import WardenDashboard from './pages/WardenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoomManagement from './pages/AdminRoomManagement';
import HostelRooms from './pages/HostelRooms';
import LeaveManagement from './pages/LeaveManagement';
import ComplaintsManagement from './pages/ComplaintsManagement';
import Profile from './pages/Profile';
import Reports from './pages/Reports';

// Innovative New Feature Pages
import GatePass from './pages/GatePass';
import HostelMap from './pages/HostelMap';
import MessHub from './pages/MessHub';
import LostFound from './pages/LostFound';
import EmergencyHub from './pages/EmergencyHub';
import CampusPolls from './pages/CampusPolls';
import RoommateRadar from './pages/RoommateRadar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role Protected Dashboards */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/faculty-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Faculty']}>
                <FacultyDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/warden-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Warden']}>
                <WardenDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Shared Authenticated Routes */}
          <Route 
            path="/hostel" 
            element={
              <ProtectedRoute>
                <HostelRooms />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave" 
            element={
              <ProtectedRoute>
                <LeaveManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/complaints" 
            element={
              <ProtectedRoute>
                <ComplaintsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['Faculty', 'Warden', 'Admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />

          {/* Innovative Feature Routes */}
          <Route 
            path="/gatepass" 
            element={
              <ProtectedRoute>
                <GatePass />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hostel-map" 
            element={
              <ProtectedRoute>
                <HostelMap />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mess" 
            element={
              <ProtectedRoute>
                <MessHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lost-found" 
            element={
              <ProtectedRoute>
                <LostFound />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/emergency" 
            element={
              <ProtectedRoute>
                <EmergencyHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/polls" 
            element={
              <ProtectedRoute>
                <CampusPolls />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/roommate-radar" 
            element={
              <ProtectedRoute>
                <RoommateRadar />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all redirect */}
          <Route path="/admin/rooms" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRoomManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
