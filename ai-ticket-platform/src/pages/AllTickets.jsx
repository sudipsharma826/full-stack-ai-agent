import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import useUserStore from '../store/useUserStore';
import { ticketAPI } from '../utils/api';

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { userInfo } = useUserStore();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getAllTickets();
      setTickets(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status?.toLowerCase() === filter;
    const matchesSearch = searchTerm === '' || 
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.createdBy?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.assignedTo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getFilterStats = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status?.toLowerCase() === 'open').length,
      'in-progress': tickets.filter(t => t.status?.toLowerCase() === 'in-progress').length,
      closed: tickets.filter(t => t.status?.toLowerCase() === 'closed').length,
      unassigned: tickets.filter(t => !t.assignedTo).length,
    };
  };

  const stats = getFilterStats();

  // Check if user has admin/moderator access
  const hasAccess = userInfo?.role === 'admin' || userInfo?.role === 'moderator';

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You don't have permission to view all tickets.</p>
              <Link
                to="/tickets"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Your Tickets
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading all tickets...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🎫 All Support Tickets</h1>
              <p className="text-blue-100">Manage and track all customer support requests</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/users"
                className="bg-white text-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 transition duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </Link>
              <Link
                to="/create-ticket"
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Ticket
              </Link>
            </div>
          </div>

          {/* Search Bar with Enhanced Styling */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="🔍 Search tickets by title, description, creator, or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs with Enhanced Styling */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Tickets', count: stats.all, icon: '📋' },
              { key: 'open', label: 'Open', count: stats.open, icon: '🟢' },
              { key: 'in-progress', label: 'In Progress', count: stats['in-progress'], icon: '🟡' },
              { key: 'closed', label: 'Closed', count: stats.closed, icon: '🔴' },
            ].map(({ key, label, count, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition duration-200 flex items-center space-x-2 transform hover:scale-105 ${
                  filter === key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  filter === key ? 'bg-white bg-opacity-20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl font-bold mb-2">{stats.all}</div>
            <div className="text-blue-100">📋 Total Tickets</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl font-bold mb-2">{stats.open}</div>
            <div className="text-green-100">🟢 Open</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl font-bold mb-2">{stats['in-progress']}</div>
            <div className="text-yellow-100">🟡 In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-6 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl font-bold mb-2">{stats.closed}</div>
            <div className="text-gray-100">🔴 Closed</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl font-bold mb-2">{stats.unassigned}</div>
            <div className="text-red-100">⚠️ Unassigned</div>
          </div>
        </div>

        {/* Enhanced Tickets List */}
        <div className="bg-white rounded-lg shadow-lg">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {searchTerm ? '🔍 No matching tickets found' : '📋 No tickets found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search to see all tickets.'
                  : 'No tickets have been created yet.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 transform hover:scale-105"
                >
                  🔄 Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-6">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-gray-200 overflow-hidden transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-800">
                            <Link 
                              to={`/ticket/${ticket._id}`}
                              className="hover:text-blue-600 transition duration-200 flex items-center"
                            >
                              🎫 {ticket.title}
                            </Link>
                          </h3>
                          {!ticket.assignedTo && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                              ⚠️ UNASSIGNED
                            </span>
                            )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(ticket.status)} shadow-sm`}>
                          {ticket.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        {ticket.priority && (
                          <span className={`px-4 py-2 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)} shadow-sm`}>
                            {ticket.priority?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          👤 <span className="text-blue-600 font-medium ml-1">{ticket.createdBy?.email || 'Unknown'}</span>
                        </span>
                        <span className="flex items-center">
                          📅 <span className="ml-1">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </span>
                        {ticket.assignedTo && (
                          <span className="flex items-center">
                            👨‍💼 <span className="text-green-600 font-medium ml-1">{ticket.assignedTo.email}</span>
                          </span>
                        )}
                        {/* Only show deadline for admin and moderator roles */}
                        {ticket.deadline && (userInfo?.role === 'admin' || userInfo?.role === 'moderator') && (
                          <span className="flex items-center">
                            ⏰ <span className="text-orange-600 font-medium ml-1">{new Date(ticket.deadline).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/ticket/${ticket._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition duration-200"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Results Info */}
        {filteredTickets.length > 0 && (
          <div className="mt-6 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 inline-block">
              <p className="text-gray-700 font-medium">
                📊 Showing <span className="text-blue-600 font-bold">{filteredTickets.length}</span> of <span className="text-purple-600 font-bold">{tickets.length}</span> tickets
                {searchTerm && <span className="text-gray-500"> for "<span className="text-orange-600 font-semibold">{searchTerm}</span>"</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllTickets;
