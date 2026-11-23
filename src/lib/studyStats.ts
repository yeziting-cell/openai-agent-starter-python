/**
 * 学习记录统计（LocalStorage 版，无数据库）。
 *
 * LocalStorage key 约定：
 *   cet_quiz_count      → 词汇测试完成轮数（数字）
 *   cet_wrong_words     → 错词本 { word: { meaning, count, last } }（词汇测试面板写入）
 *   cet_translate_count → 翻译练习次数
 *   cet_essay_count     → 作文批改次数
 *   cet_study_plan      → 备考计划 { content, savedAt }（备考计划面板写入）
 *   cet_daily_activity  → 每日练习量 { 'YYYY-MM-DD': { translate, essay, quiz } }（趋势图用）
 */

const QUIZ_COUNT_KEY = 'cet_quiz_count';
const WRONG_WORDS_KEY = 'cet_wrong_words';
const TRANSLATE_COUNT_KEY = 'cet_translate_count';
const ESSAY_COUNT_KEY = 'cet_essay_count';
const STUDY_PLAN_KEY = 'cet_study_plan';
const DAILY_KEY = 'cet_daily_activity';

export interface WrongWordEntry {
  meaning: string;
  count: number;
  last: number;
}

export interface StudyStats {
  quizRounds: number;
  wrongWords: { word: string; meaning: string; count: number }[];
  wrongCount: number;
  translateCount: number;
  essayCount: number;
  hasStudyPlan: boolean;
  planContent: string;
}

function getInt(key: string): number {
  const raw = localStorage.getItem(key);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function getWrongWords(): Record<string, WrongWordEntry> {
  try {
    const raw = localStorage.getItem(WRONG_WORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** 汇总当前所有学习记录，供面板展示和 Word 导出使用 */
export function loadStudyStats(): StudyStats {
  const wrong = getWrongWords();
  const wrongWords = Object.entries(wrong)
    .map(([word, v]) => ({ word, meaning: v.meaning ?? '', count: v.count ?? 1 }))
    .sort((a, b) => b.count - a.count);

  let planContent = '';
  let hasStudyPlan = false;
  try {
    const raw = localStorage.getItem(STUDY_PLAN_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.content) {
      hasStudyPlan = true;
      planContent = parsed.content;
    }
  } catch {
    // 忽略损坏数据
  }

  return {
    quizRounds: getInt(QUIZ_COUNT_KEY),
    wrongWords,
    wrongCount: wrongWords.length,
    translateCount: getInt(TRANSLATE_COUNT_KEY),
    essayCount: getInt(ESSAY_COUNT_KEY),
    hasStudyPlan,
    planContent,
  };
}

/** 练习完成后 +1（type: 'translate' 翻译 / 'essay' 作文） */
export function incrementExercise(type: 'translate' | 'essay'): void {
  const key = type === 'translate' ? TRANSLATE_COUNT_KEY : ESSAY_COUNT_KEY;
  localStorage.setItem(key, String(getInt(key) + 1));
  bumpDaily(type);
}

/* ============ 每日练习量（趋势图数据） ============ */

export type DailyKind = 'translate' | 'essay' | 'quiz';

export interface DayActivity {
  translate: number;
  essay: number;
  quiz: number;
}

export interface DayPoint extends DayActivity {
  date: string;   // YYYY-MM-DD
  label: string;  // 展示用短标签，如「周一」「今天」
  total: number;
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadDaily(): Record<string, DayActivity> {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** 今日某类练习 +1（趋势图数据源），在各类练习完成时调用 */
export function bumpDaily(kind: DailyKind): void {
  const store = loadDaily();
  const today = todayStr();
  const entry = store[today] ?? { translate: 0, essay: 0, quiz: 0 };
  entry[kind] = (entry[kind] ?? 0) + 1;
  store[today] = entry;
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(store));
  } catch {
    // 存储满时忽略，不影响主流程
  }
}

/** 最近 n 天（默认 7 天）每日练习量，按时间正序返回，供趋势图渲染 */
export function loadDailySeries(n = 7): DayPoint[] {
  const store = loadDaily();
  const points: DayPoint[] = [];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const date = `${d.getFullYear()}-${m}-${day}`;
    const act = store[date] ?? { translate: 0, essay: 0, quiz: 0 };
    points.push({
      date,
      label: i === 0 ? '今天' : `周${weekdays[d.getDay()]}`,
      translate: act.translate ?? 0,
      essay: act.essay ?? 0,
      quiz: act.quiz ?? 0,
      total: (act.translate ?? 0) + (act.essay ?? 0) + (act.quiz ?? 0),
    });
  }
  return points;
}
