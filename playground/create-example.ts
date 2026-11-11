/**
 * One-shot doc example: description + demo frame + k3-codeblock from a single code string.
 * @see .cursor/rules/doc-page-template.mdc
 * @see .cursor/rules/demo-cases-m3.mdc
 */

export interface CreateExampleOptions {
  /** i18n key for the h3 title (optional if title provided). */
  titleKey?: string;
  /** Fallback / EN title text. */
  title?: string;
  /** i18n key for the description paragraph. */
  descKey?: string;
  /** Fallback description. */
  desc?: string;
  /** Source shown in the codeblock and optionally used as live demo HTML. */
  html: string;
  /** Codeblock language (default html). */
  language?: string;
  /**
   * When true (default), inject `html` into `.demo-case-stage` as live markup.
   * Set false when the demo is provided separately via `demo`.
   */
  liveDemo?: boolean;
  /** Optional pre-built demo node (skips parsing `html` into the stage). */
  demo?: HTMLElement | null;
  /** Number of equal columns helper (2–4) — default 1 full-width case. */
  cols?: 1 | 2 | 3 | 4;
}

function setI18n(el: HTMLElement, key: string | undefined, fallback: string): void {
  if (key) el.dataset.i18n = key;
  el.textContent = fallback;
}

/**
 * Build a self-contained example block (h3 + blurb + demo-block + code).
 */
export function createExample(opts: CreateExampleOptions): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'doc-example';

  if (opts.titleKey || opts.title) {
    const h3 = document.createElement('h3');
    setI18n(h3, opts.titleKey, opts.title || opts.titleKey || '');
    wrap.append(h3);
  }

  if (opts.descKey || opts.desc) {
    const p = document.createElement('p');
    p.className = 'doc-example-desc';
    setI18n(p, opts.descKey, opts.desc || opts.descKey || '');
    wrap.append(p);
  }

  const demoBlock = document.createElement('div');
  demoBlock.className = 'demo-block';

  const cols = opts.cols ?? 1;
  const frame = document.createElement('div');
  frame.className =
    cols > 1
      ? `demo-frame demo-frame--cases k3-layout-grid k3-demo-cols-${cols}`
      : 'demo-frame demo-frame--cases k3-layout-grid';
  frame.dataset.demoEnhance = 'off';

  const stageHost = opts.demo;
  if (stageHost) {
    frame.append(stageHost);
  } else {
    const demoCase = document.createElement('div');
    demoCase.className = cols === 1 ? 'demo-case k3-col-full' : 'demo-case';
    const stage = document.createElement('div');
    stage.className = 'demo-case-stage';
    if (opts.liveDemo !== false) {
      stage.innerHTML = opts.html;
    }
    const num = document.createElement('span');
    num.className = 'demo-case-num';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = '1';
    demoCase.append(stage, num);
    frame.append(demoCase);
  }

  demoBlock.append(frame);

  const block = document.createElement('k3-codeblock') as HTMLElement & {
    code: string;
    language: string;
  };
  block.language = opts.language || 'html';
  block.code = opts.html.trim();
  demoBlock.append(block);

  wrap.append(demoBlock);
  return wrap;
}
