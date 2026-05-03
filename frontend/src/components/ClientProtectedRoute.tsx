import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-white/30 font-medium">Cargando...</div>
    </div>
  );

  if (!user) {
    return <Navigate to="/cliente/login" state={{ redirect: location.pathname }} replace />;
  }

  return <>{children}</>;
}
