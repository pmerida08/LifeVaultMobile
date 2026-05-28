/**
 * Extrae el mensaje de un error desconocido de forma type-safe.
 * Usar en lugar de `catch (e: any)` + `e.message`.
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Error desconocido';
}
