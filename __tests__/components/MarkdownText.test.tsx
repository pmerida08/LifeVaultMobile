import React from 'react';
import { render } from '@testing-library/react-native';
import { MarkdownText } from '../../components/ui/MarkdownText';

jest.mock('../../constants/colors', () => ({
  useThemeColors: () => ({
    text: '#1E1B8B',
    primary: '#3730AB',
    primarySurface: '#EEEEFF',
    surface: '#FFFFFF',
  }),
  useResolvedTheme: () => 'light',
}));

jest.mock('../../store/theme.store', () => ({
  useThemeStore: () => ({ theme: 'light' }),
}));

describe('MarkdownText', () => {
  it('renderiza texto plano sin errores', () => {
    const { getByText } = render(<MarkdownText content="Hola mundo" />);
    expect(getByText('Hola mundo')).toBeTruthy();
  });

  it('renderiza contenido vacío sin errores', () => {
    const { toJSON } = render(<MarkdownText content="" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renderiza encabezado H1', () => {
    const { getByText } = render(<MarkdownText content="# Título principal" />);
    expect(getByText('Título principal')).toBeTruthy();
  });

  it('renderiza encabezado H2', () => {
    const { getByText } = render(<MarkdownText content="## Subtítulo" />);
    expect(getByText('Subtítulo')).toBeTruthy();
  });

  it('renderiza encabezado H3', () => {
    const { getByText } = render(<MarkdownText content="### Sección" />);
    expect(getByText('Sección')).toBeTruthy();
  });

  it('renderiza texto en negrita', () => {
    const { getAllByText } = render(<MarkdownText content="**texto en negrita**" />);
    expect(getAllByText('texto en negrita').length).toBeGreaterThan(0);
  });

  it('renderiza texto en cursiva', () => {
    const { getAllByText } = render(<MarkdownText content="*texto en cursiva*" />);
    expect(getAllByText('texto en cursiva').length).toBeGreaterThan(0);
  });

  it('renderiza código inline', () => {
    const { getByText } = render(<MarkdownText content="Usa `npm install` para instalar" />);
    expect(getByText('npm install')).toBeTruthy();
  });

  it('renderiza item de lista con guión', () => {
    const { getByText } = render(<MarkdownText content="- Primer elemento" />);
    expect(getByText('Primer elemento')).toBeTruthy();
    expect(getByText('•')).toBeTruthy();
  });

  it('renderiza item de lista con asterisco', () => {
    const { getByText } = render(<MarkdownText content="* Segundo elemento" />);
    expect(getByText('Segundo elemento')).toBeTruthy();
  });

  it('renderiza lista numerada', () => {
    const { getByText } = render(<MarkdownText content="1. Paso uno" />);
    expect(getByText('Paso uno')).toBeTruthy();
    expect(getByText('1.')).toBeTruthy();
  });

  it('renderiza múltiples líneas correctamente', () => {
    const content = '# Título\n\nPárrafo de texto\n\n- Ítem uno\n- Ítem dos';
    const { getByText } = render(<MarkdownText content={content} />);
    expect(getByText('Título')).toBeTruthy();
    expect(getByText('Párrafo de texto')).toBeTruthy();
    expect(getByText('Ítem uno')).toBeTruthy();
    expect(getByText('Ítem dos')).toBeTruthy();
  });

  it('renderiza bloque de código', () => {
    const content = '```\nconst x = 1;\nconst y = 2;\n```';
    const { getByText } = render(<MarkdownText content={content} />);
    expect(getByText('const x = 1;\nconst y = 2;')).toBeTruthy();
  });

  it('renderiza mezcla de formatos inline en un párrafo', () => {
    const { getAllByText, getByText } = render(
      <MarkdownText content="Normal **negrita** y `código`" />
    );
    expect(getAllByText('negrita').length).toBeGreaterThan(0);
    expect(getByText('código')).toBeTruthy();
  });
});
