import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, LogOut, Sparkles, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllCompanies, createTimeEntry, getTimeEntriesByUser, updateTimeEntry, deleteTimeEntry } from '../services/firebase';
import { enhanceDescription } from '../services/gemini';
import EditEntryModal from './EditEntryModal';

const EmployeeTracker = () => {
  const { currentUser, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [description, setDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedSecondsRef = useRef(0);

  // Load companies and time entries
  useEffect(() => {
    loadData();
  }, []);

  // Self-healing timer - restore from localStorage
  useEffect(() => {
    restoreTimerState();
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const runningTime = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedSeconds(accumulatedSecondsRef.current + runningTime);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Persist timer state to localStorage
  useEffect(() => {
    if (isRunning) {
      const timerState = {
        status: 'running',
        startTime: startTimeRef.current,
        accumulatedSeconds: accumulatedSecondsRef.current,
        selectedCompanyId,
        description,
        savedAt: Date.now()
      };
      localStorage.setItem('timeos_timer', JSON.stringify(timerState));
    }
  }, [isRunning, selectedCompanyId, description]);

  const restoreTimerState = () => {
    try {
      const savedTimer = localStorage.getItem('timeos_timer');
      if (savedTimer) {
        const timerState = JSON.parse(savedTimer);
        
        if (timerState.status === 'running') {
          const now = Date.now();
          const elapsedSinceLastSave = Math.floor((now - timerState.savedAt) / 1000);
          
          startTimeRef.current = now - (elapsedSinceLastSave * 1000);
          accumulatedSecondsRef.current = timerState.accumulatedSeconds + elapsedSinceLastSave;
          
          setSelectedCompanyId(timerState.selectedCompanyId || '');
          setDescription(timerState.description || '');
          setIsRunning(true);
          setElapsedSeconds(accumulatedSecondsRef.current);
        }
      }
    } catch (error) {
      console.error('Error restoring timer:', error);
      localStorage.removeItem('timeos_timer');
    }
  };

  const loadData = async () => {
    try {
      const [companiesData, entriesData] = await Promise.all([
        getAllCompanies(),
        getTimeEntriesByUser(currentUser.id)
      ]);
      
      // Filter companies based on user's assigned companies
      const userCompanies = currentUser.role === 'admin' 
        ? companiesData 
        : companiesData.filter(c => currentUser.assignedCompanyIds?.includes(c.id));
      
      setCompanies(userCompanies);
      setTimeEntries(entriesData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    }
  };

  const handleStart = () => {
    if (!selectedCompanyId) {
      setError('Please select a company');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setError('');
    startTimeRef.current = Date.now();
    accumulatedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const handleStop = async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    
    const finalSeconds = elapsedSeconds || 0;
    
    if (finalSeconds < 1) {
      setError('Timer ran for less than 1 second');
      resetTimer();
      return;
    }

    setLoading(true);
    
    try {
      // Self-healing: lookup company name if missing
      let companyName = companies.find(c => c.id === selectedCompanyId)?.name || '';
      
      if (!companyName) {
        const allCompanies = await getAllCompanies();
        companyName = allCompanies.find(c => c.id === selectedCompanyId)?.name || 'Unknown Company';
      }

      const entry = {
        userId: currentUser.id,
        userName: currentUser.name || '',
        userTitle: currentUser.title || '',
        companyName,
        description: description.trim(),
        seconds: finalSeconds,
        date: new Date().toISOString().split('T')[0]
      };

      await createTimeEntry(entry);
      await loadData();
      resetTimer();
      setError('');
    } catch (err) {
      console.error('Error saving time entry:', err);
      setError('Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  const resetTimer = () => {
    setSelectedCompanyId('');
    setDescription('');
    setElapsedSeconds(0);
    setIsRunning(false);
    accumulatedSecondsRef.current = 0;
    startTimeRef.current = null;
    localStorage.removeItem('timeos_timer');
  };

  const handleEnhanceDescription = async () => {
    if (!description.trim()) {
      setError('Please enter a description first');
      return;
    }

    setEnhancing(true);
    setError('');

    try {
      const enhanced = await enhanceDescription(description);
      setDescription(enhanced);
    } catch (err) {
      console.error('Error enhancing description:', err);
      setError(err.message || 'Failed to enhance description. Please check your API key.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleEditEntry = async (updatedEntry) => {
    try {
      await updateTimeEntry(updatedEntry.id, {
        description: updatedEntry.description,
        seconds: updatedEntry.seconds
      });
      await loadData();
    } catch (err) {
      console.error('Error updating entry:', err);
      throw err;
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await deleteTimeEntry(entryId);
      await loadData();
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome, {currentUser.name}
              </h1>
              <p className="text-sm text-gray-600">{currentUser.title}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-target"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Timer Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Time Tracker</h2>
              <p className="text-sm text-gray-600">Track your work time</p>
            </div>
          </div>

          {/* Timer Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6 text-center">
            <div className="text-6xl font-bold font-mono text-gray-900 mb-2">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-sm text-gray-600">
              {isRunning ? 'Timer Running' : 'Timer Stopped'}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Select Company *
              </label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={isRunning || loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed touch-target"
              >
                <option value="">Choose a company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <div className="flex gap-2">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  rows={3}
                  disabled={isRunning || loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleEnhanceDescription}
                  disabled={isRunning || loading || enhancing || !description.trim()}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                  title="Enhance with AI"
                >
                  {enhancing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Timer</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5" />
                      <span>Stop & Save</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Time Entries History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Time Entries</h3>
          
          {timeEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No time entries yet. Start tracking your work!</p>
          ) : (
            <div className="space-y-3">
              {timeEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{entry.companyName}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{entry.date}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{entry.description}</p>
                    <div className="text-sm font-medium text-blue-600">
                      {formatDuration(entry.seconds || 0)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={handleEditEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
};

export default EmployeeTracker;
