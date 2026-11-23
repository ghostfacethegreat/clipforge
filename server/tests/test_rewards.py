from __future__ import annotations

import importlib


def test_default_campaigns(tmp_path, monkeypatch):
    monkeypatch.setenv("CLIPFORGE_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.delenv("CLIPFORGE_CAMPAIGNS_JSON", raising=False)
    import app.config as config
    importlib.reload(config)
    import app.rewards as rewards
    importlib.reload(rewards)
    camps = rewards.campaigns()
    assert len(camps) >= 1
    assert all(c.cpm > 0 for c in camps)
    assert rewards.find_campaign(camps[0].id) is not None
