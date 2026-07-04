import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Messages from "./pages/Messages";
import Assistant from "./pages/Assistant";
import Notifications from "./pages/Notifications";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";

import TrainerDashboard from "./pages/trainer/Dashboard";
import Exercises from "./pages/trainer/Exercises";
import ExerciseForm from "./pages/trainer/ExerciseForm";
import WandExerciseForm from "./pages/trainer/WandExerciseForm";
import RecordWandTemplate from "./pages/trainer/RecordWandTemplate";
import ExerciseDetail from "./pages/trainer/ExerciseDetail";
import Programs from "./pages/trainer/Programs";
import ProgramForm from "./pages/trainer/ProgramForm";
import TrainerProgramDetail from "./pages/trainer/ProgramDetail";
import Patients from "./pages/trainer/Patients";
import FindPatients from "./pages/trainer/FindPatients";
import PatientDetail from "./pages/trainer/PatientDetail";

import PatientDashboard from "./pages/patient/Dashboard";
import PatientPrograms from "./pages/patient/Programs";
import PatientProgramDetail from "./pages/patient/ProgramDetail";
import Progress from "./pages/patient/Progress";
import Profile from "./pages/patient/Profile";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminReview from "./pages/admin/Review";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminUsers from "./pages/admin/Users";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-screen"><Spinner /></div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isPatient = user.role === "PATIENT";
  const isAdmin = !!user.is_admin;

  return (
    <Routes>
      <Route element={<Layout />}>
        {isPatient ? (
          <>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/programs" element={<PatientPrograms />} />
            <Route path="/programs/:id" element={<PatientProgramDetail />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </>
        ) : (
          <>
            <Route path="/" element={<TrainerDashboard />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/exercises/new" element={<ExerciseForm />} />
            <Route path="/exercises/new-wand" element={<WandExerciseForm />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="/exercises/:id/edit" element={<ExerciseForm />} />
            <Route path="/exercises/:id/edit-wand" element={<WandExerciseForm />} />
            <Route path="/exercises/:id/record-wand-template" element={<RecordWandTemplate />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/new" element={<ProgramForm />} />
            <Route path="/programs/:id" element={<TrainerProgramDetail />} />
            <Route path="/programs/:id/edit" element={<ProgramForm />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/find" element={<FindPatients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
          </>
        )}

        {/* shared */}
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />

        {isAdmin && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review" element={<AdminReview />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
