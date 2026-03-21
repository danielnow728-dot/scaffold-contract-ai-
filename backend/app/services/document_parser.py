import PyPDF2
import docx
import io

def parse_pdf(file_bytes: bytes) -> str:
    text = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        print(f"PDF opened successfully with PyPDF2. Total pages: {total_pages}")
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text.append(f"--- PAGE {i + 1} ---\n" + page_text)
            else:
                text.append(f"--- PAGE {i + 1} ---\n[PAGE UNREADABLE OR IMAGE ONLY]")
    except Exception as e:
        print(f"Primary PDF parser failed: {e}")
        
    return "\n".join(text)

def parse_docx(file_bytes: bytes) -> str:
    text = []
    # io.BytesIO creates an in-memory file-like object from the bytes
    doc = docx.Document(io.BytesIO(file_bytes))
    for i, para in enumerate(doc.paragraphs):
        text.append(para.text)
    return "\n".join(text)

def parse_document(filename: str, file_bytes: bytes) -> str:
    """Parses a document based on its extension"""
    if filename.lower().endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif filename.lower().endswith((".docx", ".doc")):
        return parse_docx(file_bytes)
    elif filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8")
    else:
        raise ValueError(f"Unsupported file format: {filename}")
