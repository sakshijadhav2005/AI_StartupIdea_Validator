"""
AI Startup Validator - FastAPI Backend
Connects the beautiful web UI to Google ADK agents
"""

# Load environment variables FIRST before any other imports
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from google.adk.runners import InMemoryRunner
from google.genai import types
import uuid
import os
from pathlib import Path

# Import the agent AFTER loading env vars
from startup_validator.agent import root_agent

# Create FastAPI app
app = FastAPI(
    title="AI Startup Validator",
    description="Validate your startup idea with AI-powered multi-agent analysis",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class StartupIdea(BaseModel):
    idea: str

class ValidationResponse(BaseModel):
    status: str
    results: dict = None
    validation_report: str = None
    message: str = None


# Serve static files (web UI)
web_dir = Path(__file__).parent / "web"
if web_dir.exists():
    app.mount("/static", StaticFiles(directory=str(web_dir)), name="static")


@app.get("/")
async def serve_frontend():
    """Serve the main HTML page"""
    index_path = web_dir / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Welcome to AI Startup Validator API", "docs": "/docs"}


@app.get("/styles.css")
async def serve_css():
    """Serve the CSS file"""
    css_path = web_dir / "styles.css"
    if css_path.exists():
        return FileResponse(str(css_path), media_type="text/css")
    return {"error": "CSS file not found"}


@app.get("/app.js")
async def serve_js():
    """Serve the JavaScript file"""
    js_path = web_dir / "app.js"
    if js_path.exists():
        return FileResponse(str(js_path), media_type="application/javascript")
    return {"error": "JS file not found"}


@app.post("/validate", response_model=ValidationResponse)
async def validate_startup(request: StartupIdea):
    """
    Validate a startup idea through multiple AI agents running in parallel:
    - Market Research Agent
    - Risk Analysis Agent
    - Monetization Agent
    - Investor Lens Agent
    """
    try:
        # Create runner with proper app_name
        app_name = "startup_validator"
        runner = InMemoryRunner(agent=root_agent, app_name=app_name)
        user_id = "web_user"
        session_id = str(uuid.uuid4())
        
        # Create session with matching app_name
        session = await runner.session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id,
        )
        
        # Create user message
        user_message = types.Content(
            role="user",
            parts=[types.Part.from_text(text=request.idea)]
        )
        
        # Collect results from all agents
        results = {
            "market_analysis": "",
            "risk_analysis": "",
            "monetization_strategy": "",
            "investor_view": ""
        }
        
        combined_report = ""
        
        # Run the agent
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            # Extract content from events
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            text = part.text
                            combined_report += text + "\n\n"
                            
                            # Try to categorize by agent name in event
                            if hasattr(event, 'author'):
                                author = event.author.lower()
                                if 'market' in author:
                                    results["market_analysis"] += text
                                elif 'risk' in author:
                                    results["risk_analysis"] += text
                                elif 'monetization' in author:
                                    results["monetization_strategy"] += text
                                elif 'investor' in author:
                                    results["investor_view"] += text
        
        # If we couldn't separate results, split the combined report
        if not any(results.values()):
            # Try to intelligently split the combined report
            sections = split_report_by_content(combined_report)
            results = sections if sections else {"market_analysis": combined_report}
        
        return ValidationResponse(
            status="success",
            results=results,
            validation_report=combined_report
        )
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
        return ValidationResponse(
            status="error",
            message=str(e)
        )


def split_report_by_content(report: str) -> dict:
    """Try to split a combined report into sections based on content keywords"""
    results = {
        "market_analysis": "",
        "risk_analysis": "",
        "monetization_strategy": "",
        "investor_view": ""
    }
    
    # Simple heuristic - split by common section headers
    lines = report.split('\n')
    current_section = "market_analysis"
    
    for line in lines:
        lower_line = line.lower()
        
        if any(word in lower_line for word in ['market', 'competitor', 'industry', 'target audience']):
            current_section = "market_analysis"
        elif any(word in lower_line for word in ['risk', 'challenge', 'threat', 'concern']):
            current_section = "risk_analysis"
        elif any(word in lower_line for word in ['revenue', 'pricing', 'monetiz', 'business model']):
            current_section = "monetization_strategy"
        elif any(word in lower_line for word in ['investor', 'funding', 'investment', 'valuation']):
            current_section = "investor_view"
        
        results[current_section] += line + "\n"
    
    return results


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI Startup Validator"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
