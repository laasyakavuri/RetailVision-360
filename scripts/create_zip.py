import os
import zipfile
import sys

def create_archive():
    source_dir = r"c:\Users\Yogendar\Downloads\laas\RetailVision360"
    output_zip = r"c:\Users\Yogendar\Downloads\laas\RetailVision360.zip"
    
    # Exclusions
    exclude_dirs = {
        "node_modules",
        "venv",
        ".venv",
        "env",
        ".git",
        "__pycache__",
        ".pytest_cache",
        "dist",
        ".vite"
    }
    exclude_files = {
        ".env",
        ".DS_Store",
        "Thumbs.db"
    }
    exclude_extensions = {
        ".pyc",
        ".pyo",
        ".log",
        ".tmp"
    }

    print(f"Creating archive: {output_zip}")
    file_count = 0
    total_uncompressed_size = 0

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith("__pycache__")]
            
            for file in files:
                if file in exclude_files:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_extensions:
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, os.path.dirname(source_dir))
                
                # Check for secrets inside .env or unexpected filenames
                if ".env" in file and not file.endswith(".example"):
                    continue
                
                size = os.path.getsize(full_path)
                total_uncompressed_size += size
                zipf.write(full_path, rel_path)
                file_count += 1

    zip_size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"Archive successfully created!")
    print(f"Total files: {file_count}")
    print(f"Total uncompressed size: {total_uncompressed_size / (1024*1024):.2f} MB")
    print(f"Archive file size: {zip_size_mb:.2f} MB")

    # Verify integrity
    print("Verifying archive integrity...")
    with zipfile.ZipFile(output_zip, 'r') as zipf:
        test_result = zipf.testzip()
        if test_result is not None:
            print(f"[ERROR] Corrupt file found in zip: {test_result}")
            sys.exit(1)
        
        # Verify key expected files are present
        namelist = zipf.namelist()
        expected_files = [
            "RetailVision360/README.md",
            "RetailVision360/start.sh",
            "RetailVision360/start.bat",
            "RetailVision360/LICENSE",
            "RetailVision360/backend/requirements.txt",
            "RetailVision360/backend/.env.example",
            "RetailVision360/backend/app/main.py",
            "RetailVision360/backend/app/vision/detector.py",
            "RetailVision360/backend/app/services/gemini_service.py",
            "RetailVision360/backend/tests/test_api.py",
            "RetailVision360/frontend/package.json",
            "RetailVision360/frontend/src/App.tsx",
            "RetailVision360/docs/ARCHITECTURE.md",
            "RetailVision360/docs/API.md",
            "RetailVision360/docs/DEMO_GUIDE.md",
            "RetailVision360/docs/GEMINI_SETUP.md",
            "RetailVision360/docs/EVALUATION.md",
            "RetailVision360/docs/TEST_REPORT.md",
            "RetailVision360/docs/KNOWN_LIMITATIONS.md",
            "RetailVision360/sample_data/shelf_gap_sample.jpg",
            "RetailVision360/sample_data/shelf_resolved_sample.jpg"
        ]
        
        missing = [f for f in expected_files if f not in namelist]
        if missing:
            print(f"[ERROR] Missing expected files in archive: {missing}")
            sys.exit(1)

        # Verify forbidden files are ABSENT
        forbidden = [f for f in namelist if f.endswith("/.env") or "/node_modules/" in f or "/__pycache__/" in f or "/venv/" in f]
        if forbidden:
            print(f"[ERROR] Forbidden files found in archive: {forbidden}")
            sys.exit(1)

    print("[SUCCESS] Archive integrity verified 100%! All critical files present, zero secrets or temporary caches.")

if __name__ == "__main__":
    create_archive()
