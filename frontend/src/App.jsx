import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Farmer Pages
import FarmerLayout from './pages/farmer/FarmerLayout';
import FarmerOverview from './pages/farmer/FarmerOverview';
import FarmerFarms from './pages/farmer/FarmerFarms';
import FarmerServices from './pages/farmer/FarmerServices';
import FarmerRequests from './pages/farmer/FarmerRequests';
import FarmerRequestDetail from './pages/farmer/FarmerRequestDetail';
import FarmerBookings from './pages/farmer/FarmerBookings';
import FarmerProjects from './pages/farmer/FarmerProjects';
import FarmerProjectDetail from './pages/farmer/FarmerProjectDetail';
import FarmerCalendar from './pages/farmer/FarmerCalendar';
import FarmerAnalytics from './pages/farmer/FarmerAnalytics';
import FarmerHelp from './pages/farmer/FarmerHelp';
import FarmerSettings from './pages/farmer/FarmerSettings';

// Worker Pages
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerJobs from './pages/worker/WorkerJobs';
import WorkerBookings from './pages/worker/WorkerBookings';
import WorkerEarnings from './pages/worker/WorkerEarnings';

// Provider Pages
import ProviderLayout from './pages/provider/ProviderLayout';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderMatching from './pages/provider/ProviderMatching';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderProfileView from './pages/provider/ProviderProfileView';

// Admin Page
import AdminDashboard from './pages/admin/AdminDashboard';

// Layout for Public Site
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Farmer Protected Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/farmer/overview" replace />} />
              <Route path="overview" element={<FarmerOverview />} />
              <Route path="farms" element={<FarmerFarms />} />
              <Route path="services" element={<FarmerServices />} />
              <Route path="requests" element={<FarmerRequests />} />
              <Route path="requests/:id" element={<FarmerRequestDetail />} />
              <Route path="bookings" element={<FarmerBookings />} />
              <Route path="projects" element={<FarmerProjects />} />
              <Route path="projects/:id" element={<FarmerProjectDetail />} />
              <Route path="calendar" element={<FarmerCalendar />} />
              <Route path="analytics" element={<FarmerAnalytics />} />
              <Route path="help" element={<FarmerHelp />} />
              <Route path="settings" element={<FarmerSettings />} />
            </Route>

            {/* Worker Protected Routes */}
            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <WorkerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/worker/dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="jobs" element={<WorkerJobs />} />
              <Route path="bookings" element={<WorkerBookings />} />
              <Route path="earnings" element={<WorkerEarnings />} />
            </Route>

            {/* Provider Protected Routes */}
            <Route
              path="/provider"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/provider/dashboard" replace />} />
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="matching" element={<ProviderMatching />} />
              <Route path="bookings" element={<ProviderBookings />} />
              <Route path="earnings" element={<ProviderEarnings />} />
              <Route path="profile" element={<ProviderProfileView />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
