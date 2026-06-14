(function attachVoiceDrawing(globalScope) {
  "use strict";

  const STORAGE_KEYS = {
    users: "voiceDrawing.users",
    session: "voiceDrawing.session",
    model: "voiceDrawing.model",
    aiRefineIntroSeen: "voiceDrawing.aiRefineIntroSeen"
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
    doubaoImage: {
      label: "豆包图片生成",
      endpoint: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      model: "doubao-seedream-4-0-250828"
    },
    other: {
      label: "其他",
      endpoint: "https://api.x.com/v1/chat/completions",
      model: "请输入模型名称"
    }
  };

  const MODEL_ROLE_CONFIGS = {
    semantic: {
      title: "语义理解模型",
      description: "用于理解长句、复杂场景和修改指令，推荐接入 DeepSeek、通义千问、OpenAI 兼容聊天模型。",
      profileLabel: "当前语义配置",
      enabledLabel: "启用语义理解模型",
      addName: "语义配置",
      defaultProvider: "deepseek",
      allowedProviders: ["openai", "deepseek", "qwen", "moonshot", "zhipu", "other"],
      emptyLoggedIn: "还没有语义理解模型配置。点击 + 新增 DeepSeek、通义或 OpenAI 兼容接口。",
      emptyLoggedOut: "登录后可保存语义理解模型，用来提升复杂语音指令理解能力。",
      savedMessage: "语义理解配置已保存。",
      testText: "测试语义模型"
    },
    image: {
      title: "绘画精绘模型",
      description: "用于 AI 精绘当前画布，推荐接入火山引擎豆包图片生成或 Seedream 图片模型。",
      profileLabel: "当前精绘配置",
      enabledLabel: "启用绘画精绘模型",
      addName: "精绘配置",
      defaultProvider: "doubaoImage",
      allowedProviders: ["doubaoImage"],
      emptyLoggedIn: "还没有绘画精绘模型配置。点击 + 新增豆包图片生成 / Seedream。",
      emptyLoggedOut: "登录后可保存绘画精绘模型，用来把当前画布生成成品图。",
      savedMessage: "绘画精绘配置已保存。",
      testText: "用 AI 精绘测试"
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
    face: "笑脸",
    cat: "猫",
    dog: "狗",
    bird: "鸟",
    star: "星星",
    moon: "月亮",
    car: "汽车",
    heart: "心形",
    grass: "草地",
    butterfly: "蝴蝶",
    balloon: "气球"
  };

  const OBJECT_KEYWORDS = [
    ["house", ["房子", "房屋", "小屋", "屋子"]],
    ["tree", ["树", "大树", "树木", "树苗"]],
    ["sun", ["太阳", "日头"]],
    ["cloud", ["云朵", "白云", "云"]],
    ["river", ["河流", "小河", "河", "溪流", "水流"]],
    ["mountain", ["山峰", "高山", "山"]],
    ["flower", ["花朵", "花", "小花"]],
    ["face", ["笑脸", "脸", "表情"]],
    ["cat", ["猫", "小猫", "猫咪", "喵"]],
    ["dog", ["狗", "小狗", "狗狗", "汪"]],
    ["bird", ["鸟", "小鸟", "鸟儿"]],
    ["star", ["星星", "星"]],
    ["moon", ["月亮", "月球", "月"]],
    ["car", ["汽车", "车", "小车"]],
    ["heart", ["心", "心形", "爱心"]],
    ["grass", ["草地", "草坪", "草"]],
    ["butterfly", ["蝴蝶", "蝶"]],
    ["balloon", ["气球", "球"]]
  ];

  const DRAWING_ACTION_TYPES = ["drawShape", "drawLine", "drawObject", "refinedImage"];
  const REFINEMENT_TRIGGER_RE = /AI|ai|精绘|高清|润色|美化|重绘|生成高清|变成成品|优化这幅图|优化图片/;

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[，。！？、,.!?]/g, " ")
      .replace(/\s+/g, "");
  }

  function splitCompoundCommand(text) {
    return String(text || "")
      .split(/然后|接着|并且|以及|还有|再|和|与|及|、|;|；/)
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

  function detectColorNearKeywords(text, keywords) {
    const normalized = normalizeText(text);
    const segments = String(text || "")
      .split(/[，。！？、,.!?;；\s]+/)
      .map((segment) => normalizeText(segment))
      .filter(Boolean);

    if (segments.length > 1) {
      let bestSegment = null;
      for (const segment of segments) {
        if (!keywords.some((keyword) => segment.includes(keyword))) continue;
        for (const [colorKey, value, label] of COLOR_MAP) {
          for (const keyword of keywords) {
            if (!segment.includes(keyword)) continue;
            let score = null;
            if (
              segment.includes(`${keyword}是${colorKey}`) ||
              segment.includes(`${keyword}为${colorKey}`) ||
              segment.includes(`${keyword}用${colorKey}`)
            ) {
              score = 0;
            } else if (segment.includes(`${keyword}${colorKey}`) || segment.includes(`${colorKey}${keyword}`)) {
              score = 1;
            }
            if (score != null && (!bestSegment || score < bestSegment.score)) {
              bestSegment = { value, label, score };
            }
          }
        }
      }
      if (bestSegment) return { value: bestSegment.value, label: bestSegment.label };
    }

    let best = null;
    for (const [colorKey, value, label] of COLOR_MAP) {
      let colorIndex = normalized.indexOf(colorKey);
      while (colorIndex >= 0) {
        for (const keyword of keywords) {
          const keywordIndex = normalized.indexOf(keyword);
          if (keywordIndex < 0) continue;
          const distance = Math.abs(colorIndex - keywordIndex);
          let score = distance + 10;
          if (
            normalized.includes(`${keyword}是${colorKey}`) ||
            normalized.includes(`${keyword}为${colorKey}`) ||
            normalized.includes(`${keyword}用${colorKey}`)
          ) {
            score = 0;
          } else if (normalized.includes(`${colorKey}${keyword}`)) {
            score = 1;
          } else if (normalized.includes(`${keyword}${colorKey}`)) {
            score = 2;
          }
          if (score <= 2 && (!best || score < best.score || (score === best.score && colorIndex < best.colorIndex))) {
            best = { value, label, score, colorIndex };
          }
        }
        colorIndex = normalized.indexOf(colorKey, colorIndex + colorKey.length);
      }
    }
    return best ? { value: best.value, label: best.label } : null;
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

  function detectObjectExtras(text, object) {
    const normalized = normalizeText(text);
    const extras = {};
    const labels = [];

    if (object === "house") {
      const roofColor = detectColorNearKeywords(text, ["房顶", "屋顶", "顶", "屋檐"]);
      const wallColor = detectColorNearKeywords(text, ["墙壁", "墙面", "墙", "房身", "屋身"]);
      const doorColor = detectColorNearKeywords(text, ["门", "大门"]);
      const windowColor = detectColorNearKeywords(text, ["窗户", "窗"]);

      if (roofColor) {
        extras.roofColor = roofColor.value;
        labels.push(`${roofColor.label}屋顶`);
      }
      if (wallColor) {
        extras.wallColor = wallColor.value;
        labels.push(`${wallColor.label}墙壁`);
      }
      if (doorColor) {
        extras.doorColor = doorColor.value;
        labels.push(`${doorColor.label}门`);
      }
      if (windowColor) {
        extras.windowColor = windowColor.value;
        labels.push(`${windowColor.label}窗户`);
      }
    }

    if (object === "sun") {
      if (normalized.includes("眼镜") || normalized.includes("墨镜") || normalized.includes("太阳镜")) {
        extras.hasGlasses = true;
        labels.push("戴眼镜");
      }
      if (
        normalized.includes("眼睛") ||
        normalized.includes("有眼") ||
        normalized.includes("睁眼") ||
        normalized.includes("眨眼") ||
        extras.hasGlasses
      ) {
        extras.hasEyes = true;
        if (!extras.hasGlasses) labels.push("有眼睛");
      }
      if (
        normalized.includes("笑") ||
        normalized.includes("微笑") ||
        normalized.includes("笑脸") ||
        normalized.includes("开心")
      ) {
        extras.hasSmile = true;
        labels.push("微笑");
      }
    }

    if (object === "cat" || object === "dog") {
      if (normalized.includes("玩") || normalized.includes("玩耍") || normalized.includes("一起") || normalized.includes("追逐")) {
        extras.playing = true;
        labels.push("玩耍");
      }
      if (normalized.includes("翅膀") || normalized.includes("会飞") || normalized.includes("飞翔") || normalized.includes("飞")) {
        extras.hasWings = true;
        labels.push("带翅膀");
      }
      if (object === "dog" && extras.hasWings) {
        labels.push("飞行");
      }
      if (normalized.includes("朝右") || normalized.includes("向右")) extras.facing = "right";
      if (normalized.includes("朝左") || normalized.includes("向左")) extras.facing = "left";
    }

    return { extras, labels };
  }

  function colorLabelFromHex(value) {
    const found = COLOR_MAP.find(([, hex]) => hex.toLowerCase() === String(value || "").toLowerCase());
    return found?.[2] || value;
  }

  function primaryObjectColor(object, detectedColor, extras) {
    if (object === "house") {
      if (extras.wallColor) {
        return { value: extras.wallColor, label: colorLabelFromHex(extras.wallColor) };
      }
      if (detectedColor) return detectedColor;
      return objectDefaultColor(object);
    }
    return detectedColor || objectDefaultColor(object);
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

  function detectRelativePosition(text, state) {
    // 检测"在XX旁边/左边/右边/上方/下方"这种相对位置
    const normalized = normalizeText(text);

    // 查找参考物体
    for (const [refObject, keywords] of OBJECT_KEYWORDS) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        // 找到参考物体，查找画布上最后一个该物体的位置
        if (!state || !state.actions) continue;

        const lastRefAction = [...state.actions].reverse().find(
          action => action.type === "drawObject" && action.object === refObject
        );

        if (lastRefAction) {
          // 检测方向
          if (normalized.includes("旁边")) {
            // 旁边 = 右边偏移
            return { x: Math.min(lastRefAction.x + 0.15, 0.9), y: lastRefAction.y, label: `${keywords[0]}旁边` };
          }
          if (normalized.includes("左边")) {
            return { x: Math.max(lastRefAction.x - 0.15, 0.1), y: lastRefAction.y, label: `${keywords[0]}左边` };
          }
          if (normalized.includes("右边")) {
            return { x: Math.min(lastRefAction.x + 0.15, 0.9), y: lastRefAction.y, label: `${keywords[0]}右边` };
          }
          if (normalized.includes("上方") || normalized.includes("上面")) {
            return { x: lastRefAction.x, y: Math.max(lastRefAction.y - 0.15, 0.1), label: `${keywords[0]}上方` };
          }
          if (normalized.includes("下方") || normalized.includes("下面")) {
            return { x: lastRefAction.x, y: Math.min(lastRefAction.y + 0.15, 0.9), label: `${keywords[0]}下方` };
          }
        }
      }
    }

    return null;
  }

  function detectPositionForObject(text, object) {
    const normalized = normalizeText(text);
    const keywords = OBJECT_KEYWORDS.find(([item]) => item === object)?.[1] || [objectLabel(object)];
    let objectIndex = -1;
    for (const keyword of keywords) {
      const index = normalized.indexOf(keyword);
      if (index >= 0 && (objectIndex < 0 || index < objectIndex)) objectIndex = index;
    }
    if (objectIndex < 0) return null;

    let best = null;
    for (const [key, x, y, label] of POSITION_MAP) {
      let index = normalized.indexOf(key);
      while (index >= 0) {
        const distance = Math.abs(index - objectIndex);
        const beforeObject = index <= objectIndex;
        const nextObject = findNearestObjectAfter(normalized, index + key.length);
        if (!beforeObject && nextObject && nextObject.object !== object && nextObject.index - index <= 8) {
          index = normalized.indexOf(key, index + key.length);
          continue;
        }
        const score = distance + (beforeObject ? 0 : 4);
        if (distance <= 12 && (!best || score < best.score)) {
          best = { x, y, label, score };
        }
        index = normalized.indexOf(key, index + key.length);
      }
    }
    return best ? { x: best.x, y: best.y, label: best.label } : null;
  }

  function findNearestObjectAfter(normalizedText, startIndex) {
    let best = null;
    for (const [object, keywords] of OBJECT_KEYWORDS) {
      for (const keyword of keywords) {
        const index = normalizedText.indexOf(keyword, startIndex);
        if (index >= 0 && (!best || index < best.index)) {
          best = { object, index };
        }
      }
    }
    return best;
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

    // 检测"画"、"添加"等动作词后面的物体（这是要画的目标）
    const drawPattern = /(画|添加|绘制|加|弄|来)(一?个?|一?只?|一?朵?|一?棵?|一?座?|一?条?|一?辆?)([^，。]+)/;
    const match = text.match(drawPattern);

    if (match) {
      const targetText = normalizeText(match[3]);
      // 优先在动作词后面的文本中查找物体
      for (const [object, keywords] of OBJECT_KEYWORDS) {
        if (keywords.some((keyword) => targetText.includes(keyword))) {
          return object;
        }
      }
    }

    // 如果没有明确的动作词，则在整个文本中查找
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
      extras: overrides.extras || undefined,
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

  function sceneBackgroundFromText(text) {
    const normalized = normalizeText(text);
    if (normalized.includes("夕阳") || normalized.includes("日落") || normalized.includes("黄昏") || normalized.includes("晚霞")) {
      return backgroundAction("#f97316", "夕阳橙色");
    }
    if (normalized.includes("夜晚") || normalized.includes("晚上") || normalized.includes("夜空") || normalized.includes("星空")) {
      return backgroundAction("#111827", "深蓝色");
    }
    if (normalized.includes("草地") || normalized.includes("公园") || normalized.includes("花园")) {
      return backgroundAction("#dcfce7", "浅绿色");
    }
    if (normalized.includes("天空") || normalized.includes("白天")) {
      return backgroundAction("#dbeafe", "浅蓝色");
    }
    return null;
  }

  function relationshipSceneActions(text) {
    const normalized = normalizeText(text);
    if (!(normalized.includes("画") || normalized.includes("生成") || normalized.includes("来一幅") || normalized.includes("帮我"))) {
      return null;
    }

    const hasCat = ["猫", "小猫", "猫咪"].some((keyword) => normalized.includes(keyword));
    const hasDog = ["狗", "小狗", "狗狗"].some((keyword) => normalized.includes(keyword));
    const hasBird = ["鸟", "小鸟", "鸟儿"].some((keyword) => normalized.includes(keyword));
    const isPlaying = normalized.includes("玩") || normalized.includes("玩耍") || normalized.includes("一起") || normalized.includes("追逐");

    if (hasDog && hasBird && isPlaying) {
      return [
        backgroundAction("#dbeafe", "浅蓝色"),
        objectAction("cloud", { x: 0.24, y: 0.2, size: 0.14, label: "左上白色云朵" }),
        objectAction("sun", { x: 0.78, y: 0.18, size: 0.18, label: "右上黄色太阳" }),
        objectAction("grass", { x: 0.5, y: 0.86, color: "#22c55e", colorLabel: "绿色", size: 0.34, label: "下方绿色草地" }),
        objectAction("dog", {
          x: 0.5,
          y: 0.56,
          color: "#92400e",
          colorLabel: "棕色",
          size: 0.26,
          extras: { playing: true, facing: "right", hasWings: true },
          label: "中间带翅膀的小狗"
        }),
        objectAction("bird", {
          x: 0.72,
          y: 0.42,
          color: "#3b82f6",
          colorLabel: "蓝色",
          size: 0.15,
          label: "右侧蓝色小鸟"
        }),
        {
          type: "drawShape",
          shape: "circle",
          color: "#ef4444",
          colorLabel: "红色",
          lineWidth: 4,
          size: 0.055,
          x: 0.62,
          y: 0.5,
          positionLabel: "中间",
          label: "中间红色小球",
          rawText: "scene"
        }
      ];
    }

    if (hasCat && hasDog && isPlaying) {
      return [
        backgroundAction("#f0fdf4", "浅绿色"),
        objectAction("grass", { x: 0.5, y: 0.82, color: "#22c55e", colorLabel: "绿色", size: 0.34, label: "下方绿色草地" }),
        objectAction("cat", {
          x: 0.38,
          y: 0.64,
          color: "#f97316",
          colorLabel: "橙色",
          size: 0.22,
          extras: { playing: true, facing: "right" },
          label: "左侧橙色小猫"
        }),
        objectAction("dog", {
          x: 0.64,
          y: 0.64,
          color: "#92400e",
          colorLabel: "棕色",
          size: 0.23,
          extras: { playing: true, facing: "left" },
          label: "右侧棕色小狗"
        }),
        {
          type: "drawShape",
          shape: "circle",
          color: "#ef4444",
          colorLabel: "红色",
          lineWidth: 4,
          size: 0.07,
          x: 0.51,
          y: 0.69,
          positionLabel: "中间",
          label: "中间红色小球",
          rawText: "scene"
        }
      ];
    }

    return null;
  }

  function multiObjectSceneActions(text) {
    const normalized = normalizeText(text);
    if (!(normalized.includes("画") || normalized.includes("生成") || normalized.includes("来一幅") || normalized.includes("帮我"))) {
      return null;
    }

    const objects = [];
    for (const [object, keywords] of OBJECT_KEYWORDS) {
      if (keywords.some((keyword) => normalized.includes(keyword))) objects.push(object);
    }
    if (objects.length < 2 && !sceneBackgroundFromText(text)) return null;

    const actions = [];
    const background = sceneBackgroundFromText(text);
    if (background) actions.push(background);

    const objectOrder = ["mountain", "river", "house", "tree", "grass", "flower", "sun", "moon", "cloud", "star", "bird", "cat", "dog", "car", "heart", "butterfly", "balloon", "face"];
    const sortedObjects = objects.sort((a, b) => objectOrder.indexOf(a) - objectOrder.indexOf(b));

    for (const object of sortedObjects) {
      const position = detectPositionForObject(text, object) || objectDefaultPosition(object);
      const attributeInfo = detectObjectExtras(text, object);
      const explicitObjectColor = detectColorNearKeywords(
        text,
        OBJECT_KEYWORDS.find(([item]) => item === object)?.[1] || [objectLabel(object)]
      );
      const objectColor = primaryObjectColor(object, explicitObjectColor, attributeInfo.extras);
      const detailLabel = attributeInfo.labels.join("");
      actions.push(objectAction(object, {
        x: position.x,
        y: position.y,
        positionLabel: position.label,
        color: objectColor.value,
        colorLabel: objectColor.label,
        extras: Object.keys(attributeInfo.extras).length ? attributeInfo.extras : undefined,
        size: object === "sun" || object === "moon" ? 0.18 : 0.2,
        label: detailLabel
          ? `${position.label}${detailLabel}${objectLabel(object)}`
          : `${position.label}${objectColor.label}${objectLabel(object)}`
      }));
    }

    if (actions.length === 1 && actions[0].type === "background") return null;
    return actions;
  }

  function sceneTemplateActions(text) {
    const normalized = normalizeText(text);
    if (!(normalized.includes("画") || normalized.includes("生成") || normalized.includes("来一幅"))) return null;

    const relationshipActions = relationshipSceneActions(text);
    if (relationshipActions) return relationshipActions;

    if (normalized.includes("森林") || normalized.includes("树林") || normalized.includes("林间")) {
      const evening = normalized.includes("夕阳") || normalized.includes("日落") || normalized.includes("黄昏") || normalized.includes("晚霞");
      return [
        backgroundAction(evening ? "#fed7aa" : "#dcfce7", evening ? "夕阳橙色" : "浅绿色"),
        objectAction("sun", { x: 0.78, y: 0.18, color: "#f97316", colorLabel: "橙色", size: 0.18, label: "右上夕阳" }),
        objectAction("tree", { x: 0.18, y: 0.58, color: "#15803d", colorLabel: "深绿色", size: 0.24, label: "左侧高大的树" }),
        objectAction("tree", { x: 0.34, y: 0.62, color: "#16a34a", colorLabel: "绿色", size: 0.21, label: "左中绿色树" }),
        objectAction("tree", { x: 0.66, y: 0.62, color: "#15803d", colorLabel: "深绿色", size: 0.22, label: "右中深绿色树" }),
        objectAction("tree", { x: 0.84, y: 0.58, color: "#166534", colorLabel: "墨绿色", size: 0.25, label: "右侧高大的树" }),
        objectAction("river", { x: 0.5, y: 0.82, color: "#38bdf8", colorLabel: "浅蓝色", size: 0.22, label: "下方发光的小河" }),
        objectAction("bird", { x: 0.48, y: 0.32, color: "#2563eb", colorLabel: "蓝色", size: 0.12, label: "天空中的小鸟" }),
        objectAction("flower", { x: 0.3, y: 0.78, color: "#ec4899", colorLabel: "粉色", size: 0.12, label: "路边粉色小花" }),
        objectAction("flower", { x: 0.7, y: 0.78, color: "#9333ea", colorLabel: "紫色", size: 0.12, label: "路边紫色小花" }),
        lineAction({ color: "#facc15", colorLabel: "金色", x1: 0.38, y1: 0.9, x2: 0.62, y2: 0.42, lineWidth: 10, label: "通向森林深处的金色小路" })
      ];
    }

    const multiObjectActions = multiObjectSceneActions(text);
    if (multiObjectActions) return multiObjectActions;

    if (
      normalized.includes("风景") ||
      normalized.includes("田园") ||
      normalized.includes("小河风景") ||
      normalized.includes("有山有水")
    ) {
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
    return null;
  }

  function normalizeExportFormat(format) {
    const value = String(format || "").toLowerCase();
    if (value.includes("jpg") || value.includes("jpeg")) return "jpeg";
    if (value.includes("webp")) return "webp";
    return "png";
  }

  function detectExportFormat(rawText) {
    const normalized = normalizeText(rawText);
    if (normalized.includes("jpg") || normalized.includes("jpeg") || normalized.includes("照片格式")) return "jpeg";
    if (normalized.includes("webp")) return "webp";
    return "png";
  }

  function actionToSceneText(action) {
    if (!action || typeof action !== "object") return "";
    if (action.type === "background") return `${action.colorLabel || ""}背景`;
    if (action.type === "drawObject") {
      const extras = action.extras || {};
      const details = [];
      if (action.positionLabel) details.push(action.positionLabel);
      if (action.colorLabel) details.push(action.colorLabel);
      if (action.object === "house") {
        if (extras.roofColor) details.push(`${colorLabelFromHex(extras.roofColor)}屋顶`);
        if (extras.wallColor) details.push(`${colorLabelFromHex(extras.wallColor)}墙壁`);
      }
      if (action.object === "sun" && extras.hasGlasses) details.push("戴眼镜");
      if ((action.object === "cat" || action.object === "dog") && extras.playing) details.push("玩耍");
      if ((action.object === "cat" || action.object === "dog") && extras.hasWings) details.push("带翅膀");
      return `${details.join("")}${objectLabel(action.object)}`;
    }
    if (action.type === "drawShape") return `${action.positionLabel || ""}${action.colorLabel || ""}${shapeLabel(action.shape)}`;
    if (action.type === "drawLine") return `${action.colorLabel || ""}线条`;
    return "";
  }

  function summarizeSceneActions(actions) {
    const drawable = materializeDrawingActions(Array.isArray(actions) ? actions : [])
      .filter((action) => action.type !== "refinedImage")
      .slice(-12)
      .map(actionToSceneText)
      .filter(Boolean);
    return drawable.join("，");
  }

  function buildRefinePrompt(rawText, state) {
    const text = String(rawText || "").trim();
    const cleaned = text
      .replace(/小绘/g, "")
      .replace(/AI|ai/g, "")
      .replace(/精绘|高清|润色|美化|重绘|生成高清|变成成品|优化这幅图|优化图片/g, "")
      .replace(/把这幅图|把当前画布|当前画布|这幅图|这张图|一下|图片|图像|图/g, "")
      .replace(/[，。！？,.!?]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const latestUserPrompt = String(state?.lastDrawingPrompt || "").trim();
    const sceneSummary = summarizeSceneActions(state?.actions || []);
    const subject = cleaned || latestUserPrompt || sceneSummary || "根据当前画布草图生成一张完整、清晰、适合展示的儿童友好插画";
    return [
      "请参考当前画布草图和用户意图，重新绘制一张完整、精致、好看的成品插画。",
      "这不是图片放大、锐化、描边、滤镜增强或原样复制任务；请把草图当作粗略构图参考，允许你重新设计细节、材质、光影和背景。",
      `用户原始意图：${subject}`,
      latestUserPrompt && latestUserPrompt !== subject ? `最近绘画指令：${latestUserPrompt}` : "",
      sceneSummary ? `当前画布元素：${sceneSummary}` : "",
      "画面尺寸：1024x1024方形画布，请充分利用整个方形空间，元素居中分布，构图饱满完整。",
      "优先保留主体关系和大致位置，但不要机械照抄草图；你可以优化构图，让画面更平衡、更有层次。",
      "把当前画布截图当作构图草图参考，而不是成品图；请主动补充背景、前景、阴影、光晕、装饰元素和环境细节。",
      "把简单几何草图改造成儿童友好、干净明亮、色彩丰富、构图完整的数字插画，主体清楚，边缘自然，比例协调。",
      "如果画面里有动物或人物，请补充表情、身体结构、互动动作和环境细节，让画面更像一张完成作品。",
      "如果用户描述了房子、太阳、树、河流、动物互动等场景，请优先按文字意图重新画完整场景，再参考草图的位置关系。",
      "不要输出文字、水印、界面元素、截图边框或按钮。"
    ]
      .filter(Boolean)
      .join("\n");
  }

  function isDrawableInstruction(actions) {
    return Array.isArray(actions) && actions.some((action) => DRAWING_ACTION_TYPES.includes(action.type) || action.type === "background");
  }

  function rememberDrawingPrompt(transcript, actions, state) {
    const text = String(transcript || "").trim();
    if (!text) return;
    if (!Array.isArray(actions) || allActionsUnknown(actions)) return;
    if (!isDrawableInstruction(actions)) return;
    if (state) state.lastDrawingPrompt = text;
  }

  function detectUtilityCommand(rawText) {
    const text = normalizeText(rawText);
    const wantsOpen =
      text.includes("打开") ||
      text.includes("查看") ||
      text.includes("切换") ||
      text.includes("进入") ||
      text.includes("显示") ||
      text.includes("回到") ||
      text.includes("返回");

    if ((wantsOpen && text.includes("帮助")) || text.includes("帮助界面")) {
      return { type: "selectTab", target: "help", label: "打开帮助", rawText };
    }
    if (text.includes("帮助") || text.includes("怎么用") || text.includes("能说什么") || text.includes("指令列表")) {
      return { type: "help", label: "打开帮助", rawText };
    }
    if (wantsOpen && (text.includes("配置") || text.includes("模型") || text.includes("api"))) {
      return { type: "selectTab", target: "model", label: "打开配置", rawText };
    }
    if (wantsOpen && (text.includes("绘图") || text.includes("画画") || text.includes("画布"))) {
      return { type: "selectTab", target: "draw", label: "回到绘图", rawText };
    }
    if (text.includes("示例") || text.includes("演示")) {
      return { type: "demo", label: "执行示例", rawText };
    }
    if (REFINEMENT_TRIGGER_RE.test(rawText) || text.includes("精绘") || text.includes("高清") || text.includes("重绘")) {
      return { type: "refineImage", prompt: buildRefinePrompt(rawText), label: "AI 精绘当前画布", rawText };
    }

    const hasImageExportIntent =
      text.includes("导出") ||
      text.includes("下载") ||
      (text.includes("保存") &&
        (text.includes("图片") || text.includes("图像") || text.includes("png") || text.includes("jpg") || text.includes("jpeg") || text.includes("webp")));
    if (hasImageExportIntent) {
      const format = detectExportFormat(rawText);
      return {
        type: "export",
        format,
        label: `导出 ${format.toUpperCase()} 图片`,
        rawText
      };
    }

    const hasCloudSaveIntent =
      (text.includes("保存") || text.includes("存一下")) &&
      (text.includes("作品") || text.includes("云端") || text.includes("账号") || text.includes("绘图"));
    if (hasCloudSaveIntent) {
      return { type: "saveCloud", label: "保存作品到云端", rawText };
    }

    if (
      text.includes("我的作品") ||
      text.includes("作品列表") ||
      text.includes("打开作品") ||
      text.includes("加载作品") ||
      text.includes("查看作品")
    ) {
      return { type: "openDrawings", label: "打开作品列表", rawText };
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
    const utilityCommand = detectUtilityCommand(rawText);

    if (!text) return { type: "unknown", label: "空命令", rawText };
    if (viewCommand) return viewCommand;
    if (utilityCommand) return utilityCommand;
    if (editLast) return editLast;
    if (text.includes("清空") || text.includes("重置") || text.includes("擦掉全部")) {
      return { type: "clear", label: "清空画布", rawText };
    }
    if (text.includes("撤销") || text.includes("退回") || text.includes("上一步")) {
      return { type: "undo", label: "撤销", rawText };
    }
    if (text.includes("重做") || text.includes("恢复")) return { type: "redo", label: "重做", rawText };
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
        label: `颜色${color.label}`,
        rawText
      };
    }

    const object = detectObject(text);
    if (object) {
      // 优先检测相对位置（"在小狗旁边"）
      const relativePos = detectRelativePosition(text, current);
      const position = relativePos
        ? relativePos
        : (hasExplicitPosition(text) ? detectPosition(text) : objectDefaultPosition(object));
      const attributeInfo = detectObjectExtras(rawText, object);
      const objectColor = primaryObjectColor(object, hasExplicitColor(text) ? color : null, attributeInfo.extras);
      const detailLabel = attributeInfo.labels.join("");
      return {
        type: "drawObject",
        object,
        color: objectColor.value,
        colorLabel: objectColor.label,
        extras: Object.keys(attributeInfo.extras).length ? attributeInfo.extras : undefined,
        lineWidth: detectLineWidth(text, current.lineWidth),
        size: detectSize(text),
        x: position.x,
        y: position.y,
        positionLabel: position.label,
        label: detailLabel
          ? `${position.label}${detailLabel}${objectLabel(object)}`
          : `${position.label}${objectColor.label}${objectLabel(object)}`,
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

    if (!/然后|接着|并且|以及|还有|再|;|；/.test(String(text || ""))) {
      const wholeSceneActions = sceneTemplateActions(text);
      if (wholeSceneActions) return wholeSceneActions;
    }

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

  function shouldUseSemanticPlanner(transcript, localActions, semanticProfile) {
    if (!hasUsableModelConfig(semanticProfile)) return false;
    if (allActionsUnknown(localActions)) return true;

    const utilityTypes = new Set([
      "setColor",
      "setLineWidth",
      "clear",
      "undo",
      "redo",
      "export",
      "saveCloud",
      "openDrawings",
      "selectTab",
      "help",
      "demo",
      "setView",
      "refineImage"
    ]);
    if (localActions.every((action) => utilityTypes.has(action.type))) return false;

    const normalized = normalizeText(transcript);
    const text = String(transcript || "");
    const explicitAiIntent =
      normalized.includes("大模型") ||
      normalized.includes("ai理解") ||
      normalized.includes("智能理解") ||
      normalized.includes("帮我理解");
    const storyOrScene =
      /故事|想象|场景|画面|氛围|难忘|回忆|森林|林间|童话|梦|夕阳|落日|远山|河流|小路|玩耍|追逐|互动|翅膀|飞翔/.test(normalized);
    const relationIntent = /一起|旁边|围着|看着|追着|和.*玩|在.*中间|左边.*右边|前面.*后面/.test(normalized);
    const compoundCount = splitCompoundCommand(text).length;

    return explicitAiIntent || (normalized.length >= 18 && (storyOrScene || relationIntent)) || compoundCount >= 3 || localActions.length >= 5;
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
        if (["clear", "undo", "redo", "saveCloud", "openDrawings", "demo", "help", "refineImage"].includes(action.type)) {
          return { type: action.type, label: action.label || action.type, rawText: "model" };
        }
        if (action.type === "export") {
          const format = normalizeExportFormat(action.format || action.label || "");
          return {
            type: "export",
            format,
            label: action.label || `导出 ${format.toUpperCase()} 图片`,
            rawText: "model"
          };
        }
        if (action.type === "selectTab" && ["draw", "model", "help"].includes(action.target)) {
          return { type: "selectTab", target: action.target, label: action.label || "切换界面", rawText: "model" };
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
            label: `颜色${color.label}`,
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
          const extras = {};
          if (action.extras && typeof action.extras === "object") {
            if (action.object === "house") {
              for (const key of ["roofColor", "wallColor", "doorColor", "windowColor"]) {
                if (typeof action.extras[key] === "string" && /^#[0-9a-f]{6}$/i.test(action.extras[key])) {
                  extras[key] = action.extras[key];
                }
              }
            }
            if (action.object === "sun") {
              for (const key of ["hasGlasses", "hasEyes", "hasSmile"]) {
                if (action.extras[key] === true) extras[key] = true;
              }
            }
            if (action.object === "cat" || action.object === "dog") {
              for (const key of ["playing", "hasWings"]) {
                if (action.extras[key] === true) extras[key] = true;
              }
              if (action.extras.facing === "left" || action.extras.facing === "right") extras.facing = action.extras.facing;
            }
          }
          return {
            type: "drawObject",
            object: action.object,
            color: color.value,
            colorLabel: color.label,
            extras: Object.keys(extras).length ? extras : undefined,
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
      "你是语音绘图工具的指令规划器，将用户的自然语言转换为绘图动作的 JSON 数组。",
      "",
      "## 可用动作类型",
      "1. drawShape: 绘制基础形状 {type:'drawShape', shape:'circle|rect|triangle|star|dot', color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, size:0.06-0.36, lineWidth:1-24, label:'简短中文'}",
      "2. drawObject: 绘制复合对象 {type:'drawObject', object:'house|tree|sun|cloud|river|mountain|flower|face|cat|dog|bird|star|moon|car|heart|grass|butterfly|balloon', color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, size:0.08-0.42, lineWidth:1-24, label:'简短中文', extras:{...}}",
      "3. drawLine: 绘制线条 {type:'drawLine', color:'#RRGGBB', colorLabel:'中文颜色', x1:0-1, y1:0-1, x2:0-1, y2:0-1, lineWidth:1-24, label:'简短中文'}",
      "",
      "## extras 高级属性（可选）",
      "对于 house 对象，支持：",
      "- roofColor: 屋顶颜色",
      "- wallColor: 墙壁颜色",
      "- doorColor: 门颜色",
      "- windowColor: 窗户颜色",
      "示例: {type:'drawObject', object:'house', color:'#ffffff', extras:{roofColor:'#ef4444', wallColor:'#ffffff'}, ...}",
      "",
      "对于 sun 对象，支持：",
      "- hasGlasses: true 添加眼镜",
      "- hasEyes: true 添加眼睛",
      "- hasSmile: true 添加笑脸",
      "示例: {type:'drawObject', object:'sun', color:'#facc15', extras:{hasGlasses:true, hasEyes:true}, ...}",
      "",
      "对于 cat/dog 对象，支持：",
      "- playing: true 表示正在玩耍、追逐、互动",
      "- hasWings: true 表示带翅膀、会飞、飞翔",
      "- facing: 'left'|'right' 表示朝向",
      "示例: {type:'drawObject', object:'dog', color:'#92400e', extras:{playing:true, hasWings:true, facing:'right'}, ...}",
      "4. editLast: 修改上一个元素 {type:'editLast', updates:{color:'#RRGGBB', colorLabel:'中文颜色', x:0-1, y:0-1, sizeScale:0.5-1.8, lineWidth:1-24, positionLabel:'中文位置'}, label:'简短中文'}",
      "5. background: 设置背景色 {type:'background', color:'#RRGGBB', colorLabel:'中文颜色'}",
      "6. setColor, setLineWidth, clear, undo, redo, export",
      "",
      "## 常见命令示例",
      "- \"画一个红色的圆\" → [{\"type\":\"drawShape\",\"shape\":\"circle\",\"color\":\"#ef4444\",\"colorLabel\":\"红色\",\"x\":0.5,\"y\":0.5,\"size\":0.15,\"label\":\"红色圆\"}]",
      "- \"在左上角画蓝色房子\" → [{\"type\":\"drawObject\",\"object\":\"house\",\"color\":\"#2563eb\",\"colorLabel\":\"蓝色\",\"x\":0.22,\"y\":0.22,\"size\":0.15,\"label\":\"蓝色房子\"}]",
      "- \"画个太阳\" → [{\"type\":\"drawObject\",\"object\":\"sun\",\"color\":\"#f59e0b\",\"colorLabel\":\"橙色\",\"x\":0.8,\"y\":0.2,\"size\":0.18,\"label\":\"太阳\"}]",
      "- \"画一棵树\" → [{\"type\":\"drawObject\",\"object\":\"tree\",\"color\":\"#16a34a\",\"colorLabel\":\"绿色\",\"x\":0.5,\"y\":0.6,\"size\":0.2,\"label\":\"树\"}]",
      "- \"画只猫\" → [{\"type\":\"drawObject\",\"object\":\"cat\",\"color\":\"#f97316\",\"colorLabel\":\"橙色\",\"x\":0.5,\"y\":0.5,\"size\":0.2,\"label\":\"猫\"}]",
      "- \"画个月亮\" → [{\"type\":\"drawObject\",\"object\":\"moon\",\"color\":\"#fef3c7\",\"colorLabel\":\"淡黄色\",\"x\":0.8,\"y\":0.2,\"size\":0.18,\"label\":\"月亮\"}]",
      "- \"画颗星星\" → [{\"type\":\"drawObject\",\"object\":\"star\",\"color\":\"#facc15\",\"colorLabel\":\"金色\",\"x\":0.3,\"y\":0.2,\"size\":0.12,\"label\":\"星星\"}]",
      "- \"画个爱心\" → [{\"type\":\"drawObject\",\"object\":\"heart\",\"color\":\"#ec4899\",\"colorLabel\":\"粉色\",\"x\":0.5,\"y\":0.4,\"size\":0.15,\"label\":\"爱心\"}]",
      "",
      "## 复杂描述示例",
      "- \"画一个红色屋顶白色墙壁的房子\" → [{\"type\":\"drawObject\",\"object\":\"house\",\"color\":\"#ffffff\",\"colorLabel\":\"白色\",\"x\":0.5,\"y\":0.5,\"size\":0.2,\"extras\":{\"roofColor\":\"#ef4444\",\"wallColor\":\"#ffffff\"},\"label\":\"红屋顶白墙房子\"}]",
      "- \"画一个屋顶是蓝色墙壁是黄色的房子\" → [{\"type\":\"drawObject\",\"object\":\"house\",\"color\":\"#eab308\",\"colorLabel\":\"黄色\",\"x\":0.5,\"y\":0.5,\"size\":0.2,\"extras\":{\"roofColor\":\"#2563eb\",\"wallColor\":\"#eab308\"},\"label\":\"蓝屋顶黄墙房子\"}]",
      "",
      "## 元素组合示例",
      "- \"画一个戴眼镜的太阳\" → [{\"type\":\"drawObject\",\"object\":\"sun\",\"color\":\"#facc15\",\"colorLabel\":\"金色\",\"x\":0.5,\"y\":0.3,\"size\":0.2,\"extras\":{\"hasGlasses\":true},\"label\":\"戴眼镜的太阳\"}]",
      "- \"画一个有眼睛的太阳\" → [{\"type\":\"drawObject\",\"object\":\"sun\",\"color\":\"#facc15\",\"colorLabel\":\"金色\",\"x\":0.5,\"y\":0.3,\"size\":0.2,\"extras\":{\"hasEyes\":true},\"label\":\"有眼睛的太阳\"}]",
      "- \"画一个戴眼镜笑着的太阳\" → [{\"type\":\"drawObject\",\"object\":\"sun\",\"color\":\"#facc15\",\"colorLabel\":\"金色\",\"x\":0.5,\"y\":0.3,\"size\":0.2,\"extras\":{\"hasGlasses\":true,\"hasEyes\":true,\"hasSmile\":true},\"label\":\"戴眼镜笑脸太阳\"}]",
      "- \"在中间画一只带翅膀的狗和小鸟玩耍\" → [{\"type\":\"background\",\"color\":\"#bbf7d0\",\"colorLabel\":\"浅绿色\"},{\"type\":\"drawObject\",\"object\":\"grass\",\"color\":\"#22c55e\",\"colorLabel\":\"绿色\",\"x\":0.5,\"y\":0.78,\"size\":0.32,\"label\":\"草地\"},{\"type\":\"drawObject\",\"object\":\"dog\",\"color\":\"#92400e\",\"colorLabel\":\"棕色\",\"x\":0.45,\"y\":0.58,\"size\":0.23,\"extras\":{\"hasWings\":true,\"playing\":true,\"facing\":\"right\"},\"label\":\"带翅膀的小狗\"},{\"type\":\"drawObject\",\"object\":\"bird\",\"color\":\"#3b82f6\",\"colorLabel\":\"蓝色\",\"x\":0.65,\"y\":0.42,\"size\":0.14,\"label\":\"小鸟\"}]",
      "- \"画一片森林中的难忘景色\" → [{\"type\":\"background\",\"color\":\"#d9f99d\",\"colorLabel\":\"浅绿色\"},{\"type\":\"drawObject\",\"object\":\"sun\",\"color\":\"#f59e0b\",\"colorLabel\":\"橙色\",\"x\":0.78,\"y\":0.18,\"size\":0.16,\"label\":\"温暖落日\"},{\"type\":\"drawObject\",\"object\":\"mountain\",\"color\":\"#64748b\",\"colorLabel\":\"灰色\",\"x\":0.5,\"y\":0.42,\"size\":0.28,\"label\":\"远山\"},{\"type\":\"drawObject\",\"object\":\"river\",\"color\":\"#38bdf8\",\"colorLabel\":\"浅蓝色\",\"x\":0.5,\"y\":0.68,\"size\":0.25,\"label\":\"小河\"},{\"type\":\"drawObject\",\"object\":\"tree\",\"color\":\"#16a34a\",\"colorLabel\":\"绿色\",\"x\":0.28,\"y\":0.52,\"size\":0.22,\"label\":\"左侧大树\"},{\"type\":\"drawObject\",\"object\":\"tree\",\"color\":\"#15803d\",\"colorLabel\":\"深绿色\",\"x\":0.72,\"y\":0.52,\"size\":0.22,\"label\":\"右侧大树\"},{\"type\":\"drawObject\",\"object\":\"flower\",\"color\":\"#ec4899\",\"colorLabel\":\"粉色\",\"x\":0.42,\"y\":0.76,\"size\":0.09,\"label\":\"野花\"}]",
      "",
      "## 通用示例",
      "- \"把它变成绿色\" → [{\"type\":\"editLast\",\"updates\":{\"color\":\"#16a34a\",\"colorLabel\":\"绿色\"},\"label\":\"改为绿色\"}]",
      "- \"放大一点\" → [{\"type\":\"editLast\",\"updates\":{\"sizeScale\":1.3},\"label\":\"放大\"}]",
      "- \"移到右边\" → [{\"type\":\"editLast\",\"updates\":{\"x\":0.75,\"positionLabel\":\"右边\"},\"label\":\"移到右边\"}]",
      "",
      "## 理解规则",
      "1. **颜色映射**: 红→#ef4444, 蓝→#2563eb, 绿→#16a34a, 黄→#eab308, 橙→#f97316, 紫→#9333ea, 黑→#111827, 白→#ffffff, 灰→#64748b, 粉→#ec4899, 棕→#92400e",
      "2. **位置映射**: 左上→(0.22,0.22), 上方→(0.5,0.22), 右上→(0.78,0.22), 左边→(0.22,0.5), 中间→(0.5,0.5), 右边→(0.78,0.5), 左下→(0.22,0.78), 下方→(0.5,0.78), 右下→(0.78,0.78)",
      "3. **尺寸指示**: 小→0.08-0.12, 中等/正常→0.15-0.2, 大→0.25-0.35",
      "4. **复杂场景拆解**: 将场景描述拆解为3-12个基础动作，按从背景到前景的顺序排列",
      "5. **优先使用复合对象**: 有对应的 drawObject 时优先使用，而不是用多个 drawShape 组合",
      "6. **修改指令**: \"把它/上一个/刚才的...\" 使用 editLast",
      "7. **复杂描述解析**: ",
      "   - \"红色屋顶白色墙壁\" → extras:{roofColor:'#ef4444', wallColor:'#ffffff'}",
      "   - \"蓝色门黄色窗\" → extras:{doorColor:'#2563eb', windowColor:'#eab308'}",
      "8. **元素组合识别**: ",
      "   - \"戴眼镜的\" → extras:{hasGlasses:true}",
      "   - \"有眼睛的\" → extras:{hasEyes:true}",
      "   - \"笑着的/微笑的\" → extras:{hasSmile:true}",
      "   - 可以组合多个属性",
      "9. **场景关键词识别**: ",
      "   - 夕阳/日落 → 橙黄背景 + 太阳在右上",
      "   - 夜晚/晚上 → 深蓝背景 + 月亮 + 星星",
      "   - 草地/公园 → 草绿背景 + 树 + 花 + 草地",
      "   - 房子场景 → 天蓝背景 + 房子 + 树 + 云",
      "   - 河边/水边 → 浅蓝背景 + 河流 + 树 + 山",
      "   - 森林/林间/难忘景色 → 浅绿色背景 + 多棵树 + 远山 + 河流/小路 + 落日/光线 + 野花",
      "   - 宠物/动物 → 猫、狗、鸟、蝴蝶",
      "   - 带翅膀/飞翔/会飞 → cat/dog 的 extras.hasWings=true",
      "   - 玩耍/追逐/一起玩 → cat/dog 的 extras.playing=true，并让对象位置相互靠近",
      "   - 浪漫/爱情 → 爱心、气球、花",
      "   - 交通 → 汽车",
      "",
      "## 输出格式",
      "- 只返回纯 JSON 数组，不要 markdown 代码块",
      "- 不要编造不存在的动作类型或对象名称",
      "- 每个动作必须包含 label 字段（简短的中文描述）",
      "- 颜色必须同时提供 color（十六进制）和 colorLabel（中文）",
      "",
      "示例输出格式:",
      "[{\"type\":\"background\",\"color\":\"#38bdf8\",\"colorLabel\":\"天蓝色\"},{\"type\":\"drawObject\",\"object\":\"house\",\"color\":\"#ef4444\",\"colorLabel\":\"红色\",\"x\":0.3,\"y\":0.5,\"size\":0.2,\"label\":\"红房子\"},{\"type\":\"drawObject\",\"object\":\"tree\",\"color\":\"#16a34a\",\"colorLabel\":\"绿色\",\"x\":0.7,\"y\":0.6,\"size\":0.18,\"label\":\"树\"}]"
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

  function isImageGenerationProfile(profile) {
    return Boolean(
      profile &&
        (profile.provider === "doubaoImage" ||
          profile.endpoint?.includes("/images/generations") ||
          /seedream/i.test(profile.model || ""))
    );
  }

  function isSemanticModelProfile(profile) {
    return Boolean(profile && !isImageGenerationProfile(profile));
  }

  function syncModelRoles(appState, profiles = appState.modelProfiles || []) {
    const list = Array.isArray(profiles) ? profiles : [];
    const active = appState.modelConfig;
    appState.modelProfiles = list;
    appState.semanticModelConfig =
      (hasUsableModelConfig(active) && isSemanticModelProfile(active) ? active : null) ||
      list.find((profile) => hasUsableModelConfig(profile) && isSemanticModelProfile(profile)) || makeBlankModelConfig();
    appState.imageModelConfig =
      (hasUsableModelConfig(active) && isImageGenerationProfile(active) ? active : null) ||
      list.find((profile) => hasUsableModelConfig(profile) && isImageGenerationProfile(profile)) || makeBlankModelConfig();
    return {
      semanticModelConfig: appState.semanticModelConfig,
      imageModelConfig: appState.imageModelConfig
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
      ["导出 PNG", "export"],
      ["导出 WebP 图片", "export"],
      ["保存作品到云端", "saveCloud"],
      ["打开我的作品", "openDrawings"],
      ["把这幅图 AI 精绘一下", "refineImage"],
      ["打开帮助界面", "selectTab"],
      ["打开配置界面", "selectTab"],
      ["回到绘图界面", "selectTab"],
      ["执行示例", "demo"],
      ["画一个房子", "drawObject"],
      ["画一个戴眼镜的太阳", "drawObject"],
      ["画一个房子，房顶红色，墙壁白色", "drawObject"],
      ["画一个红色屋顶白色墙壁的房子", "drawObject"],
      ["画一条小河", "drawObject"],
      ["画一只猫和一只狗玩耍", "background,drawObject,drawObject,drawObject,drawShape"],
      ["在中间画一只带翅膀的狗在和小鸟玩耍", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawShape"],
      ["画一片森林中的难忘景色，夕阳照在小河和小路上", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,drawLine"],
      ["帮我画一个夕阳下的房子，左边有树，右上角有太阳", "background,drawObject,drawObject,drawObject"],
      ["画一棵树，然后画太阳", "drawObject,drawObject"],
      ["画一幅风景", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject"],
      ["把刚才的房子改成蓝色", "editLast"],
      ["把上一笔移到右上角", "editLast"],
      ["画一幅风景，然后把上一笔放大一点", "background,drawObject,drawObject,drawObject,drawObject,drawObject,drawObject,editLast"],
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

    const glassesSun = parseVoiceCommand("画一个戴眼镜的太阳", state)[0];
    if (glassesSun?.object !== "sun" || !glassesSun.extras?.hasGlasses || !glassesSun.extras?.hasEyes) {
      failures.push({
        input: "glasses sun extras",
        expected: "sun with glasses and eyes",
        actual: JSON.stringify(glassesSun)
      });
    }

    const coloredHouse = parseVoiceCommand("画一个房子，房顶红色，墙壁白色", state)[0];
    if (
      coloredHouse?.object !== "house" ||
      coloredHouse.extras?.roofColor !== "#ef4444" ||
      coloredHouse.extras?.wallColor !== "#ffffff" ||
      coloredHouse.color !== "#ffffff"
    ) {
      failures.push({
        input: "colored house extras",
        expected: "house roof red wall white",
        actual: JSON.stringify(coloredHouse)
      });
    }

    const sunsetScene = parseVoiceCommand("帮我画一个夕阳下的房子，左边有树，右上角有太阳", state);
    const sceneObjects = sunsetScene.filter((action) => action.type === "drawObject");
    if (
      sunsetScene[0]?.type !== "background" ||
      sceneObjects.map((action) => action.object).join(",") !== "house,tree,sun" ||
      sceneObjects[1]?.positionLabel !== "左边" ||
      sceneObjects[2]?.positionLabel !== "右上"
    ) {
      failures.push({
        input: "sunset multi-object scene",
        expected: "background + house + left tree + upper-right sun",
        actual: JSON.stringify(sunsetScene)
      });
    }

    const riverOnly = parseVoiceCommand("画一条小河", state);
    if (riverOnly.length !== 1 || riverOnly[0]?.object !== "river") {
      failures.push({
        input: "river should be single object",
        expected: "one river action",
        actual: JSON.stringify(riverOnly)
      });
    }

    const catDogPlay = parseVoiceCommand("画一只猫和一只狗玩耍", state);
    const catDogObjects = catDogPlay.filter((action) => action.type === "drawObject");
    if (
      catDogPlay[0]?.type !== "background" ||
      catDogObjects.map((action) => action.object).join(",") !== "grass,cat,dog" ||
      !catDogObjects[1]?.extras?.playing ||
      !catDogObjects[2]?.extras?.playing
    ) {
      failures.push({
        input: "cat dog play scene",
        expected: "background + grass + playing cat + playing dog + ball",
        actual: JSON.stringify(catDogPlay)
      });
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
    const accountDialog = document.getElementById("accountDialog");
    const accountEntryButton = document.getElementById("accountEntryButton");
    const closeAccountButton = document.getElementById("closeAccountButton");
    const aiRefineIntroDialog = document.getElementById("aiRefineIntroDialog");
    const closeAiRefineIntroButton = document.getElementById("closeAiRefineIntroButton");
    const aiRefineIntroConfigButton = document.getElementById("aiRefineIntroConfigButton");
    const aiRefineIntroStartButton = document.getElementById("aiRefineIntroStartButton");
    const wakeWordHint = document.getElementById("wakeWordHint");
    const demoButton = document.getElementById("demoButton");
    const voiceTestButton = document.getElementById("voiceTestButton");
    const exportFormat = document.getElementById("exportFormat");
    const exportButton = document.getElementById("exportButton");
    const modelHintBar = document.getElementById("modelHintBar");
    const modelHintJump = document.getElementById("modelHintJump");
    const dismissModelHint = document.getElementById("dismissModelHint");
    const planList = document.getElementById("planList");
    const latencyBadge = document.getElementById("latencyBadge");
    const aiRefineButton = document.getElementById("aiRefineButton");
    const imageCache = new Map();

    const appState = {
      ...makeState(),
      background: "#ffffff",
      actions: [],
      conversationLog: [],
      redoStack: [],
      recognition: null,
      listening: false,
      wakeWordMode: true,
      wakeWordTimeout: null,
      wakeWordCount: 0,
      lastWakeWordTime: 0,
      silenceTimeout: null,
      finalTranscriptTimer: null,
      pendingTranscript: "",
      isSpeaking: false,
      manualStop: false,
      recognitionStarting: false,
      recognitionRestartTimer: null,
      pendingRecognitionRestart: false,
      lastSpeechError: null,
      speechFinish: null,
      speechCancelLockUntil: 0,
      resumeRecognitionAfterSpeech: false,
      lastSpokenVoiceName: "",
      lastSpeechErrorMessage: "",
      viewScale: 1,
      modelHintDismissed: false,
      currentUser: loadJson(STORAGE_KEYS.session, null),
      modelProfiles: [],
      modelConfig: makeBlankModelConfig(),
      semanticModelConfig: makeBlankModelConfig(),
      imageModelConfig: makeBlankModelConfig(),
      lastDrawingPrompt: "",
      lastRefinePrompt: "",
      pendingAiRefineAction: null,
      aiRefineIntroOpen: false
    };

    function loadCanvasImage(src) {
      if (!src) return null;
      if (imageCache.has(src)) return imageCache.get(src);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => render();
      image.onerror = () => {
        imageCache.delete(src);
        addConversation("系统", "AI 精绘图片加载失败");
      };
      image.src = src;
      imageCache.set(src, image);
      return image;
    }

    const selectTab = setupTabs();
    setupHistoryDialog();
    setupAccountDialog();
    setupAiRefineIntroDialog();
    setupDrawingsDialog();
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

    function updateVoiceButtons() {}

    function updateCanvasView() {
      canvas.style.setProperty("--canvas-scale", String(appState.viewScale));
    }

    function clearFinalTranscriptTimer() {
      if (appState.finalTranscriptTimer) {
        clearTimeout(appState.finalTranscriptTimer);
        appState.finalTranscriptTimer = null;
      }
      appState.pendingTranscript = "";
    }

    function getSpeechVoicesWhenReady(timeout = 1200) {
      const synth = window.speechSynthesis;
      const loaded = synth.getVoices();
      if (loaded.length) return Promise.resolve(loaded);
      return new Promise((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          if (typeof synth.removeEventListener === "function") {
            synth.removeEventListener("voiceschanged", finish);
          }
          resolve(synth.getVoices());
        };
        const timer = setTimeout(finish, timeout);
        if (typeof synth.addEventListener === "function") {
          synth.addEventListener("voiceschanged", finish, { once: true });
        } else {
          const previousHandler = synth.onvoiceschanged;
          synth.onvoiceschanged = (event) => {
            if (typeof previousHandler === "function") previousHandler.call(synth, event);
            finish();
          };
        }
        synth.getVoices();
      });
    }

    function normalizeVoiceText(value) {
      return String(value || "").toLowerCase();
    }

    function isChineseVoice(voice) {
      const lang = normalizeVoiceText(voice.lang);
      const name = normalizeVoiceText(voice.name);
      return lang.startsWith("zh") || name.includes("chinese") || name.includes("mandarin") || name.includes("普通话") || name.includes("中文");
    }

    function scoreChineseVoice(voice) {
      const name = normalizeVoiceText(voice.name);
      const lang = normalizeVoiceText(voice.lang);
      let score = 0;

      // 优先普通话，避免粤语
      if (lang === "zh-cn" || lang === "zh_hans_cn" || lang === "cmn-cn") score += 100;
      else if (lang === "zh-tw" || lang === "cmn-tw") score += 60;
      else if (lang === "zh-hk" || lang === "yue-hk") score += 10; // 粤语得分很低
      else if (lang.startsWith("zh")) score += 40;

      // 排除粤语相关
      if (name.includes("cantonese") || name.includes("粤语") || name.includes("广东话") || name.includes("yue")) score -= 200;

      // 普通话关键词加分
      if (name.includes("mandarin") || name.includes("普通话")) score += 50;

      if (name.includes("natural") || name.includes("neural") || name.includes("online")) score += 80;
      if (name.includes("google")) score += 45;
      if (name.includes("xiaoxiao")) score += 42;
      if (name.includes("xiaoyi")) score += 40;
      if (name.includes("yunxi") || name.includes("yunyang") || name.includes("yunxia")) score += 34;
      if (name.includes("xiaobei") || name.includes("xiaomo") || name.includes("xiaohan") || name.includes("xiaoxuan")) score += 28;
      if (name.includes("tingting") || name.includes("meijia") || name.includes("sinji")) score += 24;
      if (name.includes("female") || name.includes("女")) score += 8;
      if (name.includes("desktop")) score -= 90;
      if (name.includes("huihui") || name.includes("yaoyao") || name.includes("kangkang")) score -= 50;
      return score;
    }

    function getPreferredChineseVoices(voices) {
      return voices
        .filter(isChineseVoice)
        .map((voice, index) => ({ voice, index, score: scoreChineseVoice(voice) }))
        .filter((item) => item.score >= 25)
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map((item) => item.voice);
    }

    function makeSpeechUtterance(text, voice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang || "zh-CN";
      utterance.voice = voice;
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      return utterance;
    }

    async function speak(text, priority = 'low') {
      // priority: 'high' (重要操作), 'low' (普通操作), 'none' (不语音)
      if (!("speechSynthesis" in window)) return Promise.resolve(false);

      // 'none' 优先级不播报语音
      if (priority === 'none') return Promise.resolve(false);

      const shouldPauseRecognition = appState.recognition && appState.listening;
      if (shouldPauseRecognition) {
        appState.resumeRecognitionAfterSpeech = true;
        appState.manualStop = true;
        clearRecognitionRestartTimer();
        try {
          appState.recognition.stop();
        } catch {
          appState.resumeRecognitionAfterSpeech = false;
        }
      }

      if (typeof appState.speechFinish === "function") appState.speechFinish(false);
      window.speechSynthesis.cancel();
      appState.isSpeaking = true;
      appState.lastSpokenVoiceName = "";
      appState.lastSpeechErrorMessage = "";
      appState.speechCancelLockUntil = Date.now() + Math.max(1200, String(text || "").length * 180);
      const voices = await getSpeechVoicesWhenReady();
      const voiceCandidates = getPreferredChineseVoices(voices);

      return new Promise((resolve) => {
        let settled = false;
        let fallbackTimer = null;
        const finish = (completed) => {
          if (settled) return;
          settled = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          appState.isSpeaking = false;
          appState.speechCancelLockUntil = 0;
          if (appState.speechFinish === finish) appState.speechFinish = null;
          if (appState.resumeRecognitionAfterSpeech) {
            appState.resumeRecognitionAfterSpeech = false;
            appState.manualStop = false;
            setTimeout(() => {
              if (!appState.listening && !appState.recognitionStarting) startRecognition();
            }, completed ? 250 : 700);
          }
          resolve(completed);
        };
        const failWithoutRobotVoice = (errorName = "") => {
          const available = voices.filter(isChineseVoice).map((voice) => voice.name).slice(0, 4).join("、");
          const message = available
            ? `没有可用的自然中文语音，已避免使用机器人音。检测到：${available}`
            : `没有检测到中文自然语音包，已避免使用机器人音。请在系统语音包中安装中文自然语音后再试`;
          appState.lastSpeechErrorMessage = message;
          heardText.textContent = message;
          if (errorName) console.warn("语音播放失败:", errorName);
          finish(false);
        };

        appState.speechFinish = finish;
        fallbackTimer = setTimeout(() => finish(false), Math.max(2500, String(text || "").length * 260));

        const tryVoice = (index) => {
          if (settled) return;
          const voice = voiceCandidates[index];
          if (!voice) {
            failWithoutRobotVoice();
            return;
          }
          const utterance = makeSpeechUtterance(text, voice);
          appState.lastSpokenVoiceName = voice.name;
          console.log("[使用语音] " + voice.name + " (" + voice.lang + ")");

          // 语音播放结束后，恢复语音识别
          utterance.onend = () => finish(true);

          // 如果被打断（用户说话），也需要清除标记
          utterance.oninterrupt = () => finish(false);
          utterance.onpause = () => {
            if (!window.speechSynthesis.speaking) finish(false);
          };
          utterance.onerror = (event) => {
            const errorName = String(event?.error || "");
            console.warn("语音播放失败:", errorName, voice.name);
            if (index + 1 < voiceCandidates.length) {
              try {
                window.speechSynthesis.cancel();
              } catch {}
              setTimeout(() => tryVoice(index + 1), 120);
              return;
            }
            failWithoutRobotVoice(errorName || "浏览器阻止播放，请点语音自检");
          };

          window.speechSynthesis.speak(utterance);
        };

        tryVoice(0);
      });
    }

    // 确保语音列表已加载
    window.speechSynthesis?.getVoices?.();

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
        if (action.type === "refinedImage") drawRefinedImage(ctx, canvas, action, loadCanvasImage);
      }

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
        speak("没有可编辑的上一笔。", 'low');
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
      speak(action.label, 'low');
      render();
    }

    function applyViewAction(action) {
      if (action.mode === "fit") appState.viewScale = 1;
      if (action.mode === "zoomIn") appState.viewScale = clamp(appState.viewScale + 0.12, 0.7, 1.45);
      if (action.mode === "zoomOut") appState.viewScale = clamp(appState.viewScale - 0.12, 0.7, 1.45);
      heardText.textContent = action.label;
      addConversation("执行", `${action.label}：${Math.round(appState.viewScale * 100)}%`);
      speak(action.label, 'low');
      updateCanvasView();
    }

    function canvasSnapshotDataUrl() {
      const exportTarget = document.createElement("canvas");
      exportTarget.width = canvas.width;
      exportTarget.height = canvas.height;
      const exportCtx = exportTarget.getContext("2d");
      exportCtx.fillStyle = "#ffffff";
      exportCtx.fillRect(0, 0, exportTarget.width, exportTarget.height);
      exportCtx.drawImage(canvas, 0, 0);
      return exportTarget.toDataURL("image/png");
    }

    function getImageGenerationProfile() {
      if (hasUsableModelConfig(appState.imageModelConfig) && isImageGenerationProfile(appState.imageModelConfig)) {
        return appState.imageModelConfig;
      }
      if (hasUsableModelConfig(appState.modelConfig) && isImageGenerationProfile(appState.modelConfig)) {
        return appState.modelConfig;
      }
      const profiles = Array.isArray(appState.modelProfiles) ? appState.modelProfiles : [];
      return profiles.find((profile) => hasUsableModelConfig(profile) && isImageGenerationProfile(profile)) || null;
    }

    function shouldShowAiRefineIntro() {
      return localStorage.getItem(STORAGE_KEYS.aiRefineIntroSeen) !== "true";
    }

    function showAiRefineIntro(action = {}) {
      if (!aiRefineIntroDialog || appState.aiRefineIntroOpen) return false;
      appState.pendingAiRefineAction = action;
      appState.aiRefineIntroOpen = true;
      try {
        if (typeof aiRefineIntroDialog.showModal === "function" && !aiRefineIntroDialog.open) {
          aiRefineIntroDialog.showModal();
        } else {
          aiRefineIntroDialog.setAttribute("open", "");
        }
      } catch {
        aiRefineIntroDialog.setAttribute("open", "");
      }
      return true;
    }

    function closeAiRefineIntro() {
      if (!aiRefineIntroDialog) return;
      appState.aiRefineIntroOpen = false;
      if (typeof aiRefineIntroDialog.close === "function" && aiRefineIntroDialog.open) {
        aiRefineIntroDialog.close();
      } else {
        aiRefineIntroDialog.removeAttribute("open");
      }
    }

    async function refineCurrentCanvas(action = {}) {
      if (action.skipIntro !== true && shouldShowAiRefineIntro()) {
        showAiRefineIntro(action);
        return;
      }
      if (!window.apiClient || !window.apiClient.isAuthenticated()) {
        const message = "请先登录账号，再使用 AI 精绘";
        heardText.textContent = message;
        addConversation("系统", message);
        speak(message, "high");
        return;
      }
      const imageProfile = getImageGenerationProfile();
      if (!imageProfile) {
        const message = "请先在配置界面新增并启用\"豆包图片生成\"模型";
        heardText.textContent = message;
        addConversation("系统", message);
        await speak(message, "high");
        selectTab("model");
        return;
      }
      if (appState.refiningImage) return;

      const prompt = action.rawText
        ? buildRefinePrompt(action.rawText, appState)
        : (action.prompt || buildRefinePrompt("", appState));
      appState.lastRefinePrompt = prompt;
      appState.refiningImage = true;
      aiRefineButton?.setAttribute("disabled", "");
      if (aiRefineButton) aiRefineButton.textContent = "精绘中...";
      heardText.textContent = "AI 正在精绘当前画布...";
      addConversation("执行", "AI 精绘当前画布");
      addConversation("系统", "已根据最近绘画意图生成精绘提示");
      renderPlan([{ type: "refineImage", label: "AI 精绘当前画布" }], "model");

      try {
        const response = await window.apiClient.refineImage({
          prompt,
          canvasImage: canvasSnapshotDataUrl(),
          profileId: imageProfile.profileId,
          size: "1024x1024",
          referenceMode: "reference"
        });
        const imageSource = response.data?.imageDataUrl || response.data?.imageUrl;
        if (!imageSource) throw new Error("图片模型没有返回图片");

        appState.actions.push({
          type: "refinedImage",
          imageSource,
          prompt,
          label: "AI 精绘结果",
          rawText: action.rawText || "AI 精绘"
        });
        appState.redoStack = [];
        loadCanvasImage(imageSource);
        heardText.textContent = "AI 精绘完成";
        addConversation("执行", "AI 精绘完成");
        speak("AI 精绘完成", "high");
        render();
      } catch (error) {
        console.error("AI 精绘失败:", error);
        const message = "AI 精绘失败: " + error.message;
        heardText.textContent = message;
        addConversation("系统", message);
        speak("AI 精绘失败，请检查图片模型配置", "high");
      } finally {
        appState.refiningImage = false;
        aiRefineButton?.removeAttribute("disabled");
        if (aiRefineButton) aiRefineButton.textContent = "AI 精绘";
      }
    }

    function setWakeWordHint(mode) {
      if (!wakeWordHint) return;
      wakeWordHint.classList.remove("is-awake", "is-listening", "is-idle");
      if (mode === "awake") {
        wakeWordHint.textContent = "已唤醒，请说指令";
        wakeWordHint.classList.add("is-awake");
      } else if (mode === "listening") {
        wakeWordHint.textContent = "正在监听";
        wakeWordHint.classList.add("is-listening");
      } else {
        wakeWordHint.textContent = "说小绘小绘唤醒我";
        wakeWordHint.classList.add("is-idle");
      }
    }

    async function saveCurrentDrawingToCloud(options = {}) {
      const { askName = true, showAlert = true } = options;
      if (!window.apiClient || !window.apiClient.isAuthenticated()) {
        const message = "请先登录账号才能保存作品到云端";
        heardText.textContent = message;
        addConversation("系统", message);
        if (showAlert) alert(message);
        else speak(message, "high");
        return false;
      }

      if (appState.actions.length === 0) {
        const message = "画布是空的，无法保存";
        heardText.textContent = message;
        addConversation("系统", message);
        if (showAlert) alert(message);
        else speak(message, "high");
        return false;
      }

      const defaultName = "我的作品 " + new Date().toLocaleString();
      const name = askName ? prompt("请输入作品名称:", defaultName) : defaultName;
      if (!name) return false;

      try {
        const thumbnail = canvas.toDataURL("image/png");
        await window.apiClient.createDrawing(name, appState.actions, thumbnail);
        heardText.textContent = "作品已保存到云端";
        addConversation("执行", `保存作品：${name}`);
        if (showAlert) alert("✅ 保存成功！");
        speak("作品已保存", "high");
        return true;
      } catch (error) {
        console.error("保存失败:", error);
        const message = "保存失败: " + error.message;
        heardText.textContent = message;
        addConversation("系统", message);
        if (showAlert) alert("❌ " + message);
        else speak("保存失败，请检查后端和数据库连接", "high");
        return false;
      }
    }

    async function openDrawingsDialog(options = {}) {
      const { showAlert = true } = options;
      const drawingsDialog = document.getElementById("drawingsDialog");
      const drawingsList = document.getElementById("drawingsList");
      const drawingsLoadingMessage = document.getElementById("drawingsLoadingMessage");

      if (!window.apiClient || !window.apiClient.isAuthenticated()) {
        const message = "请先登录账号";
        heardText.textContent = message;
        addConversation("系统", message);
        if (showAlert) alert(message);
        else speak(message, "high");
        return false;
      }

      if (typeof drawingsDialog.showModal === "function" && !drawingsDialog.open) {
        drawingsDialog.showModal();
      } else {
        drawingsDialog.setAttribute("open", "");
      }

      try {
        drawingsLoadingMessage.style.display = "block";
        drawingsLoadingMessage.textContent = "加载中...";
        drawingsList.style.display = "none";

        const response = await window.apiClient.getDrawings(50, 0);
        const drawings = response.data.drawings;

        drawingsLoadingMessage.style.display = "none";
        drawingsList.style.display = "block";

        if (drawings.length === 0) {
          drawingsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">暂无保存的作品</p>';
          heardText.textContent = "暂无保存的作品";
          addConversation("执行", "打开作品列表：暂无作品");
          return true;
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

        drawingsList.querySelectorAll(".load-drawing-btn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const drawingId = e.target.dataset.id;
            try {
              const response = await window.apiClient.getDrawing(drawingId);
              appState.actions = response.data.drawing.actions;
              appState.redoStack = [];
              render();
              drawingsDialog.close();
              speak("作品已加载", "high");
              alert("✅ 作品已加载");
            } catch (error) {
              console.error("加载失败:", error);
              alert("❌ 加载失败: " + error.message);
            }
          });
        });

        drawingsList.querySelectorAll(".delete-drawing-btn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const drawingId = e.target.dataset.id;
            if (!confirm("确定要删除这个作品吗？")) return;

            try {
              await window.apiClient.deleteDrawing(drawingId);
              alert("✅ 已删除");
              drawingsDialog.close();
              setTimeout(() => openDrawingsDialog({ showAlert: false }), 100);
            } catch (error) {
              console.error("删除失败:", error);
              alert("❌ 删除失败: " + error.message);
            }
          });
        });

        heardText.textContent = "作品列表已打开";
        addConversation("执行", `打开作品列表：${drawings.length} 个作品`);
        if (!showAlert) speak("作品列表已打开", "low");
        return true;
      } catch (error) {
        console.error("加载作品列表失败:", error);
        drawingsLoadingMessage.textContent = "❌ 加载失败: " + error.message;
        drawingsList.style.display = "none";
        heardText.textContent = "加载作品列表失败";
        addConversation("系统", "加载作品列表失败: " + error.message);
        if (!showAlert) speak("加载作品列表失败，请检查后端和数据库连接", "high");
        return false;
      }
    }

    async function executeAction(action) {
      if (action.type === "unknown") {
        heardText.textContent = `未识别：${action.rawText || ""}`;
        addConversation("系统", `未识别：${action.rawText || ""}`);
        speak("这句我还没有理解，请换一种说法。", 'high');
        return;
      }
      if (action.type === "help") {
        selectTab("help");
        heardText.textContent = "已打开帮助，可以查看绘图、编辑、导出和作品命令。";
        addConversation("系统", "打开帮助命令");
        speak("已打开帮助", 'low');
        return;
      }
      if (action.type === "selectTab") {
        selectTab(action.target);
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label, 'low');
        return;
      }
      if (action.type === "demo") {
        heardText.textContent = "执行示例：画一幅风景";
        addConversation("执行", "执行示例命令");
        await handleTranscript("画一幅风景");
        return;
      }
      if (action.type === "setColor") {
        appState.color = action.color;
        appState.colorLabel = action.colorLabel;
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label, 'low');
        render();
        return;
      }
      if (action.type === "setLineWidth") {
        appState.lineWidth = action.width;
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label, 'low');
        render();
        return;
      }
      if (action.type === "background") {
        appState.actions.push(action);
        appState.redoStack = [];
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak(action.label, 'low');
        render();
        return;
      }
      if (action.type === "clear") {
        appState.actions = [];
        appState.redoStack = [];
        heardText.textContent = action.label;
        addConversation("执行", action.label);
        speak("画布已清空", 'low');
        render();
        return;
      }
      if (action.type === "undo") {
        const previous = appState.actions.pop();
        if (previous) appState.redoStack.push(previous);
        heardText.textContent = action.label;
        addConversation("执行", previous ? "撤销上一笔" : "没有可撤销的动作");
        speak(previous ? "已撤销" : "没有可撤销的动作", 'low');
        render();
        return;
      }
      if (action.type === "redo") {
        const restored = appState.redoStack.pop();
        if (restored) appState.actions.push(restored);
        heardText.textContent = action.label;
        addConversation("执行", restored ? "重做上一笔" : "没有可重做的动作");
        speak(restored ? "已重做" : "没有可重做的动作", 'low');
        render();
        return;
      }
      if (action.type === "export") {
        const format = normalizeExportFormat(action.format || exportFormat?.value || "png");
        if (exportFormat) exportFormat.value = format;
        exportCanvas(canvas, format);
        heardText.textContent = action.label;
        addConversation("执行", `导出 ${format.toUpperCase()} 图片`);
        speak(`${format.toUpperCase()} 图片已导出`, 'high'); // 导出成功需要提示
        return;
      }
      if (action.type === "saveCloud") {
        await saveCurrentDrawingToCloud({ askName: false, showAlert: false });
        return;
      }
      if (action.type === "openDrawings") {
        await openDrawingsDialog({ showAlert: false });
        return;
      }
      if (action.type === "refineImage") {
        await refineCurrentCanvas(action);
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
        speak(`已绘制${action.label}`, 'low');
        render();
      }
    }

    async function handleTranscript(transcript) {
      appState.pendingTranscript = "";
      if (appState.finalTranscriptTimer) {
        clearTimeout(appState.finalTranscriptTimer);
        appState.finalTranscriptTimer = null;
      }
      const startedAt = Date.now();
      heardText.textContent = transcript;
      addConversation("用户", transcript);
      let actions = parseVoiceCommand(transcript, appState);
      const localActions = actions;
      let planSource = "local";

      const semanticProfile = appState.semanticModelConfig;
      if (shouldUseSemanticPlanner(transcript, localActions, semanticProfile)) {
        renderPlan([{ type: "model", label: "AI 正在拆解复杂指令" }], "model");
        setStatus("模型规划中", "listening");
        try {
          const modelActions = await planWithModel(transcript, appState, semanticProfile);
          actions = modelActions.length ? modelActions : localActions;
          if (!actions.length) actions = [{ type: "unknown", rawText: transcript, label: "模型未返回动作" }];
          heardText.textContent = `模型规划：${actions.map((action) => action.label || action.type).join("，")}`;
          addConversation("模型", actions.map((action) => action.label || action.type).join("，"));
          planSource = modelActions.length ? "model" : "local";
        } catch (error) {
          if (!allActionsUnknown(localActions)) {
            actions = localActions;
            planSource = "local";
            addConversation("系统", `AI 规划失败，已使用本地解析：${error.message}`);
          } else {
            actions = [{ type: "unknown", rawText: error.message, label: "模型错误" }];
            planSource = "error";
          }
        } finally {
          setStatus(appState.listening ? "监听中" : "已停止", appState.listening ? "listening" : undefined);
        }
      }

      renderPlan(actions, allActionsUnknown(actions) ? "error" : planSource, Date.now() - startedAt);
      rememberDrawingPrompt(transcript, actions, appState);
      for (const action of actions) await executeAction(action);
      rememberDrawingPrompt(transcript, actions, appState);
    }

    function clearRecognitionRestartTimer() {
      if (appState.recognitionRestartTimer) {
        clearTimeout(appState.recognitionRestartTimer);
        appState.recognitionRestartTimer = null;
      }
      appState.pendingRecognitionRestart = false;
    }

    function scheduleRecognitionRestart(delay = 700) {
      if (appState.manualStop) return;
      appState.pendingRecognitionRestart = true;
      if (appState.recognitionRestartTimer) clearTimeout(appState.recognitionRestartTimer);
      appState.recognitionRestartTimer = setTimeout(() => {
        appState.recognitionRestartTimer = null;
        appState.pendingRecognitionRestart = false;
        if (!appState.manualStop && !appState.listening && !appState.recognitionStarting) {
          startRecognition();
        }
      }, delay);
    }

    function startRecognition() {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        setStatus("不支持", "error");
        heardText.textContent = "当前浏览器不支持 Web Speech API";
        return;
      }
      if (appState.listening || appState.recognitionStarting) return;
      appState.manualStop = false;
      appState.lastSpeechError = null;
      clearRecognitionRestartTimer();
      if (!appState.recognition) {
        const recognition = new Recognition();
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => {
          appState.listening = true;
          appState.recognitionStarting = false;
          appState.lastSpeechError = null;
          setStatus("监听中", "listening");
          updateVoiceButtons();
          setWakeWordHint(appState.wakeWordMode ? "idle" : "listening");
          // 重置静音计时器
          resetSilenceTimeout();
        };
        recognition.onend = () => {
          appState.listening = false;
          appState.recognitionStarting = false;
          setStatus("已停止");
          updateVoiceButtons();
          clearSilenceTimeout();
          if (appState.wakeWordMode) clearFinalTranscriptTimer();
          if (appState.wakeWordMode) setWakeWordHint("idle");
          if (!appState.manualStop) {
            scheduleRecognitionRestart(appState.lastSpeechError === "no-speech" ? 500 : 900);
          }
        };
        recognition.onerror = (event) => {
          appState.lastSpeechError = event.error;
          clearSilenceTimeout();
          if (event.error === "network") {
            appState.manualStop = true;
            appState.wakeWordMode = true;
            clearRecognitionRestartTimer();
            setStatus("网络连接失败", "error");
            setWakeWordHint("idle");

            // 提供详细的解决方案
            const errorMsg = [
              "[X] 语音识别服务连接失败",
              "",
              "[!] 原因：Web Speech API 需要连接 Google 服务器",
              "",
              "[解决方法]",
              "1. 确认 VPN/代理已开启",
              "2. 测试：在新标签打开 google.com 确认能访问",
              "3. 如能访问 Google，刷新本页面",
              "4. 点击\"语音自检\"重新测试",
              "",
              "[提示] 也可以使用 simple-voice-test.html 进行详细诊断"
            ].join("\n");

            heardText.textContent = "[X] 语音服务连接失败（需要访问 Google） - 请检查 VPN/代理";
            addConversation("系统", "Web Speech API network 错误 - 无法连接到 Google 语音服务");
            console.error(errorMsg);

            // 显示在页面上
            if (confirm("语音识别连接失败。需要：\n1. 开启 VPN/代理\n2. 确保能访问 Google\n\n是否打开简单测试页面？")) {
              window.open('simple-voice-test.html', '_blank');
            }
            return;
          }
          if (event.error === "no-speech") {
            appState.wakeWordMode = true;
            setStatus("等待唤醒", "listening");
            setWakeWordHint("idle");
            heardText.textContent = "没听到声音，请再说\"小绘，小绘\"唤醒我";
            addConversation("系统", "未检测到语音，已继续等待唤醒");
            scheduleRecognitionRestart(500);
            return;
          }
          if (event.error === "aborted") return;
          setStatus("异常", "error");
          heardText.textContent = `语音识别异常：${event.error}`;
          addConversation("系统", `语音识别异常：${event.error}，正在尝试恢复`);
          scheduleRecognitionRestart(1200);
        };
        recognition.onresult = (event) => {
          // 用户开始说话，打断当前播放的语音
          if (appState.isSpeaking && Date.now() > appState.speechCancelLockUntil) {
            window.speechSynthesis.cancel();
            appState.isSpeaking = false;
            if (typeof appState.speechFinish === "function") appState.speechFinish(false);
          }

          // 重置静音计时器
          resetSilenceTimeout();

          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const transcript = event.results[i][0].transcript.trim();
            if (event.results[i].isFinal) {
              // 唤醒词模式：允许"小绘，小绘\"，也允许单次\"小绘\"降低演示门槛
              if (appState.wakeWordMode) {
                const text = transcript.replace(/[，。、\s]/g, ''); // 移除标点和空格
                const wakeMatches = text.match(/小[绘会慧惠灰画]/g) || [];
                const hasWakeWord =
                  wakeMatches.length >= 1 ||
                  text.includes("小绘") ||
                  text.includes("小会") ||
                  text.includes("小慧") ||
                  text.includes("小惠") ||
                  text.includes("小灰") ||
                  text.includes("小画");

                if (hasWakeWord) {
                  // 成功唤醒
                  appState.wakeWordMode = false;
                  window.speechSynthesis?.cancel?.();
                  speak("在呢，你想画什么", "high");
                  setWakeWordHint("awake");
                  heardText.textContent = "已唤醒，请说绘图指令...";
                } else {
                  // 不是唤醒词，安静等待
                  heardText.textContent = `等待唤醒...`;
                }
              } else {
                // 正常命令模式
                queueFinalTranscript(transcript);
              }
            } else {
              interim += transcript;
            }
          }
          if (interim && !appState.wakeWordMode) {
            heardText.textContent = interim;
          }
        };
        appState.recognition = recognition;
      }
      try {
        appState.recognitionStarting = true;
        appState.recognition.start();
      } catch (error) {
        appState.recognitionStarting = false;
        if (!appState.listening) {
          if (String(error.message || "").includes("already started")) return;
          setStatus("异常", "error");
          heardText.textContent = error.message;
          scheduleRecognitionRestart(1200);
        }
      }
    }

    function queueFinalTranscript(transcript) {
      const text = String(transcript || "").trim();
      if (!text) return;
      appState.pendingTranscript = appState.pendingTranscript
        ? `${appState.pendingTranscript}，${text}`
        : text;
      heardText.textContent = appState.pendingTranscript;

      if (appState.finalTranscriptTimer) {
        clearTimeout(appState.finalTranscriptTimer);
      }
      appState.finalTranscriptTimer = setTimeout(() => {
        const finalText = appState.pendingTranscript.trim();
        appState.pendingTranscript = "";
        appState.finalTranscriptTimer = null;
        if (finalText && !appState.wakeWordMode) {
          handleTranscript(finalText);
        }
      }, 900);
    }

    function resetSilenceTimeout() {
      clearSilenceTimeout();
      // 10秒无声音自动停止识别
      appState.silenceTimeout = setTimeout(() => {
        if (appState.listening && appState.recognition) {
          appState.manualStop = false;
          appState.recognition.stop();
          appState.wakeWordMode = true;
          appState.wakeWordCount = 0;
          setWakeWordHint("idle");
          heardText.textContent = "10秒无声音，已自动停止";
          addConversation("系统", "10秒无声音，已自动停止。说\"小绘，小绘\"重新唤醒");

          // 延迟1秒后自动重新启动识别（唤醒词模式）
          setTimeout(() => {
            if (!appState.listening) {
              startRecognition();
              heardText.textContent = "等待唤醒...";
            }
          }, 1000);
        }
      }, 10000);
    }

    function clearSilenceTimeout() {
      if (appState.silenceTimeout) {
        clearTimeout(appState.silenceTimeout);
        appState.silenceTimeout = null;
      }
    }

    function stopRecognition() {
      clearFinalTranscriptTimer();
      clearRecognitionRestartTimer();
      appState.manualStop = true;
      appState.resumeRecognitionAfterSpeech = false;
      if (appState.recognition && appState.listening) {
        appState.recognition.stop();
        return;
      }
      appState.listening = false;
      appState.recognitionStarting = false;
      setStatus("已停止");
      setWakeWordHint("idle");
      updateVoiceButtons();
    }

    async function runVoiceSelfTest() {
      if (!("speechSynthesis" in window)) {
        heardText.textContent = "当前浏览器不支持语音合成";
        addConversation("系统", "当前浏览器不支持语音合成");
        return;
      }
      window.speechSynthesis.cancel();
      heardText.textContent = "正在进行语音自检...";
      addConversation("系统", "语音自检：尝试播放小绘回应");

      // 获取并显示所有可用的中文语音
      const voices = await getSpeechVoicesWhenReady();
      const chineseVoices = voices.filter(isChineseVoice);
      const voiceCandidates = getPreferredChineseVoices(voices);

      console.log("=== 语音自检 ===");
      console.log("检测到 " + chineseVoices.length + " 个中文语音:");
      chineseVoices.forEach((voice, index) => {
        const score = scoreChineseVoice(voice);
        const isSelected = voiceCandidates[0] === voice;
        const prefix = isSelected ? "[选中]" : "      ";
        console.log(prefix + " [" + (index + 1) + "] " + voice.name + " (" + voice.lang + ") - 得分: " + score);
      });

      if (voiceCandidates.length > 0) {
        console.log("");
        console.log("已选择: " + voiceCandidates[0].name + " (" + voiceCandidates[0].lang + ")");
      }

      const spoken = await speak("在呢，语音已经准备好了", "high");
      if (spoken) {
        const voiceName = appState.lastSpokenVoiceName ? `，当前音色：${appState.lastSpokenVoiceName}` : "";
        heardText.textContent = `语音自检通过${voiceName}。可以说"小绘，小绘"唤醒我`;
        setWakeWordHint("idle");
      } else {
        heardText.textContent =
          appState.lastSpeechErrorMessage || "语音自检未播放成功，请检查系统语音包、浏览器权限和系统音量";
      }
      if (!appState.listening && !appState.recognitionStarting) {
        appState.manualStop = false;
        appState.wakeWordMode = true;
        startRecognition();
      }
    }

    voiceTestButton?.addEventListener("click", runVoiceSelfTest);
    demoButton.addEventListener("click", () => {
      handleTranscript("画一幅风景");
    });
    exportButton.addEventListener("click", () => {
      const format = normalizeExportFormat(exportFormat?.value || "png");
      executeAction({ type: "export", format, label: `导出 ${format.toUpperCase()} 图片` });
    });
    aiRefineButton?.addEventListener("click", () => {
      executeAction({ type: "refineImage", prompt: buildRefinePrompt("AI 精绘当前画布", appState), label: "AI 精绘当前画布" });
    });
    updateVoiceButtons();
    render();

    // 页面加载后自动启动语音识别（唤醒词模式）
    window.addEventListener('load', () => {
      // 延迟2秒后自动启动，给用户和浏览器足够的准备时间
      setTimeout(() => {
        if (!appState.listening && !appState.recognitionStarting) {
          const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!Recognition) {
            setStatus("不支持", "error");
            heardText.textContent = "当前浏览器不支持语音识别。请使用 Chrome 或 Edge 浏览器。";
            addConversation("系统", "浏览器不支持 Web Speech API");
            return;
          }

          // 先请求麦克风权限
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              // 关闭流，只是测试权限
              stream.getTracks().forEach(track => track.stop());
              // 权限OK，启动语音识别
              startRecognition();
              setWakeWordHint("idle");
              heardText.textContent = "等待唤醒... 说\"小绘，小绘\"";
              addConversation("系统", "语音助手小绘已就绪，说\"小绘，小绘\"唤醒我");
            })
            .catch(error => {
              setStatus("权限异常", "error");
              heardText.textContent = "需要麦克风权限。请点击地址栏的锁图标，允许麦克风访问，然后点击\"语音自检\"。";
              addConversation("系统", `麦克风权限被拒绝: ${error.name}。请在浏览器设置中允许麦克风权限。`);
            });
        }
      }, 2000);
    });

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

    function setupAccountDialog() {
      accountEntryButton?.addEventListener("click", () => {
        if (!accountDialog) return;
        try {
          if (typeof accountDialog.showModal === "function" && !accountDialog.open) {
            accountDialog.showModal();
          } else {
            accountDialog.setAttribute("open", "");
          }
        } catch {
          accountDialog.setAttribute("open", "");
        }
        accountDialog.classList.add("is-open");
      });
      closeAccountButton?.addEventListener("click", () => {
        accountDialog?.classList.remove("is-open");
        accountDialog?.close();
      });
      accountDialog?.addEventListener("click", (event) => {
        if (event.target === accountDialog) {
          accountDialog.classList.remove("is-open");
          accountDialog.close();
        }
      });
    }

    function setupAiRefineIntroDialog() {
      if (!aiRefineIntroDialog) return;

      closeAiRefineIntroButton?.addEventListener("click", () => {
        closeAiRefineIntro();
      });

      aiRefineIntroDialog.addEventListener("click", (event) => {
        if (event.target === aiRefineIntroDialog) closeAiRefineIntro();
      });

      aiRefineIntroConfigButton?.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEYS.aiRefineIntroSeen, "true");
        appState.pendingAiRefineAction = null;
        closeAiRefineIntro();
        selectTab("model");
      });

      aiRefineIntroStartButton?.addEventListener("click", () => {
        const action = appState.pendingAiRefineAction || {};
        appState.pendingAiRefineAction = null;
        localStorage.setItem(STORAGE_KEYS.aiRefineIntroSeen, "true");
        closeAiRefineIntro();
        refineCurrentCanvas({ ...action, skipIntro: true });
      });
    }

    function setupDrawingsDialog() {
      const drawingsDialog = document.getElementById("drawingsDialog");
      const closeDrawingsButton = document.getElementById("closeDrawingsButton");
      const saveDrawingButton = document.getElementById("saveDrawingButton");
      const loadDrawingsButton = document.getElementById("loadDrawingsButton");

      saveDrawingButton.addEventListener("click", () => saveCurrentDrawingToCloud({ askName: true, showAlert: true }));
      loadDrawingsButton.addEventListener("click", () => openDrawingsDialog({ showAlert: true }));

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
    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");
    const showRegisterButton = document.getElementById("showRegisterButton");
    const showLoginButton = document.getElementById("showLoginButton");
    const message = document.getElementById("accountMessage");

    function setAuthMode(mode) {
      const isRegister = mode === "register";
      loginPanel?.classList.toggle("active", !isRegister);
      registerPanel?.classList.toggle("active", isRegister);
      message.textContent = "";
    }

    showRegisterButton?.addEventListener("click", () => setAuthMode("register"));
    showLoginButton?.addEventListener("click", () => setAuthMode("login"));

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("registerName").value.trim();
      const password = document.getElementById("registerPassword").value;
      const passwordConfirm = document.getElementById("registerPasswordConfirm").value;

      if (password !== passwordConfirm) {
        message.textContent = "两次输入的密码不一致。";
        return;
      }

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
          registerForm.reset();
          setAuthMode("login");
          message.textContent = `已注册并登录：${username}`;
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
      appState.modelProfiles = [];
      appState.modelConfig = makeBlankModelConfig();
      syncModelRoles(appState, []);
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
        const profiles = response.data.profiles.map((p) => ({
          id: p.id,
          name: p.name,
          provider: p.provider,
          endpoint: p.endpoint,
          model: p.model,
          apiKey: "",
          enabled: p.enabled,
          profileId: p.id
        }));

        // Find the first enabled profile or use blank config
        const enabledProfile = profiles.find(p => p.enabled) || profiles[0];

        if (enabledProfile) {
          appState.modelConfig = {
            enabled: enabledProfile.enabled,
            provider: enabledProfile.provider,
            endpoint: enabledProfile.endpoint,
            model: enabledProfile.model,
            apiKey: "", // API Key is stored on the backend and is never exposed.
            profileId: enabledProfile.profileId || enabledProfile.id,
            name: enabledProfile.name
          };
        } else {
          appState.modelConfig = makeBlankModelConfig();
        }
        syncModelRoles(appState, profiles);
      }
    } catch (error) {
      console.error("加载模型配置失败:", error);
      appState.modelProfiles = [];
      appState.modelConfig = makeBlankModelConfig();
      syncModelRoles(appState, []);
    }
  }

  function setupModelFormV2(appState) {
    const enabled = document.getElementById("modelEnabled");
    const profileSelect = document.getElementById("modelProfileSelect");
    const profileCards = document.getElementById("modelProfileCards");
    const addProfileButton = document.getElementById("addModelProfileButton");
    const deleteProfileButton = document.getElementById("deleteModelProfileButton");
    const roleButtons = Array.from(document.querySelectorAll(".model-role-button"));
    const roleTitle = document.getElementById("modelRoleTitle");
    const roleDescription = document.getElementById("modelRoleDescription");
    const profileLabelText = document.getElementById("modelProfileLabelText");
    const enabledLabel = document.getElementById("modelEnabledLabel");
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
    let activeModelRole = "semantic";

    refreshFromAccount();
    window.addEventListener("user-model-state-changed", refreshFromAccount);

    roleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setModelRole(button.dataset.modelRole === "image" ? "image" : "semantic");
      });
    });

    profileSelect.addEventListener("change", async () => {
      activeProfileId = profileSelect.value;
      const selected = getActiveProfile();
      fillForm(selected);
      appState.modelConfig = selected;
      syncModelRoles(appState, profiles);
      updateModelUi(appState);
    });

    addProfileButton.addEventListener("click", async () => {
      if (!appState.currentUser) {
        message.textContent = "请先登录账号，再新增 API 配置。";
        return;
      }

      const roleConfig = getActiveRoleConfig();
      const providerKey = roleConfig.defaultProvider;
      const providerConfig = PROVIDER_CONFIGS[providerKey];
      const draft = normalizeModelProfile({
        id: makeId("model"),
        name: `${roleConfig.addName} ${getProfilesForRole(activeModelRole).length + 1}`,
        provider: providerKey,
        endpoint: providerConfig.endpoint,
        model: providerConfig.model,
        apiKey: "",
        enabled: true
      });

      profiles.push(draft);
      activeProfileId = draft.id;
      appState.modelConfig = draft;
      syncModelRoles(appState, profiles);
      applyRoleToProviderOptions();
      renderProfileOptions();
      renderProfileCards();
      fillForm(draft);
      updateModelUi(appState);
      message.textContent = "已新增配置草稿，填写 API Key 后点击保存。";
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
      const deletingProfile = profiles.find((profile) => profile.id === activeProfileId);
      if (!deletingProfile || !profileMatchesRole(deletingProfile)) {
        message.textContent = "当前页面没有可删除的配置。";
        return;
      }

      if (!confirm("确定要删除当前配置吗？")) {
        return;
      }

      try {
        message.textContent = "删除中...";
        const existingProfile = profiles.find(p => p.id === activeProfileId);
        if (existingProfile?.profileId) {
          await window.apiClient.deleteModelProfile(existingProfile.profileId);
          message.textContent = "已删除当前模型配置。";
          await refreshFromAccount();
        } else {
          profiles = profiles.filter(p => p.id !== activeProfileId);
          setActiveProfileForRole();
          syncModelRoles(appState, profiles);
          renderProfileOptions();
          renderProfileCards();
          fillForm(appState.modelConfig);
          updateModelUi(appState);
          message.textContent = "已移除未保存的配置草稿。";
        }
      } catch (error) {
        console.error("删除配置失败:", error);
        message.textContent = "删除失败: " + error.message;
      }
    });

    provider.addEventListener("change", () => {
      if (!getActiveRoleConfig().allowedProviders.includes(provider.value)) {
        provider.value = getActiveRoleConfig().defaultProvider;
      }
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
      if (!profileMatchesRole(profile, activeModelRole)) {
        message.textContent = activeModelRole === "image"
          ? "绘画精绘模型只能选择\"豆包图片生成 / Seedream\"。"
          : "语义理解模型不能使用图片生成接口，请选择聊天模型。";
        return;
      }
      const existingProfile = profiles.find(p => p.id === activeProfileId);
      const apiKeyValue = apiKey.value.trim();
      const needsApiKey = !existingProfile?.profileId;
      if (!profile.endpoint || !profile.model || (needsApiKey && !apiKeyValue)) {
        message.textContent = needsApiKey
          ? "请填写 Endpoint、模型名称和 API Key。"
          : "请填写 Endpoint 和模型名称；如需更换密钥，再重新输入 API Key。";
        return;
      }

      try {
        message.textContent = "保存中...";

        if (existingProfile && existingProfile.profileId) {
          const updates = {
            name: profile.name,
            provider: profile.provider,
            endpoint: profile.endpoint,
            model: profile.model,
            enabled: profile.enabled
          };
          if (apiKeyValue) {
            updates.apiKey = apiKeyValue;
          }
          await window.apiClient.updateModelProfile(existingProfile.profileId, updates);
          message.textContent = getActiveRoleConfig().savedMessage;
        } else {
          await window.apiClient.createModelProfile({
            name: profile.name,
            provider: profile.provider,
            endpoint: profile.endpoint,
            model: profile.model,
            apiKey: apiKeyValue,
            enabled: profile.enabled
          });
          message.textContent = getActiveRoleConfig().savedMessage;
        }

        await refreshFromAccount();
        setActiveProfileForRole();
        syncModelRoles(appState, profiles);
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
      if (!profile.profileId) {
        message.textContent = "请先保存模型配置，再测试后端代理调用。";
        return;
      }
      if (!profile.endpoint || !profile.model) {
        message.textContent = "请填写 Endpoint 和模型名称。";
        return;
      }
      if (!profileMatchesRole(profile, activeModelRole)) {
        message.textContent = activeModelRole === "image"
          ? "这是语义模型配置，请切换到语义理解模型页测试。"
          : "这是图片生成配置，请切换到绘画精绘模型页测试。";
        return;
      }
      upsertActiveProfile(profile);
      appState.modelConfig = profile;
      syncModelRoles(appState, profiles);
      persistProfiles();
      updateModelUi(appState);
      if (isImageGenerationProfile(profile)) {
        message.textContent = "正在测试绘画模型...";
        try {
          const response = await window.apiClient.refineImage({
            prompt: "生成一张简单的测试图片：蓝天、白云、太阳",
            profileId: profile.profileId,
            size: "1024x1024"
          });
          const imageSource = response.data?.imageDataUrl || response.data?.imageUrl;
          message.textContent = imageSource ? "测试成功，绘画模型可用。" : "测试成功，但没有返回图片。";
        } catch (error) {
          message.textContent = error.message || "绘画模型测试失败。";
        }
        return;
      }
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
        appState.modelProfiles = [];
        appState.modelConfig = makeBlankModelConfig();
        syncModelRoles(appState, profiles);
        setActiveProfileForRole();
        renderRoleUi();
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
            apiKey: "", // Don't expose API key from backend.
            enabled: p.enabled,
            profileId: p.id // Keep backend ID for API calls
          }));

          const activeProfile = getPreferredProfileForRole(activeModelRole);
          activeProfileId = activeProfile?.id || "";
          appState.modelConfig = activeProfile || makeBlankModelConfig();
          syncModelRoles(appState, profiles);
        } else {
          profiles = [];
          activeProfileId = "";
          appState.modelProfiles = [];
          appState.modelConfig = makeBlankModelConfig();
          syncModelRoles(appState, profiles);
          setActiveProfileForRole();
        }
      } catch (error) {
        console.error("加载模型配置失败:", error);
        profiles = [];
        activeProfileId = "";
        appState.modelProfiles = [];
        appState.modelConfig = makeBlankModelConfig();
        syncModelRoles(appState, profiles);
        setActiveProfileForRole();
      }

      renderRoleUi();
      renderProfileOptions();
      renderProfileCards();
      fillForm(appState.modelConfig);
      updateFormAvailability();
      updateModelUi(appState);
    }

    function getActiveRoleConfig() {
      return MODEL_ROLE_CONFIGS[activeModelRole] || MODEL_ROLE_CONFIGS.semantic;
    }

    function profileMatchesRole(profile, role = activeModelRole) {
      if (!profile?.id && !profile?.provider) return false;
      return role === "image" ? isImageGenerationProfile(profile) : isSemanticModelProfile(profile);
    }

    function getProfilesForRole(role = activeModelRole) {
      return profiles.filter((profile) => profileMatchesRole(profile, role));
    }

    function getPreferredProfileForRole(role = activeModelRole) {
      const roleProfiles = getProfilesForRole(role);
      return roleProfiles.find((profile) => profile.enabled) || roleProfiles[0] || null;
    }

    function setActiveProfileForRole() {
      const current = profiles.find((profile) => profile.id === activeProfileId);
      if (current && profileMatchesRole(current)) {
        appState.modelConfig = current;
        return current;
      }
      const next = getPreferredProfileForRole(activeModelRole);
      activeProfileId = next?.id || "";
      appState.modelConfig = next || makeBlankModelConfig();
      return next;
    }

    function setModelRole(role) {
      activeModelRole = role === "image" ? "image" : "semantic";
      setActiveProfileForRole();
      syncModelRoles(appState, profiles);
      renderRoleUi();
      renderProfileOptions();
      renderProfileCards();
      fillForm(appState.modelConfig);
      updateFormAvailability();
      updateModelUi(appState);
      message.textContent = "";
    }

    function renderRoleUi() {
      const roleConfig = getActiveRoleConfig();
      roleButtons.forEach((button) => {
        const active = button.dataset.modelRole === activeModelRole;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      if (roleTitle) roleTitle.textContent = roleConfig.title;
      if (roleDescription) roleDescription.textContent = roleConfig.description;
      if (profileLabelText) profileLabelText.textContent = roleConfig.profileLabel;
      if (enabledLabel) enabledLabel.textContent = roleConfig.enabledLabel;
      if (testButton) testButton.textContent = roleConfig.testText;
      applyRoleToProviderOptions();
    }

    function applyRoleToProviderOptions() {
      const roleConfig = getActiveRoleConfig();
      Array.from(provider.options).forEach((option) => {
        option.hidden = !roleConfig.allowedProviders.includes(option.value);
        option.disabled = !roleConfig.allowedProviders.includes(option.value);
      });
      if (!roleConfig.allowedProviders.includes(provider.value)) {
        provider.value = roleConfig.defaultProvider;
      }
      updateProviderFields();
    }

    function renderProfileOptions() {
      profileSelect.innerHTML = "";
      const roleProfiles = getProfilesForRole();
      if (!roleProfiles.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = activeModelRole === "image" ? "暂无精绘配置" : "暂无语义配置";
        profileSelect.appendChild(option);
        return;
      }
      for (const profile of roleProfiles) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name || profile.model || "未命名配置";
        profileSelect.appendChild(option);
      }
      profileSelect.value = activeProfileId;
    }

    function renderProfileCards() {
      profileCards.innerHTML = "";
      const roleProfiles = getProfilesForRole();
      if (!roleProfiles.length) {
        const empty = document.createElement("p");
        empty.className = "profile-empty";
        empty.textContent = appState.currentUser ? getActiveRoleConfig().emptyLoggedIn : getActiveRoleConfig().emptyLoggedOut;
        profileCards.appendChild(empty);
        return;
      }
      for (const profile of roleProfiles) {
        const providerConfig = PROVIDER_CONFIGS[profile.provider] || PROVIDER_CONFIGS.other;
        const isImageProfile = isImageGenerationProfile(profile);
        const roleText = isImageProfile ? "精绘" : "语义";
        const card = document.createElement("button");
        card.className = "model-profile-card";
        card.type = "button";
        card.dataset.profileId = profile.id;
        card.classList.toggle("image-profile", isImageProfile);
        card.classList.toggle("active", profile.id === activeProfileId && hasUsableModelConfig(profile));
        card.innerHTML = `
          <span class="card-drag" aria-hidden="true">::</span>
          <span class="card-logo" aria-hidden="true">${providerConfig.label.slice(0, 1)}</span>
          <span class="card-main">
            <strong>${profile.name || providerConfig.label}<em>${roleText}</em></strong>
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
          syncModelRoles(appState, profiles);
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
      const roleConfig = getActiveRoleConfig();
      provider.value = roleConfig.allowedProviders.includes(current.provider) ? current.provider : roleConfig.defaultProvider;
      endpoint.value = current.endpoint || "";
      model.value = current.model || "";
      apiKey.value = "";
      apiKey.placeholder = current.profileId
        ? "已安全保存在后端；留空表示不更换"
        : "请输入 API Key";
      updateProviderFields();
    }

    function readFormProfile() {
      const providerKey = PROVIDER_CONFIGS[provider.value] ? provider.value : "openai";
      const roleConfig = getActiveRoleConfig();
      const safeProviderKey = roleConfig.allowedProviders.includes(providerKey) ? providerKey : roleConfig.defaultProvider;
      const providerConfig = PROVIDER_CONFIGS[safeProviderKey];
      const existing = getActiveProfile();
      return normalizeModelProfile({
        ...existing,
        id: existing.id || makeId("model"),
        name: profileName.value.trim() || `${providerConfig.label} 配置`,
        enabled: enabled.checked,
        provider: safeProviderKey,
        endpoint: safeProviderKey === "other" ? endpoint.value.trim() : providerConfig.endpoint,
        model: model.value.trim() || providerConfig.model,
        apiKey: apiKey.value.trim()
      });
    }

    function getActiveProfile() {
      const active = profiles.find((profile) => profile.id === activeProfileId);
      return active && profileMatchesRole(active) ? active : makeBlankModelConfig();
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
      loginHint.textContent = loggedIn
        ? `${getActiveRoleConfig().title}会保存到当前登录账号。`
        : "请先登录账号；未登录时不会加载或保存 API。";
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
    const accountButton = document.getElementById("accountEntryButton");
    summary.textContent = appState.currentUser ? appState.currentUser.username : "登录";
    accountButton?.classList.toggle("is-logged-in", Boolean(appState.currentUser));
    accountButton?.setAttribute("title", appState.currentUser ? `已登录：${appState.currentUser.username}` : "登录或注册账号");
  }

  function updateModelUi(appState) {
    const pill = document.getElementById("modelPill");
    const hintBar = document.getElementById("modelHintBar");
    const semanticReady = hasUsableModelConfig(appState.semanticModelConfig);
    const imageReady = hasUsableModelConfig(appState.imageModelConfig);
    const semanticLabel = semanticReady ? appState.semanticModelConfig.model || "已接入" : "离线";
    const imageLabel = imageReady ? appState.imageModelConfig.model || "已接入" : "未配置";
    pill.textContent = `语义：${semanticLabel} · 精绘：${imageLabel}`;
    pill.classList.toggle("enabled", semanticReady || imageReady);
    pill.classList.toggle("partial", (semanticReady || imageReady) && !(semanticReady && imageReady));
    if (hintBar) {
      hintBar.hidden = semanticReady || Boolean(appState.modelHintDismissed);
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
    const extras = action.extras || {};
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.object === "house") drawHouse(ctx, x, y, size, action.color, extras);
    if (action.object === "tree") drawTree(ctx, x, y, size, action.color);
    if (action.object === "sun") drawSun(ctx, x, y, size, action.color, extras);
    if (action.object === "cloud") drawCloud(ctx, x, y, size, action.color);
    if (action.object === "river") drawRiver(ctx, x, y, size, action.color);
    if (action.object === "mountain") drawMountain(ctx, x, y, size, action.color);
    if (action.object === "flower") drawFlower(ctx, x, y, size, action.color);
    if (action.object === "face") drawFace(ctx, x, y, size, action.color);
    if (action.object === "cat") drawCat(ctx, x, y, size, action.color, extras);
    if (action.object === "dog") drawDog(ctx, x, y, size, action.color, extras);
    if (action.object === "bird") drawBird(ctx, x, y, size, action.color);
    if (action.object === "star") drawStarObject(ctx, x, y, size, action.color);
    if (action.object === "moon") drawMoon(ctx, x, y, size, action.color);
    if (action.object === "car") drawCar(ctx, x, y, size, action.color);
    if (action.object === "heart") drawHeart(ctx, x, y, size, action.color);
    if (action.object === "grass") drawGrass(ctx, x, y, size, action.color);
    if (action.object === "butterfly") drawButterfly(ctx, x, y, size, action.color);
    if (action.object === "balloon") drawBalloon(ctx, x, y, size, action.color);

    ctx.restore();
  }

  function drawRefinedImage(ctx, canvas, action, loadImage) {
    const image = loadImage(action.imageSource);
    ctx.save();
    if (image && image.complete && image.naturalWidth > 0) {
      const canvasRatio = canvas.width / canvas.height;
      const imageRatio = image.naturalWidth / image.naturalHeight;

      // 使用"cover"模式：填满整个画布，可能会裁剪图片
      let sx = 0;
      let sy = 0;
      let sw = image.naturalWidth;
      let sh = image.naturalHeight;

      if (imageRatio > canvasRatio) {
        // 图片比画布更宽，裁剪左右
        sw = image.naturalHeight * canvasRatio;
        sx = (image.naturalWidth - sw) / 2;
      } else {
        // 图片比画布更窄，裁剪上下
        sh = image.naturalWidth / canvasRatio;
        sy = (image.naturalHeight - sh) / 2;
      }
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#4c1d95";
      ctx.font = "700 32px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI 精绘加载中...", canvas.width / 2, canvas.height / 2);
    }
    ctx.restore();
  }

  function drawHouse(ctx, x, y, size, color, extras) {
    const bodyColor = (extras && extras.wallColor) || color || "#ef4444";
    const roofColor = (extras && extras.roofColor) || "#7c3aed";
    const doorColor = (extras && extras.doorColor) || "#92400e";
    const windowColor = (extras && extras.windowColor) || "#fef3c7";

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = "#1f2937";
    // 墙壁
    ctx.fillRect(x - size * 0.52, y - size * 0.02, size * 1.04, size * 0.62);
    ctx.strokeRect(x - size * 0.52, y - size * 0.02, size * 1.04, size * 0.62);
    // 屋顶
    ctx.beginPath();
    ctx.moveTo(x - size * 0.65, y - size * 0.02);
    ctx.lineTo(x, y - size * 0.58);
    ctx.lineTo(x + size * 0.65, y - size * 0.02);
    ctx.closePath();
    ctx.fillStyle = roofColor;
    ctx.fill();
    ctx.stroke();
    // 窗户
    ctx.fillStyle = windowColor;
    ctx.fillRect(x + size * 0.17, y + size * 0.16, size * 0.2, size * 0.18);
    ctx.strokeRect(x + size * 0.17, y + size * 0.16, size * 0.2, size * 0.18);
    // 门
    ctx.fillStyle = doorColor;
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

  function drawSun(ctx, x, y, size, color, extras) {
    const radius = size * 0.28;
    ctx.strokeStyle = color || "#f59e0b";
    ctx.fillStyle = color || "#facc15";
    // 光芒
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius * 1.35, y + Math.sin(angle) * radius * 1.35);
      ctx.lineTo(x + Math.cos(angle) * radius * 2.0, y + Math.sin(angle) * radius * 2.0);
      ctx.stroke();
    }
    // 太阳主体
    drawFilledCircle(ctx, x, y, radius);

    // 如果有眼镜属性，画眼镜
    if (extras && extras.hasGlasses) {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Math.max(3, size * 0.04);
      ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
      // 左镜片
      ctx.beginPath();
      ctx.arc(x - radius * 0.4, y, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 右镜片
      ctx.beginPath();
      ctx.arc(x + radius * 0.4, y, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 鼻梁
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.05, y);
      ctx.lineTo(x + radius * 0.05, y);
      ctx.stroke();
    }

    // 如果有眼睛属性，画眼睛
    if (extras && extras.hasEyes) {
      ctx.fillStyle = "#111827";
      drawFilledCircle(ctx, x - radius * 0.3, y - radius * 0.1, size * 0.04);
      drawFilledCircle(ctx, x + radius * 0.3, y - radius * 0.1, size * 0.04);
    }

    // 如果有笑脸属性，画嘴巴
    if (extras && extras.hasSmile) {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Math.max(3, size * 0.04);
      ctx.beginPath();
      ctx.arc(x, y + radius * 0.2, radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
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

  function drawCat(ctx, x, y, size, color, extras = {}) {
    const catColor = color && color !== "#111827" ? color : "#f97316";
    const dir = extras.facing === "left" ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    const px = 0;
    const py = extras.playing ? -size * 0.04 : 0;
    // 身体
    ctx.fillStyle = catColor;
    ctx.fillRect(px - size * 0.25, py + size * 0.1, size * 0.5, size * 0.4);
    // 头
    drawFilledCircle(ctx, px, py - size * 0.15, size * 0.3);
    // 耳朵
    ctx.beginPath();
    ctx.moveTo(px - size * 0.25, py - size * 0.3);
    ctx.lineTo(px - size * 0.12, py - size * 0.15);
    ctx.lineTo(px - size * 0.2, py - size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + size * 0.25, py - size * 0.3);
    ctx.lineTo(px + size * 0.12, py - size * 0.15);
    ctx.lineTo(px + size * 0.2, py - size * 0.1);
    ctx.closePath();
    ctx.fill();
    // 眼睛
    ctx.fillStyle = "#111827";
    drawFilledCircle(ctx, px - size * 0.1, py - size * 0.2, size * 0.04);
    drawFilledCircle(ctx, px + size * 0.1, py - size * 0.2, size * 0.04);
    if (extras.playing) {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Math.max(2, size * 0.025);
      ctx.beginPath();
      ctx.arc(px, py - size * 0.1, size * 0.08, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    // 尾巴
    ctx.strokeStyle = catColor;
    ctx.lineWidth = Math.max(5, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(px + size * 0.25, py + size * 0.3);
    ctx.bezierCurveTo(px + size * 0.4, py + size * 0.4, px + size * 0.3, py - size * 0.1, px + size * 0.35, py - size * 0.25);
    ctx.stroke();
    ctx.restore();
  }

  function drawDog(ctx, x, y, size, color, extras = {}) {
    const dogColor = color && color !== "#111827" ? color : "#92400e";
    const dir = extras.facing === "left" ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    const px = 0;
    const py = extras.playing ? -size * 0.02 : 0;

    if (extras.hasWings) {
      ctx.strokeStyle = "#dbeafe";
      ctx.fillStyle = "rgba(191, 219, 254, 0.75)";
      ctx.lineWidth = Math.max(2, size * 0.03);
      ctx.beginPath();
      ctx.moveTo(px - size * 0.03, py - size * 0.05);
      ctx.quadraticCurveTo(px - size * 0.28, py - size * 0.28, px - size * 0.35, py - size * 0.02);
      ctx.quadraticCurveTo(px - size * 0.18, py + size * 0.08, px - size * 0.03, py + size * 0.02);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + size * 0.03, py - size * 0.05);
      ctx.quadraticCurveTo(px + size * 0.28, py - size * 0.28, px + size * 0.35, py - size * 0.02);
      ctx.quadraticCurveTo(px + size * 0.18, py + size * 0.08, px + size * 0.03, py + size * 0.02);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = dogColor;
    // 身体
    ctx.fillRect(px - size * 0.3, py + size * 0.1, size * 0.6, size * 0.35);
    // 头
    drawFilledCircle(ctx, px - size * 0.15, py - size * 0.1, size * 0.25);
    // 耳朵
    ctx.beginPath();
    ctx.ellipse(px - size * 0.3, py - size * 0.05, size * 0.12, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px, py - size * 0.05, size * 0.12, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 鼻子
    ctx.fillStyle = "#111827";
    drawFilledCircle(ctx, px - size * 0.15, py - size * 0.05, size * 0.05);
    // 眼睛
    drawFilledCircle(ctx, px - size * 0.25, py - size * 0.15, size * 0.04);
    drawFilledCircle(ctx, px - size * 0.05, py - size * 0.15, size * 0.04);
    // 尾巴
    ctx.strokeStyle = dogColor;
    ctx.lineWidth = Math.max(5, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(px + size * 0.3, py + size * 0.25);
    if (extras.playing) {
      ctx.bezierCurveTo(px + size * 0.42, py + size * 0.03, px + size * 0.52, py + size * 0.28, px + size * 0.62, py + size * 0.06);
    } else {
      ctx.lineTo(px + size * 0.45, py + size * 0.05);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawBird(ctx, x, y, size, color) {
    const birdColor = color && color !== "#111827" ? color : "#3b82f6";
    ctx.fillStyle = birdColor;
    // 身体
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.25, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头
    drawFilledCircle(ctx, x - size * 0.18, y - size * 0.1, size * 0.15);
    // 眼睛
    ctx.fillStyle = "#111827";
    drawFilledCircle(ctx, x - size * 0.2, y - size * 0.12, size * 0.03);
    // 嘴
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.28, y - size * 0.08);
    ctx.lineTo(x - size * 0.38, y - size * 0.08);
    ctx.lineTo(x - size * 0.28, y - size * 0.04);
    ctx.closePath();
    ctx.fill();
    // 翅膀
    ctx.fillStyle = birdColor;
    ctx.beginPath();
    ctx.ellipse(x + size * 0.1, y, size * 0.3, size * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStarObject(ctx, x, y, size, color) {
    const starColor = color && color !== "#111827" ? color : "#facc15";
    ctx.fillStyle = starColor;
    ctx.strokeStyle = "#f59e0b";
    const outerRadius = size * 0.35;
    const innerRadius = size * 0.15;
    drawStar(ctx, x, y, outerRadius, innerRadius, 5);
    ctx.fill();
    ctx.stroke();
  }

  function drawMoon(ctx, x, y, size, color) {
    const moonColor = color && color !== "#111827" ? color : "#fef3c7";
    ctx.fillStyle = moonColor;
    // 月亮主体
    drawFilledCircle(ctx, x, y, size * 0.35);
    // 阴影部分（新月效果）
    ctx.fillStyle = ctx.canvas.style.backgroundColor || "#ffffff";
    drawFilledCircle(ctx, x + size * 0.15, y - size * 0.05, size * 0.3);
  }

  function drawCar(ctx, x, y, size, color) {
    const carColor = color && color !== "#111827" ? color : "#ef4444";
    ctx.fillStyle = carColor;
    ctx.strokeStyle = "#111827";
    // 车身
    ctx.fillRect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.25);
    ctx.strokeRect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.25);
    // 车顶
    ctx.fillRect(x - size * 0.25, y - size * 0.05, size * 0.5, size * 0.15);
    ctx.strokeRect(x - size * 0.25, y - size * 0.05, size * 0.5, size * 0.15);
    // 窗户
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x - size * 0.2, y, size * 0.15, size * 0.08);
    ctx.fillRect(x + size * 0.05, y, size * 0.15, size * 0.08);
    // 轮子
    ctx.fillStyle = "#111827";
    drawFilledCircle(ctx, x - size * 0.25, y + size * 0.35, size * 0.1);
    drawFilledCircle(ctx, x + size * 0.25, y + size * 0.35, size * 0.1);
  }

  function drawHeart(ctx, x, y, size, color) {
    const heartColor = color && color !== "#111827" ? color : "#ec4899";
    ctx.fillStyle = heartColor;
    ctx.strokeStyle = "#be185d";
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y - size * 0.1, x - size * 0.5, y - size * 0.4, x, y - size * 0.2);
    ctx.bezierCurveTo(x + size * 0.5, y - size * 0.4, x + size * 0.5, y - size * 0.1, x, y + size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawGrass(ctx, x, y, size, color) {
    const grassColor = color && color !== "#111827" ? color : "#22c55e";
    ctx.strokeStyle = grassColor;
    ctx.lineWidth = Math.max(2, size * 0.03);
    // 绘制多根草
    for (let i = 0; i < 12; i++) {
      const offsetX = (i - 6) * size * 0.08;
      const height = size * (0.3 + Math.random() * 0.2);
      ctx.beginPath();
      ctx.moveTo(x + offsetX, y + size * 0.3);
      ctx.bezierCurveTo(
        x + offsetX - size * 0.03, y + size * 0.1,
        x + offsetX + size * 0.02, y - height * 0.5,
        x + offsetX, y - height
      );
      ctx.stroke();
    }
  }

  function drawButterfly(ctx, x, y, size, color) {
    const butterflyColor = color && color !== "#111827" ? color : "#a855f7";
    ctx.fillStyle = butterflyColor;
    ctx.strokeStyle = "#111827";
    // 左上翅膀
    ctx.beginPath();
    ctx.ellipse(x - size * 0.15, y - size * 0.1, size * 0.2, size * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 右上翅膀
    ctx.beginPath();
    ctx.ellipse(x + size * 0.15, y - size * 0.1, size * 0.2, size * 0.15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 左下翅膀
    ctx.beginPath();
    ctx.ellipse(x - size * 0.15, y + size * 0.15, size * 0.18, size * 0.13, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 右下翅膀
    ctx.beginPath();
    ctx.ellipse(x + size * 0.15, y + size * 0.15, size * 0.18, size * 0.13, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 身体
    ctx.fillStyle = "#111827";
    ctx.fillRect(x - size * 0.02, y - size * 0.2, size * 0.04, size * 0.45);
    // 触角
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = Math.max(2, size * 0.02);
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.2);
    ctx.lineTo(x - size * 0.08, y - size * 0.3);
    ctx.moveTo(x, y - size * 0.2);
    ctx.lineTo(x + size * 0.08, y - size * 0.3);
    ctx.stroke();
  }

  function drawBalloon(ctx, x, y, size, color) {
    const balloonColor = color && color !== "#111827" ? color : "#ef4444";
    ctx.fillStyle = balloonColor;
    ctx.strokeStyle = "#111827";
    // 气球
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.15, size * 0.25, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 气球结
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.17);
    ctx.quadraticCurveTo(x - size * 0.05, y + size * 0.2, x, y + size * 0.25);
    ctx.quadraticCurveTo(x + size * 0.05, y + size * 0.2, x, y + size * 0.17);
    ctx.fill();
    ctx.stroke();
    // 绳子
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = Math.max(1, size * 0.015);
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.25);
    ctx.lineTo(x, y + size * 0.6);
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
