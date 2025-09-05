// n8n configuration
export const n8nConfig = {
  // Base URL for n8n instance (update this to your n8n instance URL)
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  
  // API token for authenticating with n8n
  apiToken: process.env.N8N_API_TOKEN || 'your-n8n-api-token',
  
  // Webhook paths for different workflows
  webhooks: {
    chatbotAnalyze: '/webhook/chatbot-analyze',
    generateWeek: '/webhook/generate-week',
    mealReminders: '/webhook/meal-reminders'
  },
  
  // Get full webhook URL for a specific workflow
  getWebhookUrl: function(workflow: keyof typeof this.webhooks) {
    return `${this.baseUrl}${this.webhooks[workflow]}`;
  },
  
  // Headers for n8n API requests
  getHeaders: function() {
    return {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': this.apiToken
    };
  }
};

export default n8nConfig;
