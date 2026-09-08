import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  /** Un rol o lista de roles permitidos. Si no se pasa, solo requiere autenticación. */
  requiredRoles?: UserRole | UserRole[];
  redirectPath?: string;
}

// Destino por defecto según rol cuando accede a una ruta no permitida
const roleHomeMap: Record<string, string> = {
  gestante:      '/main',
  admin:         '/admin',
  clinico:       '/clinico',
  hospital:      '/hospital',
};

export const ProtectedRoute = ({
  requiredRoles,
  redirectPath = '/login',
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { user } = useAuth();

  // 1. No autenticado → al login
  if (!user.isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 2. Sin restricción de rol → permitir
  if (!requiredRoles) {
    return <Outlet />;
  }

  // 3. Verificar rol
  const allowed = Array.isArray(requiredRoles)
    ? requiredRoles.includes(user.role)
    : user.role === requiredRoles;

  if (!allowed) {
    // Redirigir al home del rol actual
    const home = user.role ? roleHomeMap[user.role] ?? '/login' : redirectPath;
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};
