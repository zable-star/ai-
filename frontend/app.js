(function attachVoiceDrawing(globalScope) {
  "use strict";

  const STORAGE_KEYS = {
    users: "voiceDrawing.users",
    session: "voiceDrawing.session",
    model: "voiceDrawing.model"
  };

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

  const SHAPE_LABELS = {
    circle: "圆形",
    rect: "矩形",
    triangle: "三角形",
    star: "星形",
    dot: "点"
  };

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
    if (numberMatch) return clamp(Number(numberMatch[1]), 1, 24);

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
    if (normalized.includes("很大") || normalized.includes("大一点") || normalized.includes("大号")) return 0.3;
    if (normalized.includes("小") || normalized.includes("小号")) return 0.12;
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

    if (!text) return { type: "unknown", label: "空命令", rawText };
    if (text.includes("帮助")) return { type: "help", label: "帮助", rawText };
    if (text.includes("清空") || text.includes("重置") || text.includes("擦掉全部")) {
      return { type: "clear", label: "清空画布", rawText };
    }
    if (text.includes("撤销") || text.includes("退回") || text.includes("上一步")) {
      return { type: "undo", label: "撤销", rawText };
    }
    if (text.includes("重做") || text.includes("恢复")) return { type: "redo", label: "重做", rawText };
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

    const color = detectColor(text, { value: current.color, label: current.colorLabel });
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
    if (!shape) return { type: "unknown", label: "未识别", rawText };

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
      if (action.type === "setLineWidth") scratch.lineWidth = action.width;
      if (action.type === "drawShape" || action.type === "drawLine") scratch.lineWidth = action.lineWidth;
      return action;
    });
  }

  function shapeLabel(shape) {
    return SHAPE_LABELS[shape] || "图形";
  }

  function allActionsUnknown(actions) {
    return actions.length === 0 || actions.every((action) => action.type === "unknown");
  }

  function sanitizeModelActions(rawActions, state) {
    const current = state || makeState();
    if (!Array.isArray(rawActions)) return [];
    return rawActions
      .map((action) => {
        if (!action || typeof action !== "object") return null;
        if (["clear", "undo", "redo", "export"].includes(action.type)) {
          return { type: action.type, label: action.label || action.type, rawText: "model" };
        }
        if (action.type === "setLineWidth") {
          const width = clamp(Number(action.width) || current.lineWidth || 4, 1, 24);
          return { type: "setLineWidth", width, label: `线宽 ${width}px`, rawText: "model" };
        }
        const color = normalizeModelColor(action.color, action.colorLabel, current);
        if (action.type === "setColor") {
          return {
            type: "setColor",
            color: color.value,
            colorLabel: color.label,
            label: `画笔${color.label}`,
            rawText: "model"
          };
        }
        if (action.type === "drawLine") {
          return {
            type: "drawLine",
            color: color.value,
            colorLabel: color.label,
            lineWidth: clamp(Number(action.lineWidth) || current.lineWidth || 4, 1, 24),
            x1: clamp(Number(action.x1) || 0.2, 0, 1),
            y1: clamp(Number(action.y1) || 0.5, 0, 1),
            x2: clamp(Number(action.x2) || 0.8, 0, 1),
            y2: clamp(Number(action.y2) || 0.5, 0, 1),
            label: action.label || `${color.label}线条`,
            rawText: "model"
          };
        }
        if (action.type === "drawShape" && SHAPE_LABELS[action.shape]) {
          return {
            type: "drawShape",
            shape: action.shape,
            color: color.value,
            colorLabel: color.label,
            lineWidth: clamp(Number(action.lineWidth) || current.lineWidth || 4, 1, 24),
            size: clamp(Number(action.size) || 0.2, 0.06, 0.36),
            x: clamp(Number(action.x) || 0.5, 0.05, 0.95),
            y: clamp(Number(action.y) || 0.5, 0.05, 0.95),
            positionLabel: action.positionLabel || "模型规划",
            label: action.label || `${color.label}${shapeLabel(action.shape)}`,
            rawText: "model"
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function normalizeModelColor(value, label, state) {
    if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
      return { value, label: label || value };
    }
    const detected = detectColor(String(label || value || ""), null);
    if (detected) return detected;
    return { value: state?.color || "#111827", label: state?.colorLabel || "黑色" };
  }

  function modelSystemPrompt() {
    return [
      "你是语音绘图工具的指令规划器。",
      "把用户中文绘图描述转换为 JSON 数组，不要输出 markdown。",
      "允许动作：",
      "drawShape: {type:'drawShape', shape:'circle|rect|triangle|star|dot', color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, size:0.06-0.36, lineWidth:1-24, label:'简短中文'}",
      "drawLine: {type:'drawLine', color:'#RRGGBB', colorLabel:'中文颜色', x1:0-1, y1:0-1, x2:0-1, y2:0-1, lineWidth:1-24, label:'简短中文'}",
      "setColor, setLineWidth, clear, undo, redo, export。",
      "只返回 JSON 数组。"
    ].join("\n");
  }

  // OpenAI-compatible chat-completions endpoint, supplied by the user in the UI.
  async function planWithModel(text, state, config) {
    if (!config?.enabled || !config.endpoint || !config.apiKey || !config.model) return [];
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.1,
        messages: [
          { role: "system", content: modelSystemPrompt() },
          {
            role: "user",
            content: JSON.stringify({
              utterance: text,
              currentColor: state.colorLabel,
              currentLineWidth: state.lineWidth
            })
          }
        ]
      })
    });
    const data = await readApiJson(response);
    if (!response.ok) {
      throw new Error(data?.error?.message || `模型请求失败：${response.status}`);
    }
    const content = data?.choices?.[0]?.message?.content || "";
    const jsonText = extractJsonArray(content);
    return sanitizeModelActions(JSON.parse(jsonText), state);
  }

  async function readApiJson(response) {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const trimmed = text.trim();
    const looksJson = contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");

    if (!looksJson) {
      if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
        throw new Error("API Endpoint 返回了网页 HTML，不是模型 JSON。请填写完整的 /v1/chat/completions 地址。");
      }
      throw new Error(`API Endpoint 返回 ${contentType || "未知类型"}，不是 JSON。请检查服务商接口地址。`);
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error("API Endpoint 返回内容不是合法 JSON。请检查接口地址和模型服务商配置。");
    }
  }

  function extractJsonArray(content) {
    const text = String(content || "").trim();
    if (text.startsWith("[")) return text;
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    throw new Error("模型没有返回 JSON 数组");
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function hashPassword(password, salt) {
    const input = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function makeSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function loadModelConfig() {
    return {
      enabled: false,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      apiKey: "",
      ...loadJson(STORAGE_KEYS.model, {})
    };
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
      if (actual !== expected) failures.push({ input, expected, actual });
      if (input.includes("然后") && input.includes("线宽五") && actions[1]?.lineWidth !== 5) {
        failures.push({ input, expected: "second action lineWidth 5", actual: actions[1]?.lineWidth });
      }
    }

    const sanitized = sanitizeModelActions(
      [{ type: "drawShape", shape: "circle", color: "#ef4444", x: 0.2, y: 0.3, size: 0.2 }],
      state
    );
    if (sanitized[0]?.type !== "drawShape") {
      failures.push({ input: "sanitizeModelActions", expected: "drawShape", actual: sanitized[0]?.type });
    }

    return failures;
  }

  async function runAsyncSelfTest() {
    const failures = runParserSelfTest();
    const fakeHtmlResponse = {
      ok: true,
      headers: { get: () => "text/html" },
      text: async () => "<!doctype html><html></html>"
    };
    try {
      await readApiJson(fakeHtmlResponse);
      failures.push({ input: "readApiJson html", expected: "throw", actual: "no throw" });
    } catch (error) {
      if (!String(error.message).includes("网页 HTML")) {
        failures.push({ input: "readApiJson html", expected: "HTML endpoint hint", actual: error.message });
      }
    }
    return failures;
  }

  function initBrowserApp() {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    const statusPill = document.getElementById("statusPill");
    const modelPill = document.getElementById("modelPill");
    const heardText = document.getElementById("heardText");
    const historyList = document.getElementById("historyList");
    const colorPreview = document.getElementById("colorPreview");
    const brushLabel = document.getElementById("brushLabel");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const demoButton = document.getElementById("demoButton");

    const appState = {
      ...makeState(),
      background: "#ffffff",
      actions: [],
      redoStack: [],
      recognition: null,
      listening: false,
      currentUser: loadJson(STORAGE_KEYS.session, null),
      modelConfig: loadModelConfig()
    };

    setupTabs();
    setupAccountForms(appState);
    setupModelForm(appState);
    updateUserSummary(appState);
    updateModelUi(appState);

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
      const recent = appState.actions.slice(-10).reverse();
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

    async function handleTranscript(transcript) {
      heardText.textContent = transcript;
      let actions = parseVoiceCommand(transcript, appState);

      if (allActionsUnknown(actions) && appState.modelConfig.enabled) {
        setStatus("模型规划中", "listening");
        try {
          actions = await planWithModel(transcript, appState, appState.modelConfig);
          if (!actions.length) actions = [{ type: "unknown", rawText: transcript, label: "模型未返回动作" }];
          heardText.textContent = `模型规划：${actions.map((action) => action.label || action.type).join("，")}`;
        } catch (error) {
          actions = [{ type: "unknown", rawText: error.message, label: "模型错误" }];
        } finally {
          setStatus(appState.listening ? "监听中" : "已停止", appState.listening ? "listening" : undefined);
        }
      }

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

    startButton.addEventListener("click", startRecognition);
    stopButton.addEventListener("click", () => appState.recognition?.stop());
    demoButton.addEventListener("click", () => {
      handleTranscript("画一个红色圆形，然后在右下角画蓝色矩形，再画一条从左上到右下的绿色线");
    });
    render();
  }

  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-button"));
    const panels = Array.from(document.querySelectorAll(".tab-panel"));
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tab;
        buttons.forEach((item) => item.classList.toggle("active", item === button));
        panels.forEach((panel) => panel.classList.toggle("active", panel.id === `${target}Tab`));
      });
    });
  }

  function setupAccountForms(appState) {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const logoutButton = document.getElementById("logoutButton");
    const message = document.getElementById("accountMessage");

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("registerName").value.trim();
      const password = document.getElementById("registerPassword").value;
      const users = loadJson(STORAGE_KEYS.users, {});
      if (users[username]) {
        message.textContent = "该用户名已存在。";
        return;
      }
      const salt = makeSalt();
      users[username] = {
        salt,
        passwordHash: await hashPassword(password, salt),
        createdAt: new Date().toISOString()
      };
      saveJson(STORAGE_KEYS.users, users);
      appState.currentUser = { username };
      saveJson(STORAGE_KEYS.session, appState.currentUser);
      updateUserSummary(appState);
      message.textContent = `已注册并登录：${username}`;
      registerForm.reset();
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("loginName").value.trim();
      const password = document.getElementById("loginPassword").value;
      const users = loadJson(STORAGE_KEYS.users, {});
      const user = users[username];
      if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
        message.textContent = "用户名或密码不正确。";
        return;
      }
      appState.currentUser = { username };
      saveJson(STORAGE_KEYS.session, appState.currentUser);
      updateUserSummary(appState);
      message.textContent = `已登录：${username}`;
      loginForm.reset();
    });

    logoutButton.addEventListener("click", () => {
      appState.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.session);
      updateUserSummary(appState);
      message.textContent = "已退出登录。";
    });
  }

  function setupModelForm(appState) {
    const enabled = document.getElementById("modelEnabled");
    const endpoint = document.getElementById("modelEndpoint");
    const model = document.getElementById("modelName");
    const apiKey = document.getElementById("modelApiKey");
    const form = document.getElementById("modelForm");
    const testButton = document.getElementById("testModelButton");
    const message = document.getElementById("modelMessage");

    enabled.checked = Boolean(appState.modelConfig.enabled);
    endpoint.value = appState.modelConfig.endpoint || "";
    model.value = appState.modelConfig.model || "";
    apiKey.value = appState.modelConfig.apiKey || "";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      appState.modelConfig = {
        enabled: enabled.checked,
        endpoint: endpoint.value.trim(),
        model: model.value.trim(),
        apiKey: apiKey.value.trim()
      };
      saveJson(STORAGE_KEYS.model, appState.modelConfig);
      updateModelUi(appState);
      message.textContent = "模型配置已保存。";
    });

    testButton.addEventListener("click", async () => {
      appState.modelConfig = {
        enabled: enabled.checked,
        endpoint: endpoint.value.trim(),
        model: model.value.trim(),
        apiKey: apiKey.value.trim()
      };
      saveJson(STORAGE_KEYS.model, appState.modelConfig);
      updateModelUi(appState);
      message.textContent = "正在测试模型...";
      try {
        const actions = await planWithModel("画一个红色圆形和蓝色矩形", makeState(), appState.modelConfig);
        message.textContent = actions.length ? `测试成功，返回 ${actions.length} 个动作。` : "模型可用，但没有返回动作。";
      } catch (error) {
        message.textContent = error.message;
      }
    });
  }

  function updateUserSummary(appState) {
    const summary = document.getElementById("userSummary");
    summary.textContent = appState.currentUser ? `已登录：${appState.currentUser.username}` : "未登录";
  }

  function updateModelUi(appState) {
    const pill = document.getElementById("modelPill");
    pill.textContent = appState.modelConfig.enabled ? `模型：${appState.modelConfig.model || "未命名"}` : "本地规则";
    pill.classList.toggle("enabled", Boolean(appState.modelConfig.enabled));
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
    sanitizeModelActions,
    extractJsonArray,
    runParserSelfTest,
    runAsyncSelfTest
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.VoiceDrawing = api;
  if (typeof window !== "undefined") window.addEventListener("DOMContentLoaded", initBrowserApp);

  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    runAsyncSelfTest().then((failures) => {
      if (failures.length) {
        console.error(JSON.stringify(failures, null, 2));
        process.exitCode = 1;
      } else {
        console.log("Parser self-test passed.");
      }
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
