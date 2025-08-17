#!/usr/bin/env python3
"""Test script for enhanced chunking system."""

import sys
from pathlib import Path

# Add scripts/ingest to Python path
sys.path.insert(0, str(Path(__file__).parent / "scripts" / "ingest"))

from chunking import structure_aware_chunking, parse_markdown_structure
import parse

def test_chunking():
    """Test the enhanced chunking system on real PDF content."""
    
    # Test on one of our PDFs
    pdf_path = Path("rag_input/Honda_s2000_owners_manual_2001.pdf")
    print(f"Testing chunking on: {pdf_path.name}")
    
    if not pdf_path.exists():
        print(f"⚠️  PDF not found: {pdf_path}")
        return
    
    try:
        # Parse the PDF to get markdown content
        print("📄 Parsing PDF with Docling...")
        pages = parse.parse_document(pdf_path)
        
        if not pages:
            print("❌ No pages extracted")
            return
        
        # Get the markdown content (Docling returns one "page" with all content)
        markdown_content = pages[0].text
        print(f"✅ Extracted {len(markdown_content):,} characters")
        
        # Test structure parsing
        print("\n🔍 Analyzing document structure...")
        sections = parse_markdown_structure(markdown_content)
        print(f"📑 Found {len(sections)} sections")
        
        # Show first few sections
        for i, section in enumerate(sections[:5]):
            print(f"  {i+1}. [{section.level}] {section.section_path}")
            print(f"     Content: {len(section.content)} chars")
        
        if len(sections) > 5:
            print(f"     ... and {len(sections) - 5} more sections")
        
        # Test chunking
        print(f"\n🧩 Creating structure-aware chunks...")
        chunks = structure_aware_chunking(markdown_content)
        print(f"📦 Generated {len(chunks)} chunks")
        
        # Analyze chunk statistics
        chunk_sizes = [len(chunk.content) for chunk in chunks]
        avg_size = sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0
        min_size = min(chunk_sizes) if chunk_sizes else 0
        max_size = max(chunk_sizes) if chunk_sizes else 0
        
        print(f"\n📊 Chunk Statistics:")
        print(f"   Average size: {avg_size:.0f} characters")
        print(f"   Size range: {min_size} - {max_size} characters")
        print(f"   Target range: 1000-1200 characters")
        
        # Show sample chunks
        print(f"\n📝 Sample chunks:")
        for i, chunk in enumerate(chunks[:3]):
            print(f"\n--- Chunk {i+1} ---")
            print(f"Section: {chunk.section_path}")
            print(f"Size: {len(chunk.content)} chars")
            print(f"Preview: {chunk.content[:150]}...")
        
        # Quality checks
        in_target_range = sum(1 for size in chunk_sizes if 1000 <= size <= 1200)
        percentage_in_range = (in_target_range / len(chunk_sizes)) * 100 if chunk_sizes else 0
        
        print(f"\n✅ Quality Metrics:")
        print(f"   Chunks in target range (1000-1200): {in_target_range}/{len(chunks)} ({percentage_in_range:.1f}%)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during chunking test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_chunking()
