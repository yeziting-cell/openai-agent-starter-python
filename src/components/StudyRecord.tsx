import { useState, useEffect, useCallback } from 'react';
import { useT } from '../i18n';
import { loadStudyStats, type StudyStats } from '../lib/studyStats';
import { exportStudyReport } from '../api';
import styles from './StudyRecord.module.css';

/**
 * 学习记录面板：汇总 LocalStorage 中的学习数据，
 * 支持生成简单学习报告并导出 Word（python-docx 后端接口）。
 */
export default function StudyRecord() {
  const { t } = useT();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<'' | 'ok' | 'fail'>('');

  const refresh = useCallback(() => {
    setStats(loadStudyStats());
    setExportMsg('');
  }, []);

  // 首次进入加载一次；用户点击刷新按钮可重新读取
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleExport = async () => {
    if (!stats || exporting) return;
    setExporting(true);
    setExportMsg('');

    const blob = await exportStudyReport(stats);
    setExporting(false);

    if (!blob) {
      setExportMsg('fail');
      return;
    }

    // 触发浏览器下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '学习报告.docx';
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('ok');
  };

  if (!stats) return null;

  const empty =
    stats.quizRounds === 0 &&
    stats.translateCount === 0 &&
    stats.essayCount === 0;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('record.title')}</h3>

      <div className={styles.statRow}>
        <span>{t('record.quizRounds')}</span>
        <b>{stats.quizRounds}</b>
      </div>
      <div className={styles.statRow}>
        <span>{t('record.translate')}</span>
        <b>{stats.translateCount}</b>
      </div>
      <div className={styles.statRow}>
        <span>{t('record.essay')}</span>
        <b>{stats.essayCount}</b>
      </div>
      <div className={styles.statRow}>
        <span>{t('record.wrongCount')}</span>
        <b>{stats.wrongCount}</b>
      </div>
      <div className={styles.statRow}>
        <span>{t('record.plan')}</span>
        <b>{stats.hasStudyPlan ? t('record.planYes') : t('record.planNo')}</b>
      </div>

      {stats.wrongWords.length > 0 && (
        <>
          <p className={styles.wrongTitle}>{t('record.wrongTitle')}</p>
          <ul className={styles.wrongList}>
            {stats.wrongWords.slice(0, 10).map(w => (
              <li key={w.word}>
                <b>{w.word}</b> — {w.meaning}（×{w.count}）
              </li>
            ))}
          </ul>
        </>
      )}

      {empty && <p className={styles.hint}>{t('record.empty')}</p>}

      <div className={styles.btnRow}>
        <button className={styles.refreshBtn} onClick={refresh}>
          {t('record.refresh')}
        </button>
        <button
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? t('record.exporting') : t('record.export')}
        </button>
      </div>

      {exportMsg === 'ok' && <p className={styles.msgOk}>{t('record.exportOk')}</p>}
      {exportMsg === 'fail' && <p className={styles.msgFail}>{t('record.exportFail')}</p>}
    </div>
  );
}
