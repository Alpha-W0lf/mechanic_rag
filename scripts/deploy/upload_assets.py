import mimetypes
import os
from pathlib import Path
import sys

from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

# Add project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def get_supabase_client() -> Client:
    """Initializes and returns the Supabase client."""
    # Ensure environment variables are loaded
    env_path = PROJECT_ROOT / "web" / ".env.local"
    if not env_path.exists():
        raise FileNotFoundError(f".env.local file not found at {env_path}")
    load_dotenv(dotenv_path=env_path)
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Supabase URL and service role key must be set in .env.local")

    return create_client(supabase_url, supabase_key)

def upload_assets_to_storage():
    """
    Uploads all generated PNG assets from the local `output/images` directory
    to Supabase Storage, maintaining the directory structure.
    """
    print("Starting asset upload to Supabase Storage...")
    
    supabase = get_supabase_client()
    local_images_root = PROJECT_ROOT / "output" / "images"

    if not local_images_root.exists():
        print("No `output/images` directory found. Nothing to upload.")
        return

    # Get all document-specific image directories
    doc_dirs = [d for d in local_images_root.iterdir() if d.is_dir()]
    if not doc_dirs:
        print("No document image directories found to process.")
        return

    print(f"Found {len(doc_dirs)} document asset director(y/ies) to process.")

    for doc_dir in doc_dirs:
        bucket_name = doc_dir.name.lower() # Buckets must be lowercase
        
        # 1. Create bucket if it doesn't exist
        try:
            supabase.storage.get_bucket(bucket_name)
            print(f"Bucket '{bucket_name}' already exists.")
        except Exception:
            print(f"Bucket '{bucket_name}' not found, creating it...")
            supabase.storage.create_bucket(
                id=bucket_name, 
                options={"public": True}
            )

        # 2. Get list of files already in the bucket for resumability
        try:
            response = supabase.storage.from_(bucket_name).list()
            existing_files = {file['name'] for file in response}
            print(f"Found {len(existing_files)} files already in bucket '{bucket_name}'.")
        except Exception as e:
            print(f"Warning: Could not list files from bucket '{bucket_name}'. Will attempt to upload all files. Error: {e}")
            existing_files = set()

        # 3. Upload all PNG files from the local directory
        local_files = list(doc_dir.glob("*.png"))
        print(f"Found {len(local_files)} local PNG files for '{doc_dir.name}'.")

        if not local_files:
            continue

        progress_bar = tqdm(local_files, desc=f"Uploading to '{bucket_name}'")
        for file_path in progress_bar:
            if file_path.name in existing_files:
                # print(f"Skipping {file_path.name}, already exists in storage.")
                continue

            try:
                content_type, _ = mimetypes.guess_type(file_path)
                if content_type is None:
                    content_type = 'application/octet-stream' # Default content type

                with open(file_path, 'rb') as f:
                    supabase.storage.from_(bucket_name).upload(
                        path=file_path.name,
                        file=f,
                        file_options={"content-type": content_type, "upsert": "false"}
                    )
            except Exception as e:
                print(f"\nERROR uploading {file_path.name}: {e}")

    print("\nAsset upload process complete.")

if __name__ == "__main__":
    upload_assets_to_storage()
