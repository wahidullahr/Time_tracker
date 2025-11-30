import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';

const EditEntryModal = ({ entry, onSave, onClose }) => {
  const [description, setDescription] = useState(entry?.description || '');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (entry) {
      const totalSeconds = entry.seconds || 0;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      setHours(h);
      setMinutes(m);
      setDescription(entry.description || '');
    }
  }, [entry]);

  const handleSave = async () => {
    setError('');
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    
    if (totalSeconds <= 0) {
      setError('Time must be greater than 0');
      return;
    }

    setLoading(true);
    
    try {
      await onSave({
        ...entry,
        description: description.trim(),
        seconds: totalSeconds
      });
      onClose();
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Time Entry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
              {entry.companyName}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                Hours
              </label>
              <input
                type="number"
                id="hours"
                min="0"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-2">
                Minutes
              </label>
              <input
                type="number"
                id="minutes"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-target"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 touch-target"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEntryModal;
