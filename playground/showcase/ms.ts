/** Translate-safe Material Symbols markup for showcase demos. */
export function ms(name: string, slot?: string, extraClass = '', fill = false): string {
  const slotAttr = slot ? ` slot="${slot}"` : '';
  const cls = ['ms', 'notranslate', extraClass].filter(Boolean).join(' ');
  const fillAttr = fill ? ' data-k3-fill="1"' : '';
  const fillStyle = fill
    ? ` style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"`
    : '';
  return `<span${slotAttr} class="${cls}" translate="no" lang="zxx" data-k3-icon="${name}"${fillAttr}${fillStyle} aria-hidden="true"></span>`;
}
