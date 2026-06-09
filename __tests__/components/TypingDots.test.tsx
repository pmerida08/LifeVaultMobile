import React from 'react';
import { render } from '@testing-library/react-native';
import { TypingDots } from '../../components/ui/TypingDots';

jest.mock('../../constants/colors', () => ({
  Colors: { primaryLight: '#5B52DF' },
}));

describe('TypingDots', () => {
  it('renderiza sin errores', () => {
    const { toJSON } = render(<TypingDots />);
    expect(toJSON()).toBeTruthy();
  });

  it('renderiza tres puntos', () => {
    const { toJSON } = render(<TypingDots />);
    const tree = toJSON() as any;
    // El contenedor envuelve tres Animated.View (los puntos)
    expect(tree.children).toHaveLength(3);
  });
});
