#!/usr/bin/env python3
"""Test script for the PDF parser implementation."""

import sys
from pathlib import Path

# Add scripts/ingest to Python path
sys.path.insert(0, str(Path(__file__).parent / "scripts" / "ingest"))

# Import modules directly to avoid relative import issues
import pdf_text
from pdf_text import PageText
import parse

def test_parser():
    """Test parser on sample PDFs."""
    rag_input = Path("rag_input")
    
    # Test files
    test_files = [
        "Honda_s2000_owners_manual_2001.pdf",
        "Honda_S2000_Service Manual_2000_2008.pdf", 
        "Honda_S2000_Wiring Diagram_2008.pdf"
    ]
    
    for filename in test_files:
        pdf_path = rag_input / filename
        print(f"\n=== Testing {filename} ===")
        print(f"PDF exists: {pdf_path.exists()}")
        
        if not pdf_path.exists():
            print(f"⚠️  File not found: {pdf_path}")
            continue
            
        try:
            pages = parse.parse_document(pdf_path)
            print(f"✅ Successfully parsed {len(pages)} pages")
            
            if pages:
                print(f"📄 First page preview (first 200 chars):")
                print(f"   {pages[0].text[:200].replace(chr(10), ' ')[:200]}...")
                print(f"📊 Page numbers: {[p.page_number for p in pages[:5]]}")
                
                # Show total text length
                total_chars = sum(len(p.text) for p in pages)
                print(f"📈 Total characters extracted: {total_chars:,}")
                
        except Exception as e:
            print(f"❌ Error parsing {filename}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_parser()
