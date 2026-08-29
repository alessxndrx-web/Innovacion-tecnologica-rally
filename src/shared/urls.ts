const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Normaliza una URL de contenido antes de enviarla al cliente.
 *
 * Acepta rutas relativas propias (`/imagen.png`) y URL absolutas http/https.
 * Cualquier otra cosa —`javascript:`, `data:`, `//host` protocol-relative o un
 * valor no parseable— se devuelve como `null` en lugar de propagarse hasta el
 * frontend, donde acabaría en un `src` o un `href`.
 */
export function safeMediaUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  if (trimmed.startsWith('//')) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}
