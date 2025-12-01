/**
 * Email Service using EmailJS or similar service
 * For production, consider using: SendGrid, Mailgun, or AWS SES
 */

/**
 * Send timesheet to client via email
 * @param {Object} params - Email parameters
 * @param {string} params.clientEmail - Client's email address
 * @param {string} params.clientReference - Client reference number
 * @param {string} params.companyName - Company name
 * @param {Array} params.timeEntries - Array of time entries
 * @param {string} params.totalHours - Total hours worked
 * @returns {Promise<boolean>} - Success status
 */
export const sendTimesheetToClient = async ({ 
  clientEmail, 
  clientReference, 
  companyName, 
  timeEntries,
  totalHours 
}) => {
  if (!clientEmail) {
    throw new Error('Client email is required');
  }

  // Format time entries as HTML table
  const tableRows = timeEntries.map(entry => {
    const hours = Math.floor(entry.seconds / 3600);
    const minutes = Math.floor((entry.seconds % 3600) / 60);
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.userName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${hours}h ${minutes}m</td>
      </tr>
    `;
  }).join('');

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">TimeOS - Work Hours Report</h1>
      <p style="margin: 0; opacity: 0.9;">Client: ${companyName}</p>
      ${clientReference ? `<p style="margin: 5px 0 0 0; opacity: 0.9;">Reference: ${clientReference}</p>` : ''}
    </div>

    <div class="summary">
      <h2 style="margin: 0 0 10px 0; color: #1f2937;">Summary</h2>
      <p style="margin: 0;"><strong>Total Hours:</strong> ${totalHours} hours</p>
      <p style="margin: 5px 0 0 0;"><strong>Number of Entries:</strong> ${timeEntries.length}</p>
      <p style="margin: 5px 0 0 0;"><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <h2 style="color: #1f2937;">Detailed Time Entries</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Employee</th>
          <th>Description</th>
          <th style="text-align: right;">Duration</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <p>This is an automated report from TimeOS.</p>
      <p style="margin-top: 5px;">If you have any questions, please contact your account manager.</p>
    </div>
  </div>
</body>
</html>
  `;

  // Create mailto link (temporary solution for demo)
  // For production, integrate with email service like SendGrid
  const subject = `Work Hours Report - ${companyName} - ${new Date().toLocaleDateString()}`;
  const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Please see attached timesheet report.')}`;
  
  // Open mailto link
  window.open(mailtoLink, '_blank');
  
  // For production, use actual email service:
  // const response = await fetch('https://api.emailservice.com/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: clientEmail,
  //     subject,
  //     html: emailBody
  //   })
  // });

  return true;
};

/**
 * Generate PDF-like HTML content for download
 * @param {Object} params - Same as sendTimesheetToClient
 * @returns {string} - HTML content
 */
export const generateTimesheetHTML = ({ 
  clientEmail, 
  clientReference, 
  companyName, 
  timeEntries,
  totalHours 
}) => {
  const tableRows = timeEntries.map(entry => {
    const hours = Math.floor(entry.seconds / 3600);
    const minutes = Math.floor((entry.seconds % 3600) / 60);
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.userName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${hours}h ${minutes}m</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Timesheet - ${companyName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; }
    @media print { 
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
  </div>
  
  <div class="header">
    <h1 style="margin: 0 0 10px 0;">TimeOS - Work Hours Report</h1>
    <p style="margin: 0; opacity: 0.9;">Client: ${companyName}</p>
    ${clientReference ? `<p style="margin: 5px 0 0 0; opacity: 0.9;">Reference: ${clientReference}</p>` : ''}
  </div>

  <div class="summary">
    <h2 style="margin: 0 0 10px 0; color: #1f2937;">Summary</h2>
    <p style="margin: 0;"><strong>Total Hours:</strong> ${totalHours} hours</p>
    <p style="margin: 5px 0 0 0;"><strong>Number of Entries:</strong> ${timeEntries.length}</p>
    <p style="margin: 5px 0 0 0;"><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <h2 style="color: #1f2937;">Detailed Time Entries</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Employee</th>
        <th>Description</th>
        <th style="text-align: right;">Duration</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <p>This is an automated report from TimeOS.</p>
    <p style="margin-top: 5px;">If you have any questions, please contact your account manager.</p>
  </div>
</body>
</html>
  `;
};

export default {
  sendTimesheetToClient,
  generateTimesheetHTML
};
