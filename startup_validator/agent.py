"""
AI Startup Validator Agent

This module defines the root_agent for the ADK CLI tool.
It validates startup ideas using 4 parallel analysis agents.
"""

from google.adk.agents import ParallelAgent, Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools import google_search
from google.genai import types

# Retry configuration
retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504]
)

# Market Research Agent
market_agent = Agent(
    name="MarketResearchAgent",
    model=Gemini(model="gemini-2.0-flash", retry_options=retry_config),
    tools=[google_search],
    instruction="""
    You are a market research expert. Analyze the startup idea provided.
    
    Provide insights on:
    - Market size and growth potential
    - Target audience and customer segments
    - Key competitors and competitive landscape
    - Market trends and opportunities
    
    Use Google Search to find current market data when helpful.
    Be specific with numbers and cite sources where possible.
    """,
    output_key="market_analysis"
)

# Risk Analysis Agent
risk_agent = Agent(
    name="RiskAnalysisAgent",
    model=Gemini(model="gemini-2.0-flash", retry_options=retry_config),
    instruction="""
    You are a risk analysis expert. Analyze the startup idea provided.
    
    Identify and evaluate:
    - Technical risks (feasibility, complexity)
    - Business risks (market adoption, competition)
    - Financial risks (funding, unit economics)
    - Regulatory or legal risks
    
    For each risk, provide: Risk level (Low/Medium/High), justification, and mitigation strategy.
    """,
    output_key="risk_analysis"
)

# Monetization Agent
monetization_agent = Agent(
    name="MonetizationAgent",
    model=Gemini(model="gemini-2.0-flash", retry_options=retry_config),
    instruction="""
    You are a business model expert. Analyze the startup idea provided.
    
    Design a monetization strategy including:
    - Recommended revenue model (SaaS, Subscription, Freemium, etc.)
    - Pricing strategy and tiers
    - Key revenue streams
    - Scalability potential
    - Path to profitability
    
    Provide specific pricing suggestions where applicable.
    """,
    output_key="monetization_strategy"
)

# Investor Lens Agent
investor_agent = Agent(
    name="InvestorLensAgent",
    model=Gemini(model="gemini-2.0-flash", retry_options=retry_config),
    instruction="""
    You are an experienced venture capital investor. Evaluate the startup idea provided.
    
    Provide an investor's perspective including:
    - Overall investment attractiveness (1-10 score)
    - Key strengths that would excite investors
    - Red flags or concerns
    - What metrics/traction investors would want to see
    - Recommended funding stage and amount
    
    Be honest and direct, as a real investor would be.
    """,
    output_key="investor_view"
)

# Root Agent - ParallelAgent that runs all sub-agents simultaneously
root_agent = ParallelAgent(
    name="StartupValidator",
    description="Validates startup ideas by running market, risk, monetization, and investor analysis in parallel.",
    sub_agents=[market_agent, risk_agent, monetization_agent, investor_agent]
)
