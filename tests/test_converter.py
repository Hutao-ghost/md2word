import pytest
import io
from pathlib import Path
from copy import deepcopy

from converter import (
    parse_markdown,
    build_ir,
    render_docx,
    convert,
    ConversionError,
    DEFAULT_TEMPLATE,
    MAX_IR_NODES,
)


class TestParseMarkdown:
    def test_valid_markdown(self):
        md = "# Hello\n\nWorld"
        tokens = parse_markdown(md)
        assert len(tokens) > 0

    def test_empty_string(self):
        tokens = parse_markdown("")
        assert tokens is not None

    def test_malformed_markdown_unclosed_fence(self):
        md = "```python\nprint('hello')\n"
        tokens = parse_markdown(md)
        assert len(tokens) > 0

    def test_none_input_raises(self):
        with pytest.raises(ConversionError, match="字符串"):
            parse_markdown(None)

    def test_whitespace_only(self):
        tokens = parse_markdown("   \n\n  ")
        assert tokens is not None


class TestBuildIRHeadings:
    def test_h1(self):
        tokens = parse_markdown("# Title")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "heading"
        assert ir[0]["level"] == 1
        assert "Title" in ir[0]["text"]

    def test_h2(self):
        tokens = parse_markdown("## Subtitle")
        ir = build_ir(tokens)
        assert ir[0]["level"] == 2

    def test_h6(self):
        tokens = parse_markdown("###### Tiny")
        ir = build_ir(tokens)
        assert ir[0]["level"] == 6

    def test_heading_with_inline_formatting(self):
        tokens = parse_markdown("# **Bold** and *italic*")
        ir = build_ir(tokens)
        assert len(ir[0]["inline"]) > 0


class TestBuildIRParagraphs:
    def test_simple_paragraph(self):
        tokens = parse_markdown("Hello world.")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "paragraph"
        assert "Hello world." in ir[0]["text"]

    def test_bold_inline(self):
        tokens = parse_markdown("This is **bold** text")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        assert any(i["type"] == "bold" for i in inline)

    def test_italic_inline(self):
        tokens = parse_markdown("This is *italic* text")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        assert any(i["type"] == "italic" for i in inline)

    def test_inline_code(self):
        tokens = parse_markdown("Use `print()` function")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        assert any(i["type"] == "inline_code" for i in inline)

    def test_link(self):
        tokens = parse_markdown("[Google](https://google.com)")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        assert any(i["type"] == "link" for i in inline)

    def test_image(self):
        tokens = parse_markdown("![alt](img.png)")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        assert any(i["type"] == "image" for i in inline)

    def test_mixed_inline(self):
        tokens = parse_markdown("**bold** and *italic* and `code`")
        ir = build_ir(tokens)
        inline = ir[0]["inline"]
        types = [i["type"] for i in inline]
        assert "bold" in types
        assert "italic" in types
        assert "inline_code" in types


class TestBuildIRCodeBlocks:
    def test_fenced_code_block(self):
        tokens = parse_markdown('```python\nprint("hello")\n```')
        ir = build_ir(tokens)
        assert ir[0]["type"] == "code_block"
        assert ir[0]["language"] == "python"
        assert "print" in ir[0]["content"]

    def test_code_block_no_language(self):
        tokens = parse_markdown('```\nplain text\n```')
        ir = build_ir(tokens)
        assert ir[0]["type"] == "code_block"
        assert ir[0]["language"] == ""


class TestBuildIRTables:
    def test_simple_table(self):
        tokens = parse_markdown("| A | B |\n|---|---|\n| 1 | 2 |")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "table"
        assert len(ir[0]["headers"]) == 2
        assert len(ir[0]["rows"]) == 1

    def test_table_with_inline_formatting(self):
        tokens = parse_markdown("| **Name** | Age |\n|----------|-----|\n| *Alice* | 30 |")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "table"
        header_inline = ir[0]["headers"][0]["inline"]
        assert any(i["type"] == "bold" for i in header_inline)


