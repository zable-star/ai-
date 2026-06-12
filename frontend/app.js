(function attachVoiceDrawing(globalScope) {
  "use strict";

  const STORAGE_KEYS = {
    users: "voiceDrawing.users",
    session: "voiceDrawing.session",
    model: "voiceDrawing.model"
  };

  const PROVIDER_CONFIGS = {
    openai: {
      label: "OpenAI",
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini"
    },
    deepseek: {
      label: "DeepSeek",
      endpoint: "https://api.deepseek.com/chat/completions",
      model: "deepseek-chat"
    },
    qwen: {
      label: "通义千问",
      endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      model: "qwen-plus"
    },
    moonshot: {
      label: "Moonshot Kimi",
      endpoint: "https://api.moonshot.cn/v1/chat/completions",
      model: "moonshot-v1-8k"
    },
    zhipu: {
      label: "智谱 GLM",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      model: "glm-4-flash"
    },
    other: {
      label: "其他",
      endpoint: "https://api.x.com/v1/chat/completions",
      model: "请输入模型名称"
    }
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
    if (
      (text.includes("开始") || text.includes("启动") || text.includes("继续") || text.includes("打开")) &&
      (text.includes("语音") || text.includes("录音") || text.includes("监听"))
    ) {
      return { type: "voiceStart", label: "启动语音", rawText };
    }
    if (
      (text.includes("停止") || text.includes("暂停") || text.includes("关闭") || text.includes("结束")) &&
      (text.includes("语音") || text.includes("录音") || text.includes("监听"))
    ) {
      return { type: "voiceStop", label: "停止语音", rawText };
    }
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

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function makeBlankModelConfig() {
    const provider = PROVIDER_CONFIGS.openai;
    return {
      id: "",
      name: "",
      enabled: false,
      provider: "openai",
      endpoint: provider.endpoint,
      model: provider.model,
      apiKey: ""
    };
  }

  function createModelProfile(providerKey = "openai") {
    const key = PROVIDER_CONFIGS[providerKey] ? providerKey : "openai";
    const provider = PROVIDER_CONFIGS[key];
    return {
      id: makeId("model"),
      name: `${provider.label} 配置`,
      enabled: false,
      provider: key,
      endpoint: provider.endpoint,
      model: provider.model,
      apiKey: ""
    };
  }

  function normalizeModelProfile(profile) {
    const fallback = createModelProfile("openai");
    const providerKey = PROVIDER_CONFIGS[profile?.provider] ? profile.provider : "openai";
    const provider = PROVIDER_CONFIGS[providerKey];
    return {
      ...fallback,
      ...profile,
      id: profile?.id || makeId("model"),
      name: profile?.name || `${provider.label} 配置`,
      provider: providerKey,
      endpoint: providerKey === "other" ? profile?.endpoint || provider.endpoint : provider.endpoint,
      model: profile?.model || provider.model,
      apiKey: profile?.apiKey || "",
      enabled: Boolean(profile?.enabled)
    };
  }

  function loadUserModelState(username) {
    if (!username) {
      return { profiles: [], activeProfileId: "", activeConfig: makeBlankModelConfig() };
    }

    const users = loadJson(STORAGE_KEYS.users, {});
    const user = users[username] || {};
    let profiles = Array.isArray(user.modelProfiles) ? user.modelProfiles.map(normalizeModelProfile) : [];
    const legacyConfig = loadJson(STORAGE_KEYS.model, null);
    if (!profiles.length && legacyConfig?.apiKey) {
      profiles = [
        normalizeModelProfile({
          id: makeId("model"),
          name: "已迁移配置",
          provider: "other",
          endpoint: legacyConfig.endpoint,
          model: legacyConfig.model,
          apiKey: legacyConfig.apiKey,
          enabled: Boolean(legacyConfig.enabled)
        })
      ];
      users[username] = { ...user, modelProfiles: profiles, activeModelProfileId: profiles[0].id };
      saveJson(STORAGE_KEYS.users, users);
      localStorage.removeItem(STORAGE_KEYS.model);
    }

    const activeProfileId = profiles.some((profile) => profile.id === user.activeModelProfileId)
      ? user.activeModelProfileId
      : profiles[0]?.id || "";
    const activeConfig = profiles.find((profile) => profile.id === activeProfileId) || makeBlankModelConfig();
    return { profiles, activeProfileId, activeConfig };
  }

  function saveUserModelState(username, profiles, activeProfileId) {
    if (!username) return;
    const users = loadJson(STORAGE_KEYS.users, {});
    const user = users[username] || {};
    const normalized = profiles.map(normalizeModelProfile);
    users[username] = {
      ...user,
      modelProfiles: normalized,
      activeModelProfileId: activeProfileId || normalized[0]?.id || ""
    };
    saveJson(STORAGE_KEYS.users, users);
  }

  function loadModelConfigForUser(username) {
    return loadUserModelState(username).activeConfig;
  }

  function hasUsableModelConfig(config) {
    return Boolean(config?.enabled && config.endpoint && config.model && config.apiKey);
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
      ["停止语音", "voiceStop"],
      ["开始语音", "voiceStart"],
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
    const brandLogo = document.getElementById("brandLogo");
    const statusPill = document.getElementById("statusPill");
    const modelPill = document.getElementById("modelPill");
    const heardText = document.getElementById("heardText");
    const historyList = document.getElementById("historyList");
    const historySummary = document.getElementById("historySummary");
    const historyDialog = document.getElementById("historyDialog");
    const openHistoryButton = document.getElementById("openHistoryButton");
    const closeHistoryButton = document.getElementById("closeHistoryButton");
    const colorPreview = document.getElementById("colorPreview");
    const brushLabel = document.getElementById("brushLabel");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const demoButton = document.getElementById("demoButton");
    const exportFormat = document.getElementById("exportFormat");
    const exportButton = document.getElementById("exportButton");
    const modelHintBar = document.getElementById("modelHintBar");
    const modelHintJump = document.getElementById("modelHintJump");
    const dismissModelHint = document.getElementById("dismissModelHint");

    const appState = {
      ...makeState(),
      background: "#ffffff",
      actions: [],
      conversationLog: [],
      redoStack: [],
      recognition: null,
      listening: false,
      modelHintDismissed: false,
      currentUser: loadJson(STORAGE_KEYS.session, null),
      modelConfig: loadModelConfigForUser(loadJson(STORAGE_KEYS.session, null)?.username)
    };

    const selectTab = setupTabs();
    setupHistoryDialog();
    setupModelHint(selectTab);
    setupAccountForms(appState);
    setupModelFormV2(appState);
    updateUserSummary(appState);
    updateModelUi(appState);

    function setStatus(text, kind) {
      statusPill.textContent = text;
      statusPill.classList.toggle("listening", kind === "listening");
      statusPill.classList.toggle("error", kind === "error");
      brandLogo?.classList.toggle("listening-mode", kind === "listening");
      brandLogo?.classList.toggle("error-mode", kind === "error");
    }

    function updateVoiceButtons() {
      startButton.classList.toggle("is-active", appState.listening);
      stopButton.classList.toggle("is-active", !appState.listening);
      startButton.setAttribute("aria-pressed", String(appState.listening));
      stopButton.setAttribute("aria-pressed", String(!appState.listening));
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
      const entries = appState.conversationLog.slice().reverse();
      const latestAction = appState.actions[appState.actions.length - 1];
      historySummary.textContent = latestAction ? `最近：${latestAction.label || latestAction.type}` : "暂无绘图动作";

      if (!entries.length) {
        const empty = document.createElement("li");
        empty.textContent = "暂无语音对话记录";
        historyList.appendChild(empty);
        return;
      }

      for (const entry of entries) {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${entry.kind}</strong><span>${entry.text}</span>`;
        historyList.appendChild(item);
      }
    }

    function addConversation(kind, text) {
      appState.conversationLog.push({
        kind,
        text,
        time: new Date().toLocaleTimeString()
      });
      if (appState.conversationLog.length > 80) appState.conversationLog.shift();
      renderHistory();
    }

    function executeAction(action) {
      if (action.type === "unknown") {
        heardText.textContent = `未识别：${action.rawText || ""}`;
        addConversation("系统", `未识别：${action.rawText || ""}`);
        speak("这句我还没有理解，请换一种说法。");
        return;
      }
      if (action.type === "help") {
        heardText.textContent = "可以说：画红色圆形、左上蓝色矩形、撤销、清空、保存图片。";
        addConversation("系统", "展示帮助命令");
        speak("可以说画红色圆形，左上蓝色矩形，撤销，清空，保存图片。");
        return;
      }
      if (action.type === "voiceStart") {
        heardText.textContent = action.label;
        addConversation("执行", "启动语音识别");
        speak("已启动语音");
        startRecognition();
        return;
      }
      if (action.type === "voiceStop") {
        heardText.textContent = action.label;
        addConversation("执行", "停止语音识别");
        speak("已停止语音");
        stopRecognition();
        return;
      }
      if (action.type === "setColor") {
        appState.color = action.color;
        appState.colorLabel = action.colorLabel;
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label);
        render();
        return;
      }
      if (action.type === "setLineWidth") {
        appState.lineWidth = action.width;
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label);
        render();
        return;
      }
      if (action.type === "background") {
        appState.background = action.color;
        appState.redoStack = [];
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label);
        render();
        return;
      }
      if (action.type === "clear") {
        appState.actions = [];
        appState.redoStack = [];
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak("画布已清空");
        render();
        return;
      }
      if (action.type === "undo") {
        const previous = appState.actions.pop();
        if (previous) appState.redoStack.push(previous);
        heardText.textContent = action.label;
        addConversation("执行", previous ? "撤销上一笔" : "没有可撤销的动作");
        speak(previous ? "已撤销" : "没有可撤销的动作");
        render();
        return;
      }
      if (action.type === "redo") {
        const restored = appState.redoStack.pop();
        if (restored) appState.actions.push(restored);
        heardText.textContent = action.label;
        addConversation("执行", restored ? "重做上一笔" : "没有可重做的动作");
        speak(restored ? "已重做" : "没有可重做的动作");
        render();
        return;
      }
      if (action.type === "export") {
        exportCanvas(canvas, exportFormat?.value || "png");
        heardText.textContent = action.label;
        addConversation("执行", "保存图片");
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
        addConversation("执行", action.label);
        speak(`已绘制${action.label}`);
        render();
      }
    }

    async function handleTranscript(transcript) {
      heardText.textContent = transcript;
      addConversation("用户", transcript);
      let actions = parseVoiceCommand(transcript, appState);

      if (allActionsUnknown(actions) && hasUsableModelConfig(appState.modelConfig)) {
        setStatus("模型规划中", "listening");
        try {
          actions = await planWithModel(transcript, appState, appState.modelConfig);
          if (!actions.length) actions = [{ type: "unknown", rawText: transcript, label: "模型未返回动作" }];
          heardText.textContent = `模型规划：${actions.map((action) => action.label || action.type).join("，")}`;
          addConversation("模型", actions.map((action) => action.label || action.type).join("，"));
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
          updateVoiceButtons();
        };
        recognition.onend = () => {
          appState.listening = false;
          setStatus("已停止");
          updateVoiceButtons();
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
      if (appState.recognition && appState.listening) {
        appState.recognition.stop();
        return;
      }
      appState.listening = false;
      setStatus("已停止");
      updateVoiceButtons();
    }

    startButton.addEventListener("click", startRecognition);
    stopButton.addEventListener("click", stopRecognition);
    demoButton.addEventListener("click", () => {
      handleTranscript("画一个红色圆形，然后在右下角画蓝色矩形，再画一条从左上到右下的绿色线");
    });
    exportButton.addEventListener("click", () => {
      exportCanvas(canvas, exportFormat?.value || "png");
      addConversation("执行", `导出 ${String(exportFormat?.value || "png").toUpperCase()} 图片`);
      heardText.textContent = "图片已导出";
    });
    updateVoiceButtons();
    render();

    function setupHistoryDialog() {
      openHistoryButton.addEventListener("click", () => {
        if (typeof historyDialog.showModal === "function") {
          historyDialog.showModal();
        }
      });
      closeHistoryButton.addEventListener("click", () => historyDialog.close());
      historyDialog.addEventListener("click", (event) => {
        if (event.target === historyDialog) historyDialog.close();
      });
    }

    function setupModelHint(selectTab) {
      dismissModelHint.addEventListener("click", () => {
        appState.modelHintDismissed = true;
        updateModelUi(appState);
      });
      modelHintJump.addEventListener("click", () => selectTab("model"));
    }
  }

  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-button"));
    const panels = Array.from(document.querySelectorAll(".tab-panel"));
    function selectTab(target) {
      const button = buttons.find((item) => item.dataset.tab === target);
      if (!button) return;
      button.classList.remove("tab-clicked");
      void button.offsetWidth;
      button.classList.add("tab-clicked");
      buttons.forEach((item) => item.classList.toggle("active", item === button));
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === `${target}Tab`));
    }
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        selectTab(button.dataset.tab);
      });
    });
    return selectTab;
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
      appState.modelConfig = loadModelConfigForUser(username);
      updateUserSummary(appState);
      updateModelUi(appState);
      window.dispatchEvent(new CustomEvent("user-model-state-changed"));
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
      appState.modelConfig = loadModelConfigForUser(username);
      updateUserSummary(appState);
      updateModelUi(appState);
      window.dispatchEvent(new CustomEvent("user-model-state-changed"));
      message.textContent = `已登录：${username}`;
      loginForm.reset();
    });

    logoutButton.addEventListener("click", () => {
      appState.currentUser = null;
      appState.modelConfig = makeBlankModelConfig();
      localStorage.removeItem(STORAGE_KEYS.session);
      updateUserSummary(appState);
      updateModelUi(appState);
      window.dispatchEvent(new CustomEvent("user-model-state-changed"));
      message.textContent = "已退出登录。";
    });
  }

  function setupModelFormV2(appState) {
    const enabled = document.getElementById("modelEnabled");
    const profileSelect = document.getElementById("modelProfileSelect");
    const profileCards = document.getElementById("modelProfileCards");
    const addProfileButton = document.getElementById("addModelProfileButton");
    const deleteProfileButton = document.getElementById("deleteModelProfileButton");
    const profileName = document.getElementById("modelProfileName");
    const provider = document.getElementById("modelProvider");
    const endpoint = document.getElementById("modelEndpoint");
    const model = document.getElementById("modelName");
    const customEndpointField = document.getElementById("customEndpointField");
    const apiKey = document.getElementById("modelApiKey");
    const form = document.getElementById("modelForm");
    const saveButton = form.querySelector("button[type='submit']");
    const testButton = document.getElementById("testModelButton");
    const message = document.getElementById("modelMessage");
    const loginHint = document.getElementById("modelLoginHint");

    let profiles = [];
    let activeProfileId = "";

    refreshFromAccount();
    window.addEventListener("user-model-state-changed", refreshFromAccount);

    profileSelect.addEventListener("change", () => {
      activeProfileId = profileSelect.value;
      persistProfiles();
      fillForm(getActiveProfile());
      appState.modelConfig = getActiveProfile();
      updateModelUi(appState);
    });

    addProfileButton.addEventListener("click", () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号，再新增 API 配置。";
        return;
      }
      const created = createModelProfile(provider.value || "openai");
      created.name = `模型配置 ${profiles.length + 1}`;
      profiles.push(created);
      activeProfileId = created.id;
      persistProfiles();
      renderProfileOptions();
      renderProfileCards();
      fillForm(created);
      appState.modelConfig = created;
      updateModelUi(appState);
      message.textContent = "已新增一个模型配置。";
    });

    deleteProfileButton.addEventListener("click", () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号。";
        return;
      }
      if (!profiles.length) {
        message.textContent = "当前没有可删除的配置。";
        return;
      }
      profiles = profiles.filter((profile) => profile.id !== activeProfileId);
      activeProfileId = profiles[0]?.id || "";
      persistProfiles();
      renderProfileOptions();
      renderProfileCards();
      fillForm(getActiveProfile());
      appState.modelConfig = getActiveProfile();
      updateModelUi(appState);
      message.textContent = "已删除当前模型配置。";
    });

    provider.addEventListener("change", () => {
      const providerConfig = PROVIDER_CONFIGS[provider.value] || PROVIDER_CONFIGS.openai;
      if (provider.value !== "other") {
        endpoint.value = providerConfig.endpoint;
        if (!model.value.trim() || Object.values(PROVIDER_CONFIGS).some((item) => item.model === model.value.trim())) {
          model.value = providerConfig.model;
        }
      } else {
        endpoint.value = PROVIDER_CONFIGS.other.endpoint;
        if (!model.value.trim() || Object.values(PROVIDER_CONFIGS).some((item) => item.model === model.value.trim())) {
          model.value = "";
        }
      }
      updateProviderFields();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!appState.currentUser) {
        message.textContent = "请先登录账号，再保存 API 配置。";
        return;
      }
      const profile = readFormProfile();
      if (!profile.endpoint || !profile.model || !profile.apiKey) {
        message.textContent = "请填写 Endpoint、模型名称和 API Key。";
        return;
      }
      upsertActiveProfile(profile);
      appState.modelConfig = profile;
      persistProfiles();
      renderProfileOptions();
      renderProfileCards();
      fillForm(profile);
      updateModelUi(appState);
      message.textContent = "模型配置已保存到当前账号。";
    });

    testButton.addEventListener("click", async () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号，再测试模型。";
        return;
      }
      const profile = readFormProfile();
      if (!profile.endpoint || !profile.model || !profile.apiKey) {
        message.textContent = "请填写 Endpoint、模型名称和 API Key。";
        return;
      }
      upsertActiveProfile(profile);
      appState.modelConfig = profile;
      persistProfiles();
      updateModelUi(appState);
      message.textContent = "正在测试模型...";
      try {
        const actions = await planWithModel("画一个红色圆形和蓝色矩形", makeState(), { ...profile, enabled: true });
        message.textContent = actions.length ? `测试成功，返回 ${actions.length} 个动作。` : "模型可用，但没有返回动作。";
      } catch (error) {
        message.textContent = error.message;
      }
    });

    function refreshFromAccount() {
      const userState = loadUserModelState(appState.currentUser?.username);
      profiles = userState.profiles;
      activeProfileId = userState.activeProfileId;
      appState.modelConfig = userState.activeConfig;
      renderProfileOptions();
      renderProfileCards();
      fillForm(userState.activeConfig);
      updateFormAvailability();
      updateModelUi(appState);
    }

    function renderProfileOptions() {
      profileSelect.innerHTML = "";
      if (!profiles.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "暂无配置";
        profileSelect.appendChild(option);
        return;
      }
      for (const profile of profiles) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name || profile.model || "未命名配置";
        profileSelect.appendChild(option);
      }
      profileSelect.value = activeProfileId;
    }

    function renderProfileCards() {
      profileCards.innerHTML = "";
      if (!profiles.length) {
        const empty = document.createElement("p");
        empty.className = "profile-empty";
        empty.textContent = appState.currentUser ? "保存模型配置后，会在这里出现快捷选择卡片。" : "登录后可保存并选择多个模型 API。";
        profileCards.appendChild(empty);
        return;
      }
      for (const profile of profiles) {
        const providerConfig = PROVIDER_CONFIGS[profile.provider] || PROVIDER_CONFIGS.other;
        const card = document.createElement("button");
        card.className = "model-profile-card";
        card.type = "button";
        card.dataset.profileId = profile.id;
        card.classList.toggle("active", profile.id === activeProfileId && hasUsableModelConfig(profile));
        card.innerHTML = `
          <span class="card-drag" aria-hidden="true">::</span>
          <span class="card-logo" aria-hidden="true">${providerConfig.label.slice(0, 1)}</span>
          <span class="card-main">
            <strong>${profile.name || providerConfig.label}</strong>
            <span>${profile.endpoint || providerConfig.endpoint}</span>
          </span>
        `;
        card.addEventListener("click", () => {
          const selected = profiles.find((item) => item.id === profile.id);
          if (!selected) return;
          activeProfileId = selected.id;
          selected.enabled = true;
          persistProfiles();
          renderProfileOptions();
          renderProfileCards();
          fillForm(selected);
          appState.modelConfig = selected;
          updateModelUi(appState);
          message.textContent = `已选择并启用：${selected.name || selected.model}`;
        });
        profileCards.appendChild(card);
      }
    }

    function fillForm(profile) {
      const current = profile?.id ? normalizeModelProfile(profile) : makeBlankModelConfig();
      enabled.checked = Boolean(current.enabled);
      profileName.value = current.name || "";
      provider.value = PROVIDER_CONFIGS[current.provider] ? current.provider : "openai";
      endpoint.value = current.endpoint || "";
      model.value = current.model || "";
      apiKey.value = current.apiKey || "";
      updateProviderFields();
    }

    function readFormProfile() {
      const providerKey = PROVIDER_CONFIGS[provider.value] ? provider.value : "openai";
      const providerConfig = PROVIDER_CONFIGS[providerKey];
      const existing = getActiveProfile();
      return normalizeModelProfile({
        ...existing,
        id: existing.id || makeId("model"),
        name: profileName.value.trim() || `${providerConfig.label} 配置`,
        enabled: enabled.checked,
        provider: providerKey,
        endpoint: providerKey === "other" ? endpoint.value.trim() : providerConfig.endpoint,
        model: model.value.trim() || providerConfig.model,
        apiKey: apiKey.value.trim()
      });
    }

    function getActiveProfile() {
      return profiles.find((profile) => profile.id === activeProfileId) || makeBlankModelConfig();
    }

    function upsertActiveProfile(profile) {
      const index = profiles.findIndex((item) => item.id === profile.id);
      if (index >= 0) {
        profiles[index] = profile;
      } else {
        profiles.push(profile);
      }
      activeProfileId = profile.id;
    }

    function persistProfiles() {
      saveUserModelState(appState.currentUser?.username, profiles, activeProfileId);
    }

    function updateProviderFields() {
      const providerKey = PROVIDER_CONFIGS[provider.value] ? provider.value : "openai";
      const providerConfig = PROVIDER_CONFIGS[providerKey];
      const isOther = providerKey === "other";
      customEndpointField.hidden = !isOther;
      endpoint.disabled = !isOther;
      if (!isOther) endpoint.value = providerConfig.endpoint;
    }

    function updateFormAvailability() {
      const loggedIn = Boolean(appState.currentUser);
      loginHint.textContent = loggedIn ? "API 配置会保存到当前登录账号。" : "请先登录账号；未登录时不会加载或保存 API。";
      for (const control of [
        profileSelect,
        deleteProfileButton,
        enabled,
        profileName,
        provider,
        model,
        apiKey,
        testButton,
        saveButton
      ]) {
        control.disabled = !loggedIn;
      }
      addProfileButton.disabled = !loggedIn;
      endpoint.disabled = !loggedIn || provider.value !== "other";
    }
  }

  function updateUserSummary(appState) {
    const summary = document.getElementById("userSummary");
    summary.textContent = appState.currentUser ? `已登录：${appState.currentUser.username}` : "未登录";
  }

  function updateModelUi(appState) {
    const pill = document.getElementById("modelPill");
    const hintBar = document.getElementById("modelHintBar");
    const modelReady = hasUsableModelConfig(appState.modelConfig);
    pill.textContent = modelReady ? `模型：${appState.modelConfig.model || "未命名"}` : "离线解析";
    pill.classList.toggle("enabled", modelReady);
    if (hintBar) {
      hintBar.hidden = modelReady || Boolean(appState.modelHintDismissed);
    }
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

  function exportCanvas(canvas, format = "png") {
    const normalized = ["png", "jpeg", "webp"].includes(format) ? format : "png";
    const mimeType = normalized === "jpg" || normalized === "jpeg" ? "image/jpeg" : `image/${normalized}`;
    const exportTarget = document.createElement("canvas");
    exportTarget.width = canvas.width;
    exportTarget.height = canvas.height;
    const exportCtx = exportTarget.getContext("2d");
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportTarget.width, exportTarget.height);
    exportCtx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = `voice-drawing-${Date.now()}.${normalized === "jpeg" ? "jpg" : normalized}`;
    link.href = exportTarget.toDataURL(mimeType, normalized === "png" ? undefined : 0.92);
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
