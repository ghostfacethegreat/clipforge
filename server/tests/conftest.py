from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure server package importable
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT / "server") not in sys.path:
    sys.path.insert(0, str(ROOT / "server"))

# Isolate data dir for tests before app.config import
os.environ.setdefault("CLIPFORGE_DATA_DIR", str(ROOT / "data" / "test-data"))
os.environ.setdefault("CLIPFORGE_TRANSCRIBER", "demo")
