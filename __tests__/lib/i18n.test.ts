import { i18n, t } from '../../lib/i18n';

describe('i18n', () => {
  beforeEach(() => {
    i18n.locale = 'es';
  });

  describe('español (es)', () => {
    it('traduce tabs correctamente', () => {
      expect(t('tabs.home')).toBe('Inicio');
      expect(t('tabs.vault')).toBe('Bóveda');
      expect(t('tabs.assistant')).toBe('Asistente');
      expect(t('tabs.planner')).toBe('Planner');
      expect(t('tabs.settings')).toBe('Ajustes');
    });

    it('traduce login correctamente', () => {
      expect(t('login.enter')).toBe('Entrar');
      expect(t('login.email')).toBe('Email');
    });

    it('soporta interpolación', () => {
      expect(t('vault.filterBy', { label: 'Legal' })).toBe('Filtrar por Legal');
    });

    it('soporta interpolación con búsqueda', () => {
      expect(t('vault.noResultsHint', { search: 'contrato' })).toBe(
        'No hay documentos con "contrato"'
      );
    });
  });

  describe('inglés (en)', () => {
    beforeEach(() => {
      i18n.locale = 'en';
    });

    it('traduce tabs correctamente', () => {
      expect(t('tabs.home')).toBe('Home');
      expect(t('tabs.vault')).toBe('Vault');
      expect(t('tabs.settings')).toBe('Settings');
    });

    it('traduce login correctamente', () => {
      expect(t('login.enter')).toBe('Sign in');
    });
  });

  describe('fallback', () => {
    it('devuelve la clave si no existe la traducción', () => {
      const result = t('clave.inexistente');
      expect(result).toContain('inexistente');
    });
  });
});
