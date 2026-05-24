(function () {
  "use strict";

  var md = window.markdownit({
    html: false,
    typographer: true,
    linkify: true,
  }).enable(["table", "strikethrough"]);

  var PRESETS = {
    "default": {
      name: "默认",
      heading_1: { font_name: "Microsoft YaHei", font_size: 24 },
      heading_2: { font_name: "Microsoft YaHei", font_size: 18 },
      heading_3: { font_name: "Microsoft YaHei", font_size: 14 },
      heading_4_6_font: "Arial",
      paragraph_font: "Times New Roman",
      paragraph_size: 12,
      code_font: "Courier New",
    },
    "academic": {
      name: "学术论文",
      heading_1: { font_name: "SimHei", font_size: 22 },
      heading_2: { font_name: "SimHei", font_size: 16 },
      heading_3: { font_name: "SimHei", font_size: 14 },
      heading_4_6_font: "SimHei",
      paragraph_font: "Times New Roman",
      paragraph_size: 12,
      code_font: "Consolas",
    },
    "business": {
      name: "商务文档",
      heading_1: { font_name: "Microsoft YaHei", font_size: 26 },
      heading_2: { font_name: "Microsoft YaHei", font_size: 20 },
      heading_3: { font_name: "Microsoft YaHei", font_size: 16 },
      heading_4_6_font: "Microsoft YaHei",
      paragraph_font: "Microsoft YaHei",
      paragraph_size: 11,
      code_font: "Courier New",
    },
    "notes": {
      name: "个人笔记",
      heading_1: { font_name: "KaiTi", font_size: 24 },
      heading_2: { font_name: "KaiTi", font_size: 18 },
      heading_3: { font_name: "KaiTi", font_size: 14 },
      heading_4_6_font: "KaiTi",
      paragraph_font: "Times New Roman",
      paragraph_size: 11,
      code_font: "Courier New",
    },
  };

  var currentPreset = "default";

  var state = {
    markdown: "",
    filePath: "",
    fileName: "",
    template: {
      styles: {
        heading_1: { font_name: "Microsoft YaHei", font_size: 24 },
        heading_2: { font_name: "Microsoft YaHei", font_size: 18 },
        heading_3: { font_name: "Microsoft YaHei", font_size: 14 },
      },
    },
    exporting: false,
  };

  var exports = {};

  var previewPane = document.getElementById("previewPane");
  var previewEmpty = document.getElementById("previewEmpty");
  var previewContent = document.getElementById("previewContent");
  var fileDropZone = document.getElementById("fileDropZone");
  var fileInput = document.getElementById("fileInput");
  var fileNameDisplay = document.getElementById("fileNameDisplay");
  var exportBtn = document.getElementById("exportBtn");
  var statusMsg = document.getElementById("statusMsg");

  var h1SizeEl = document.getElementById("h1Size");
  var h2SizeEl = document.getElementById("h2Size");
  var h3SizeEl = document.getElementById("h3Size");
  var h1FontEl = document.getElementById("h1Font");
  var h2FontEl = document.getElementById("h2Font");
  var h3FontEl = document.getElementById("h3Font");
  var h1SizeVal = document.getElementById("h1SizeVal");
  var h2SizeVal = document.getElementById("h2SizeVal");
  var h3SizeVal = document.getElementById("h3SizeVal");
  var presetList = document.getElementById("presetList");

  function syncControlsFromState() {
    var s = state.template.styles;
    h1SizeEl.value = s.heading_1.font_size;
    h2SizeEl.value = s.heading_2.font_size;
    h3SizeEl.value = s.heading_3.font_size;
    h1SizeVal.textContent = s.heading_1.font_size;
    h2SizeVal.textContent = s.heading_2.font_size;
    h3SizeVal.textContent = s.heading_3.font_size;
    h1FontEl.value = s.heading_1.font_name;
    h2FontEl.value = s.heading_2.font_name;
    h3FontEl.value = s.heading_3.font_name;
  }

  function applyPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;

    currentPreset = name;
    state.template.styles.heading_1.font_name = preset.heading_1.font_name;
    state.template.styles.heading_1.font_size = preset.heading_1.font_size;
    state.template.styles.heading_2.font_name = preset.heading_2.font_name;
    state.template.styles.heading_2.font_size = preset.heading_2.font_size;
    state.template.styles.heading_3.font_name = preset.heading_3.font_name;
    state.template.styles.heading_3.font_size = preset.heading_3.font_size;

    syncControlsFromState();

    var cards = presetList.querySelectorAll(".preset-card");
    cards.forEach(function (card) {
      card.classList.toggle("active", card.dataset.preset === name);
    });

    if (state.markdown) {
      applyTemplateStyles();
    }
  }

  presetList.addEventListener("click", function (e) {
    var card = e.target.closest(".preset-card");
    if (!card) return;
    var name = card.dataset.preset;
    if (name && name !== currentPreset) {
      applyPreset(name);
    }
  });

  function handleFile(file) {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      showToast("仅支持 .md 文件", "error");
      return;
    }
    if (file.size === 0) {
      showToast("文件内容为空", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("文件较大（>5MB），可能影响预览性能", "info");
    }

    state.fileName = file.name;
    fileNameDisplay.textContent = file.name;

    var reader = new FileReader();
    reader.onload = function (e) {
      state.markdown = e.target.result;
      state.filePath = file.path || "";
      renderPreview();
      exportBtn.disabled = false;
    };
    reader.readAsText(file);
  }

  function renderPreview() {
    var html = md.render(state.markdown);
    previewContent.innerHTML = html;
    previewEmpty.style.display = "none";
    previewContent.style.display = "block";
    applyTemplateStyles();
  }

  function applyTemplateStyles() {
    var s = state.template.styles;
    var preset = PRESETS[currentPreset] || PRESETS["default"];
    var styleEl = document.getElementById("dynamic-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-styles";
      document.head.appendChild(styleEl);
    }

    var h1FontFamily = mapFontFamily(s.heading_1.font_name);
    var h2FontFamily = mapFontFamily(s.heading_2.font_name);
    var h3FontFamily = mapFontFamily(s.heading_3.font_name);
    var h4FontFamily = mapFontFamily(preset.heading_4_6_font);
    var bodyFontFamily = mapFontFamily(preset.paragraph_font);

    styleEl.textContent =
      ".markdown-body { font-family: " + bodyFontFamily + "; font-size: " + preset.paragraph_size + "pt; }" +
      ".markdown-body h1 { font-family: " + h1FontFamily + "; font-size: " + s.heading_1.font_size + "pt; }" +
      ".markdown-body h2 { font-family: " + h2FontFamily + "; font-size: " + s.heading_2.font_size + "pt; }" +
      ".markdown-body h3 { font-family: " + h3FontFamily + "; font-size: " + s.heading_3.font_size + "pt; }" +
      ".markdown-body h4, .markdown-body h5, .markdown-body h6 { font-family: " + h4FontFamily + "; }";
  }

  function mapFontFamily(fontName) {
    var map = {
      "Arial": 'Arial, "Microsoft YaHei", "微软雅黑", sans-serif',
      "Microsoft YaHei": '"Microsoft YaHei", "微软雅黑", "PingFang SC", Arial, sans-serif',
      "SimSun": '"SimSun", "宋体", "Noto Serif SC", serif',
      "SimHei": '"SimHei", "黑体", "PingFang SC", sans-serif',
      "KaiTi": '"KaiTi", "楷体", "STKaiti", serif',
      "Times New Roman": '"Times New Roman", "SimSun", serif',
      "Helvetica": 'Helvetica, Arial, sans-serif',
      "Georgia": 'Georgia, "Times New Roman", serif',
      "Consolas": '"Consolas", "Courier New", monospace',
    };
    return map[fontName] || fontName;
  }

  var debounceTimer = null;
  function debouncedApplyStyles() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      applyTemplateStyles();
    }, 300);
  }

  function onManualAdjust() {
    currentPreset = null;
    var cards = presetList.querySelectorAll(".preset-card");
    cards.forEach(function (card) {
      card.classList.remove("active");
    });
  }

  h1SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h1SizeVal.textContent = val;
    state.template.styles.heading_1.font_size = val;
    onManualAdjust();
    debouncedApplyStyles();
  });

  h2SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h2SizeVal.textContent = val;
    state.template.styles.heading_2.font_size = val;
    onManualAdjust();
    debouncedApplyStyles();
  });

  h3SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h3SizeVal.textContent = val;
    state.template.styles.heading_3.font_size = val;
    onManualAdjust();
    debouncedApplyStyles();
  });

  h1FontEl.addEventListener("change", function () {
    state.template.styles.heading_1.font_name = this.value;
    onManualAdjust();
    debouncedApplyStyles();
  });

  h2FontEl.addEventListener("change", function () {
    state.template.styles.heading_2.font_name = this.value;
    onManualAdjust();
    debouncedApplyStyles();
  });

  h3FontEl.addEventListener("change", function () {
    state.template.styles.heading_3.font_name = this.value;
    onManualAdjust();
    debouncedApplyStyles();
  });

  fileDropZone.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function (e) {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  previewPane.addEventListener("dragover", function (e) {
    e.preventDefault();
    previewPane.classList.add("preview-drop-active");
  });

  previewPane.addEventListener("dragleave", function () {
    previewPane.classList.remove("preview-drop-active");
  });

  previewPane.addEventListener("drop", function (e) {
    e.preventDefault();
    previewPane.classList.remove("preview-drop-active");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileDropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    fileDropZone.classList.add("drag-over");
  });

  fileDropZone.addEventListener("dragleave", function () {
    fileDropZone.classList.remove("drag-over");
  });

  fileDropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    fileDropZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  exportBtn.addEventListener("click", function () {
    if (state.exporting) return;
    if (!state.markdown) {
      showToast("请先选择文件", "error");
      return;
    }

    state.exporting = true;
    exportBtn.disabled = true;
    exportBtn.textContent = "导出中...";
    statusMsg.textContent = "正在生成...";
    statusMsg.className = "status-message info";

    fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: state.markdown,
        template: buildFullTemplate(),
        file_path: state.filePath,
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error(err.error || "导出失败");
          });
        }
        return response.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = (state.fileName || "output").replace(/\.(md|markdown)$/i, "") + ".docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        statusMsg.textContent = "导出成功";
        statusMsg.className = "status-message success";
        showToast("导出成功", "success");
      })
      .catch(function (err) {
        statusMsg.textContent = "";
        statusMsg.className = "status-message";
        showToast(err.message || "导出失败", "error");
      })
      .finally(function () {
        state.exporting = false;
        exportBtn.disabled = false;
        exportBtn.textContent = "导出 Word";
        setTimeout(function () {
          statusMsg.textContent = "";
        }, 3000);
      });
  });

  function buildFullTemplate() {
    var preset = PRESETS[currentPreset] || PRESETS["default"];
    var h1 = state.template.styles.heading_1;
    var h2 = state.template.styles.heading_2;
    var h3 = state.template.styles.heading_3;

    return {
      document: {
        default_font: preset.paragraph_font,
        default_size: preset.paragraph_size,
        page_margins: { top: 2.54, bottom: 2.54, left: 3.18, right: 3.18 },
      },
      styles: {
        heading_1: { font_name: h1.font_name, font_size: h1.font_size, bold: true, alignment: "center", color: "#1a1a1a" },
        heading_2: { font_name: h2.font_name, font_size: h2.font_size, bold: true, color: "#2d2d2d" },
        heading_3: { font_name: h3.font_name, font_size: h3.font_size, bold: true, color: "#3d3d3d" },
        heading_4: { font_name: preset.heading_4_6_font, font_size: 12, bold: true },
        heading_5: { font_name: preset.heading_4_6_font, font_size: 11, bold: true },
        heading_6: { font_name: preset.heading_4_6_font, font_size: 10, bold: true },
        paragraph: { font_name: preset.paragraph_font, font_size: preset.paragraph_size },
        bold: { bold: true },
        italic: { italic: true },
        inline_code: { font_name: preset.code_font, font_size: 10.5, bg_color: "#F0F0F0" },
        code_block: { font_name: preset.code_font, font_size: 10, bg_color: "#F0F0F0", border_color: "#CCCCCC", border_width_pt: 1 },
        link: { color: "#0000EE", underline: true },
        table_header: { font_name: preset.heading_4_6_font, font_size: 10, bold: true },
        table_cell: { font_name: preset.paragraph_font, font_size: 10 },
        list_bullet: { indent_cm: 1.27 },
        list_number: { indent_cm: 1.27 },
        image: { alignment: "center" },
      },
    };
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3000);
  }

  exports.handleFile = handleFile;
  exports.state = state;
  exports.applyPreset = applyPreset;
  window.app = exports;
})();
