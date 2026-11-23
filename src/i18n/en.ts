const en = {
  // Header
  "app.title": "CET Prep Agent",
  "app.subtitle": "Running on EdgeOne Makers · Your CET-4/6 study assistant",

  // Empty state
  "empty.title": "CET Prep Agent",
  "empty.hint": "I'm your CET-4/6 study assistant. I can help with study plans, vocabulary quizzes, translation practice, essay review, and study records.",
  "empty.features": "Study Plan · Vocab Quiz · Translation · Essay Review",

  // Chat input
  "chat.placeholder": "Type a message...  ⏎ Send · Shift+⏎ Newline",
  "chat.hint": "Powered by OpenAI Agents SDK + EdgeOne Makers",

  // Preset questions
  "preset.1": "Help me make a CET-4 study plan, 2 hours of study per day.",
  "preset.2": "Translate this English sentence and give suggestions: Persistence is the key to success.",

  // Tool indicators (CET Agent's 5 tools)
  "tool.create_study_plan": "Study Plan",
  "tool.query_vocab": "Vocab",
  "tool.get_vocab_list": "Word List",
  "tool.make_vocab_quiz": "Quiz",
  "tool.text_statistics": "Stats",

  // Right panel tabs
  "panel.record": "Study Record",
  "panel.plan": "Study Plan",
  "panel.quiz": "Vocab Quiz",
  "panel.code": "Code",
  "panel.debug": "Trace",

  // Study plan panel
  "plan.title": "🗓️ Study Plan",
  "plan.hint": "No study plan yet. Ask in the chat, e.g. \"Make me a CET-4 study plan, exam date 2026-06-13, 2 hours per day\" — the AI-generated plan is saved here automatically.",
  "plan.savedAt": "Saved at",
  "plan.delete": "Delete plan",

  // Study record panel
  "record.title": "📒 Study Record",
  "record.quizRounds": "Vocabulary quiz rounds",
  "record.translate": "Translation practices",
  "record.essay": "Essay reviews",
  "record.wrongCount": "Wrong words total",
  "record.plan": "Study plan",
  "record.planYes": "Created",
  "record.planNo": "None",
  "record.wrongTitle": "Wrong-word book (sorted by count, top 10):",
  "record.refresh": "Refresh",
  "record.export": "Export Word Report",
  "record.exporting": "Generating…",
  "record.exportOk": "Report generated, download started.",
  "record.exportFail": "Export failed, please try again later.",
  "record.empty": "No study record yet. Try a vocab quiz or practice translation/essay in the chat!",

  // Vocab quiz panel
  "quiz.title": "✏️ Vocabulary Quiz",
  "quiz.hint": "Pick a level. 5 multiple-choice questions per round; wrong words are recorded.",
  "quiz.level4": "CET-4 Words",
  "quiz.level6": "CET-6 Words",
  "quiz.start": "Start Quiz",
  "quiz.loading": "Loading…",
  "quiz.next": "Next",
  "quiz.finish": "See Result",
  "quiz.restart": "Try Again",
  "quiz.score": "Score",
  "quiz.correct": "✓ Correct",
  "quiz.wrong": "✗ Wrong",
  "quiz.wrongTitle": "Wrong words this round:",
  "quiz.wrongSaved": "Wrong words saved to your local study record.",
  "quiz.allRight": "All correct, great job!",
  "quiz.error": "Failed to load vocabulary data. Please try again later.",

  // Status & errors
  "status.error": "Request failed. Please check if the backend service is running.",
  "status.stopped": "⏹ *Generation stopped*",
  "status.backendError": "Backend abort request failed. The server may still be running.",

  // Debug panel
  "debug.title": "Trace",
  "debug.events": "events",
  "debug.clear": "Clear",
  "debug.empty": "Waiting for SSE events...",
  "debug.emptyHint": "After sending a message, all raw backend data will be displayed here.",

  // Conversation sidebar
  "sidebar.label": "Conversation list",
  "sidebar.title": "Chats",
  "sidebar.newChat": "New chat",
  "sidebar.loading": "Loading conversations...",
  "sidebar.loadMore": "Load more",
  "sidebar.loadingMore": "Loading...",
  "sidebar.emptyTitle": "No conversations yet",
  "sidebar.emptyHint": "Click \"New chat\" to start your first conversation.",
  "sidebar.delete": "Delete conversation",
  "sidebar.deleteConfirm": "Permanently delete this conversation? This cannot be undone.",

  // Aria labels (button hover/screen-reader)
  "aria.send": "Send",
  "aria.clearHistory": "Clear history",
  "aria.stopGeneration": "Stop generation",

  // Language toggle
  "lang.switch": "中文",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "Deploy",
  "floatingLink.github": "GitHub",
} as const;

export default en;
