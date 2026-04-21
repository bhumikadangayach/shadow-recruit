import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'

import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import DashboardPage from '@/pages/DashboardPage'
import NewInterviewPage from '@/pages/NewInterviewPage'
import InterviewPage from '@/pages/InterviewPage'
import ReportPage from '@/pages/ReportPage'
import SessionsPage from '@/pages/SessionsPage'
import ResumesPage from '@/pages/ResumesPage'
import JobDescriptionsPage from '@/pages/JobDescriptionsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        {/* Protected — with sidebar layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/"                         element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"                element={<DashboardPage />} />
                  <Route path="/interview/new"            element={<NewInterviewPage />} />
                  <Route path="/interview/:sessionId"     element={<InterviewPage />} />
                  <Route path="/sessions"                 element={<SessionsPage />} />
                  <Route path="/sessions/:sessionId/report" element={<ReportPage />} />
                  <Route path="/resumes"                  element={<ResumesPage />} />
                  <Route path="/jobs"                     element={<JobDescriptionsPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#22222d',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
