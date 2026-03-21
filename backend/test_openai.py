import asyncio
from app.services.llm_pipeline import analyze_chunk_with_llm
from app.core.config import settings

async def main():
    print(f"Using API Key starting with: {settings.OPENAI_API_KEY[:5]}")
    chunk_text = "The Subcontractor agrees to indemnify the Contractor against all claims."
    print("Sending test chunk to OpenAI...")
    try:
        issues = await analyze_chunk_with_llm(chunk_text)
        print(f"SUCCESS: Returned {len(issues)} issues.")
        for issue in issues:
            print(issue)
        
        with open("openai_test_result.txt", "w") as f:
            f.write(f"Returned {len(issues)} issues.\n")
            f.write(str(issues))
            
    except Exception as e:
        print(f"FAILED: {e}")
        with open("openai_test_result.txt", "w") as f:
            f.write(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
