// src/utils/downloadUtils.js

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob data
 * @param {string} filename - The filename with extension
 */
export const downloadBlob = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Check if response is a valid blob
 */
export const isValidBlob = (data) => {
  return data && data.size > 0 && data.type && data.type.includes('application');
};

/**
 * Get current date string for filename
 */
export const getDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Handle export error response
 */
export const handleExportError = async (response) => {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.message || json.error || 'Export failed';
    } catch {
      return text || 'Export failed';
    }
  } catch {
    return 'Export failed';
  }
};