# 语音识别功能使用指南

## 问题描述

如果您看到"语音识别服务连接失败"的提示，这是因为浏览器的 Web Speech API 需要连接到 Google 的语音识别服务。

## 技术背景

- **Web Speech API**：浏览器内置的语音识别接口
- **服务提供商**：Chrome/Edge 使用 Google 的语音识别服务
- **网络要求**：需要能够访问 Google 服务器

## 解决方案

### 方案 1：使用科学上网工具（推荐）

1. 启用科学上网工具（VPN/代理）
2. 确保代理设置正确，浏览器能够访问 Google 服务
3. 刷新页面
4. 点击"语音自检"按钮测试

### 方案 2：使用支持的浏览器和环境

1. **推荐浏览器**：
   - Google Chrome（最新版）
   - Microsoft Edge（最新版）
   - Safari（macOS/iOS）

2. **网络环境**：
   - 确保网络连接正常
   - 如果在公司网络，检查防火墙设置

### 方案 3：检查浏览器权限

1. 点击地址栏左侧的锁图标
2. 找到"麦克风"权限
3. 设置为"允许"
4. 刷新页面重试

### 方案 4：手动测试

在浏览器控制台（F12）执行以下代码测试：

```javascript
// 测试语音识别是否可用
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.onstart = () => console.log("语音识别已启动");
  recognition.onerror = (e) => console.error("错误:", e.error);
  recognition.onresult = (e) => console.log("识别结果:", e.results[0][0].transcript);
  recognition.start();
  console.log("正在测试语音识别...");
} else {
  console.error("浏览器不支持 Web Speech API");
}
```

## 常见错误及解决方法

### network 错误
- **原因**：无法连接到 Google 语音识别服务
- **解决**：使用科学上网工具

### not-allowed 错误
- **原因**：用户拒绝了麦克风权限
- **解决**：在浏览器设置中允许麦克风权限

### no-speech 错误
- **原因**：没有检测到语音输入
- **解决**：检查麦克风是否正常工作，尝试大声说话

### aborted 错误
- **原因**：语音识别被中断
- **解决**：正常情况，系统会自动重启

## 功能说明

### 唤醒词模式

1. 页面加载后，系统会自动开始监听
2. 说"小绘，小绘"唤醒助手
3. 唤醒后可以直接说绘图指令
4. 例如："画一个红色的圆"

### 支持的指令

- **绘图**：画圆、画矩形、画三角形、画星形、画线
- **对象**：画房子、画树、画太阳、画云、画河流、画山
- **编辑**：改颜色、移动位置、放大、缩小
- **操作**：清空画布、撤销、重做
- **导出**：保存图片、导出 PNG

### 语音汇报功能

系统会通过语音汇报操作结果：

- **高优先级**：错误提示、完成通知（如"AI 精绘完成"）
- **低优先级**：普通操作反馈（如"已绘制红色圆形"）
- **无语音**：静默操作（使用 'none' 优先级时）

## 最近修复

✅ **语音汇报功能已修复**（2024版本）

- 修复了 `speak()` 函数只播报高优先级的问题
- 恢复了绘图操作的语音反馈
- 现在所有操作都会有相应的语音提示

### 优先级说明

```javascript
speak("重要提示", "high");  // 一定会播报
speak("普通提示", "low");   // 会播报（修复后）
speak("静默操作", "none");  // 不播报
```

## 备选方案

如果语音识别始终无法使用，您可以：

1. **使用键盘输入**：在文本框中输入绘图指令
2. **使用按钮控制**：点击界面上的工具按钮
3. **查看示例**：点击"执行示例"查看演示

## 技术支持

如果问题持续存在，请提供以下信息：

- 浏览器版本（在地址栏输入 `chrome://version`）
- 操作系统版本
- 错误信息截图
- 浏览器控制台（F12）的错误日志

## 参考资料

- [Web Speech API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Speech_API)
- [Chrome 语音识别支持](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/)
