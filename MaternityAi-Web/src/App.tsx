import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OfflineBanner } from './components/pwa/OfflineBanner';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const UsPage = lazy(() => import('./pages/UsPage').then(module => ({ default: module.UsPage })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(module => ({ default: module.UserProfile })));
const Biblioteca = lazy(() => import('./pages/Biblioteca').then(module => ({ default: module.Biblioteca })));
const Actividad = lazy(() => import('./pages/Actividad').then(module => ({ default: module.Actividad })));
const Ai = lazy(() => import('./pages/Ai').then(module => ({ default: module.Ai })));
const Main = lazy(() => import('./pages/Main').then(module => ({ default: module.Main })));

const AdminUsuarias = lazy(() => import('./pages/adminPages/AdminUsuarias').then(module => ({ default: module.AdminUsuarias })));
const AdminOBA = lazy(() => import('./pages/adminPages/AdminOBA').then(module => ({ default: module.AdminOBA })));
const AdminPreguntas = lazy(() => import('./pages/adminPages/AdminPreguntas').then(module => ({ default: module.AdminPreguntas })));
const AdminCitas = lazy(() => import('./pages/adminPages/AdminCitas').then(module => ({ default: module.AdminCitas })));
const AdminCargas = lazy(() => import('./pages/adminPages/AdminCargas').then(module => ({ default: module.AdminCargas })));
const AdminChecklist = lazy(() => import('./pages/adminPages/AdminChecklist').then(module => ({ default: module.AdminChecklist })));
const AdminIA = lazy(() => import('./pages/adminPages/AdminIA').then(module => ({ default: module.AdminIA })));
const HospitalDashboard = lazy(() => import('./pages/hospitalPages/HospitalDashboard').then(module => ({ default: module.HospitalDashboard })));

function App() {
  return (
    <>
      <OfflineBanner />
      <BrowserRouter>
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#CA436E', fontSize: '24px' }}>Cargando...</div>}>
          <Routes>
            {/* ── Rutas públicas ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/nosotros" element={<UsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Rutas exclusivas de gestante ── */}
            <Route element={<ProtectedRoute requiredRoles="gestante" />}>
              <Route path="/userprofile" element={<UserProfile />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/actividad" element={<Actividad />} />
              <Route path="/ai" element={<Ai />} />
              <Route path="/main" element={<Main />} />
            </Route>

            {/* ── Rutas exclusivas de admin ── */}
            <Route element={<ProtectedRoute requiredRoles="admin" />}>
              <Route path="/admin" element={<Navigate to="/admin/usuarias" />} />
              <Route path="/admin/usuarias" element={<AdminUsuarias />} />
              <Route path="/admin/preguntas" element={<AdminPreguntas />} />
              <Route path="/admin/cargas" element={<AdminCargas />} />
              <Route path="/admin/checklist" element={<AdminChecklist />} />
              <Route path="/admin/ia" element={<AdminIA />} />
            </Route>

            {/* ── Rutas para clínico (Personal Médico) ── */}
            <Route element={<ProtectedRoute requiredRoles="clinico" />}>
              <Route path="/clinico" element={<Navigate to="/clinico/usuarias" replace />} />
              <Route path="/clinico/usuarias" element={<AdminUsuarias />} />
              <Route path="/clinico/citas" element={<AdminCitas />} />
              <Route path="/clinico/oba" element={<AdminOBA />} />
              <Route path="/clinico/ia" element={<AdminIA />} />
            </Route>

            {/* ── Rutas para Hospital ── */}
            <Route element={<ProtectedRoute requiredRoles="hospital" />}>
              <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
              <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            </Route>


            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
