from openai import AsyncOpenAI
from app.core.config import settings
import json
import logging

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

# Load the system prompt we synthesized from the user's notes
def load_system_prompt() -> str:
    try:
        with open("app/core/scaffolding_prompt.md", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load system prompt: {e}")
        return "You are an expert scaffolding contract reviewer."

async def analyze_chunk_with_llm(chunk_text: str):
    """
    Analyzes a specific chunk of the contract against the scaffolding rules.
    Expects JSON output mapping found risks and redlines.
    """
    system_prompt = load_system_prompt()
    
    prompt = f"""
    Analyze the following extracted contract text using the exact JSON format and instructions specified in your system prompt.
    If no relevant issues are found in this chunk, return an empty array for the issues field.
    
    CONTRACT TEXT CHUNK:
    {chunk_text}
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        logger.error(f"LLM API Error: {e}")
        return {}

async def extract_financials(full_text: str):
    """
    Uses Gemini or OpenAI (here using OpenAI for simplicity in MVP) 
    to extract all money amounts and project values from the contract to compare with proposal.
    """
    prompt = f"""
    Extract all explicit financial values, subcontractor pricing, and contract sums from the following text.
    Return strictly as valid JSON:
    {{
        "financials": [
            {{"item": "Description (e.g. Total Contract Sum)", "amount": "$0.00"}}
        ]
    }}
    TEXT:
    {full_text[:8000]} # Only searching first 8k chars usually where totals are.
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        return json.loads(response.choices[0].message.content).get("financials", [])
    except Exception as e:
        logger.error(f"Financial Extraction Error: {e}")
        return []
