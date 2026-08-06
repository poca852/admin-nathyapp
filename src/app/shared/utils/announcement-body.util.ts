export type AnnouncementBodyBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

const BULLET_LINE = /^\s*(?:[•\-\*]|\d+[.)])\s+(.*)$/;

/**
 * Convierte el texto plano de un aviso en bloques (párrafos / listas).
 * Respeta saltos de línea y también viñetas "•" pegadas en la misma línea.
 */
export function parseAnnouncementBody(body: string): AnnouncementBodyBlock[] {
  if (!body?.trim()) return [];

  const normalized = body
    .replace(/\r\n?/g, '\n')
    // "...texto. • Siguiente" → salto + viñeta
    .replace(/([^\n•])\s*•\s+/g, '$1\n• ');

  const lines = normalized.split('\n');
  const blocks: AnnouncementBodyBlock[] = [];
  let listItems: string[] | null = null;
  let paraParts: string[] = [];

  const flushPara = () => {
    const text = paraParts.join('\n').trim();
    paraParts = [];
    if (text) blocks.push({ type: 'p', text });
  };

  const flushList = () => {
    if (listItems?.length) blocks.push({ type: 'ul', items: listItems });
    listItems = null;
  };

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      flushList();
      flushPara();
      continue;
    }

    const match = rawLine.match(BULLET_LINE);
    if (match) {
      flushPara();
      if (!listItems) listItems = [];
      listItems.push(match[1].trim());
      continue;
    }

    flushList();
    paraParts.push(rawLine.trim());
  }

  flushList();
  flushPara();
  return blocks;
}
