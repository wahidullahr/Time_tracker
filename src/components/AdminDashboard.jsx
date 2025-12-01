import React, { useState, useEffect } from 'react';
import { Users, Building2, FileText, LogOut, Plus, Edit2, Trash2, Shield, ShieldOff, Loader2, Download, Sparkles, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllUsers, getAllCompanies, getAllTimeEntries, 
  createUser, updateUser, deleteUser,
  createCompany, updateCompany, deleteCompany
} from '../services/supabase';
import { exportToCSV } from '../utils/csvExport';
import { generateExecutiveSummary } from '../services/gemini';
import { sendTimesheetToClient, generateTimesheetHTML } from '../services/emailService';
import ManageEmployeeModal from './ManageEmployeeModal';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Company management
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newClientReference, setNewClientReference] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  
  // AI Summary
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterTimeEntries();
  }, [timeEntries, selectedCompanyFilter]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, companiesData, entriesData] = await Promise.all([
        getAllUsers(),
        getAllCompanies(),
        getAllTimeEntries()
      ]);
      
      setUsers(usersData);
      setCompanies(companiesData);
      setTimeEntries(entriesData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const filterTimeEntries = () => {
    if (selectedCompanyFilter === 'all') {
      setFilteredEntries(timeEntries);
    } else {
      setFilteredEntries(timeEntries.filter(e => e.companyName === selectedCompanyFilter));
    }
  };

  // Employee Management
  const handleSaveEmployee = async (employeeData) => {
    try {
      if (employeeData.id) {
        await updateUser(employeeData.id, employeeData);
      } else {
        await createUser({ ...employeeData, role: 'employee' });
      }
      await loadAllData();
    } catch (err) {
      console.error('Error saving employee:', err);
      throw err;
    }
  };

  const handleToggleBlock = async (user) => {
    try {
      await updateUser(user.id, { isBlocked: !user.isBlocked });
      await loadAllData();
    } catch (err) {
      console.error('Error toggling block:', err);
      setError('Failed to update user status');
    }
  };

  const handleDeleteEmployee = async (userId) => {
    if (!confirm('Are you sure you want to delete this employee? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      await loadAllData();
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
    }
  };

  // Company Management
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      return;
    }
    
    setAddingCompany(true);
    try {
      await createCompany({ 
        name: newCompanyName.trim(),
        clientReference: newClientReference.trim() || null,
        clientEmail: newClientEmail.trim() || null
      });
      setNewCompanyName('');
      setNewClientReference('');
      setNewClientEmail('');
      await loadAllData();
    } catch (err) {
      console.error('Error adding company:', err);
      setError('Failed to add company');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('Are you sure you want to delete this company? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCompany(companyId);
      await loadAllData();
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('Failed to delete company');
    }
  };

  // Reports
  const handleExportCSV = () => {
    const filename = selectedCompanyFilter === 'all' 
      ? 'all_time_entries.csv' 
      : `${selectedCompanyFilter}_time_entries.csv`;
    exportToCSV(filteredEntries, filename);
  };

  const handleSendToClient = () => {
    if (selectedCompanyFilter === 'all') {
      setError('Please select a specific company to send timesheet');
      return;
    }

    const company = companies.find(c => c.name === selectedCompanyFilter);
    
    if (!company) {
      setError('Company not found');
      return;
    }

    if (!company.clientEmail) {
      setError('This company does not have a client email configured. Please add it in the Companies tab.');
      return;
    }

    try {
      const totalHours = calculateTotalHours(filteredEntries);
      
      // Generate HTML and open in new tab for preview/print
      const htmlContent = generateTimesheetHTML({
        clientEmail: company.clientEmail,
        clientReference: company.clientReference,
        companyName: company.name,
        timeEntries: filteredEntries,
        totalHours
      });
      
      const newWindow = window.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Also trigger mailto
      sendTimesheetToClient({
        clientEmail: company.clientEmail,
        clientReference: company.clientReference,
        companyName: company.name,
        timeEntries: filteredEntries,
        totalHours
      });
      
    } catch (err) {
      console.error('Error sending to client:', err);
      setError(err.message || 'Failed to send timesheet');
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setError('');
    setAiSummary('');
    
    try {
      const summary = await generateExecutiveSummary(filteredEntries);
      setAiSummary(summary);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate AI summary. Please check your API key.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const calculateTotalHours = (entries) => {
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.seconds || 0), 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your team and reports</p>
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto">
            {[
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'companies', label: 'Companies', icon: Building2 },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors touch-target whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setShowEmployeeModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors touch-target"
              >
                <Plus className="w-5 h-5" />
                <span>Add Employee</span>
              </button>
            </div>

            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No employees yet. Add your first employee!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Companies</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{user.title}</td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-600">{user.accessCode}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isBlocked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {user.assignedCompanyIds?.length || 0} assigned
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingEmployee(user);
                                setShowEmployeeModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.isBlocked
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title={user.isBlocked ? 'Unblock' : 'Block'}
                            >
                              {user.isBlocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Management</h2>

            {/* Add Company Form */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Company name *"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  disabled={addingCompany}
                />
                <input
                  type="text"
                  value={newClientReference}
                  onChange={(e) => setNewClientReference(e.target.value)}
                  placeholder="Client reference (optional)"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  disabled={addingCompany}
                />
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Client email (optional)"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  disabled={addingCompany}
                />
              </div>
              <button
                onClick={handleAddCompany}
                disabled={addingCompany || !newCompanyName.trim()}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                {addingCompany ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Add Company</span>
                  </>
                )}
              </button>
            </div>

            {/* Companies List */}
            {companies.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No companies yet. Add your first company!</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {companies.map(company => (
                  <div
                    key={company.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
                        {company.clientReference && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Ref:</span> {company.clientReference}
                          </p>
                        )}
                        {company.clientEmail && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {company.clientEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="mt-3 md:mt-0 md:ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end md:self-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Time Tracking Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-900">{calculateTotalHours(filteredEntries)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">Total Entries</p>
                  <p className="text-3xl font-bold text-green-900">{filteredEntries.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(filteredEntries.map(e => e.userId)).size}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div className="flex-1 w-full sm:w-auto">
                  <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Company
                  </label>
                  <select
                    id="companyFilter"
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  >
                    <option value="all">All Companies</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSendToClient}
                    disabled={filteredEntries.length === 0 || selectedCompanyFilter === 'all'}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                    title={selectedCompanyFilter === 'all' ? 'Select a specific company first' : 'Send timesheet to client'}
                  >
                    <Mail className="w-5 h-5" />
                    <span className="hidden sm:inline">Send to Client</span>
                    <span className="sm:hidden">Send</span>
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary || filteredEntries.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                  >
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span className="hidden sm:inline">AI Summary</span>
                        <span className="sm:hidden">AI</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredEntries.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </button>
                </div>
              </div>

              {/* AI Summary Display */}
              {aiSummary && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">AI Executive Summary</h3>
                  </div>
                  <div className="text-sm text-purple-800 whitespace-pre-wrap">{aiSummary}</div>
                </div>
              )}

              {/* Time Entries Table */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Time Entries</h3>
                {filteredEntries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No time entries found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredEntries.map(entry => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{entry.date}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{entry.userName}</div>
                              <div className="text-xs text-gray-500">{entry.userTitle}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{entry.companyName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">{entry.description}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                              {formatDuration(entry.seconds || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <ManageEmployeeModal
          employee={editingEmployee}
          companies={companies}
          onSave={handleSaveEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
