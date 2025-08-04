import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import useUserStore from '../store/useUserStore';
import { ticketAPI } from '../utils/api';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
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
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
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
    if (filter === 'all') return true;
    return ticket.status?.toLowerCase() === filter;
  });

  const getFilterStats = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status?.toLowerCase() === 'open').length,
      'in-progress': tickets.filter(t => t.status?.toLowerCase() === 'in-progress').length,
      closed: tickets.filter(t => t.status?.toLowerCase() === 'closed').length,
      resolved: tickets.filter(t => t.status?.toLowerCase() === 'resolved').length,
    };
  };

  const stats = getFilterStats();

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your tickets...</p>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
              <p className="text-gray-600">Manage and track your submitted tickets</p>
            </div>
            <Link
              to="/create-ticket"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Ticket
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: stats.all },
              { key: 'open', label: 'Open', count: stats.open },
              { key: 'in-progress', label: 'In Progress', count: stats['in-progress'] },
              { key: 'resolved', label: 'Resolved', count: stats.resolved },
              { key: 'closed', label: 'Closed', count: stats.closed },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {filter === 'all' ? 'No tickets found' : `No ${filter} tickets`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? "You haven't created any tickets yet."
                  : `You don't have any ${filter} tickets.`
                }
              </p>
              {filter === 'all' && (
                <Link
                  to="/create-ticket"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Create Your First Ticket
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="p-6 hover:bg-gray-50 transition duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        <Link 
                          to={`/ticket/${ticket._id}`}
                          className="hover:text-blue-600 transition duration-200"
                        >
                          {ticket.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      {ticket.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.deadline && (
                        <span>Deadline: {new Date(ticket.deadline).toLocaleDateString()}</span>
                      )}
                      {ticket.assignedTo && (
                        <span>Assigned to: <span className="text-blue-600">{ticket.assignedTo.email}</span></span>
                      )}
                    </div>
                    <Link
                      to={`/ticket/${ticket._id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {tickets.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.all}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.open}</div>
                <div className="text-sm text-gray-600">Open</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats['in-progress']}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                <div className="text-sm text-gray-600">Closed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tickets;
