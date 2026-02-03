from PyPDF2 import PdfReader
from io import BytesIO

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text content from PDF file
    """
    try:
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")