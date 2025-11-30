/**
 * Convert time entries to CSV format and trigger download
 * @param {Array} timeEntries - Array of time entry objects
 * @param {string} filename - Optional filename for the CSV
 */
export const exportToCSV = (timeEntries, filename = 'time_entries.csv') => {
  if (!timeEntries || timeEntries.length === 0) {
    alert('No data to export');
    return;
  }

  // CSV Headers
  const headers = [
    'Date',
    'Employee Name',
    'Job Title',
    'Company',
    'Description',
    'Hours',
    'Minutes',
    'Total Hours (Decimal)'
  ];

  // Convert entries to CSV rows
  const rows = timeEntries.map(entry => {
    const totalSeconds = entry.seconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const decimalHours = (totalSeconds / 3600).toFixed(2);

    return [
      entry.date || '',
      entry.userName || '',
      entry.userTitle || '',
      entry.companyName || '',
      entry.description ? `"${entry.description.replace(/"/g, '""')}"` : '', // Escape quotes
      hours,
      minutes,
      decimalHours
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Format time entries data for export with additional statistics
 * @param {Array} timeEntries - Array of time entry objects
 * @returns {Object} - Formatted data with statistics
 */
export const prepareExportData = (timeEntries) => {
  const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.seconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(2);

  const companySummary = {};
  const userSummary = {};

  timeEntries.forEach(entry => {
    const company = entry.companyName || 'Unknown';
    const user = entry.userName || 'Unknown';
    const seconds = entry.seconds || 0;

    companySummary[company] = (companySummary[company] || 0) + seconds;
    userSummary[user] = (userSummary[user] || 0) + seconds;
  });

  return {
    entries: timeEntries,
    totalHours,
    totalEntries: timeEntries.length,
    companySummary,
    userSummary
  };
};

export default {
  exportToCSV,
  prepareExportData
};
