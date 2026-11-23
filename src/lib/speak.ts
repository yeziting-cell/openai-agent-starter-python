/**
 * 单词发音（Web Speech API，纯前端，无需任何后端/密钥）。
 *
 * 使用浏览器内置 speechSynthesis，优先选择英语语音。
 * 部分浏览器需要用户先有交互才允许发声，而我们的发音按钮
 * 本身就是点击触发，天然满足该限制。
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // 异步加载中，下次再取

  // 优先美式英语，其次任意英语语音
  cachedVoice =
    voices.find(v => v.lang === 'en-US') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null;
  return cachedVoice;
}

// 语音列表在部分浏览器是异步加载的，提前监听以预热缓存
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickEnglishVoice();
  };
}

/** 朗读一段英文文本。text 为空或浏览器不支持时静默忽略。 */
export function speak(text: string): void {
  if (!text.trim()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // 打断上一次未播完的发音
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickEnglishVoice();
    if (voice) utter.voice = voice;
    utter.lang = voice?.lang ?? 'en-US';
    utter.rate = 0.9; // 稍慢一点，方便跟读
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // 发音失败不影响主流程
  }
}
