import json
import io
from pathlib import Path
from flask import Flask, request, send_file, jsonify

app = Flask(__name__, static_folder="static", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB

from converter import convert, ConversionError, DEFAULT_TEMPLATE


def load_template():
    template_path = Path(__file__).parent / "template_config.json"
    if template_path.exists():
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return DEFAULT_TEMPLATE


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/convert", methods=["POST"])
def convert_md():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "请求体为空", "type": "invalid_request"}), 400

        markdown = data.get("markdown", "").strip()
        if not markdown:
            return jsonify({"error": "文件内容为空", "type": "empty_content"}), 400

        template = data.get("template") or load_template()
        file_path = data.get("file_path", "")

        docx_bytes = convert(markdown, template, file_path)
        return send_file(
            io.BytesIO(docx_bytes),
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name="output.docx",
        )
    except ConversionError as e:
        return jsonify({"error": str(e), "type": "conversion_error"}), 400
    except Exception as e:
        return jsonify({"error": "服务器内部错误", "type": "server_error"}), 500


if __name__ == "__main__":
    import webbrowser
    import socket

    port = 5000
    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
                break
        except OSError:
            port += 1

    webbrowser.open(f"http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
