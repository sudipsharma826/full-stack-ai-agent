import { Navigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userInfo } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userInfo?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Access Denied!</strong>
          <span className="block sm:inline"> You don't have permission to access this page.</span>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
