import { useEffect, useState } from 'react';
import { getUser, logout, authFetch } from '../../service/AuthService';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch('/api/profile');
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to load profile');
        }
        const data = await res.json();
        setProfile(data.user); // Store only the user data, not the full response
      } catch (err) {
        console.error('Profile load error:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleCreateTrip() {
    navigate('/create-trip');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Trip-Planner</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span></span>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Welcome Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Plan Your Next Adventure?</h2>
              <p className="text-gray-600 mb-6">
                Create personalized travel itineraries with AI-powered recommendations. 
                Get hotel suggestions, daily plans, and everything you need for the perfect trip.
              </p>
              <button 
                onClick={handleCreateTrip}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Create New Trip
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Account Details</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading profile data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {(profile?.name || user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{profile?.name || user?.name || 'User'}</h4>
                      <p className="text-gray-600">{profile?.email || user?.email || 'No email'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Account Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {profile?.accountStatus || 'Active'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Member Since</span>
                      <span className="text-gray-900">
                        {profile?.memberSince 
                          ? new Date(profile.memberSince).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : new Date().toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">User ID</span>
                      <span className="text-gray-900 font-mono text-sm">
                        #{profile?.id || user?.id || 'N/A'}
                      </span>
                    </div>
                    
                    {profile?.lastLogin && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Last Login</span>
                        <span className="text-gray-900 text-sm">
                          {new Date(profile.lastLogin).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900">Quick Actions</h5>
                  <div className="space-y-3">
                    <button 
                      onClick={handleCreateTrip}
                      className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg border border-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">✈️</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Create New Trip</p>
                          <p className="text-sm text-gray-600">Plan your next adventure</p>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => navigate('/trip-plan')}
                      className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-lg border border-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">📋</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">View Trip Plans</p>
                          <p className="text-sm text-gray-600">See your saved trips</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}