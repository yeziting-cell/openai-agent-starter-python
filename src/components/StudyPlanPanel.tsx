import { useState, useEffect } from 'react';
import { useT } from '../i18n';
import styles from './StudyPlanPanel.module.css';

/**
 * 备考计划面板：读取 LocalStorage 中保存的最新备考计划。
 *
 * LocalStorage 约定（与 App.tsx 中的保存逻辑保持一致）：
 *   key: cet_study_plan
 *   value: JSON 字符串 { content: string; savedAt: number }
 */
export const STUDY_PLAN_KEY = 'cet_study_plan';

export default function StudyPlanPanel() {
  const { t } = useT();
  const [plan, setPlan] = useState<{ content: string; savedAt: number } | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STUDY_PLAN_KEY);
        if (!raw) { setPlan(null); return; }
        const parsed = JSON.parse(raw) as { content?: string; savedAt?: number };
        if (parsed?.content) {
          setPlan({ content: parsed.content, savedAt: parsed.savedAt ?? 0 });
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

  const handleDelete = () => {
    localStorage.removeItem(STUDY_PLAN_KEY);
    setPlan(null);
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
          <pre className={styles.planContent}>{plan.content}</pre>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            {t('plan.delete')}
          </button>
        </>
      )}
    </div>
  );
}
