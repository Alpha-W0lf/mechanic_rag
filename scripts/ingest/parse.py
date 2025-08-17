from __future__ import annotations
from pathlib import Path
from typing import List
from unstructured.partition.pdf import partition_pdf

def elements_to_markdown(elements: List[str]) -> str:
    """Convert a list of unstructured elements to a markdown string."""
    markdown_elements = []
    for el in elements:
        if "unstructured.documents.elements.Title" in str(type(el)):
            markdown_elements.append(f"# {el.text}")
        elif "unstructured.documents.elements.NarrativeText" in str(type(el)):
            markdown_elements.append(el.text)
        elif "unstructured.documents.elements.ListItem" in str(type(el)):
            markdown_elements.append(f"* {el.text}")
        elif "unstructured.documents.elements.Header" in str(type(el)):
            # Use a smaller heading for headers to distinguish from titles
            markdown_elements.append(f"### {el.text}")
        elif "unstructured.documents.elements.Table" in str(type(el)):
            # Convert HTML table to Markdown
            if hasattr(el, 'metadata') and el.metadata.text_as_html:
                try:
                    import pandas as pd
                    from io import StringIO
                    # Read HTML table into a pandas DataFrame
                    df = pd.read_html(StringIO(el.metadata.text_as_html))[0]
                    # Convert DataFrame to Markdown
                    markdown_elements.append(df.to_markdown(index=False))
                except Exception as e:
                    print(f"Could not convert table to markdown: {e}")
                    markdown_elements.append(el.text) # fallback to raw text
            else:
                markdown_elements.append(el.text)
        else:
            # Keep other elements as plain text
            markdown_elements.append(el.text)
            
    return "\\n\\n".join(markdown_elements)


def parse_document(pdf_path: Path) -> str:
    """Parse a PDF into a markdown string using unstructured."""
    print(f"Parsing {pdf_path.name} with unstructured...")
    elements = partition_pdf(
        filename=str(pdf_path),
        strategy="hi_res",
        hi_res_model_name="yolox"
    )
    return elements_to_markdown(elements)


