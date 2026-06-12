(function attachVoiceDrawing(globalScope) {
  "use strict";

  const COLOR_MAP = [
    ["红", "#ef4444", "红色"],
    ["red", "#ef4444", "红色"],
    ["蓝", "#2563eb", "蓝色"],
    ["blue", "#2563eb", "蓝色"],
    ["绿", "#16a34a", "绿色"],
    ["green", "#16a34a", "绿色"],
    ["黄", "#eab308", "黄色"],
    ["yellow", "#eab308", "黄色"],
    ["紫", "#9333ea", "紫色"],
    ["purple", "#9333ea", "紫色"],
    ["黑", "#111827", "黑色"],
    ["black", "#111827", "黑色"],
    ["白", "#ffffff", "白色"],
    ["white", "#ffffff", "白色"],
    ["灰", "#64748b", "灰色"],
    ["gray", "#64748b", "灰色"],
    ["橙", "#f97316", "橙色"],
    ["orange", "#f97316", "橙色"],
    ["粉", "#ec4899", "粉色"],
    ["pink", "#ec4899", "粉色"]
  ];

  const NUMBER_MAP = new Map([
    ["一", 1],
    ["二", 2],
    ["两", 2],
    ["三", 3],
    ["四", 4],
    ["五", 5],
    ["六", 6],
    ["七", 7],
    ["八", 8],
    ["九", 9],
    ["十", 10]
  ]);

  const POSITION_MAP = [
    ["左上", 0.22, 0.22, "左上"],
    ["右上", 0.78, 0.22, "右上"],
    ["左下", 0.22, 0.78, "左下"],
    ["右下", 0.78, 0.78, "右下"],
    ["上方", 0.5, 0.22, "上方"],
    ["下面", 0.5, 0.78, "下方"],
    ["下方", 0.5, 0.78, "下方"],
    ["左边", 0.22, 0.5, "左边"],
    ["右边", 0.78, 0.5, "右边"],
    ["中间", 0.5, 0.5, "中间"],
    ["中央", 0.5, 0.5, "中间"]
  ];

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[，。！？、,.!?]/g, " ")
      .replace(/\s+/g, "");
  }

  function splitCompoundCommand(text) {
    return String(text || "")
      .split(/然后|接着|并且|以及|再|;|；|，|。/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function detectColor(text, fallback) {
    const normalized = normalizeText(text);
    for (const [key, value, label] of COLOR_MAP) {
      if (normalized.includes(key)) {
        return { value, label };
      }
    }
    return fallback || { value: "#111827", label: "黑色" };
  }

  function detectPosition(text) {
    const normalized = normalizeText(text);
    for (const [key, x, y, label] of POSITION_MAP) {
      if (normalized.includes(key)) {
        return { x, y, label };
      }
    }
    return { x: 0.5, y: 0.5, label: "中间" };
  }

  function detectLineWidth(text, currentWidth) {
    const normalized = normalizeText(text);
    const numberMatch = normalized.match(/(?:线宽|粗细|宽度)(\d{1,2})/);
    if (numberMatch) {
      return clamp(Number(numberMatch[1]), 1, 24);
    }

    for (const [word, value] of NUMBER_MAP.entries()) {
      if (
        normalized.includes(`线宽${word}`) ||
        normalized.includes(`粗细${word}`) ||
        normalized.includes(`宽度${word}`)
      ) {
        return clamp(value, 1, 24);
      }
    }

    if (normalized.includes("粗一点") || normalized.includes("加粗")) {
      return clamp((currentWidth || 4) + 2, 1, 24);
    }

    if (normalized.includes("细一点") || normalized.includes("变细")) {
      return clamp((currentWidth || 4) - 2, 1, 24);
    }

    return currentWidth || 4;
  }

  function detectSize(text) {
    const normalized = normalizeText(text);
    if (normalized.includes("很大") || normalized.includes("大一点") || normalized.includes("大号")) {
      return 0.3;
    }
    if (normalized.includes("小") || normalized.includes("小号")) {
      return 0.12;
    }
    return 0.2;
  }

  function detectShape(text) {
    const normalized = normalizeText(text);
    if (normalized.includes("圆") || normalized.includes("圈")) return "circle";
    if (normalized.includes("矩形") || normalized.includes("方形") || normalized.includes("正方形")) return "rect";
    if (normalized.includes("三角")) return "triangle";
    if (normalized.includes("星")) return "star";
    if (normalized.includes("点")) return "dot";
    if (normalized.includes("线") || normalized.includes("斜线") || normalized.includes("直线")) return "line";
    return null;
  }

  function detectLineEndpoints(text) {
    const normalized = normalizeText(text);
    const pairs = [
      ["左上", "右下", 0.18, 0.18, 0.82, 0.82],
      ["右下", "左上", 0.82, 0.82, 0.18, 0.18],
      ["右上", "左下", 0.82, 0.18, 0.18, 0.82],
      ["左下", "右上", 0.18, 0.82, 0.82, 0.18],
      ["左边", "右边", 0.18, 0.5, 0.82, 0.5],
      ["右边", "左边", 0.82, 0.5, 0.18, 0.5],
      ["上方", "下方", 0.5, 0.18, 0.5, 0.82],
      ["下方", "上方", 0.5, 0.82, 0.5, 0.18]
    ];

    for (const [from, to, x1, y1, x2, y2] of pairs) {
      if (normalized.includes(from) && normalized.includes(to)) {
        return { x1, y1, x2, y2, label: `${from}到${to}` };
      }
    }

    if (normalized.includes("竖")) {
      return { x1: 0.5, y1: 0.2, x2: 0.5, y2: 0.8, label: "竖线" };
    }

    return { x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5, label: "横线" };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeState() {
    return {
      color: "#111827",
      colorLabel: "黑色",
      lineWidth: 4
    };
  }

  function parseSingleCommand(rawText, state) {
    const text = normalizeText(rawText);
    const current = state || makeState();

    if (!text) {
      return { type: "unknown", label: "空命令", rawText };
    }

    if (text.includes("帮助")) {
      return { type: "help", label: "帮助", rawText };
    }

    if (text.includes("清空") || text.includes("重置") || text.includes("擦掉全部")) {
      return { type: "clear", label: "清空画布", rawText };
    }

    if (text.includes("撤销") || text.includes("退回") || text.includes("上一步")) {
      return { type: "undo", label: "撤销", rawText };
    }

    if (text.includes("重做") || text.includes("恢复")) {
      return { type: "redo", label: "重做", rawText };
    }

    if (text.includes("保存") || text.includes("下载") || text.includes("导出")) {
      return { type: "export", label: "保存图片", rawText };
    }

    if (text.includes("背景")) {
      const color = detectColor(text, { value: "#ffffff", label: "白色" });
      return {
        type: "background",
        color: color.value,
        colorLabel: color.label,
        label: `背景${color.label}`,
        rawText
      };
    }

    if (
      text.includes("线宽") ||
      text.includes("粗细") ||
      text.includes("宽度") ||
      text.includes("粗一点") ||
      text.includes("细一点") ||
      text.includes("加粗") ||
      text.includes("变细")
    ) {
      const width = detectLineWidth(text, current.lineWidth);
      return { type: "setLineWidth", width, label: `线宽 ${width}px`, rawText };
    }

    const color = detectColor(text, {
      value: current.color,
      label: current.colorLabel
    });
    const hasColorIntent =
      COLOR_MAP.some(([key]) => text.includes(key)) &&
      (text.includes("颜色") || text.includes("画笔") || text.includes("换成") || text.includes("改成"));

    if (hasColorIntent) {
      return {
        type: "setColor",
        color: color.value,
        colorLabel: color.label,
        label: `画笔${color.label}`,
        rawText
      };
    }

    const shape = detectShape(text);
    if (!shape) {
      return { type: "unknown", label: "未识别", rawText };
    }

    if (shape === "line") {
      const endpoints = detectLineEndpoints(text);
      return {
        type: "drawLine",
        color: color.value,
        colorLabel: color.label,
        lineWidth: detectLineWidth(text, current.lineWidth),
        ...endpoints,
        label: `${color.label}${endpoints.label}`,
        rawText
      };
    }

    const position = detectPosition(text);
    return {
      type: "drawShape",
      shape,
      color: color.value,
      colorLabel: color.label,
      lineWidth: detectLineWidth(text, current.lineWidth),
      size: detectSize(text),
      x: position.x,
      y: position.y,
      positionLabel: position.label,
      label: `${position.label}${color.label}${shapeLabel(shape)}`,
      rawText
    };
  }

  function parseVoiceCommand(text, state) {
    const scratch = {
      color: state?.color || "#111827",
      colorLabel: state?.colorLabel || "黑色",
      lineWidth: state?.lineWidth || 4
    };

    return splitCompoundCommand(text).map((part) => {
      const action = parseSingleCommand(part, scratch);
      if (action.type === "setColor" || action.type === "drawShape" || action.type === "drawLine") {
        scratch.color = action.color;
        scratch.colorLabel = action.colorLabel;
      }
      if (action.type === "setLineWidth") {
        scratch.lineWidth = action.width;
      }
      if (action.type === "drawShape" || action.type === "drawLine") {
        scratch.lineWidth = action.lineWidth;
      }
      return action;
    });
  }

  function shapeLabel(shape) {
    return {
      circle: "圆形",
      rect: "矩形",
      triangle: "三角形",
      star: "星形",
      dot: "点"
    }[shape] || "图形";
  }

  function runParserSelfTest() {
    const state = makeState();
    const cases = [
      ["画一个红色圆形", "drawShape"],
      ["在左上角画蓝色矩形", "drawShape"],
      ["画一条从左上到右下的绿色线", "drawLine"],
      ["线宽五", "setLineWidth"],
      ["清空画布", "clear"],
      ["撤销", "undo"],
      ["重做", "redo"],
      ["保存图片", "export"],
      ["画一个红色圆形，然后在右下角画蓝色矩形", "drawShape,drawShape"],
      ["线宽五，然后画一个红色圆形", "setLineWidth,drawShape"]
    ];

    const failures = [];
    for (const [input, expected] of cases) {
      const actions = parseVoiceCommand(input, state);
      const actual = actions.map((action) => action.type).join(",");
      if (actual !== expected) {
        failures.push({ input, expected, actual });
      }
      if (input.includes("然后") && input.includes("线宽五") && actions[1]?.lineWidth !== 5) {
        failures.push({ input, expected: "second action lineWidth 5", actual: actions[1]?.lineWidth });
      }
    }
    return failures;
  }

  function initBrowserApp() {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    const statusPill = document.getElementById("statusPill");
    const heardText = document.getElementById("heardText");
    const historyList = document.getElementById("historyList");
    const colorPreview = document.getElementById("colorPreview");
    const brushLabel = document.getElementById("brushLabel");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");

    const appState = {
      ...makeState(),
      background: "#ffffff",
      actions: [],
      redoStack: [],
      recognition: null,
      listening: false
    };

    function setStatus(text, kind) {
      statusPill.textContent = text;
      statusPill.classList.toggle("listening", kind === "listening");
      statusPill.classList.toggle("error", kind === "error");
    }

    function speak(text) {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.08;
      window.speechSynthesis.speak(utterance);
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = appState.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const action of appState.actions) {
        if (action.type === "drawShape") drawShape(ctx, canvas, action);
        if (action.type === "drawLine") drawLine(ctx, canvas, action);
      }

      colorPreview.style.background = appState.color;
      brushLabel.textContent = `${appState.colorLabel} · ${appState.lineWidth}px`;
      renderHistory();
    }

    function renderHistory() {
      historyList.innerHTML = "";
      const recent = appState.actions.slice(-8).reverse();
      if (!recent.length) {
        const empty = document.createElement("li");
        empty.textContent = "暂无绘图动作";
        historyList.appendChild(empty);
        return;
      }

      for (const action of recent) {
        const item = document.createElement("li");
        item.textContent = action.label || action.rawText || action.type;
        historyList.appendChild(item);
      }
    }

    function executeAction(action) {
      if (action.type === "unknown") {
        heardText.textContent = `未识别：${action.rawText || ""}`;
        speak("这句我还没有理解，请换一种说法。");
        return;
      }

      if (action.type === "help") {
        heardText.textContent = "可以说：画红色圆形、左上蓝色矩形、撤销、清空、保存图片。";
        speak("可以说画红色圆形，左上蓝色矩形，撤销，清空，保存图片。");
        return;
      }

      if (action.type === "setColor") {
        appState.color = action.color;
        appState.colorLabel = action.colorLabel;
        heardText.textContent = action.label;
        speak(action.label);
        render();
        return;
      }

      if (action.type === "setLineWidth") {
        appState.lineWidth = action.width;
        heardText.textContent = action.label;
        speak(action.label);
        render();
        return;
      }

      if (action.type === "background") {
        appState.background = action.color;
        appState.redoStack = [];
        heardText.textContent = action.label;
        speak(action.label);
        render();
        return;
      }

      if (action.type === "clear") {
        appState.actions = [];
        appState.redoStack = [];
        heardText.textContent = action.label;
        speak("画布已清空");
        render();
        return;
      }

      if (action.type === "undo") {
        const previous = appState.actions.pop();
        if (previous) appState.redoStack.push(previous);
        heardText.textContent = action.label;
        speak(previous ? "已撤销" : "没有可撤销的动作");
        render();
        return;
      }

      if (action.type === "redo") {
        const restored = appState.redoStack.pop();
        if (restored) appState.actions.push(restored);
        heardText.textContent = action.label;
        speak(restored ? "已重做" : "没有可重做的动作");
        render();
        return;
      }

      if (action.type === "export") {
        exportCanvas(canvas);
        heardText.textContent = action.label;
        speak("图片已导出");
        return;
      }

      if (action.type === "drawShape" || action.type === "drawLine") {
        appState.actions.push(action);
        appState.redoStack = [];
        appState.color = action.color;
        appState.colorLabel = action.colorLabel;
        appState.lineWidth = action.lineWidth;
        heardText.textContent = action.label;
        speak(`已绘制${action.label}`);
        render();
      }
    }

    function handleTranscript(transcript) {
      heardText.textContent = transcript;
      const actions = parseVoiceCommand(transcript, appState);
      for (const action of actions) executeAction(action);
    }

    function startRecognition() {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        setStatus("不支持", "error");
        heardText.textContent = "当前浏览器不支持 Web Speech API";
        return;
      }

      if (!appState.recognition) {
        const recognition = new Recognition();
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          appState.listening = true;
          setStatus("监听中", "listening");
        };

        recognition.onend = () => {
          appState.listening = false;
          setStatus("已停止");
        };

        recognition.onerror = (event) => {
          setStatus("异常", "error");
          heardText.textContent = `语音识别异常：${event.error}`;
        };

        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const transcript = event.results[i][0].transcript.trim();
            if (event.results[i].isFinal) {
              handleTranscript(transcript);
            } else {
              interim += transcript;
            }
          }
          if (interim) heardText.textContent = interim;
        };

        appState.recognition = recognition;
      }

      try {
        appState.recognition.start();
      } catch (error) {
        if (!appState.listening) {
          setStatus("异常", "error");
          heardText.textContent = error.message;
        }
      }
    }

    function stopRecognition() {
      if (appState.recognition) appState.recognition.stop();
    }

    startButton.addEventListener("click", startRecognition);
    stopButton.addEventListener("click", stopRecognition);
    render();
  }

  function drawShape(ctx, canvas, action) {
    const x = action.x * canvas.width;
    const y = action.y * canvas.height;
    const size = action.size * Math.min(canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = action.color;
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    if (action.shape === "rect") {
      ctx.fillRect(x - size * 0.65, y - size * 0.45, size * 1.3, size * 0.9);
    }

    if (action.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.65);
      ctx.lineTo(x - size * 0.7, y + size * 0.55);
      ctx.lineTo(x + size * 0.7, y + size * 0.55);
      ctx.closePath();
      ctx.fill();
    }

    if (action.shape === "star") {
      drawStar(ctx, x, y, size * 0.72, size * 0.32, 5);
      ctx.fill();
    }

    if (action.shape === "dot") {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(5, action.lineWidth * 1.7), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawLine(ctx, canvas, action) {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(action.x1 * canvas.width, action.y1 * canvas.height);
    ctx.lineTo(action.x2 * canvas.width, action.y2 * canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  function drawStar(ctx, x, y, outerRadius, innerRadius, points) {
    let rotation = -Math.PI / 2;
    const step = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      ctx.lineTo(x + Math.cos(rotation) * radius, y + Math.sin(rotation) * radius);
      rotation += step;
    }
    ctx.closePath();
  }

  function exportCanvas(canvas) {
    const link = document.createElement("a");
    link.download = `voice-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const api = {
    parseVoiceCommand,
    splitCompoundCommand,
    runParserSelfTest
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (globalScope) {
    globalScope.VoiceDrawing = api;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", initBrowserApp);
  }

  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    const failures = runParserSelfTest();
    if (failures.length) {
      console.error(JSON.stringify(failures, null, 2));
      process.exitCode = 1;
    } else {
      console.log("Parser self-test passed.");
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
