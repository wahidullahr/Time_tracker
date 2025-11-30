import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus } from 'lucide-react';

const ManageEmployeeModal = ({ employee, companies, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [assignedCompanyIds, setAssignedCompanyIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setTitle(employee.title || '');
      setAccessCode(employee.accessCode || '');
      setAssignedCompanyIds(employee.assignedCompanyIds || []);
    } else {
      // Generate random 6-digit access code for new employee
      setAccessCode(Math.floor(100000 + Math.random() * 900000).toString());
    }
  }, [employee]);

  const handleCompanyToggle = (companyId) => {
    setAssignedCompanyIds(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const handleSave = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!accessCode.trim() || accessCode.length !== 6) {
      setError('Access code must be 6 digits');
      return;
    }

    setLoading(true);
    
    try {
      await onSave({
        ...employee,
        name: name.trim(),
        title: title.trim(),
        accessCode: accessCode.trim(),
        assignedCompanyIds
      });
      onClose();
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Consultant"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code *
            </label>
            <input
              type="text"
              id="accessCode"
              value={accessCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setAccessCode(value);
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg tracking-wider touch-target"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Employee will use this 6-digit code to login
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assigned Companies
            </label>
            {companies.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No companies available. Create companies first.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {companies.map((company) => (
                  <label
                    key={company.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedCompanyIds.includes(company.id)}
                      onChange={() => handleCompanyToggle(company.id)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">{company.name}</span>
                  </label>
                ))}
              </div>
            )}
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
                {employee ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{employee ? 'Save Changes' : 'Create Employee'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageEmployeeModal;
