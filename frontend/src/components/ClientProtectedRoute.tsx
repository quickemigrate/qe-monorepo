import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="text-on-background/40 font-medium">Cargando...</div>
    </div>
  );

  if (!user) {
    return <Navigate to="/cliente/login" replace />;
  }

  return <>{children}</>;
}
