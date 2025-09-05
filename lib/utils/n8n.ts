import n8nConfig from '@/lib/config/n8n';

export interface N8NWebhookResponse {
  success: boolean;
  [key: string]: any;
}

export async function callN8NWebhook<T = any>(
  workflow: keyof typeof n8nConfig.webhooks,
  data: Record<string, any>,
  options: RequestInit = {}
): Promise<T> {
  const webhookUrl = n8nConfig.getWebhookUrl(workflow);
  
  // Start with base headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  // Add n8n headers
  const n8nHeaders = n8nConfig.getHeaders();
  Object.entries(n8nHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  const defaultOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }),
  };

  try {
    const response = await fetch(webhookUrl, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling n8n webhook ${workflow}:`, error);
    throw error;
  }
}
