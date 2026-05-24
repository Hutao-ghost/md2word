# Markdown → Word 转换器

将 Markdown 文件转换为排版精美的 Word (.docx) 文档。拖拽、预览、微调、导出——三步完成。

## 预览
<img width="1470" height="747" alt="image" src="https://github.com/user-attachments/assets/ba157b95-c69a-4567-9708-e007d6b3b37f" />


## 功能

- **所见即所得预览**：左侧实时渲染 Markdown 效果，所见即导出后的样子
- **拖拽即用**：拖 .md 文件到窗口，立即看到预览
- **4 套预设模板**：一键切换默认 / 学术论文 / 商务文档 / 个人笔记
- **手动微调**：在预设基础上自行调整标题字号和字体
- **本地运行**：纯本地 Web 应用，无需网络，数据不上传

## 快速开始

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

浏览器自动打开 `http://localhost:5000`，拖入 .md 文件即可。

## 预设模板

| 模板 | 标题字体 | 正文字体 | 代码字体 | 场景 |
|------|----------|----------|----------|------|
| 默认 | 微软雅黑 | 宋体 | Courier New | 通用文档 |
| 学术论文 | 黑体 | 宋体 | Consolas | 论文、报告 |
| 商务文档 | 微软雅黑 | 微软雅黑 | Courier New | 工作汇报 |
| 个人笔记 | 楷体 | 宋体 | Courier New | 日记、随笔 |

## 支持格式

标题（1-6级）、加粗、斜体、行内代码、代码块、表格、无序/有序列表、引用、链接、图片、分割线。

## 项目结构

```
├── app.py              # Flask 应用入口
├── converter.py         # Markdown → IR → docx 核心转换
├── template_config.json # 默认模板配置
├── static/
│   ├── index.html       # 前端页面
│   ├── style.css        # 纸墨 Editorial 主题
│   ├── app.js           # 拖拽、预览、模板、导出逻辑
│   └── markdown-it.min.js
├── tests/               # 51 个测试（pytest）
└── requirements.txt
```

## 技术栈

Python 3.13 / Flask / python-docx / markdown-it-py / lxml / Pillow

## License

MIT

---

特别鸣谢我的助手 DeepSeek。
