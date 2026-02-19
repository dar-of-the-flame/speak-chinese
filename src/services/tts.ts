import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { AppLauncher } from '@capacitor/app-launcher';

// Функция для ожидания загрузки голосов в браузере
async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length) {
      resolve(window.speechSynthesis.getVoices());
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
}

export async function speak(text: string, lang: string = 'zh-CN'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Браузер
    return new Promise(async (resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Отменяем предыдущие
      window.speechSynthesis.cancel();

      // Ждём загрузки голосов
      const voices = await waitForVoices();
      let selectedVoice = voices.find(v => v.lang === 'zh-CN' || v.lang.startsWith('zh-'));
      if (!selectedVoice) {
        console.warn('No Chinese voice found, using default');
        selectedVoice = voices[0]; // берём первый доступный
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Нативная платформа (Android)
  try {
    await TextToSpeech.speak({
      text,
      lang,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}

export async function isChineseVoiceAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const voices = await waitForVoices();
    return voices.some(v => v.lang === 'zh-CN' || v.lang.startsWith('zh-'));
  }

  try {
    const result = await TextToSpeech.getSupportedLanguages();
    return result.languages.includes('zh-CN') || result.languages.some(l => l.startsWith('zh-'));
  } catch (error) {
    console.error('Failed to get supported languages:', error);
    return false;
  }
}

/**
 * Открывает системные настройки TTS на Android
 */
export async function openTtsSettings() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AppLauncher.openUrl({ url: 'android.settings.TTS_SETTINGS' });
  } catch (error) {
    console.error('Cannot open TTS settings:', error);
    try {
      await AppLauncher.openUrl({
        url: 'intent:#Intent;action=android.settings.TTS_SETTINGS;end'
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Не удалось открыть настройки TTS');
    }
  }
}