import { useState, useEffect, useCallback } from 'react';
import { useT } from '../i18n';
import { loadStudyStats, loadDailySeries, type StudyStats, type DayPoint } from '../lib/studyStats';
import { exportStudyReport } from '../api';
import { speak } from '../lib/speak';
import styles from './StudyRecord.module.css';

/* ============ 7 天趋势小图（手绘风堆叠柱状图，纯 SVG） ============ */

const BAR_COLORS = {
  quiz: '#8fa382',      // 鼠尾草绿：词汇测试
  translate: '#a9bcc9', // 雾蓝：翻译练习
  essay: '#d9b0a3',     // 灰粉：作文批改
} as const;

function TrendChart({ data }: { data: DayPoint[] }) {
  const W = 300;
  const H = 130;
  const pad = { top: 10, bottom: 22, left: 8, right: 8 };
  const chartH = H - pad.top - pad.bottom;
  const slot = (W - pad.left - pad.right) / data.length;
  const barW = slot * 0.52;

  const maxTotal = Math.max(...data.map(d => d.total), 1); // 至少 1，避免除 0
  const yOf = (h: number) => pad.top + chartH - (h / maxTotal) * (chartH - 6);

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img">
      {/* 虚线基线（手绘坐标轴感） */}
      <line
        x1={pad.left} y1={pad.top + chartH}
        x2={W - pad.right} y2={pad.top + chartH}
        stroke="var(--bg-border)" strokeWidth="1.6" strokeDasharray="5 4"
      />
      {data.map((d, i) => {
        const cx = pad.left + slot * i + slot / 2;
        const x = cx - barW / 2;
        // 从下往上堆叠：quiz → translate → essay
        let cursor = 0;
        const segs = (['quiz', 'translate', 'essay'] as const).map(kind => {
          const h = (d[kind] / maxTotal) * (chartH - 6);
          const y = yOf(cursor + d[kind]);
          cursor += d[kind];
          return h > 0 ? (
            <rect
              key={kind}
              x={x} y={y} width={barW} height={Math.max(h, 2)}
              fill={BAR_COLORS[kind]}
              rx="3"
              transform={`rotate(${i % 2 === 0 ? -0.8 : 0.8} ${cx} ${y})`}
            />
          ) : null;
        });
        return (
          <g key={d.date}>
            {segs}
            {/* 无数据日画一个小圆点占位，保持手账感 */}
            {d.total === 0 && (
              <circle cx={cx} cy={pad.top + chartH - 4} r="2.5" fill="var(--bg-border)" />
            )}
            <text
              x={cx} y={H - 8}
              textAnchor="middle"
              className={styles.chartLabel}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 学习记录面板：汇总 LocalStorage 中的学习数据，
 * 支持生成简单学习报告并导出 Word（python-docx 后端接口）。
 */
export default function StudyRecord() {
  const { t } = useT();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<'' | 'ok' | 'fail'>('');

  const refresh = useCallback(() => {
    setStats(loadStudyStats());
    setDaily(loadDailySeries(7));
    setExportMsg('');
  }, []);

  // 首次进入加载一次；数据更新事件 / 刷新按钮均可重新读取
  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener('cet-data-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('cet-data-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
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

      {/* 近 7 天练习趋势 */}
      <div className={styles.chartWrap}>
        <p className={styles.chartTitle}>{t('record.chartTitle')}</p>
        <TrendChart data={daily} />
        <div className={styles.legend}>
          <span><i style={{ background: BAR_COLORS.quiz }} />{t('record.chartQuiz')}</span>
          <span><i style={{ background: BAR_COLORS.translate }} />{t('record.chartTranslate')}</span>
          <span><i style={{ background: BAR_COLORS.essay }} />{t('record.chartEssay')}</span>
        </div>
      </div>

      {stats.wrongWords.length > 0 && (
        <>
          <p className={styles.wrongTitle}>{t('record.wrongTitle')}</p>
          <ul className={styles.wrongList}>
            {stats.wrongWords.slice(0, 10).map(w => (
              <li key={w.word}>
                <b>{w.word}</b>
                <button
                  className={styles.speakBtn}
                  title={t('quiz.speak')}
                  onClick={() => speak(w.word)}
                >
                  🔊
                </button>
                {' — '}{w.meaning}（×{w.count}）
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
