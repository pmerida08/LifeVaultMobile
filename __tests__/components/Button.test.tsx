import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

jest.mock('../../constants/colors', () => ({
  useThemeColors: () => ({
    primary: '#3730AB',
    white: '#FFFFFF',
    surfaceElevated: '#EEEEFF',
    danger: '#FF4757',
  }),
}));

describe('Button', () => {
  it('renderiza el label', () => {
    const { getByText } = render(<Button label="Guardar" onPress={() => {}} />);
    expect(getByText('Guardar')).toBeTruthy();
  });

  it('llama a onPress al pulsar', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Enviar" onPress={onPress} />);
    fireEvent.press(getByText('Enviar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('oculta el label y muestra el spinner cuando loading', () => {
    const { queryByText } = render(
      <Button label="Cargando" onPress={() => {}} loading />
    );
    expect(queryByText('Cargando')).toBeNull();
  });

  it('usa el accessibilityLabel personalizado', () => {
    const { getByLabelText } = render(
      <Button label="OK" accessibilityLabel="Confirmar acción" onPress={() => {}} />
    );
    expect(getByLabelText('Confirmar acción')).toBeTruthy();
  });

  it('por defecto usa el label como accessibilityLabel', () => {
    const { getByLabelText } = render(<Button label="Aceptar" onPress={() => {}} />);
    expect(getByLabelText('Aceptar')).toBeTruthy();
  });
});
