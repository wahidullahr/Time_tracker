const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Call Google Gemini API to enhance text
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The enhanced text
 */
export const callGeminiAPI = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from AI');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    return generatedText.trim();
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

/**
 * Enhance a task description using AI
 * @param {string} roughDescription - The rough description to enhance
 * @returns {Promise<string>} - The enhanced professional description
 */
export const enhanceDescription = async (roughDescription) => {
  const prompt = `You are a professional business writing assistant. Transform this rough work note into a clear, professional task description. Keep it concise (1-2 sentences) and use professional language.

Rough note: "${roughDescription}"

Professional description:`;

  return await callGeminiAPI(prompt);
};

/**
 * Generate an executive summary from time entries
 * @param {Array} timeEntries - Array of time entry objects
 * @returns {Promise<string>} - The executive summary
 */
export const generateExecutiveSummary = async (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) {
    return 'No time entries available to analyze.';
  }

  // Prepare data summary
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.seconds || 0), 0) / 3600;
  const companiesData = {};
  const usersData = {};

  timeEntries.forEach(entry => {
    const companyName = entry.companyName || 'Unknown';
    const userName = entry.userName || 'Unknown';
    const hours = (entry.seconds || 0) / 3600;

    if (!companiesData[companyName]) {
      companiesData[companyName] = 0;
    }
    companiesData[companyName] += hours;

    if (!usersData[userName]) {
      usersData[userName] = 0;
    }
    usersData[userName] += hours;
  });

  const prompt = `You are a management consultant. Analyze these time tracking statistics and provide a concise executive summary (2-3 paragraphs) covering resource allocation, efficiency insights, and key recommendations.

Statistics:
- Total Hours Tracked: ${totalHours.toFixed(1)} hours
- Number of Entries: ${timeEntries.length}
- Companies: ${JSON.stringify(companiesData, null, 2)}
- Team Members: ${JSON.stringify(usersData, null, 2)}

Recent Tasks Sample:
${timeEntries.slice(0, 10).map(e => `- ${e.userName}: ${e.description} (${((e.seconds || 0) / 3600).toFixed(1)}h) for ${e.companyName}`).join('\n')}

Executive Summary:`;

  return await callGeminiAPI(prompt);
};

export default {
  enhanceDescription,
  generateExecutiveSummary,
  callGeminiAPI
};
