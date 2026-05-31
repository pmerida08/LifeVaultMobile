import { getErrorMessage } from '../../lib/errors';

describe('getErrorMessage', () => {
  it('returns message from Error instance', () => {
    expect(getErrorMessage(new Error('algo salió mal'))).toBe('algo salió mal');
  });

  it('returns string as-is', () => {
    expect(getErrorMessage('fallo de red')).toBe('fallo de red');
  });

  it('returns fallback for number', () => {
    expect(getErrorMessage(42)).toBe('Error desconocido');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('Error desconocido');
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Error desconocido');
  });

  it('returns fallback for plain object', () => {
    expect(getErrorMessage({ code: 404 })).toBe('Error desconocido');
  });

  it('returns empty string when Error has empty message', () => {
    expect(getErrorMessage(new Error(''))).toBe('');
  });
});
