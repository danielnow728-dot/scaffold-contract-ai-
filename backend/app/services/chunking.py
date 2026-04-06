import asyncio
import re
from typing import List, Dict

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


def chunk_text(text: str, max_chars: int = 12000) -> List[Dict]:
    """
    Splits text into chunks with page metadata.

    For PDFs (which contain --- PAGE X --- markers), splits on page boundaries
    and tracks which pages each chunk covers.

    For DOCX/TXT (no page markers), splits by paragraphs and estimates position.

    Returns a list of dicts: { "text": str, "start_page": int|None, "end_page": int|None }
    """
    # Check if the text has PDF page markers
    page_pattern = re.compile(r'--- PAGE (\d+) ---')
    page_markers = list(page_pattern.finditer(text))

    if page_markers:
        return _chunk_with_pages(text, page_markers, max_chars)
    else:
        return _chunk_without_pages(text, max_chars)


def _chunk_with_pages(text: str, page_markers, max_chars: int) -> List[Dict]:
    """Split PDF text on page boundaries, grouping pages into chunks under max_chars."""
    # Split text into individual pages
    pages = []
    for i, marker in enumerate(page_markers):
        page_num = int(marker.group(1))
        start = marker.start()
        end = page_markers[i + 1].start() if i + 1 < len(page_markers) else len(text)
        page_text = text[start:end]
        pages.append({"num": page_num, "text": page_text})

    # Group pages into chunks that stay under max_chars
    chunks = []
    current_text = ""
    current_start_page = pages[0]["num"] if pages else None
    current_end_page = current_start_page

    for page in pages:
        if len(current_text) + len(page["text"]) > max_chars and current_text:
            chunks.append({
                "text": current_text,
                "start_page": current_start_page,
                "end_page": current_end_page
            })
            current_text = page["text"]
            current_start_page = page["num"]
            current_end_page = page["num"]
        else:
            current_text += page["text"]
            current_end_page = page["num"]

    if current_text:
        chunks.append({
            "text": current_text,
            "start_page": current_start_page,
            "end_page": current_end_page
        })

    return chunks


def _chunk_without_pages(text: str, max_chars: int) -> List[Dict]:
    """Split DOCX/TXT text by paragraphs. No reliable page numbers available."""
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        if len(current_chunk) + len(p) < max_chars:
            current_chunk += p + "\n"
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = p + "\n"

    if current_chunk:
        chunks.append(current_chunk)

    # Wrap in dict format — no page info for non-PDF documents
    return [{"text": c, "start_page": None, "end_page": None} for c in chunks]


# Global instance for FastAPI lifecycle
processing_queue = RateLimitedQueue(delay_seconds=3.0)
