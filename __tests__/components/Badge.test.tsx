import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../components/ui/Badge';

jest.mock('../../constants/colors', () => ({
  useThemeColors: () => ({
    primarySurface: '#EEEEFF',
    primary: '#3730AB',
    surfaceElevated: '#EEEEFF',
    textMuted: '#7C6FA0',
  }),
}));

describe('Badge', () => {
  it('renderiza el label', () => {
    const { getByText } = render(<Badge label="Activo" />);
    expect(getByText('Activo')).toBeTruthy();
  });

  it('renderiza cada variante sin errores', () => {
    const variants = ['primary', 'success', 'warning', 'danger', 'muted'] as const;
    variants.forEach((variant) => {
      const { getByText } = render(<Badge label={variant} variant={variant} />);
      expect(getByText(variant)).toBeTruthy();
    });
  });
});
