import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/ui/Input';

jest.mock('../../constants/colors', () => ({
  useThemeColors: () => ({
    danger: '#FF4757',
    primary: '#3730AB',
    border: '#E0D9FF',
    surface: '#FFFFFF',
    text: '#1E1B8B',
    textMuted: '#7C6FA0',
  }),
}));

describe('Input', () => {
  it('renderiza el label', () => {
    const { getByText } = render(<Input label="Correo" />);
    expect(getByText('Correo')).toBeTruthy();
  });

  it('renderiza el placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="tu@email.com" />);
    expect(getByPlaceholderText('tu@email.com')).toBeTruthy();
  });

  it('muestra el mensaje de error', () => {
    const { getByText } = render(<Input label="Correo" error="Campo obligatorio" />);
    expect(getByText('Campo obligatorio')).toBeTruthy();
  });

  it('propaga onChangeText al escribir', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Escribe" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Escribe'), 'hola');
    expect(onChangeText).toHaveBeenCalledWith('hola');
  });

  it('muestra el botón de mostrar/ocultar contraseña con secureTextEntry', () => {
    const { getByLabelText } = render(<Input placeholder="Contraseña" secureTextEntry />);
    expect(getByLabelText('Mostrar contraseña')).toBeTruthy();
  });
});
