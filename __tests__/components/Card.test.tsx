import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '../../components/ui/Card';

jest.mock('../../constants/colors', () => ({
  useThemeColors: () => ({
    surface: '#FFFFFF',
    surfaceElevated: '#EEEEFF',
  }),
}));

describe('Card', () => {
  it('renderiza los hijos', () => {
    const { getByText } = render(
      <Card>
        <Text>Contenido interno</Text>
      </Card>
    );
    expect(getByText('Contenido interno')).toBeTruthy();
  });

  it('renderiza en variante elevada sin errores', () => {
    const { getByText } = render(
      <Card elevated>
        <Text>Elevado</Text>
      </Card>
    );
    expect(getByText('Elevado')).toBeTruthy();
  });
});
