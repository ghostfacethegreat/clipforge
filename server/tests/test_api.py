from __future__ import annotations

from fastapi.testclient import TestClient


def make_client(tmp_path, monkeypatch):
    import app.config as config
    import app.rewards as rewards
    import app.jobs as jobs
    import app.channels as channels
    import app.main as main

    data = tmp_path / "data"
    upload = data / "uploads"
    output = data / "outputs"
    work = data / "work"
    for d in (data, upload, output, work):
        d.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(config, "DATA_DIR", data)
    monkeypatch.setattr(config, "UPLOAD_DIR", upload)
    monkeypatch.setattr(config, "OUTPUT_DIR", output)
    monkeypatch.setattr(config, "WORK_DIR", work)
    monkeypatch.setattr(config, "JOBS_FILE", data / "jobs.json")
    monkeypatch.setattr(config, "CHANNELS_FILE", data / "channels.json")
    monkeypatch.setattr(config, "SUBMISSIONS_FILE", data / "submissions.json")
    monkeypatch.setattr(config, "TRANSCRIBER", "demo")

    # reset singletons/state
    rewards._lock  # noqa: B018
    main.manager = jobs.JobManager(workers=1)
    main.channels = channels.ChannelManager(main.manager)
    # stop channel thread impact by making it inactive; thread is daemon, ok for tests
    for ch in main.channels.list():
        main.channels.update(ch.id, {"active": False})
    return TestClient(main.app)


def test_health_and_config(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    r = client.get("/api/config")
    assert r.status_code == 200
    data = r.json()
    assert "caption_styles" in data
    assert "destinations" in data
    assert "campaigns" in data


def test_campaigns_and_analytics(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    r = client.get("/api/campaigns")
    assert r.status_code == 200
    assert len(r.json()) >= 1

    r = client.get("/api/analytics")
    assert r.status_code == 200
    data = r.json()
    assert data["jobs"] == 0
    assert data["clips"] == 0


def test_url_job_rejects_invalid(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    r = client.post("/api/jobs/url", json={"url": "not-a-url", "options": {}, "auto_publish": {}})
    assert r.status_code == 400
