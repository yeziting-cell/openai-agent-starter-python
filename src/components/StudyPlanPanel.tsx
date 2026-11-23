import { useState, useEffect, useMemo } from 'react';
import { useT } from '../i18n';
import styles from './StudyPlanPanel.module.css';

/**
 * 备考计划面板：读取 LocalStorage 中保存的最新备考计划，
 * 并支持按「阶段」勾选打卡 + 显示完成进度。
 *
 * LocalStorage 约定（与 App.tsx 中的保存逻辑保持一致）：
 *   key: cet_study_plan   → { content: string; savedAt: number }
 *   key: cet_plan_checks  → { savedAt: number; checked: number[] }
 *                            （勾选状态，换新计划时自动重置）
 */
export const STUDY_PLAN_KEY = 'cet_study_plan';
const PLAN_CHECKS_KEY = 'cet_plan_checks';

interface PlanSection {
  title: string;    // 段落标题行（无则为空）
  body: string;     // 其余内容
  isPhase: boolean; // 是否为「阶段」段落（可打卡）
}

/** 阶段标题行：第 1 阶段 / 第 2 阶段 / 第一阶段 / Phase 1 … */
const PHASE_RE = /^\s*(第\s*[一二三四五六七八九十1-9]+\s*阶段|阶段\s*[一二三四五六七八九十1-9]+|Phase\s*\d)/i;

/** 把计划文本拆成段落：以阶段标题行开头的新段落可打卡 */
function parseSections(content: string): PlanSection[] {
  const lines = content.split('\n');
  const sections: PlanSection[] = [];
  let current: PlanSection | null = null;

  for (const line of lines) {
    if (PHASE_RE.test(line)) {
      if (current) sections.push(current);
      current = { title: line, body: '', isPhase: true };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    } else {
      // 开头还没遇到阶段标题的行：单独算一段（不可打卡）
      const prev = sections[sections.length - 1];
      if (prev && !prev.isPhase) {
        prev.body += (prev.body ? '\n' : '') + line;
      } else {
        sections.push({ title: '', body: line, isPhase: false });
      }
    }
  }
  if (current) sections.push(current);
  return sections.filter(s => s.title || s.body.trim());
}

export default function StudyPlanPanel() {
  const { t } = useT();
  const [plan, setPlan] = useState<{ content: string; savedAt: number } | null>(null);
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STUDY_PLAN_KEY);
        if (!raw) { setPlan(null); setChecked([]); return; }
        const parsed = JSON.parse(raw) as { content?: string; savedAt?: number };
        if (parsed?.content) {
          setPlan({ content: parsed.content, savedAt: parsed.savedAt ?? 0 });

          // 读取勾选状态；换新计划（savedAt 变化）时自动清零
          const checksRaw = localStorage.getItem(PLAN_CHECKS_KEY);
          const checks = checksRaw ? JSON.parse(checksRaw) : null;
          setChecked(
            checks && checks.savedAt === (parsed.savedAt ?? 0)
              ? (checks.checked as number[]) ?? []
              : []
          );
        }
      } catch {
        // 数据损坏时忽略，视为无计划
      }
    };
    load();
    // 保存计划后 App.tsx 会派发 cet-data-updated，让正打开的面板立即刷新；
    // storage 事件用于兼容多标签页场景。
    window.addEventListener('cet-data-updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('cet-data-updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const sections = useMemo(
    () => (plan ? parseSections(plan.content) : []),
    [plan],
  );
  const phaseIdxs = useMemo(
    () => sections.map((s, i) => (s.isPhase ? i : -1)).filter(i => i >= 0),
    [sections],
  );
  const progress = phaseIdxs.length
    ? Math.round((phaseIdxs.filter(i => checked.includes(i)).length / phaseIdxs.length) * 100)
    : 0;

  const toggle = (idx: number) => {
    setChecked(prev => {
      const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
      try {
        localStorage.setItem(
          PLAN_CHECKS_KEY,
          JSON.stringify({ savedAt: plan?.savedAt ?? 0, checked: next }),
        );
      } catch {
        // 忽略存储失败
      }
      return next;
    });
  };

  const handleDelete = () => {
    localStorage.removeItem(STUDY_PLAN_KEY);
    localStorage.removeItem(PLAN_CHECKS_KEY);
    setPlan(null);
    setChecked([]);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('plan.title')}</h3>

      {!plan ? (
        <p className={styles.hint}>{t('plan.hint')}</p>
      ) : (
        <>
          <p className={styles.savedAt}>
            {t('plan.savedAt')}
            {plan.savedAt > 0 ? `：${new Date(plan.savedAt).toLocaleString()}` : ''}
          </p>

          {/* 打卡进度条（有阶段段落时才显示） */}
          {phaseIdxs.length > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressText}>
                🌱 {t('plan.progress')} {progress}%
              </span>
            </div>
          )}

          {/* 计划内容：阶段段落可勾选打卡 */}
          <div className={styles.planContent}>
            {sections.map((s, i) =>
              s.isPhase ? (
                <div
                  key={i}
                  className={`${styles.section} ${checked.includes(i) ? styles.sectionDone : ''}`}
                >
                  <button
                    className={styles.checkBtn}
                    onClick={() => toggle(i)}
                    title={t('plan.check')}
                  >
                    {checked.includes(i) ? '✅' : '⬜'}
                  </button>
                  <div className={styles.sectionText}>
                    <p className={styles.sectionTitle}>{s.title}</p>
                    {s.body.trim() && <pre className={styles.sectionBody}>{s.body}</pre>}
                  </div>
                </div>
              ) : (
                (s.title || s.body.trim()) && (
                  <pre key={i} className={styles.plainBlock}>{s.title}{s.body}</pre>
                )
              ),
            )}
          </div>

          <button className={styles.deleteBtn} onClick={handleDelete}>
            {t('plan.delete')}
          </button>
        </>
      )}
    </div>
  );
}
