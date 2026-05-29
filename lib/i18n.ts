import { I18n } from 'i18n-js';
import en from '../locales/en.json';
import es from '../locales/es.json';

export const i18n = new I18n({ en, es });
i18n.defaultLocale = 'es';
i18n.locale = 'es';
i18n.enableFallback = true;

export const t = (key: string, options?: object): string => i18n.t(key, options);
