from openai import AsyncOpenAI
from app.core.config import settings
import json
import logging

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

# Load the system prompt — checks DB for a custom prompt first, falls back to file
def load_system_prompt() -> str:
    try:
        from app.core.database import SessionLocal
        from app.api.prompt import get_active_prompt
        db = SessionLocal()
        try:
            return get_active_prompt(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to load system prompt from DB: {e}")
        try:
            with open("app/core/scaffolding_prompt.md", "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e2:
            logger.error(f"Failed to load system prompt from file: {e2}")
            return "You are an expert scaffolding contract reviewer."

async def analyze_chunk_with_llm(chunk_text: str, start_page: int = None, end_page: int = None, chunk_index: int = None, total_chunks: int = None, pages_estimated: bool = False):
    """
    Analyzes a specific chunk of the contract against the scaffolding rules.
    Expects JSON output mapping found risks and redlines.
    """
    system_prompt = load_system_prompt()

    # Build page context so the LLM knows exactly where it is in the document
    location_context = ""
    if start_page is not None and end_page is not None:
        if start_page == end_page:
            location_context = f"This chunk contains text from approximately PAGE {start_page}."
        else:
            location_context = f"This chunk contains text from approximately PAGE {start_page} through PAGE {end_page}."

        if pages_estimated:
            location_context += (
                " These page numbers are estimated from a DOCX file and may not match the original document's printed page numbers exactly. "
                "Use them as approximate references. If the text itself contains printed page numbers, headers, or footers with page references, prefer those."
            )
        else:
            location_context += " Use the page numbers from the '--- PAGE X ---' markers in the text below."
    else:
        location_context = (
            "This document does not have page markers. "
            "If the text itself contains printed page numbers, headers, or footers with page references, use those. "
            "Otherwise, use 'N/A' for the page field."
        )

    chunk_position = ""
    if chunk_index is not None and total_chunks is not None:
        chunk_position = f" (Chunk {chunk_index + 1} of {total_chunks})"

    prompt = f"""
    Analyze the following extracted contract text{chunk_position} using the exact JSON format and instructions specified in your system prompt.
    If no relevant issues are found in this chunk, return an empty array for the issues field.

    IMPORTANT PAGE/LOCATION INSTRUCTIONS:
    {location_context}

    For section numbers, quote the EXACT section number as printed in the contract text (e.g., "2.8", "4.1.2", "Article 7"). Do NOT invent section numbers that are not explicitly written in the text.

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