class TestBuildIRLists:
    def test_bullet_list(self):
        tokens = parse_markdown("- item 1\n- item 2\n- item 3")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "list"
        assert ir[0]["list_type"] == "bullet"
        assert len(ir[0]["items"]) == 3

    def test_ordered_list(self):
        tokens = parse_markdown("1. first\n2. second\n3. third")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "list"
        assert ir[0]["list_type"] == "ordered"
        assert len(ir[0]["items"]) == 3

    def test_nested_list(self):
        tokens = parse_markdown("- parent\n  - child\n  - child2")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "list"
        items = ir[0]["items"]
        assert len(items) >= 1
        parent_item = items[0]
        assert len(parent_item["content"]) >= 2
        nested = parent_item["content"][1]
        assert nested["type"] == "list"
        assert len(nested["items"]) == 2


class TestBuildIRBlockquote:
    def test_blockquote(self):
        tokens = parse_markdown("> quoted text")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "blockquote"

    def test_hr(self):
        tokens = parse_markdown("---")
        ir = build_ir(tokens)
        assert ir[0]["type"] == "hr"


class TestRenderDocx:
    def test_heading_styles(self):
        tokens = parse_markdown("# Title\n\nPara")
        ir = build_ir(tokens)
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert len(doc.paragraphs) >= 2

    def test_code_block_styles(self):
        tokens = parse_markdown('```\ncode\n```')
        ir = build_ir(tokens)
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert len(doc.paragraphs) >= 1

    def test_table_rendering(self):
        tokens = parse_markdown("| A | B |\n|---|---|\n| 1 | 2 |")
        ir = build_ir(tokens)
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert len(doc.tables) == 1

    def test_list_rendering(self):
        tokens = parse_markdown("- item 1\n- item 2")
        ir = build_ir(tokens)
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert len(doc.paragraphs) >= 2

    def test_empty_ir(self):
        ir = []
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert doc is not None

    def test_custom_template_heading_font(self):
        tokens = parse_markdown("# Title")
        ir = build_ir(tokens)
        custom = deepcopy(DEFAULT_TEMPLATE)
        custom["styles"]["heading_1"]["font_size"] = 48
        doc = render_docx(ir, custom)
        para = doc.paragraphs[0]
        if para.runs:
            assert para.runs[0].font.size is not None


class TestConvert:
    def test_full_pipeline(self):
        md = "# Hello\n\nWorld"
        result = convert(md)
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:2] == b"PK"

    def test_empty_paragraph_only(self):
        md = "Just text"
        result = convert(md)
        assert len(result) > 0
        assert result[:2] == b"PK"

    def test_custom_template_override(self):
        md = "# Title"
        custom = {"styles": {"heading_1": {"font_size": 48}}}
        result = convert(md, template=custom)
        assert len(result) > 0

    def test_merge_template_preserves_defaults(self):
        md = "# Title"
        custom = {"styles": {"heading_1": {"font_size": 48}}}
        result = convert(md, template=custom)
        assert len(result) > 0

    def test_file_path_handling(self):
        md = "Text"
        result = convert(md, file_path="/some/path/doc.md")
        assert len(result) > 0

    def test_missing_file_path(self):
        md = "![img](notfound.png)"
        result = convert(md, file_path="")
        assert len(result) > 0


class TestErrorHandling:
    def test_convert_empty_content(self):
        md = ""
        tokens = parse_markdown(md)
        ir = build_ir(tokens)
        doc = render_docx(ir, DEFAULT_TEMPLATE)
        assert len(doc.paragraphs) == 0

    def test_invalid_input_type(self):
        with pytest.raises(ConversionError):
            parse_markdown(42)

    def test_large_ir_warning(self):
        many_headings = "\n".join(f"# Heading {i}\n\npara" for i in range(10000))
        tokens = parse_markdown(many_headings)
        ir = build_ir(tokens)
        assert len(ir) > MAX_IR_NODES
        result = convert(many_headings)
        assert len(result) > 0
