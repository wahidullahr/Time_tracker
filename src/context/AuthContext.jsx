import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('timeos_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('timeos_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    try {
      setCurrentUser(userData);
      localStorage.setItem('timeos_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('timeos_user');
    localStorage.removeItem('timeos_timer');
  };

  const updateUser = (userData) => {
    try {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      localStorage.setItem('timeos_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user in localStorage:', error);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    updateUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
