async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_health_db(client):
    resp = await client.get("/api/v1/health/db")
    assert resp.status_code == 200
    assert resp.json()["database"] == "ok"
