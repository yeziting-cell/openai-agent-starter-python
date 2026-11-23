import { useCallback, useState } from 'react';
import { useT } from '../i18n';
import { speak } from '../lib/speak';
import { bumpDaily } from '../lib/studyStats';
import styles from './VocabQuiz.module.css';

/* ============ 类型 ============ */
type WordItem = { word: string; meaning: string; example: string };
type Question = { word: WordItem; options: string[]; answer: string };

const LEVELS = ['cet4', 'cet6'] as const;
type LevelId = (typeof LEVELS)[number];

const QUIZ_SIZES = [5, 10, 15, 20]; // 每轮题数可选
const DEFAULT_QUIZ_SIZE = 10;

/* 词汇文件缓存在内存里，切换级别时不用重复请求 */
const WORDS_CACHE: Record<string, WordItem[]> = {};

async function loadWords(level: LevelId): Promise<WordItem[]> {
  if (WORDS_CACHE[level]) return WORDS_CACHE[level];
  const res = await fetch(`/data/${level}_words.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as WordItem[];
  WORDS_CACHE[level] = data;
  return data;
}

/** 打乱数组（简单洗牌，够用） */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 从词库里生成一轮选择题 */
function buildQuestions(words: WordItem[], size: number): Question[] {
  const picked = shuffle(words).slice(0, size);
  return picked.map(item => {
    const wrongOptions = shuffle(words.filter(w => w.word !== item.word))
      .slice(0, 3)
      .map(w => w.meaning);
    return { word: item, options: shuffle([item.meaning, ...wrongOptions]), answer: item.meaning };
  });
}

/* ============ LocalStorage 记录（步骤 5 学习记录也会用到） ============ */
const WRONG_WORDS_KEY = 'cet_wrong_words';
const QUIZ_COUNT_KEY = 'cet_quiz_count';

function addWrongWord(word: WordItem): void {
  const store: Record<string, { meaning: string; count: number; last: string }> =
    JSON.parse(localStorage.getItem(WRONG_WORDS_KEY) || '{}');
  const prev = store[word.word];
  store[word.word] = {
    meaning: word.meaning,
    count: (prev?.count || 0) + 1,
    last: new Date().toISOString().slice(0, 10),
  };
  localStorage.setItem(WRONG_WORDS_KEY, JSON.stringify(store));
}

function addQuizCount(): void {
  const n = Number(localStorage.getItem(QUIZ_COUNT_KEY) || '0') + 1;
  localStorage.setItem(QUIZ_COUNT_KEY, String(n));
  bumpDaily('quiz'); // 写入每日练习量，供学习记录趋势图使用
}

/* ============ 组件 ============ */
export default function VocabQuiz() {
  const { t } = useT();

  const [level, setLevel] = useState<LevelId>('cet4');
  const [size, setSize] = useState<number>(DEFAULT_QUIZ_SIZE);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongList, setWrongList] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(async (lv: LevelId) => {
    setLoading(true);
    setError(null);
    try {
      const words = await loadWords(lv);
      setQuestions(buildQuestions(words, size));
      setIndex(0);
      setSelected(null);
      setScore(0);
      setWrongList([]);
    } catch {
      setError(t('quiz.error'));
    } finally {
      setLoading(false);
    }
  }, [t, size]);

  const handleSelect = useCallback((option: string) => {
    if (!questions || selected !== null) return; // 已答过，锁定
    setSelected(option);
    const q = questions[index];
    if (option === q.answer) {
      setScore(s => s + 1);
    } else {
      addWrongWord(q.word);
      setWrongList(prev => [...prev, q.word]);
    }
  }, [questions, index, selected]);

  const handleNext = useCallback(() => {
    if (!questions) return;
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
      setSelected(null);
    } else {
      addQuizCount(); // 完成一轮，记录测试次数
      setQuestions(questions.map(q => ({ ...q }))); // 保持 finished 判断用 score/wrongList
      setIndex(questions.length); // index 越过题目数 = 结束
    }
  }, [questions, index]);

  const finished = questions !== null && index >= questions.length;

  /* ── 未开始：选级别 ── */
  if (questions === null) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>{t('quiz.title')}</h3>
        <p className={styles.hint}>{t('quiz.hint')}</p>
        <div className={styles.levelRow}>
          {LEVELS.map(lv => (
            <button
              key={lv}
              className={`${styles.levelBtn} ${lv === level ? styles.levelBtnActive : ''}`}
              onClick={() => setLevel(lv)}
            >
              {lv === 'cet4' ? t('quiz.level4') : t('quiz.level6')}
            </button>
          ))}
        </div>
        <div className={styles.levelRow}>
          {QUIZ_SIZES.map(n => (
            <button
              key={n}
              className={`${styles.levelBtn} ${n === size ? styles.levelBtnActive : ''}`}
              onClick={() => setSize(n)}
            >
              {n} {t('quiz.sizeUnit')}
            </button>
          ))}
        </div>
        <button className={styles.startBtn} disabled={loading} onClick={() => startQuiz(level)}>
          {loading ? t('quiz.loading') : t('quiz.start')}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  /* ── 结束：成绩 + 错词 ── */
  if (finished) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>{t('quiz.title')}</h3>
        <p className={styles.score}>
          {t('quiz.score')}: {score} / {questions.length}
        </p>
        {wrongList.length > 0 && (
          <>
            <p className={styles.wrongTitle}>{t('quiz.wrongTitle')}</p>
            <ul className={styles.wrongList}>
              {wrongList.map(w => (
                <li key={w.word}>
                  <b>{w.word}</b>
                  <button
                    className={styles.speakBtn}
                    title={t('quiz.speak')}
                    onClick={() => speak(w.word)}
                  >
                    🔊
                  </button>
                  {' — '}{w.meaning}
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{t('quiz.wrongSaved')}</p>
          </>
        )}
        {wrongList.length === 0 && <p className={styles.hint}>{t('quiz.allRight')}</p>}
        <button className={styles.startBtn} onClick={() => startQuiz(level)}>
          {t('quiz.restart')}
        </button>
      </div>
    );
  }

  /* ── 答题中 ── */
  const q = questions[index];
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('quiz.title')}</h3>
      <p className={styles.progress}>
        Q{index + 1} / {questions.length} · {t('quiz.score')}: {score}
      </p>
      <div className={styles.question}>
        <p className={styles.word}>
          {q.word.word}
          <button
            className={styles.speakBtn}
            title={t('quiz.speak')}
            onClick={() => speak(q.word.word)}
          >
            🔊
          </button>
        </p>
        <div className={styles.options}>
          {q.options.map(opt => {
            const isAnswer = opt === q.answer;
            const isPicked = opt === selected;
            let cls = styles.option;
            if (selected !== null) {
              if (isAnswer) cls = `${styles.option} ${styles.optionCorrect}`;
              else if (isPicked) cls = `${styles.option} ${styles.optionWrong}`;
            }
            return (
              <button key={opt} className={cls} onClick={() => handleSelect(opt)} disabled={selected !== null}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {selected !== null && (
        <div className={styles.feedback}>
          <p className={selected === q.answer ? styles.feedbackOk : styles.feedbackNo}>
            {selected === q.answer ? t('quiz.correct') : `${t('quiz.wrong')} — ${q.word.word}: ${q.answer}`}
          </p>
          <p className={styles.example}>
            {q.word.example}
            <button
              className={styles.speakBtn}
              title={t('quiz.speak')}
              onClick={() => speak(q.word.example)}
            >
              🔊
            </button>
          </p>
          <button className={styles.startBtn} onClick={handleNext}>
            {index + 1 < questions.length ? t('quiz.next') : t('quiz.finish')}
          </button>
        </div>
      )}
    </div>
  );
}
