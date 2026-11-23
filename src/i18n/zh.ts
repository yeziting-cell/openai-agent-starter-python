const zh = {
  // Header
  "app.title": "OpenAI Agents Starter",
  "app.subtitle": "运行在 EdgeOne Makers 上，支持会话记忆、Agent Tools",

  // Empty state
  "empty.title": "OpenAI Agents Starter",
  "empty.hint": "我是运行在 EdgeOne 环境中的 OpenAI Agents，支持自定义工具、会话记忆，并帮助你完成天气查询、穿衣建议、翻译和文本统计。",
  "empty.features": "EdgeOne Store · Session Memory · Agent Tools",

  // Chat input
  "chat.placeholder": "发消息…  ⏎ 发送 · Shift+⏎ 换行",
  "chat.hint": "由 OpenAI Agents SDK + EdgeOne Makers 驱动 · 仅供演示",

  // Preset questions
  "preset.1": "现在北京天气怎么样，有什么穿衣建议吗？",
  "preset.2": "帮我翻译英文\"你好，欢迎来到北京！\"，并统计翻译字符数。",

  // Tool indicators（四六级智学通的 5 个工具）
  "tool.create_study_plan": "备考计划",
  "tool.query_vocab": "词汇查询",
  "tool.get_vocab_list": "每日单词",
  "tool.make_vocab_quiz": "词汇测试",
  "tool.text_statistics": "字数统计",

  // Right panel tabs
  "panel.record": "学习记录",
  "panel.plan": "备考计划",
  "panel.quiz": "词汇测试",
  "panel.code": "代码",
  "panel.debug": "调试",

  // Study plan panel
  "plan.title": "备考计划",
  "plan.hint": "还没有备考计划。在聊天框输入「帮我制定四级备考计划，考试日期 2026-06-13，每天学习 2 小时」，AI 生成的计划会自动保存到这里。",
  "plan.savedAt": "保存时间",
  "plan.delete": "删除计划",

  // Study record panel
  "record.title": "学习记录",
  "record.quizRounds": "词汇测试轮数",
  "record.translate": "翻译练习次数",
  "record.essay": "作文批改次数",
  "record.wrongCount": "错词总数",
  "record.plan": "备考计划",
  "record.planYes": "已制定",
  "record.planNo": "暂无",
  "record.wrongTitle": "错词本（按错误次数排序，最多显示 10 个）：",
  "record.refresh": "刷新",
  "record.export": "导出 Word 报告",
  "record.exporting": "生成中…",
  "record.exportOk": "报告已生成，浏览器已开始下载。",
  "record.exportFail": "导出失败，请稍后再试。",
  "record.empty": "暂无学习记录，去聊天框练习翻译/作文，或做一轮词汇测试吧！",

  // Vocab quiz panel
  "quiz.title": "词汇测试",
  "quiz.hint": "选择级别，每次 5 道选择题，答错单词会记录下来。",
  "quiz.level4": "四级词汇",
  "quiz.level6": "六级词汇",
  "quiz.start": "开始测试",
  "quiz.loading": "加载中…",
  "quiz.next": "下一题",
  "quiz.finish": "查看成绩",
  "quiz.restart": "再来一轮",
  "quiz.score": "得分",
  "quiz.correct": "✓ 回答正确",
  "quiz.wrong": "✗ 回答错误",
  "quiz.wrongTitle": "本轮错词：",
  "quiz.wrongSaved": "错词已保存到本地学习记录。",
  "quiz.allRight": "全对，太棒了！",
  "quiz.error": "词汇数据加载失败，请稍后再试。",

  // Status & errors
  "status.error": "⚠️ 请求失败，请检查后端服务是否启动。",
  "status.stopped": "⏹ *已停止生成*",
  "status.backendError": "⚠️ 后端中断请求失败，服务端可能仍在运行。",

  // Debug panel
  "debug.title": "传输流",
  "debug.events": "事件",
  "debug.clear": "清除",
  "debug.empty": "等待 SSE 事件...",
  "debug.emptyHint": "发送消息后，所有原始后端数据将在此处显示。",

  // Conversation sidebar
  "sidebar.label": "会话列表",
  "sidebar.title": "会话",
  "sidebar.newChat": "新建聊天",
  "sidebar.loading": "正在加载会话...",
  "sidebar.loadMore": "加载更多",
  "sidebar.loadingMore": "加载中...",
  "sidebar.emptyTitle": "暂无会话",
  "sidebar.emptyHint": "点击「新建聊天」开始第一段对话。",
  "sidebar.delete": "删除会话",
  "sidebar.deleteConfirm": "确定要永久删除这个会话吗？此操作不可恢复。",

  // Aria labels (button hover/screen-reader)
  "aria.send": "发送",
  "aria.clearHistory": "清除历史",
  "aria.stopGeneration": "停止生成",

  // Language toggle
  "lang.switch": "English",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "一键部署",
  "floatingLink.github": "GitHub",
} as const;

export default zh;
