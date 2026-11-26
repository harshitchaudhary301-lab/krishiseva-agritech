"""
Packaging Script: Evidence Manifest & ZIP Archive Generator
Mission 03 Acceptance Gate V3.0 (KS-SM-003-EVG-003)
Computes SHA-256 fingerprints, generates evidence_manifest.json, and builds ZIP archive.
"""
import os
import sys
import hashlib
import json
import zipfile
import datetime

evidence_dir = os.path.abspath('docs/mission03/acceptance_evidence')
manifest_path = os.path.join(evidence_dir, 'evidence_manifest.json')
zip_path = os.path.abspath('KRISHISEVA_MISSION_03_ACCEPTANCE_EVIDENCE_V3.zip')

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def build_manifest_and_zip():
    print("=" * 80)
    print("SECTION 21 — EVIDENCE MANIFEST GENERATION & ARCHIVE CREATION")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 80)

    # 1. Collect all files except evidence_manifest.json itself
    file_entries = []
    all_files = []

    for root, dirs, files in os.walk(evidence_dir):
        for file in sorted(files):
            if file == 'evidence_manifest.json':
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, evidence_dir).replace('\\', '/')
            size = os.path.getsize(full_path)
            sha = sha256_file(full_path)
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            
            entry = {
                'relative_path': rel_path,
                'file_size_bytes': size,
                'sha256': sha,
                'modified_at': mtime
            }
            file_entries.append(entry)
            all_files.append((full_path, rel_path))

    manifest_data = {
        'manifest_title': 'KRISHISEVA MISSION 03 PRE-ACCEPTANCE EVIDENCE MANIFEST',
        'order_id': 'KS-SM-003-EVG-003',
        'parent_order': 'KS-SM-003-DEV-003',
        'generated_at': datetime.datetime.now().isoformat(),
        'git_branch': 'mission03-mvp',
        'git_commit_sha': '9e49924d8ff7413dbd4ed8ef21808a313cfe68bf',
        'base_commit_sha': '4a512e68407eece46a39d892697e8bead6472464',
        'total_files': len(file_entries),
        'files': file_entries
    }

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2)

    # Calculate sha of manifest itself
    manifest_sha = sha256_file(manifest_path)
    print(f"Generated {manifest_path} with {len(file_entries)} entries.")
    print(f"Manifest SHA-256: {manifest_sha}")

    # 2. Package into ZIP archive at repo root
    print(f"\nBuilding ZIP archive at: {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add manifest first
        zipf.write(manifest_path, arcname='evidence_manifest.json')
        # Add all evidence files
        for full_path, rel_path in all_files:
            zipf.write(full_path, arcname=rel_path)

    zip_size = os.path.getsize(zip_path)
    zip_sha = sha256_file(zip_path)

    print(f"Archive created successfully!")
    print(f"  Archive Path:    {zip_path}")
    print(f"  Archive Size:    {zip_size:,} bytes")
    print(f"  Archive SHA-256: {zip_sha}")

    # 3. Verify ZIP integrity by testing contents
    print("\nVerifying archive integrity...")
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        test_res = zipf.testzip()
        if test_res is None:
            print(f"  PASS: ZIP integrity verified. {len(zipf.namelist())} files present with 0 CRC errors.")
        else:
            print(f"  FAIL: Corrupt file detected in ZIP: {test_res}")
            sys.exit(1)

    print("=" * 80)

if __name__ == '__main__':
    build_manifest_and_zip()
