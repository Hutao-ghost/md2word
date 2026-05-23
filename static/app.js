(function () {
  "use strict";

  var md = window.markdownit({
    html: false,
    typographer: true,
    linkify: true,
  }).enable(["table", "strikethrough"]);

  var state = {
    markdown: "",
    filePath: "",
    fileName: "",
    template: {
      styles: {
        heading_1: { font_name: "Arial", font_size: 24 },
        heading_2: { font_name: "Arial", font_size: 18 },
        heading_3: { font_name: "Arial", font_size: 14 },
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
    var styleEl = document.getElementById("dynamic-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-styles";
      document.head.appendChild(styleEl);
    }

    var h1FontFamily = mapFontFamily(s.heading_1.font_name);
    var h2FontFamily = mapFontFamily(s.heading_2.font_name);
    var h3FontFamily = mapFontFamily(s.heading_3.font_name);

    styleEl.textContent =
      ".markdown-body h1 { font-family: " + h1FontFamily + "; font-size: " + s.heading_1.font_size + "pt; }" +
      ".markdown-body h2 { font-family: " + h2FontFamily + "; font-size: " + s.heading_2.font_size + "pt; }" +
      ".markdown-body h3 { font-family: " + h3FontFamily + "; font-size: " + s.heading_3.font_size + "pt; }";
  }

  function mapFontFamily(fontName) {
    var map = {
      "Arial": 'Arial, "Microsoft YaHei", "微软雅黑", sans-serif',
      "Microsoft YaHei": '"Microsoft YaHei", "微软雅黑", Arial, sans-serif',
      "SimSun": '"SimSun", "宋体", serif',
      "SimHei": '"SimHei", "黑体", sans-serif',
      "KaiTi": '"KaiTi", "楷体", serif',
      "Times New Roman": '"Times New Roman", serif',
      "Helvetica": 'Helvetica, Arial, sans-serif',
      "Georgia": 'Georgia, "Times New Roman", serif',
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

  h1SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h1SizeVal.textContent = val;
    state.template.styles.heading_1.font_size = val;
    debouncedApplyStyles();
  });

  h2SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h2SizeVal.textContent = val;
    state.template.styles.heading_2.font_size = val;
    debouncedApplyStyles();
  });

  h3SizeEl.addEventListener("input", function () {
    var val = parseInt(this.value);
    h3SizeVal.textContent = val;
    state.template.styles.heading_3.font_size = val;
    debouncedApplyStyles();
  });

  h1FontEl.addEventListener("change", function () {
    state.template.styles.heading_1.font_name = this.value;
    debouncedApplyStyles();
  });

  h2FontEl.addEventListener("change", function () {
    state.template.styles.heading_2.font_name = this.value;
    debouncedApplyStyles();
  });

  h3FontEl.addEventListener("change", function () {
    state.template.styles.heading_3.font_name = this.value;
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
    return {
      document: {
        default_font: "Times New Roman",
        default_size: 12,
        page_margins: { top: 2.54, bottom: 2.54, left: 3.18, right: 3.18 },
      },
      styles: {
        heading_1: {
          font_name: state.template.styles.heading_1.font_name,
          font_size: state.template.styles.heading_1.font_size,
          bold: true,
          alignment: "center",
          color: "#1a1a1a",
        },
        heading_2: {
          font_name: state.template.styles.heading_2.font_name,
          font_size: state.template.styles.heading_2.font_size,
          bold: true,
          color: "#2d2d2d",
        },
        heading_3: {
          font_name: state.template.styles.heading_3.font_name,
          font_size: state.template.styles.heading_3.font_size,
          bold: true,
          color: "#3d3d3d",
        },
        heading_4: { font_name: "Arial", font_size: 12, bold: true },
        heading_5: { font_name: "Arial", font_size: 11, bold: true },
        heading_6: { font_name: "Arial", font_size: 10, bold: true },
        paragraph: { font_name: "Times New Roman", font_size: 12 },
        bold: { bold: true },
        italic: { italic: true },
        inline_code: { font_name: "Courier New", font_size: 10.5, bg_color: "#F0F0F0" },
        code_block: { font_name: "Courier New", font_size: 10, bg_color: "#F0F0F0", border_color: "#CCCCCC", border_width_pt: 1 },
        link: { color: "#0000EE", underline: true },
        table_header: { font_name: "Arial", font_size: 10, bold: true },
        table_cell: { font_name: "Arial", font_size: 10 },
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
  window.app = exports;
})();
