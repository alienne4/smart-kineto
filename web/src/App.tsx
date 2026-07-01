import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import TrainerDashboard from "./pages/trainer/Dashboard";
import { LoginPage, RegisterPage } from "./pages/shared/AuthPages";
import PlaceholderPage from "./pages/shared/PlaceholderPage";
import { Spinner } from "./components/ui";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isPatient = user.role === "PATIENT";

  return (
    <Routes>
      <Route element={<Layout />}>
        {isPatient ? (
          <>
            <Route path="/" element={<PlaceholderPage title="Patient dashboard" />} />
            <Route path="/programs" element={<PlaceholderPage title="My programs" />} />
            <Route path="/programs/:id" element={<PlaceholderPage title="Program detail" />} />
            <Route path="/assistant" element={<PlaceholderPage title="AI assistant" />} />
            <Route path="/progress" element={<PlaceholderPage title="Progress" />} />
            <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<TrainerDashboard />} />
            <Route path="/exercises" element={<PlaceholderPage title="Exercises" />} />
            <Route path="/exercises/new" element={<PlaceholderPage title="New exercise" />} />
            <Route path="/exercises/:id" element={<PlaceholderPage title="Exercise detail" />} />
            <Route path="/exercises/:id/edit" element={<PlaceholderPage title="Edit exercise" />} />
            <Route path="/programs" element={<PlaceholderPage title="Programs" />} />
            <Route path="/programs/new" element={<PlaceholderPage title="New program" />} />
            <Route path="/programs/:id" element={<PlaceholderPage title="Program detail" />} />
            <Route path="/programs/:id/edit" element={<PlaceholderPage title="Edit program" />} />
            <Route path="/patients" element={<PlaceholderPage title="Patients" />} />
            <Route path="/patients/find" element={<PlaceholderPage title="Find patients" />} />
            <Route path="/patients/:id" element={<PlaceholderPage title="Patient detail" />} />
          </>
        )}
        <Route path="/messages" element={<PlaceholderPage title="Messages" />} />
        <Route path="/messages/:userId" element={<PlaceholderPage title="Conversation" />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="/news" element={<PlaceholderPage title="News and events" />} />
        <Route path="/news/:id" element={<PlaceholderPage title="News detail" />} />
        {user.is_admin ? (
          <>
            <Route path="/admin" element={<PlaceholderPage title="Admin dashboard" />} />
            <Route path="/admin/review" element={<PlaceholderPage title="Review queue" />} />
            <Route path="/admin/announcements" element={<PlaceholderPage title="News and events admin" />} />
            <Route path="/admin/users" element={<PlaceholderPage title="Users" />} />
          </>
        ) : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
