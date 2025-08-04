import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useUserStore from '../store/useUserStore';
import { ticketAPI } from '../utils/api';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { userInfo } = useUserStore();

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await ticketAPI.getTicketById(id);
      setTicket(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    
    setActionLoading(true);
    try {
      await ticketAPI.updateTicketStatus(id, 'closed');
      await fetchTicket(); // Refresh ticket data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to close ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      await ticketAPI.deleteTicket(id);
      navigate('/tickets'); // Redirect to tickets list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete ticket');
      setActionLoading(false);
    }
  };

  const canCloseTicket = () => {
    if (userInfo?.role === 'admin') return true;
    if (userInfo?.role === 'moderator' && ticket?.assignedTo?._id === userInfo._id) return true;
    return false;
  };

  const canDeleteTicket = () => {
    if (userInfo?.role === 'admin') return true;
    if (userInfo?.role === 'moderator' && (ticket?.assignedTo?._id === userInfo._id || ticket?.createdBy === userInfo._id)) return true;
    if (userInfo?.role === 'user' && ticket?.createdBy === userInfo._id) return true;
    return false;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'resolved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading ticket details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Ticket</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link
                to="/tickets"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Back to Tickets
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link
                to="/tickets"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Back to Tickets
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{ticket.title}</h1>
              <p className="text-gray-600">Ticket ID: {ticket._id}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                {ticket.status?.toUpperCase() || 'UNKNOWN'}
              </span>
              {ticket.priority && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority?.toUpperCase()} PRIORITY
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ticket Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                {ticket.updatedAt && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</span>
                  </div>
                )}
                {ticket.deadline && (userInfo?.role === 'admin' || userInfo?.role === 'moderator') && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium text-red-600">{new Date(ticket.deadline).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                {ticket.priority && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">People Involved</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Created By:</span>
                  <div className="font-medium text-right">
                    <div>{ticket.createdBy?.email || userInfo?.email}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Assigned To:</span>
                  <div className="font-medium text-right">
                    {ticket.assignedTo ? (
                      <span className="text-blue-600">{ticket.assignedTo.email}</span>
                    ) : (
                      <span className="text-yellow-600">Pending Assignment</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

       

         
        </div>

        {/* AI Processing Status */}
        {ticket.status === 'in-progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">🤖 AI Processing</h3>
                <p className="text-blue-700">
                  Our AI is analyzing your ticket and finding the best match for assignment. This usually takes a few minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Results - Only visible to Moderators and Admins */}
        {ticket.summary && (userInfo?.role === 'admin' || userInfo?.role === 'moderator') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Analysis</h2>
            
            {ticket.summary && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-700">{ticket.summary}</p>
                </div>
              </div>
            )}

            {ticket.helpfulNotes && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Helpful Notes</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-gray-700">{ticket.helpfulNotes}</p>
                </div>
              </div>
            )}

            {ticket.relatedSkills && ticket.relatedSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Related Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.relatedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to={userInfo?.role === 'admin' ? "/all-tickets" : "/tickets"}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition duration-200"
            >
              ← Back to Tickets
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              disabled={actionLoading}
            >
              🔄 Refresh
            </button>
            
            {canCloseTicket() && ticket?.status !== 'closed' && (
              <button
                onClick={handleCloseTicket}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : '✅ Close Ticket'}
              </button>
            )}
            
            {canDeleteTicket() && (
              <button
                onClick={handleDeleteTicket}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : '🗑️ Delete Ticket'}
              </button>
            )}
            
            {(userInfo?.role === 'admin' || userInfo?.role === 'moderator') && (
              <Link
                to="/all-tickets"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
              >
                View All Tickets
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetails;
