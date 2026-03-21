import asyncio
from typing import List

# Simple background processing queue to obey TPM limits
# For larger deployments, switch to Celery/Redis.

class RateLimitedQueue:
    def __init__(self, delay_seconds: float = 2.0):
        self.queue = None
        self.delay_seconds = delay_seconds
        
    def _get_queue(self):
        if self.queue is None:
            self.queue = asyncio.Queue()
        return self.queue
        
    async def add_task(self, task_func, *args, **kwargs):
        q = self._get_queue()
        await q.put((task_func, args, kwargs))
        
    async def process_queue(self):
        q = self._get_queue()
        while True:
            task_func, args, kwargs = await q.get()
            try:
                await task_func(*args, **kwargs)
            except Exception as e:
                print(f"Error processing task: {e}")
            finally:
                q.task_done()
                # Required delay to avoid API TPM Limits
                await asyncio.sleep(self.delay_seconds)

def chunk_text(text: str, max_chars: int = 12000) -> List[str]:
    """
    Splits text into larger chunks by paragraphs to preserve context.
    12000 characters is roughly ~3000 tokens, leaving plenty of room for system prompts.
    """
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = ""
    
    for p in paragraphs:
        if len(current_chunk) + len(p) < max_chars:
            current_chunk += p + "\n"
        else:
            chunks.append(current_chunk)
            current_chunk = p + "\n"
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

# Global instance for FastAPI lifecycle
processing_queue = RateLimitedQueue(delay_seconds=3.0)
