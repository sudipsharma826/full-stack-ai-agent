import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import useUserStore from '../store/useUserStore';
import { userAPI } from '../utils/api';

const UpdateUser = () => {
  const [formData, setFormData] = useState({
    email: '',
    skills: [],
    role: 'user',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userInfo } = useUserStore();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      fetchUserData(emailParam);
    }
  }, [searchParams]);

  const fetchUserData = async (email) => {
    setFetchingUser(true);
    setError('');
    try {
      const response = await userAPI.getUserByEmail(email);
      const userData = response.data;
      setFormData({
        email: userData.email,
        skills: userData.skills || [],
        role: userData.role || 'user',
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch user data');
    } finally {
      setFetchingUser(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userAPI.updateUser(formData);
      setSuccess('User updated successfully!');
      
      // Redirect to users page after 2 seconds
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has admin access (only admins can update users)
  const hasAccess = userInfo?.role === 'admin';

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">Only administrators can update user data.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Update User</h1>
            <p className="text-gray-600">
              Modify user information, skills, and role permissions.
            </p>
          </div>

          {fetchingUser && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Loading user data...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                User Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={fetchingUser}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter user email"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={fetchingUser}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={fetchingUser}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={fetchingUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                >
                  Add
                </button>
              </div>
              
              {/* Display existing skills */}
              {formData.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Current Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          disabled={fetchingUser}
                          className="ml-2 text-blue-600 hover:text-blue-800 font-bold disabled:text-gray-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Skills help the AI system assign tickets to the most qualified person.
              </p>
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingUser || !formData.email}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Update User Tips</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Enter the user's email address to search and update their profile</li>
              <li>• Skills help AI assign tickets to the most qualified person</li>
              <li>• Role changes affect what users can see and do in the platform</li>
              <li>• Admin: Full access | Moderator: View assigned tickets | User: Own tickets only</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateUser;
