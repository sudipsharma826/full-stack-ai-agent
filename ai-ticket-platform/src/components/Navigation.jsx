import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import { authAPI } from '../utils/api';

const Navigation = () => {
  const { userInfo, isAuthenticated, logoutUser } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutUser();
      navigate('/');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const isAdminOrModerator = userInfo?.role === 'admin' || userInfo?.role === 'moderator';
  const isAdmin = userInfo?.role === 'admin';

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-xl font-bold">
              AI Ticket Platform
            </Link>
            <div className="flex space-x-4">
              <Link 
                to="/dashboard" 
                className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
              >
                Dashboard
              </Link>
              <Link 
                to="/create-ticket" 
                className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
              >
                Create Ticket
              </Link>
              {userInfo?.role !== 'admin' && (
                <Link 
                  to="/tickets" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  My Tickets
                </Link>
              )}
              {isAdminOrModerator && (
                <Link 
                  to="/all-tickets" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  All Tickets
                </Link>
              )}
              {isAdmin && (
                <Link 
                  to="/users" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Manage Users
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Welcome, {userInfo?.email} ({userInfo?.role})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
