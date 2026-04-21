// Re-exports the shared Firebase auth context for use in client-facing components.
// Both admin and client use the same Firebase Auth instance; restrictions are enforced
// at the route level (ProtectedRoute vs ClientProtectedRoute).
export { AuthProvider as ClientAuthProvider, useAuth as useClientAuth } from './AuthContext';
