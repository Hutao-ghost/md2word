import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pathlib import Path
from PIL import Image
import tempfile
import io
import json
import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


SAMPLE_MD = """# 项目文档

## 简介

这是一个测试文档，包含**加粗**和*斜体*文本。

## 功能列表

- 拖拽上传文件
- 所见即所得预览
- 模板自定义
- 一键导出

## 代码示例

```python
def hello():
    print("Hello, World!")
```

## 数据表格

| 名称 | 版本 | 状态 |
|------|------|------|
| Flask | 3.1 | 正常 |
| python-docx | 1.2 | 正常 |
| markdown-it | 4.2 | 正常 |

> 这是一个引用块，用于测试引用渲染。

---

文档结束。
"""


class TestE2EWorkflow:
    def test_full_workflow_default_template(self, client):
        resp = client.post("/convert", json={"markdown": SAMPLE_MD})
        assert resp.status_code == 200
        assert resp.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert resp.data[:2] == b"PK"
        assert len(resp.data) > 5000

    def test_workflow_with_custom_h1_style(self, client):
        custom_template = {
            "styles": {
                "heading_1": {"font_name": "SimHei", "font_size": 36, "bold": True, "alignment": "center", "color": "#000000"},
            }
        }
        resp = client.post(
            "/convert",
            json={"markdown": SAMPLE_MD, "template": custom_template},
        )
        assert resp.status_code == 200
        assert len(resp.data) > 5000

    def test_frontend_template_integration(self, client):
        resp = client.post(
            "/convert",
            json={
                "markdown": "# Custom H1\n## Custom H2\n### Custom H3",
                "template": {
                    "styles": {
                        "heading_1": {"font_size": 30},
                        "heading_2": {"font_size": 22},
                        "heading_3": {"font_size": 16},
                    },
                },
            },
        )
        assert resp.status_code == 200

    def test_complex_markdown_with_all_elements(self, client):
        resp = client.post("/convert", json={"markdown": SAMPLE_MD})
        assert resp.status_code == 200
        assert len(resp.data) > 10000

    def test_error_response_structure(self, client):
        resp = client.post("/convert", json={"markdown": ""})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert "error" in data
        assert "type" in data
