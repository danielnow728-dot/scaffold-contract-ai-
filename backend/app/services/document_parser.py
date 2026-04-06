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
    doc = docx.Document(io.BytesIO(file_bytes))

    # Estimate page breaks: docx files can contain explicit page breaks
    # and we can also estimate based on ~45 lines per page
    page_num = 1
    line_count = 0
    lines_per_page = 45  # Rough estimate for standard letter/A4
    text.append(f"--- PAGE {page_num} (estimated) ---")

    for para in doc.paragraphs:
        # Check for explicit page breaks in the paragraph's XML
        has_page_break = False
        for run in para.runs:
            if run._element.xml and 'w:br' in run._element.xml and 'type="page"' in run._element.xml:
                has_page_break = True
                break

        if has_page_break:
            page_num += 1
            text.append(f"\n--- PAGE {page_num} (estimated) ---")
            line_count = 0

        para_text = para.text.strip()
        if para_text:
            text.append(para_text)
            # Estimate line count (rough: 1 paragraph = 1-3 lines depending on length)
            line_count += max(1, len(para_text) // 80 + 1)

            if line_count >= lines_per_page:
                page_num += 1
                text.append(f"\n--- PAGE {page_num} (estimated) ---")
                line_count = 0

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
