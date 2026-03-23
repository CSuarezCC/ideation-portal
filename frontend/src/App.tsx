import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ConfirmAccountPage } from './pages/auth/ConfirmAccountPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { UserManagementPage } from './pages/admin/users/UserManagementPage'
import { CampaignListPage } from './pages/admin/campaigns/CampaignListPage'
import { CampaignFormPage } from './pages/admin/campaigns/CampaignFormPage'
import { CampaignDetailPage } from './pages/admin/campaigns/CampaignDetailPage'
import { CategoryManagementPage } from './pages/admin/categories/CategoryManagementPage'
import { IdeaSubmitPage } from './pages/ideas/IdeaSubmitPage'
import { MyIdeasPage } from './pages/ideas/MyIdeasPage'
import { IdeaDetailPage } from './pages/ideas/IdeaDetailPage'
import { EvaluationQueuePage } from './pages/evaluation/EvaluationQueuePage'
import { ScoringFormPage } from './pages/evaluation/ScoringFormPage'
import { EvaluationSummaryPage } from './pages/evaluation/EvaluationSummaryPage'
import { LeaderboardPage } from './pages/dashboard/LeaderboardPage'
import { IdeaDetailDashboardPage } from './pages/dashboard/IdeaDetailDashboardPage'
import { AnalyticsDashboardPage } from './pages/analytics/AnalyticsDashboardPage'
import { NotificationCenterPage } from './pages/notifications/NotificationCenterPage'
import { WinnersAnnouncementPage } from './pages/recognition/WinnersAnnouncementPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/confirm-account" element={<ConfirmAccountPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CampaignListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/new"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CampaignFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/:id"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CampaignDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/:id/edit"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CampaignFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CategoryManagementPage />
                  </ProtectedRoute>
                }
              />
              {/* Idea routes */}
              <Route path="/ideas/submit" element={<IdeaSubmitPage />} />
              <Route path="/ideas/mine" element={<MyIdeasPage />} />
              <Route path="/ideas/:id" element={<IdeaDetailPage />} />
              <Route path="/ideas/:id/edit" element={<IdeaSubmitPage />} />
              {/* Evaluation routes */}
              <Route path="/evaluation" element={<EvaluationQueuePage />} />
              <Route path="/evaluation/:ideaId" element={<ScoringFormPage />} />
              <Route path="/evaluation/:ideaId/summary" element={<EvaluationSummaryPage />} />
              {/* Dashboard & Analytics routes (Unit 5) */}
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/leaderboard/ideas/:ideaId" element={<IdeaDetailDashboardPage />} />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredRole="PANEL_MEMBER">
                    <AnalyticsDashboardPage />
                  </ProtectedRoute>
                }
              />
              {/* Notification routes (Unit 6) */}
              <Route path="/notifications" element={<NotificationCenterPage />} />
              {/* Recognition routes (Unit 7) */}
              <Route path="/recognition/:campaignId" element={<WinnersAnnouncementPage />} />
              <Route path="/" element={<Navigate to="/leaderboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
