import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALLOWED_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL_1,
  import.meta.env.VITE_ADMIN_EMAIL_2
];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="text-on-background/40 font-medium">Cargando...</div>
    </div>
  );

  if (!user || !ALLOWED_EMAILS.includes(user.email || '')) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
