/**
 * Localization System
 * Handles multi-language support for forms
 */

import type { Language } from '../../stores/types/formEngine';

export interface LocalizationStore {
  currentLanguage: string;
  languages: Language[];
  translations: Record<string, Record<string, Record<string, string>>>;
  setLanguage: (code: string) => void;
  getTranslation: (namespace: string, key: string, defaultValue?: string) => string;
  addTranslations: (language: string, namespace: string, translations: Record<string, string>) => void;
}

export class LocalizationManager {
  private static store: LocalizationStore | null = null;

  /**
   * Initialize localization store
   */
  static initialize(
    defaultLanguage: string,
    languages: Language[],
    translations: Record<string, Record<string, Record<string, string>>> = {}
  ): LocalizationStore {
    const store: LocalizationStore = {
      currentLanguage: defaultLanguage,
      languages,
      translations,
      setLanguage: (code: string) => {
        if (store.languages.some((lang) => lang.code === code)) {
          store.currentLanguage = code;
        }
      },
      getTranslation: (namespace: string, key: string, defaultValue?: string) => {
        const langTranslations = store.translations[store.currentLanguage];
        if (!langTranslations) return defaultValue || key;

        const namespaceTranslations = langTranslations[namespace];
        if (!namespaceTranslations) return defaultValue || key;

        return namespaceTranslations[key] || defaultValue || key;
      },
      addTranslations: (language: string, namespace: string, translations: Record<string, string>) => {
        if (!store.translations[language]) {
          store.translations[language] = {};
        }
        if (!store.translations[language][namespace]) {
          store.translations[language][namespace] = {};
        }
        store.translations[language][namespace] = {
          ...store.translations[language][namespace],
          ...translations,
        };
      },
    };

    this.store = store;
    return store;
  }

  /**
   * Get current localization store
   */
  static getStore(): LocalizationStore | null {
    return this.store;
  }

  /**
   * Get translation for current language
   */
  static translate(namespace: string, key: string, defaultValue?: string): string {
    if (!this.store) return defaultValue || key;
    return this.store.getTranslation(namespace, key, defaultValue);
  }

  /**
   * Set current language
   */
  static setLanguage(code: string): void {
    if (this.store) {
      this.store.setLanguage(code);
    }
  }
}

