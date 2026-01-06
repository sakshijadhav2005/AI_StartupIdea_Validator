# AI Startup Validator

AI-powered startup idea validation using Google Gemini and ADK multi-agent system.

## Features

- **Market Analysis** - Deep dive into market size, competition, and growth potential
- **Risk Assessment** - Identify technical, business, and regulatory risks
- **Monetization Strategy** - Revenue models, pricing strategies, and path to profit
- **Investor Perspective** - See your idea through a VC's eyes

## Tech Stack

- **Backend**: FastAPI + Google ADK + Gemini AI
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Render.com

## Local Development

1. Clone the repository
2. Create virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Linux/Mac
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file with your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
5. Run the server:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000
   ```
6. Open http://localhost:8000

## Deployment

This project is configured for Render.com deployment. See `render.yaml` for configuration.

## Environment Variables

- `GOOGLE_API_KEY` - Your Google AI API key (required)
- `PORT` - Server port (default: 8000)
