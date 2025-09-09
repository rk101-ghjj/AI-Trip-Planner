import { Navigate } from 'react-router-dom';
import { getToken } from '../../service/AuthService';

export default function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}