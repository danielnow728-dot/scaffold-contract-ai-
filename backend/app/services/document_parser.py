import pdfplumber
import PyPDF2
import docx
import io

def parse_pdf(file_bytes: bytes) -> str:
    text = []
    
    # Primary Parser: pdfplumber (best for tables/columns)
    try:
        print("Opening PDF with pdfplumber...")
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = len(pdf.pages)
            print(f"PDF opened successfully. Total pages to extract: {total_pages}")
            for i, page in enumerate(pdf.pages):
                print(f"Extracting page {i+1}...")
                page_text = page.extract_text(layout=True)
                
                # If pdfplumber returns Nothing (often happens on image-heavy/graph pages)
                if not page_text or len(page_text.strip()) < 10:
                    print(f"Page {i+1} returned empty text, falling back to PyPDF2...")
                    # Fallback to standard PyPDF2 for this specific page
                    try:
                        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                        fallback_text = reader.pages[i].extract_text()
                        if fallback_text:
                            page_text = fallback_text
                    except Exception as e:
                        print(f"Fallback parser failed on page {i}: {e}")
                
                print(f"Finished page {i+1}")
                
                if page_text:
                    text.append(f"--- PAGE {i + 1} ---\n" + page_text)
                else:
                    text.append(f"--- PAGE {i + 1} ---\n[PAGE UNREADABLE OR IMAGE ONLY]")
    except Exception as e:
        print(f"Primary PDF parser failed: {e}")
        # Nuclear Fallback: If pdfplumber totally crashes, use PyPDF2 for whole doc
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text.append(f"--- PAGE {i + 1} ---\n" + page_text)
                
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
