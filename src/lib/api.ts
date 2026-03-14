import axios from 'axios';

export const createApiClient = (baseURL: string, apiKey: string) => {
  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};

export const testConnection = async (baseURL: string, apiKey: string) => {
  try {
    const client = createApiClient(baseURL, apiKey);
    // Try to hit a generic endpoint to test auth, e.g., /profile or /status
    // If we don't know the exact endpoint, we can try a GET request to the base URL or a known endpoint.
    // Let's assume there is a /status or /profile endpoint.
    const response = await client.get('/status').catch(() => client.get('/profile')).catch(() => client.get('/'));
    return { success: true, data: response.data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Connection failed' 
    };
  }
};

export const sendMessage = async (baseURL: string, apiKey: string, to: string, message: string) => {
  try {
    const client = createApiClient(baseURL, apiKey);
    // Assuming endpoint is /send-message or /message/send
    const response = await client.post('/send-message', {
      phone: to,
      message: message,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send message' 
    };
  }
};
