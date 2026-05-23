import pytest
import json
import io
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestAppRoutes:
    def test_index_returns_html(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert b"<!DOCTYPE html>" in resp.data or b"<html" in resp.data

    def test_convert_valid_markdown(self, client):
        resp = client.post(
            "/convert",
            json={"markdown": "# Hello\n\nWorld"},
        )
        assert resp.status_code == 200
        assert resp.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert resp.data[:2] == b"PK"

    def test_convert_empty_markdown(self, client):
        resp = client.post("/convert", json={"markdown": ""})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert data["type"] == "empty_content"

    def test_convert_no_body(self, client):
        resp = client.post("/convert", data="not json", content_type="application/json")
        assert resp.status_code == 400

    def test_convert_with_template(self, client):
        resp = client.post(
            "/convert",
            json={
                "markdown": "# Title",
                "template": {"styles": {"heading_1": {"font_size": 48}}},
            },
        )
        assert resp.status_code == 200

    def test_convert_with_file_path(self, client):
        resp = client.post(
            "/convert",
            json={
                "markdown": "text",
                "file_path": "/some/path/doc.md",
            },
        )
        assert resp.status_code == 200
