/**
 * 学习记录统计（LocalStorage 版，无数据库）。
 *
 * LocalStorage key 约定：
 *   cet_quiz_count      → 词汇测试完成轮数（数字）
 *   cet_wrong_words     → 错词本 { word: { meaning, count, last } }（词汇测试面板写入）
 *   cet_translate_count → 翻译练习次数
 *   cet_essay_count     → 作文批改次数
 *   cet_study_plan      → 备考计划 { content, savedAt }（备考计划面板写入）
 */

const QUIZ_COUNT_KEY = 'cet_quiz_count';
const WRONG_WORDS_KEY = 'cet_wrong_words';
const TRANSLATE_COUNT_KEY = 'cet_translate_count';
const ESSAY_COUNT_KEY = 'cet_essay_count';
const STUDY_PLAN_KEY = 'cet_study_plan';

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
}
