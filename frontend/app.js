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
    ["浅蓝", "#38bdf8", "浅蓝色"],
    ["天蓝", "#38bdf8", "天蓝色"],
    ["深蓝", "#1d4ed8", "深蓝色"],
    ["深红", "#b91c1c", "深红色"],
    ["橙黄", "#f59e0b", "橙黄色"],
    ["草绿", "#22c55e", "草绿色"],
    ["金色", "#f59e0b", "金色"],
    ["棕色", "#92400e", "棕色"],
    ["褐色", "#7c2d12", "褐色"],
    ["青色", "#06b6d4", "青色"],
    ["红色", "#ef4444", "红色"],
    ["红", "#ef4444", "红色"],
    ["red", "#ef4444", "红色"],
    ["蓝色", "#2563eb", "蓝色"],
    ["蓝", "#2563eb", "蓝色"],
    ["blue", "#2563eb", "蓝色"],
    ["绿色", "#16a34a", "绿色"],
    ["绿", "#16a34a", "绿色"],
    ["green", "#16a34a", "绿色"],
    ["黄色", "#eab308", "黄色"],
    ["黄", "#eab308", "黄色"],
    ["yellow", "#eab308", "黄色"],
    ["紫色", "#9333ea", "紫色"],
    ["紫", "#9333ea", "紫色"],
    ["purple", "#9333ea", "紫色"],
    ["黑色", "#111827", "黑色"],
    ["黑", "#111827", "黑色"],
    ["black", "#111827", "黑色"],
    ["白色", "#ffffff", "白色"],
    ["白", "#ffffff", "白色"],
    ["white", "#ffffff", "白色"],
    ["灰色", "#64748b", "灰色"],
    ["灰", "#64748b", "灰色"],
    ["gray", "#64748b", "灰色"],
    ["橙色", "#f97316", "橙色"],
    ["橙", "#f97316", "橙色"],
    ["orange", "#f97316", "橙色"],
    ["粉色", "#ec4899", "粉色"],
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

  const SCENE_LABELS = {
    house: "房子",
    tree: "树",
    sun: "太阳",
    cloud: "云朵",
    river: "河流",
    mountain: "山",
    flower: "花",
    face: "笑脸"
  };

  const OBJECT_KEYWORDS = [
    ["house", ["房子", "房屋", "小屋", "屋子"]],
    ["tree", ["树", "大树", "树木", "树苗"]],
    ["sun", ["太阳", "日头"]],
    ["cloud", ["云朵", "白云", "云"]],
    ["river", ["河流", "小河", "河", "溪流", "水流"]],
    ["mountain", ["山峰", "高山", "山"]],
    ["flower", ["花朵", "花", "小花"]],
    ["face", ["笑脸", "脸", "表情"]]
  ];

  const DRAWING_ACTION_TYPES = ["drawShape", "drawLine", "drawObject"];

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[，。！？、,.!?]/g, " ")
      .replace(/\s+/g, "");
  }

  function splitCompoundCommand(text) {
    return String(text || "")
      .split(/然后|接着|并且|以及|还有|再|和|与|及|、|;|；|，|。/)
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

  function objectDefaultColor(object) {
    const defaults = {
      house: { value: "#ef4444", label: "红色" },
      tree: { value: "#16a34a", label: "绿色" },
      sun: { value: "#facc15", label: "黄色" },
      cloud: { value: "#ffffff", label: "白色" },
      river: { value: "#38bdf8", label: "浅蓝色" },
      mountain: { value: "#64748b", label: "灰色" },
      flower: { value: "#ec4899", label: "粉色" },
      face: { value: "#facc15", label: "黄色" }
    };
    return defaults[object] || { value: "#111827", label: "黑色" };
  }

  function hasExplicitColor(text) {
    const normalized = normalizeText(text);
    return COLOR_MAP.some(([key]) => normalized.includes(key));
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

  function hasExplicitPosition(text) {
    const normalized = normalizeText(text);
    return POSITION_MAP.some(([key]) => normalized.includes(key));
  }

  function objectDefaultPosition(object) {
    const defaults = {
      house: { x: 0.42, y: 0.62, label: "中间偏左" },
      tree: { x: 0.68, y: 0.62, label: "中间偏右" },
      sun: { x: 0.78, y: 0.22, label: "右上" },
      cloud: { x: 0.3, y: 0.22, label: "左上" },
      river: { x: 0.5, y: 0.78, label: "下方" },
      mountain: { x: 0.5, y: 0.66, label: "下方" },
      flower: { x: 0.28, y: 0.72, label: "左下" },
      face: { x: 0.5, y: 0.45, label: "中间" }
    };
    return defaults[object] || { x: 0.5, y: 0.5, label: "中间" };
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

  function detectSizeEdit(text) {
    const normalized = normalizeText(text);
    if (normalized.includes("放大") || normalized.includes("变大") || normalized.includes("大一点")) return 1.25;
    if (normalized.includes("缩小") || normalized.includes("变小") || normalized.includes("小一点")) return 0.8;
    return null;
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

  function detectObject(text) {
    const normalized = normalizeText(text);
    for (const [object, keywords] of OBJECT_KEYWORDS) {
      if (keywords.some((keyword) => normalized.includes(keyword))) return object;
    }
    return null;
  }

  function objectLabel(object) {
    return SCENE_LABELS[object] || "物体";
  }

  function objectAction(object, overrides = {}) {
    const color = overrides.color
      ? { value: overrides.color, label: overrides.colorLabel || overrides.color }
      : objectDefaultColor(object);
    const position = overrides.x != null && overrides.y != null
      ? { x: overrides.x, y: overrides.y, label: overrides.positionLabel || "模板位置" }
      : objectDefaultPosition(object);
    return {
      type: "drawObject",
      object,
      color: color.value,
      colorLabel: color.label,
      lineWidth: overrides.lineWidth || 4,
      size: overrides.size || 0.2,
      x: position.x,
      y: position.y,
      positionLabel: position.label,
      label: overrides.label || `${position.label}${color.label}${objectLabel(object)}`,
      rawText: "scene"
    };
  }

  function lineAction(overrides = {}) {
    const color = overrides.color || "#111827";
    const colorLabel = overrides.colorLabel || color;
    return {
      type: "drawLine",
      color,
      colorLabel,
      lineWidth: overrides.lineWidth || 4,
      x1: overrides.x1 ?? 0.2,
      y1: overrides.y1 ?? 0.5,
      x2: overrides.x2 ?? 0.8,
      y2: overrides.y2 ?? 0.5,
      label: overrides.label || `${colorLabel}线条`,
      rawText: "scene"
    };
  }

  function backgroundAction(color, colorLabel) {
    return {
      type: "background",
      color,
      colorLabel,
      label: `背景${colorLabel}`,
      rawText: "scene"
    };
  }

  function sceneTemplateActions(text) {
    const normalized = normalizeText(text);
    if (!(normalized.includes("画") || normalized.includes("生成") || normalized.includes("来一幅"))) return null;

    if (normalized.includes("风景") || normalized.includes("田园") || normalized.includes("小河")) {
      return [
        backgroundAction("#f8fbff", "浅色"),
        objectAction("cloud", { x: 0.28, y: 0.22, size: 0.16, label: "左上白色云朵" }),
        objectAction("sun", { x: 0.78, y: 0.2, size: 0.2, label: "右上黄色太阳" }),
        objectAction("mountain", { x: 0.5, y: 0.58, size: 0.26, label: "下方灰色山" }),
        objectAction("house", { x: 0.38, y: 0.66, size: 0.2, label: "中间偏左红色房子" }),
        objectAction("tree", { x: 0.66, y: 0.66, size: 0.2, label: "中间偏右绿色树" }),
        objectAction("river", { x: 0.5, y: 0.82, size: 0.25, label: "下方浅蓝色河流" })
      ];
    }

    if (normalized.includes("花园") || normalized.includes("草地")) {
      return [
        backgroundAction("#f7fff5", "浅绿色"),
        objectAction("sun", { x: 0.78, y: 0.2, size: 0.18, label: "右上黄色太阳" }),
        objectAction("tree", { x: 0.28, y: 0.6, size: 0.2, label: "左侧绿色树" }),
        objectAction("flower", { x: 0.5, y: 0.72, size: 0.18, label: "中间粉色花" }),
        objectAction("flower", { x: 0.64, y: 0.72, color: "#9333ea", colorLabel: "紫色", size: 0.16, label: "右侧紫色花" }),
        objectAction("cloud", { x: 0.42, y: 0.22, size: 0.14, label: "上方白色云朵" })
      ];
    }

    if (normalized.includes("夜空") || normalized.includes("星空")) {
      return [
        backgroundAction("#111827", "深蓝色"),
        objectAction("cloud", { x: 0.3, y: 0.25, color: "#64748b", colorLabel: "灰色", size: 0.15, label: "左上灰色云朵" }),
        {
          type: "drawShape",
          shape: "star",
          color: "#facc15",
          colorLabel: "黄色",
          lineWidth: 4,
          size: 0.12,
          x: 0.52,
          y: 0.25,
          positionLabel: "上方",
          label: "上方黄色星形",
          rawText: "scene"
        },
        {
          type: "drawShape",
          shape: "star",
          color: "#facc15",
          colorLabel: "黄色",
          lineWidth: 4,
          size: 0.09,
          x: 0.72,
          y: 0.34,
          positionLabel: "右上",
          label: "右上黄色星形",
          rawText: "scene"
        },
        lineAction({ color: "#38bdf8", colorLabel: "浅蓝色", x1: 0.18, y1: 0.72, x2: 0.82, y2: 0.72, lineWidth: 8, label: "下方浅蓝色地平线" })
      ];
    }

    return null;
  }

  function detectEditLast(rawText, state) {
    const normalized = normalizeText(rawText);
    const referencesLast =
      normalized.includes("刚才") ||
      normalized.includes("上一笔") ||
      normalized.includes("上一个") ||
      normalized.includes("最后") ||
      normalized.includes("最近") ||
      normalized.includes("这个") ||
      normalized.includes("它");
    const hasEditVerb =
      normalized.includes("改") ||
      normalized.includes("换") ||
      normalized.includes("移") ||
      normalized.includes("放大") ||
      normalized.includes("缩小") ||
      normalized.includes("变大") ||
      normalized.includes("变小") ||
      normalized.includes("粗") ||
      normalized.includes("细");
    if (!referencesLast || !hasEditVerb) return null;

    const updates = {};
    const labels = [];

    if (hasExplicitColor(rawText)) {
      const color = detectColor(rawText, { value: state?.color || "#111827", label: state?.colorLabel || "黑色" });
      updates.color = color.value;
      updates.colorLabel = color.label;
      labels.push(`改成${color.label}`);
    }

    if (hasExplicitPosition(rawText)) {
      const position = detectPosition(rawText);
      updates.x = position.x;
      updates.y = position.y;
      updates.positionLabel = position.label;
      labels.push(`移动到${position.label}`);
    }

    const sizeScale = detectSizeEdit(rawText);
    if (sizeScale) {
      updates.sizeScale = sizeScale;
      labels.push(sizeScale > 1 ? "放大" : "缩小");
    }

    if (
      normalized.includes("线宽") ||
      normalized.includes("粗细") ||
      normalized.includes("宽度") ||
      normalized.includes("粗一点") ||
      normalized.includes("细一点") ||
      normalized.includes("加粗") ||
      normalized.includes("变细")
    ) {
      const width = detectLineWidth(rawText, state?.lineWidth || 4);
      updates.lineWidth = width;
      labels.push(`线宽${width}px`);
    }

    if (!Object.keys(updates).length) return null;
    return {
      type: "editLast",
      updates,
      label: `编辑上一笔：${labels.join("，")}`,
      rawText
    };
  }

  function detectViewCommand(rawText) {
    const normalized = normalizeText(rawText);
    if (!(normalized.includes("画布") || normalized.includes("视图") || normalized.includes("窗口"))) return null;
    if (normalized.includes("适应") || normalized.includes("自适应") || normalized.includes("铺满") || normalized.includes("居中")) {
      return { type: "setView", mode: "fit", label: "画布适应窗口", rawText };
    }
    if (normalized.includes("放大") || normalized.includes("变大")) {
      return { type: "setView", mode: "zoomIn", label: "放大画布视图", rawText };
    }
    if (normalized.includes("缩小") || normalized.includes("变小")) {
      return { type: "setView", mode: "zoomOut", label: "缩小画布视图", rawText };
    }
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
    const editLast = detectEditLast(rawText, current);
    const viewCommand = detectViewCommand(rawText);

    if (!text) return { type: "unknown", label: "空命令", rawText };
    if (text.includes("帮助")) return { type: "help", label: "帮助", rawText };
    if (viewCommand) return viewCommand;
    if (editLast) return editLast;
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

    const object = detectObject(text);
    if (object) {
      const position = hasExplicitPosition(text) ? detectPosition(text) : objectDefaultPosition(object);
      const objectColor = hasExplicitColor(text) ? color : objectDefaultColor(object);
      return {
        type: "drawObject",
        object,
        color: objectColor.value,
        colorLabel: objectColor.label,
        lineWidth: detectLineWidth(text, current.lineWidth),
        size: detectSize(text),
        x: position.x,
        y: position.y,
        positionLabel: position.label,
        label: `${position.label}${objectColor.label}${objectLabel(object)}`,
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

    const actions = [];
    for (const part of splitCompoundCommand(text)) {
      const sceneActions = sceneTemplateActions(part);
      if (sceneActions) {
        actions.push(...sceneActions);
        const latestDrawing = sceneActions.filter((action) => DRAWING_ACTION_TYPES.includes(action.type)).pop();
        if (latestDrawing) {
          if (latestDrawing.color) scratch.color = latestDrawing.color;
          if (latestDrawing.colorLabel) scratch.colorLabel = latestDrawing.colorLabel;
          if (latestDrawing.lineWidth) scratch.lineWidth = latestDrawing.lineWidth;
        }
        continue;
      }

      const action = parseSingleCommand(part, scratch);
      actions.push(action);
      if (action.type === "setColor" || DRAWING_ACTION_TYPES.includes(action.type)) {
        if (action.color) scratch.color = action.color;
        if (action.colorLabel) scratch.colorLabel = action.colorLabel;
      }
      if (action.type === "setLineWidth") scratch.lineWidth = action.width;
      if (DRAWING_ACTION_TYPES.includes(action.type) && action.lineWidth) scratch.lineWidth = action.lineWidth;
    }
    return actions;
  }

  function shapeLabel(shape) {
    return SHAPE_LABELS[shape] || "图形";
  }

  function allActionsUnknown(actions) {
    return actions.length === 0 || actions.every((action) => action.type === "unknown");
  }

  function isDrawingAction(action) {
    return DRAWING_ACTION_TYPES.includes(action?.type);
  }

  function applyEditToDrawingAction(action, updates = {}) {
    if (!isDrawingAction(action)) return action;
    const next = { ...action };
    if (updates.color) next.color = updates.color;
    if (updates.colorLabel) next.colorLabel = updates.colorLabel;
    if (updates.x != null && "x" in next) next.x = updates.x;
    if (updates.y != null && "y" in next) next.y = updates.y;
    if (updates.x != null && "x1" in next && "x2" in next) {
      const centerX = (next.x1 + next.x2) / 2;
      const deltaX = updates.x - centerX;
      next.x1 = clamp(next.x1 + deltaX, 0, 1);
      next.x2 = clamp(next.x2 + deltaX, 0, 1);
    }
    if (updates.y != null && "y1" in next && "y2" in next) {
      const centerY = (next.y1 + next.y2) / 2;
      const deltaY = updates.y - centerY;
      next.y1 = clamp(next.y1 + deltaY, 0, 1);
      next.y2 = clamp(next.y2 + deltaY, 0, 1);
    }
    if (updates.positionLabel) next.positionLabel = updates.positionLabel;
    if (updates.sizeScale && "size" in next) next.size = clamp(next.size * updates.sizeScale, 0.05, 0.5);
    if (updates.lineWidth) next.lineWidth = updates.lineWidth;
    relabelDrawingAction(next);
    return next;
  }

  function relabelDrawingAction(action) {
    const positionLabel = action.positionLabel || "当前位置";
    if (action.type === "drawShape") action.label = `${positionLabel}${action.colorLabel}${shapeLabel(action.shape)}`;
    if (action.type === "drawObject") action.label = `${positionLabel}${action.colorLabel}${objectLabel(action.object)}`;
    if (action.type === "drawLine") action.label = `${action.colorLabel}线条`;
    return action;
  }

  function materializeDrawingActions(actions) {
    const resolved = [];
    const sourceToResolved = new Map();
    actions.forEach((action, sourceIndex) => {
      if (isDrawingAction(action)) {
        sourceToResolved.set(sourceIndex, resolved.length);
        resolved.push({ ...action });
        return;
      }
      if (action?.type === "editLast") {
        const targetResolvedIndex =
          Number.isInteger(action.targetIndex) && sourceToResolved.has(action.targetIndex)
            ? sourceToResolved.get(action.targetIndex)
            : resolved.length - 1;
        if (targetResolvedIndex >= 0) {
          resolved[targetResolvedIndex] = applyEditToDrawingAction(resolved[targetResolvedIndex], action.updates);
        }
      }
    });
    return resolved;
  }

  function resolveBackground(actions, fallback = "#ffffff") {
    let color = fallback;
    actions.forEach((action) => {
      if (action?.type === "background") color = action.color || color;
    });
    return color;
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
        if (action.type === "background") {
          return {
            type: "background",
            color: color.value,
            colorLabel: color.label,
            label: action.label || `背景${color.label}`,
            rawText: "model"
          };
        }
        if (action.type === "editLast") {
          const updates = {};
          if (action.updates && typeof action.updates === "object") {
            if (typeof action.updates.color === "string" || typeof action.updates.colorLabel === "string") {
              const updateColor = normalizeModelColor(action.updates.color, action.updates.colorLabel, current);
              updates.color = updateColor.value;
              updates.colorLabel = updateColor.label;
            }
            if (action.updates.x != null) updates.x = clamp(Number(action.updates.x) || 0.5, 0.05, 0.95);
            if (action.updates.y != null) updates.y = clamp(Number(action.updates.y) || 0.5, 0.05, 0.95);
            if (typeof action.updates.positionLabel === "string") updates.positionLabel = action.updates.positionLabel;
            if (action.updates.sizeScale != null) updates.sizeScale = clamp(Number(action.updates.sizeScale) || 1, 0.5, 1.8);
            if (action.updates.lineWidth != null) updates.lineWidth = clamp(Number(action.updates.lineWidth) || current.lineWidth || 4, 1, 24);
          }
          if (!Object.keys(updates).length) return null;
          return {
            type: "editLast",
            updates,
            label: action.label || "编辑上一笔",
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
        if (action.type === "drawObject" && SCENE_LABELS[action.object]) {
          return {
            type: "drawObject",
            object: action.object,
            color: color.value,
            colorLabel: color.label,
            lineWidth: clamp(Number(action.lineWidth) || current.lineWidth || 4, 1, 24),
            size: clamp(Number(action.size) || 0.22, 0.08, 0.42),
            x: clamp(Number(action.x) || 0.5, 0.06, 0.94),
            y: clamp(Number(action.y) || 0.5, 0.08, 0.94),
            positionLabel: action.positionLabel || "模型规划",
            label: action.label || `${color.label}${objectLabel(action.object)}`,
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
      "drawObject: {type:'drawObject', object:'house|tree|sun|cloud|river|mountain|flower|face', color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, size:0.08-0.42, lineWidth:1-24, label:'简短中文'}",
      "drawLine: {type:'drawLine', color:'#RRGGBB', colorLabel:'中文颜色', x1:0-1, y1:0-1, x2:0-1, y2:0-1, lineWidth:1-24, label:'简短中文'}",
      "editLast: {type:'editLast', updates:{color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, sizeScale:0.5-1.8, lineWidth:1-24, positionLabel:'中文位置'}, label:'简短中文'}",
      "setColor, setLineWidth, clear, undo, redo, export。",
      "复杂场景请拆成 3 到 12 条 drawObject、drawShape、drawLine 或 background 动作，并按从背景到前景的顺序返回。",
      "不要编造不存在的动作类型；不能确定时返回最接近的多个基础动作。",
      "只返回 JSON 数组。"
    ].join("\n");
  }

  // OpenAI-compatible chat-completions endpoint, supplied by the user in the UI.
  async function planWithModel(text, state, config) {
    if (!config?.enabled || !window.apiClient.isAuthenticated()) return [];

    try {
      const messages = [
        { role: "system", content: modelSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            utterance: text,
            currentColor: state.colorLabel,
            currentLineWidth: state.lineWidth
          })
        }
      ];

      // Use backend proxy instead of direct call
      const response = await window.apiClient.chat(messages, config.profileId, 0.1);

      if (response.success && response.data.response) {
        const content = response.data.response;
        const jsonText = extractJsonArray(content);
        return sanitizeModelActions(JSON.parse(jsonText), state);
      }
      return [];
    } catch (error) {
      console.error("AI 规划失败:", error);
      throw new Error(error.message || "模型请求失败");
    }
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
    // For backward compatibility, but now we load from backend
    if (!username || !window.apiClient.isAuthenticated()) {
      return makeBlankModelConfig();
    }
    // This will be loaded asynchronously via loadModelProfilesFromBackend
    return makeBlankModelConfig();
  }

  function hasUsableModelConfig(config) {
    return Boolean(config?.enabled && config.profileId);
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
      ["画一个房子", "drawObject"],
      ["画一棵树，然后画太阳", "drawObject,drawObject"],
      ["画一幅风景", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject"],
      ["把刚才的房子改成蓝色", "editLast"],
      ["把上一笔移到右上角", "editLast"],
      ["画一幅风景，然后把上一笔放大一点", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,editLast"],
      ["放大画布", "setView"],
      ["缩小画布", "setView"],
      ["画布适应窗口", "setView"],
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

    const objectPlan = sanitizeModelActions(
      [{ type: "drawObject", object: "house", color: "#ef4444", x: 0.45, y: 0.55, size: 0.25 }],
      state
    );
    if (objectPlan[0]?.type !== "drawObject") {
      failures.push({ input: "sanitizeModelActions object", expected: "drawObject", actual: objectPlan[0]?.type });
    }

    const editPlan = sanitizeModelActions(
      [{ type: "editLast", updates: { color: "#2563eb", colorLabel: "蓝色", x: 0.78, y: 0.22, sizeScale: 1.2 } }],
      state
    );
    if (editPlan[0]?.type !== "editLast") {
      failures.push({ input: "sanitizeModelActions edit", expected: "editLast", actual: editPlan[0]?.type });
    }

    const sceneEditActions = parseVoiceCommand("画一幅风景，然后把上一笔放大一点", state);
    const renderedActions = materializeDrawingActions(sceneEditActions);
    const lastRendered = renderedActions[renderedActions.length - 1];
    if (lastRendered?.object !== "river" || lastRendered.size <= 0.25) {
      failures.push({
        input: "materialize scene edit",
        expected: "larger river",
        actual: `${lastRendered?.object || "none"} ${lastRendered?.size || 0}`
      });
    }
    if (resolveBackground(sceneEditActions) !== "#f8fbff") {
      failures.push({ input: "resolveBackground scene", expected: "#f8fbff", actual: resolveBackground(sceneEditActions) });
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
    const fitCanvasButton = document.getElementById("fitCanvasButton");
    const zoomOutButton = document.getElementById("zoomOutButton");
    const zoomInButton = document.getElementById("zoomInButton");
    const exportFormat = document.getElementById("exportFormat");
    const exportButton = document.getElementById("exportButton");
    const modelHintBar = document.getElementById("modelHintBar");
    const modelHintJump = document.getElementById("modelHintJump");
    const dismissModelHint = document.getElementById("dismissModelHint");
    const planList = document.getElementById("planList");
    const latencyBadge = document.getElementById("latencyBadge");

    const appState = {
      ...makeState(),
      background: "#ffffff",
      actions: [],
      conversationLog: [],
      redoStack: [],
      recognition: null,
      listening: false,
      viewScale: 1,
      modelHintDismissed: false,
      currentUser: loadJson(STORAGE_KEYS.session, null),
      modelConfig: makeBlankModelConfig()
    };

    const selectTab = setupTabs();
    setupHistoryDialog();
    setupModelHint(selectTab);
    setupAccountForms(appState);
    setupModelFormV2(appState);
    updateUserSummary(appState);
    updateModelUi(appState);

    // Load user and model config asynchronously if authenticated
    (async function initializeAuth() {
      if (window.apiClient && window.apiClient.isAuthenticated() && appState.currentUser) {
        try {
          // Verify token is still valid
          const response = await window.apiClient.getCurrentUser();
          if (response.success) {
            appState.currentUser = response.data.user;
            await loadModelProfilesFromBackend(appState);
            updateUserSummary(appState);
            updateModelUi(appState);
          }
        } catch (error) {
          console.error("Token 验证失败:", error);
          // Token expired, logout
          window.apiClient.logout();
          appState.currentUser = null;
          localStorage.removeItem(STORAGE_KEYS.session);
          updateUserSummary(appState);
          updateModelUi(appState);
        }
      }
    })();

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

    function updateCanvasView() {
      canvas.style.setProperty("--canvas-scale", String(appState.viewScale));
      fitCanvasButton.textContent = appState.viewScale === 1 ? "适应" : `${Math.round(appState.viewScale * 100)}%`;
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
      appState.background = resolveBackground(appState.actions);
      ctx.fillStyle = appState.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawableActions = materializeDrawingActions(appState.actions);
      for (const action of drawableActions) {
        if (action.type === "drawShape") drawShape(ctx, canvas, action);
        if (action.type === "drawLine") drawLine(ctx, canvas, action);
        if (action.type === "drawObject") drawObject(ctx, canvas, action);
      }

      colorPreview.style.background = appState.color;
      brushLabel.textContent = `${appState.colorLabel} · ${appState.lineWidth}px`;
      updateCanvasView();
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

    function renderPlan(actions, source, elapsedMs) {
      const safeActions = Array.isArray(actions) ? actions : [];
      const sourceText = source === "model" ? "AI 规划" : source === "error" ? "需要复述" : "本地解析";
      latencyBadge.textContent =
        typeof elapsedMs === "number"
          ? `${sourceText} · ${Math.max(0, Math.round(elapsedMs))}ms · ${safeActions.length}步`
          : sourceText;
      latencyBadge.classList.toggle("model", source === "model");
      latencyBadge.classList.toggle("error", source === "error");
      planList.innerHTML = "";

      if (!safeActions.length) {
        const empty = document.createElement("li");
        empty.textContent = "没有可执行步骤";
        planList.appendChild(empty);
        return;
      }

      safeActions.forEach((action, index) => {
        const item = document.createElement("li");
        item.textContent = `${index + 1}. ${action.label || action.type}`;
        planList.appendChild(item);
      });
    }

    function findLastDrawableIndex() {
      for (let index = appState.actions.length - 1; index >= 0; index -= 1) {
        if (isDrawingAction(appState.actions[index])) return index;
      }
      return -1;
    }

    function applyLastEdit(action) {
      const targetIndex = findLastDrawableIndex();
      if (targetIndex < 0) {
        heardText.textContent = "没有可编辑的上一笔";
        addConversation("系统", "没有可编辑的上一笔");
        speak("没有可编辑的上一笔。");
        return;
      }

      const target = appState.actions[targetIndex];
      const preview = applyEditToDrawingAction(target, action.updates);
      appState.actions.push({ ...action, targetIndex });
      appState.redoStack = [];
      appState.color = preview.color || appState.color;
      appState.colorLabel = preview.colorLabel || appState.colorLabel;
      appState.lineWidth = preview.lineWidth || appState.lineWidth;
      heardText.textContent = action.label;
      addConversation("执行", action.label);
      speak(action.label);
      render();
    }

    function applyViewAction(action) {
      if (action.mode === "fit") appState.viewScale = 1;
      if (action.mode === "zoomIn") appState.viewScale = clamp(appState.viewScale + 0.12, 0.7, 1.45);
      if (action.mode === "zoomOut") appState.viewScale = clamp(appState.viewScale - 0.12, 0.7, 1.45);
      heardText.textContent = action.label;
      addConversation("执行", `${action.label}：${Math.round(appState.viewScale * 100)}%`);
      speak(action.label);
      updateCanvasView();
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
        appState.actions.push(action);
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
      if (action.type === "setView") {
        applyViewAction(action);
        return;
      }
      if (action.type === "editLast") {
        applyLastEdit(action);
        return;
      }
      if (action.type === "drawShape" || action.type === "drawLine" || action.type === "drawObject") {
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
      const startedAt = Date.now();
      heardText.textContent = transcript;
      addConversation("用户", transcript);
      let actions = parseVoiceCommand(transcript, appState);
      let planSource = "local";

      if (allActionsUnknown(actions) && hasUsableModelConfig(appState.modelConfig)) {
        renderPlan([{ type: "model", label: "AI 正在拆解复杂指令" }], "model");
        setStatus("模型规划中", "listening");
        try {
          actions = await planWithModel(transcript, appState, appState.modelConfig);
          if (!actions.length) actions = [{ type: "unknown", rawText: transcript, label: "模型未返回动作" }];
          heardText.textContent = `模型规划：${actions.map((action) => action.label || action.type).join("，")}`;
          addConversation("模型", actions.map((action) => action.label || action.type).join("，"));
          planSource = "model";
        } catch (error) {
          actions = [{ type: "unknown", rawText: error.message, label: "模型错误" }];
          planSource = "error";
        } finally {
          setStatus(appState.listening ? "监听中" : "已停止", appState.listening ? "listening" : undefined);
        }
      }

      renderPlan(actions, allActionsUnknown(actions) ? "error" : planSource, Date.now() - startedAt);
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
    fitCanvasButton.addEventListener("click", () => executeAction({ type: "setView", mode: "fit", label: "画布适应窗口" }));
    zoomOutButton.addEventListener("click", () => executeAction({ type: "setView", mode: "zoomOut", label: "缩小画布视图" }));
    zoomInButton.addEventListener("click", () => executeAction({ type: "setView", mode: "zoomIn", label: "放大画布视图" }));
    demoButton.addEventListener("click", () => {
      handleTranscript("画一幅风景");
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

    function setupDrawingsDialog() {
      const drawingsDialog = document.getElementById("drawingsDialog");
      const closeDrawingsButton = document.getElementById("closeDrawingsButton");
      const saveDrawingButton = document.getElementById("saveDrawingButton");
      const loadDrawingsButton = document.getElementById("loadDrawingsButton");
      const drawingsList = document.getElementById("drawingsList");
      const drawingsLoadingMessage = document.getElementById("drawingsLoadingMessage");

      // 保存绘图
      saveDrawingButton.addEventListener("click", async () => {
        if (!window.apiClient || !window.apiClient.isAuthenticated()) {
          alert("请先登录账号才能保存作品到云端");
          return;
        }

        if (appState.actions.length === 0) {
          alert("画布是空的，无法保存");
          return;
        }

        const name = prompt("请输入作品名称:", "我的作品 " + new Date().toLocaleString());
        if (!name) return;

        try {
          const thumbnail = canvas.toDataURL("image/png");
          await window.apiClient.createDrawing(name, appState.actions, thumbnail);
          alert("✅ 保存成功！");
          speak("作品已保存");
        } catch (error) {
          console.error("保存失败:", error);
          alert("❌ 保存失败: " + error.message);
        }
      });

      // 加载绘图列表
      loadDrawingsButton.addEventListener("click", async () => {
        if (!window.apiClient || !window.apiClient.isAuthenticated()) {
          alert("请先登录账号");
          return;
        }

        if (typeof drawingsDialog.showModal === "function") {
          drawingsDialog.showModal();
        }

        try {
          drawingsLoadingMessage.style.display = "block";
          drawingsList.style.display = "none";

          const response = await window.apiClient.getDrawings(50, 0);
          const drawings = response.data.drawings;

          drawingsLoadingMessage.style.display = "none";
          drawingsList.style.display = "block";

          if (drawings.length === 0) {
            drawingsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">暂无保存的作品</p>';
            return;
          }

          drawingsList.innerHTML = drawings.map(drawing => `
            <div class="drawing-item" style="border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 6px; background: #fff;">
              <div style="display: flex; gap: 12px; align-items: start;">
                ${drawing.thumbnail ? `
                  <img src="${drawing.thumbnail}" style="width: 120px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" alt="缩略图" />
                ` : `
                  <div style="width: 120px; height: 68px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">无预览</div>
                `}
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px;">${escapeHtml(drawing.name)}</h3>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    动作数: ${drawing.actions.length} |
                    创建时间: ${new Date(drawing.created_at).toLocaleString()}
                  </p>
                  <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button class="ghost-action compact-action load-drawing-btn" data-id="${drawing.id}" style="font-size: 13px;">📂 加载</button>
                    <button class="ghost-action compact-action delete-drawing-btn" data-id="${drawing.id}" style="font-size: 13px; color: #dc3545;">🗑️ 删除</button>
                  </div>
                </div>
              </div>
            </div>
          `).join("");

          // 绑定加载按钮事件
          drawingsList.querySelectorAll(".load-drawing-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
              const drawingId = e.target.dataset.id;
              try {
                const response = await window.apiClient.getDrawing(drawingId);
                appState.actions = response.data.drawing.actions;
                appState.redoStack = [];
                render();
                drawingsDialog.close();
                speak("作品已加载");
                alert("✅ 作品已加载");
              } catch (error) {
                console.error("加载失败:", error);
                alert("❌ 加载失败: " + error.message);
              }
            });
          });

          // 绑定删除按钮事件
          drawingsList.querySelectorAll(".delete-drawing-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
              const drawingId = e.target.dataset.id;
              if (!confirm("确定要删除这个作品吗？")) return;

              try {
                await window.apiClient.deleteDrawing(drawingId);
                alert("✅ 已删除");
                // 重新加载列表
                loadDrawingsButton.click();
                drawingsDialog.close();
                setTimeout(() => loadDrawingsButton.click(), 100);
              } catch (error) {
                console.error("删除失败:", error);
                alert("❌ 删除失败: " + error.message);
              }
            });
          });

        } catch (error) {
          console.error("加载作品列表失败:", error);
          drawingsLoadingMessage.textContent = "❌ 加载失败: " + error.message;
          drawingsList.style.display = "none";
        }
      });

      closeDrawingsButton.addEventListener("click", () => drawingsDialog.close());
      drawingsDialog.addEventListener("click", (event) => {
        if (event.target === drawingsDialog) drawingsDialog.close();
      });
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    setupHistoryDialog();
    setupDrawingsDialog();

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

      try {
        message.textContent = "注册中...";
        const response = await window.apiClient.register(username, password);

        if (response.success) {
          appState.currentUser = response.data.user;
          saveJson(STORAGE_KEYS.session, appState.currentUser);

          // Load model profiles from backend
          await loadModelProfilesFromBackend(appState);

          updateUserSummary(appState);
          updateModelUi(appState);
          window.dispatchEvent(new CustomEvent("user-model-state-changed"));
          message.textContent = `已注册并登录：${username}`;
          registerForm.reset();
        }
      } catch (error) {
        console.error("注册失败:", error);
        message.textContent = error.message || "注册失败，请重试。";
      }
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("loginName").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        message.textContent = "登录中...";
        const response = await window.apiClient.login(username, password);

        if (response.success) {
          appState.currentUser = response.data.user;
          saveJson(STORAGE_KEYS.session, appState.currentUser);

          // Load model profiles from backend
          await loadModelProfilesFromBackend(appState);

          updateUserSummary(appState);
          updateModelUi(appState);
          window.dispatchEvent(new CustomEvent("user-model-state-changed"));
          message.textContent = `已登录：${username}`;
          loginForm.reset();
        }
      } catch (error) {
        console.error("登录失败:", error);
        message.textContent = error.message || "用户名或密码不正确。";
      }
    });

    logoutButton.addEventListener("click", () => {
      window.apiClient.logout();
      appState.currentUser = null;
      appState.modelConfig = makeBlankModelConfig();
      localStorage.removeItem(STORAGE_KEYS.session);
      updateUserSummary(appState);
      updateModelUi(appState);
      window.dispatchEvent(new CustomEvent("user-model-state-changed"));
      message.textContent = "已退出登录。";
    });
  }

  // Load model profiles from backend API
  async function loadModelProfilesFromBackend(appState) {
    try {
      const response = await window.apiClient.getModelProfiles();
      if (response.success && response.data.profiles) {
        const profiles = response.data.profiles;

        // Find the first enabled profile or use blank config
        const enabledProfile = profiles.find(p => p.enabled) || profiles[0];

        if (enabledProfile) {
          appState.modelConfig = {
            enabled: enabledProfile.enabled,
            provider: enabledProfile.provider,
            endpoint: enabledProfile.endpoint,
            model: enabledProfile.model,
            apiKey: '***', // API Key is on backend, not exposed
            profileId: enabledProfile.id,
            name: enabledProfile.name
          };
        } else {
          appState.modelConfig = makeBlankModelConfig();
        }
      }
    } catch (error) {
      console.error("加载模型配置失败:", error);
      appState.modelConfig = makeBlankModelConfig();
    }
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

    profileSelect.addEventListener("change", async () => {
      activeProfileId = profileSelect.value;
      const selected = getActiveProfile();
      fillForm(selected);
      appState.modelConfig = selected;
      updateModelUi(appState);
    });

    addProfileButton.addEventListener("click", async () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号，再新增 API 配置。";
        return;
      }

      const providerKey = provider.value || "openai";
      const providerConfig = PROVIDER_CONFIGS[providerKey];

      try {
        message.textContent = "创建中...";
        const response = await window.apiClient.createModelProfile({
          name: `模型配置 ${profiles.length + 1}`,
          provider: providerKey,
          endpoint: providerConfig.endpoint,
          model: providerConfig.model,
          apiKey: 'sk-placeholder',
          enabled: true
        });

        if (response.success) {
          message.textContent = "已新增一个模型配置。";
          await refreshFromAccount();
          // Select the newly created profile
          activeProfileId = response.data.profile.id;
          const newProfile = profiles.find(p => p.id === activeProfileId);
          if (newProfile) {
            fillForm(newProfile);
            appState.modelConfig = newProfile;
            updateModelUi(appState);
          }
        }
      } catch (error) {
        console.error("创建配置失败:", error);
        message.textContent = "创建失败: " + error.message;
      }
    });

    deleteProfileButton.addEventListener("click", async () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号。";
        return;
      }
      if (!profiles.length || !activeProfileId) {
        message.textContent = "当前没有可删除的配置。";
        return;
      }

      if (!confirm("确定要删除当前配置吗？")) {
        return;
      }

      try {
        message.textContent = "删除中...";
        await window.apiClient.deleteModelProfile(activeProfileId);
        message.textContent = "已删除当前模型配置。";
        await refreshFromAccount();
      } catch (error) {
        console.error("删除配置失败:", error);
        message.textContent = "删除失败: " + error.message;
      }
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

    form.addEventListener("submit", async (event) => {
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

      try {
        message.textContent = "保存中...";

        // Check if this is an update or create
        const existingProfile = profiles.find(p => p.id === activeProfileId);

        if (existingProfile && existingProfile.profileId) {
          // Update existing profile
          await window.apiClient.updateModelProfile(existingProfile.profileId, {
            name: profile.name,
            provider: profile.provider,
            endpoint: profile.endpoint,
            model: profile.model,
            apiKey: profile.apiKey,
            enabled: profile.enabled
          });
          message.textContent = "模型配置已更新。";
        } else {
          // Create new profile
          await window.apiClient.createModelProfile({
            name: profile.name,
            provider: profile.provider,
            endpoint: profile.endpoint,
            model: profile.model,
            apiKey: profile.apiKey,
            enabled: profile.enabled
          });
          message.textContent = "模型配置已保存到当前账号。";
        }

        await refreshFromAccount();
        appState.modelConfig = getActiveProfile();
        updateModelUi(appState);
      } catch (error) {
        console.error("保存配置失败:", error);
        message.textContent = "保存失败: " + error.message;
      }
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

    async function refreshFromAccount() {
      if (!appState.currentUser) {
        profiles = [];
        activeProfileId = "";
        appState.modelConfig = makeBlankModelConfig();
        renderProfileOptions();
        renderProfileCards();
        fillForm(makeBlankModelConfig());
        updateFormAvailability();
        updateModelUi(appState);
        return;
      }

      // Load from backend API
      try {
        const response = await window.apiClient.getModelProfiles();
        if (response.success && response.data.profiles) {
          // Convert backend format to frontend format
          profiles = response.data.profiles.map(p => ({
            id: p.id,
            name: p.name,
            provider: p.provider,
            endpoint: p.endpoint,
            model: p.model,
            apiKey: '***', // Don't expose API key from backend
            enabled: p.enabled,
            profileId: p.id // Keep backend ID for API calls
          }));

          // Find active profile (first enabled one or first one)
          const activeProfile = profiles.find(p => p.enabled) || profiles[0];
          activeProfileId = activeProfile?.id || "";
          appState.modelConfig = activeProfile || makeBlankModelConfig();
        } else {
          profiles = [];
          activeProfileId = "";
          appState.modelConfig = makeBlankModelConfig();
        }
      } catch (error) {
        console.error("加载模型配置失败:", error);
        profiles = [];
        activeProfileId = "";
        appState.modelConfig = makeBlankModelConfig();
      }

      renderProfileOptions();
      renderProfileCards();
      fillForm(appState.modelConfig);
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
        card.addEventListener("click", async () => {
          const selected = profiles.find((item) => item.id === profile.id);
          if (!selected) return;

          activeProfileId = selected.id;

          // Update enabled status on backend
          if (selected.profileId && !selected.enabled) {
            try {
              await window.apiClient.updateModelProfile(selected.profileId, {
                enabled: true
              });
              selected.enabled = true;
            } catch (error) {
              console.error("启用配置失败:", error);
            }
          }

          fillForm(selected);
          appState.modelConfig = selected;
          renderProfileOptions();
          renderProfileCards();
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

    async function persistProfiles() {
      // Backend API handles persistence automatically
      // This function is kept for compatibility but doesn't need to do localStorage
      // Profile changes are saved via saveButton event handler
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

  function drawObject(ctx, canvas, action) {
    const x = action.x * canvas.width;
    const y = action.y * canvas.height;
    const size = action.size * Math.min(canvas.width, canvas.height);
    const lineWidth = action.lineWidth || 4;
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.object === "house") drawHouse(ctx, x, y, size, action.color);
    if (action.object === "tree") drawTree(ctx, x, y, size, action.color);
    if (action.object === "sun") drawSun(ctx, x, y, size, action.color);
    if (action.object === "cloud") drawCloud(ctx, x, y, size, action.color);
    if (action.object === "river") drawRiver(ctx, x, y, size, action.color);
    if (action.object === "mountain") drawMountain(ctx, x, y, size, action.color);
    if (action.object === "flower") drawFlower(ctx, x, y, size, action.color);
    if (action.object === "face") drawFace(ctx, x, y, size, action.color);

    ctx.restore();
  }

  function drawHouse(ctx, x, y, size, color) {
    const bodyColor = color || "#ef4444";
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = "#1f2937";
    ctx.fillRect(x - size * 0.52, y - size * 0.02, size * 1.04, size * 0.62);
    ctx.strokeRect(x - size * 0.52, y - size * 0.02, size * 1.04, size * 0.62);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.65, y - size * 0.02);
    ctx.lineTo(x, y - size * 0.58);
    ctx.lineTo(x + size * 0.65, y - size * 0.02);
    ctx.closePath();
    ctx.fillStyle = "#7c3aed";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(x + size * 0.17, y + size * 0.16, size * 0.2, size * 0.18);
    ctx.strokeRect(x + size * 0.17, y + size * 0.16, size * 0.2, size * 0.18);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - size * 0.2, y + size * 0.22, size * 0.24, size * 0.38);
  }

  function drawTree(ctx, x, y, size, color) {
    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - size * 0.1, y + size * 0.08, size * 0.2, size * 0.56);
    ctx.fillStyle = color && color !== "#92400e" ? color : "#16a34a";
    drawFilledCircle(ctx, x, y - size * 0.22, size * 0.32);
    drawFilledCircle(ctx, x - size * 0.24, y - size * 0.02, size * 0.28);
    drawFilledCircle(ctx, x + size * 0.24, y - size * 0.02, size * 0.28);
    drawFilledCircle(ctx, x, y + size * 0.08, size * 0.3);
  }

  function drawSun(ctx, x, y, size, color) {
    const radius = size * 0.28;
    ctx.strokeStyle = color || "#f59e0b";
    ctx.fillStyle = color || "#facc15";
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius * 1.35, y + Math.sin(angle) * radius * 1.35);
      ctx.lineTo(x + Math.cos(angle) * radius * 2.0, y + Math.sin(angle) * radius * 2.0);
      ctx.stroke();
    }
    drawFilledCircle(ctx, x, y, radius);
  }

  function drawCloud(ctx, x, y, size, color) {
    ctx.fillStyle = color && color !== "#111827" ? color : "#ffffff";
    ctx.strokeStyle = "#9cc9f5";
    drawCloudBubble(ctx, x - size * 0.25, y + size * 0.06, size * 0.25);
    drawCloudBubble(ctx, x, y - size * 0.08, size * 0.34);
    drawCloudBubble(ctx, x + size * 0.3, y + size * 0.06, size * 0.25);
    ctx.fillRect(x - size * 0.48, y + size * 0.02, size * 0.96, size * 0.26);
    ctx.strokeRect(x - size * 0.48, y + size * 0.02, size * 0.96, size * 0.26);
  }

  function drawRiver(ctx, x, y, size, color) {
    ctx.strokeStyle = color && color !== "#111827" ? color : "#38bdf8";
    ctx.lineWidth = Math.max(14, size * 0.16);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.72, y - size * 0.16);
    ctx.bezierCurveTo(x - size * 0.28, y - size * 0.42, x + size * 0.12, y + size * 0.24, x + size * 0.72, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = Math.max(3, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y - size * 0.12);
    ctx.bezierCurveTo(x - size * 0.18, y - size * 0.22, x + size * 0.14, y + size * 0.12, x + size * 0.48, y + size * 0.02);
    ctx.stroke();
  }

  function drawMountain(ctx, x, y, size, color) {
    ctx.fillStyle = color && color !== "#111827" ? color : "#64748b";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.78, y + size * 0.48);
    ctx.lineTo(x - size * 0.22, y - size * 0.5);
    ctx.lineTo(x + size * 0.12, y + size * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.12, y + size * 0.48);
    ctx.lineTo(x + size * 0.32, y - size * 0.36);
    ctx.lineTo(x + size * 0.78, y + size * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.22, y - size * 0.5);
    ctx.lineTo(x - size * 0.34, y - size * 0.28);
    ctx.lineTo(x - size * 0.1, y - size * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  function drawFlower(ctx, x, y, size, color) {
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = Math.max(3, size * 0.04);
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.58);
    ctx.lineTo(x, y + size * 0.05);
    ctx.stroke();
    ctx.fillStyle = color && color !== "#16a34a" ? color : "#ec4899";
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      drawFilledCircle(ctx, x + Math.cos(angle) * size * 0.2, y - size * 0.08 + Math.sin(angle) * size * 0.2, size * 0.12);
    }
    ctx.fillStyle = "#facc15";
    drawFilledCircle(ctx, x, y - size * 0.08, size * 0.11);
  }

  function drawFace(ctx, x, y, size, color) {
    ctx.fillStyle = color && color !== "#111827" ? color : "#facc15";
    ctx.strokeStyle = "#111827";
    drawFilledCircle(ctx, x, y, size * 0.42);
    ctx.stroke();
    ctx.fillStyle = "#111827";
    drawFilledCircle(ctx, x - size * 0.15, y - size * 0.08, size * 0.045);
    drawFilledCircle(ctx, x + size * 0.15, y - size * 0.08, size * 0.045);
    ctx.beginPath();
    ctx.arc(x, y + size * 0.05, size * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  function drawCloudBubble(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, 0);
    ctx.lineTo(x + radius, y + radius * 0.55);
    ctx.lineTo(x - radius, y + radius * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawFilledCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
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
