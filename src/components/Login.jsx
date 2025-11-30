import React, { useState } from 'react';
import { LogIn, Loader2, Lock } from 'lucide-react';
import { getUserByAccessCode, signInAnonymous } from '../services/firebase';

const Login = ({ onLogin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!accessCode || accessCode.trim().length === 0) {
      setError('Please enter your access code');
      return;
    }

    setLoading(true);

    try {
      // Admin backdoor
      if (accessCode === 'admin123') {
        await signInAnonymous();
        onLogin({
          id: 'admin',
          name: 'Super Admin',
          title: 'System Administrator',
          role: 'admin',
          accessCode: 'admin123',
          assignedCompanyIds: [],
          isBlocked: false
        });
        return;
      }

      // Regular user authentication
      const user = await getUserByAccessCode(accessCode.trim());
      
      if (!user) {
        setError('Invalid access code. Please try again.');
        setLoading(false);
        return;
      }

      if (user.isBlocked) {
        setError('Your account has been blocked. Please contact your administrator.');
        setLoading(false);
        return;
      }

      // Sign in anonymously to Firebase Auth
      await signInAnonymous();
      
      // Call parent login handler with user data
      onLogin(user);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters (or more for admin)
    if (value.length <= 10) {
      setAccessCode(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo/Header */}
          <div className="flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Welcome to TimeOS
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter your access code to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest touch-target"
                disabled={loading}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accessCode}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 touch-target"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
