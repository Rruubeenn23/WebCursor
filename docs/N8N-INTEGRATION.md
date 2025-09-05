# n8n Workflow Integration

This document outlines the n8n workflows used in the application and how they integrate with the system.

## Workflows

### 1. Chatbot - Food Analysis

**File**: `n8n-workflows/chatbot-analyze.json`

**Purpose**: Analyzes food entries from the chatbot interface and returns nutritional information.

**Input**:
```json
{
  "message": "I ate 200g of chicken",
  "userId": "user-123"
}
```

**Output**:
```json
{
  "success": true,
  "response": "He analizado tu comida. Pollo pechuga (200g) contiene aproximadamente 330 calorías, 62g de proteína, 0g de carbohidratos y 7.2g de grasas.",
  "macros": {
    "kcal": 330,
    "protein": 62,
    "carbs": 0,
    "fat": 7.2
  },
  "foodName": "Pollo pechuga",
  "qty": 200,
  "suggestedFood": {
    "name": "Pollo pechuga",
    "kcal": 165,
    "protein_g": 31,
    "carbs_g": 0,
    "fat_g": 3.6,
    "unit": "100g",
    "grams_per_unit": 100,
    "id": "suggested_1234567890"
  }
}
```

### 2. Generate Weekly Meal Plans

**File**: `n8n-workflows/generate-week.json`

**Purpose**: Automatically generates meal plans for the upcoming week.

**Trigger**: Weekly on Sunday at 8 PM

**API Endpoint**: `POST /api/plans/generate-weekly`

**Input**:
```json
{
  "userId": "user-123",
  "templateId": "template-456"
}
```

**Actions**:
1. Creates 7 day plans (Monday to Sunday)
2. Marks training days (Mon, Tue, Thu, Sat)
3. Generates meal items based on the template
4. Saves to the database

### 3. Meal Reminders

**File**: `n8n-workflows/meal-reminders.json`

**Purpose**: Sends reminders for upcoming meals.

**Trigger**: Every 15 minutes

**Actions**:
1. Fetches today's meal plan from `/api/plans/today`
2. Checks for meals due in the next 15 minutes
3. Sends Telegram notifications for upcoming meals
4. Updates meal status when marked as done

## Environment Variables

```env
# n8n Configuration
N8N_BASE_URL=http://localhost:5678  # URL of your n8n instance
N8N_API_KEY=your_n8n_api_key        # API key for n8n authentication

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your Next.js app URL
API_TOKEN=your_api_token_for_n8n
DEFAULT_TEMPLATE_ID=your_default_meal_template_id

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

## Setting Up n8n

1. Install n8n:
   ```bash
   npm install n8n -g
   ```

2. Start n8n:
   ```bash
   n8n start
   ```

3. Import the workflow files from the `n8n-workflows` directory

4. Set up the required environment variables in n8n

5. Activate the workflows

## API Endpoints

### Chatbot Analysis
- **Endpoint**: `POST /api/chatbot/analyze`
- **Input**: `{ "message": "I ate 200g of chicken" }`
- **Response**: See "Chatbot - Food Analysis" output above

### Generate Weekly Plan
- **Endpoint**: `POST /api/plans/generate-weekly`
- **Input**: `{ "templateId": "template-456" }`
- **Response**: `{ "success": true, "plans": [...] }`

### Get Today's Plan
- **Endpoint**: `GET /api/plans/today`
- **Response**: 
  ```json
  {
    "plan": { ... },
    "items": [
      {
        "id": "item-123",
        "food": { "name": "Chicken Breast", "unit": "g" },
        "qty_units": 200,
        "time": "13:00",
        "done": false
      }
    ],
    "goals": { ... }
  }
  ```

## Troubleshooting

1. **Webhook not working**:
   - Check if n8n is running and accessible
   - Verify the webhook URL is correct
   - Check the n8n logs for errors

2. **Authentication issues**:
   - Verify the API token is correct
   - Check the request headers for the Authorization token

3. **Database errors**:
   - Check the database connection string
   - Verify the database schema matches the expected structure

## Security Considerations

1. Always use HTTPS in production
2. Keep API keys and tokens secure
3. Implement rate limiting on API endpoints
4. Validate all inputs to prevent injection attacks
5. Use environment variables for sensitive information
