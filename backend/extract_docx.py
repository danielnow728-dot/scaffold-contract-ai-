import os
import docx

directory = "C:\\Users\\danie\\.gemini\\antigravity\\playground\\core-einstein\\contract-review-app\\backend\\app\\core"

for filename in os.listdir(directory):
    if filename.endswith(".docx"):
        doc_path = os.path.join(directory, filename)
        txt_path = os.path.join(directory, filename.replace(".docx", ".txt"))
        
        doc = docx.Document(doc_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
            
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(full_text))
        print(f"Extracted {filename}")
