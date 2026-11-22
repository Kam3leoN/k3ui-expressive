/**
 * Pack builder UI — mounts inside the docs shell (`#/pack`) or a standalone root.
 * Unified mode: k3ui checklist first, then k3ux at the end (custom packs stay separate files).
 */
import './pack.css';
import {
  GROUP_ORDER,
  cliCommand,
  formatPackHref,
  formatKb,
  isManifest,
  ownSize,
  parseLocationSelection,
  parseLocationSelectionDual,
  resolveSelection,
  totals,
  type Manifest,
  type PackProduct,
} from './model.js';

export type PackLocale = 'fr' | 'en';

const k3uxSibling = import.meta.env.VITE_K3UX_SIBLING === '1';

export interface MountPackOptions {
  /** Legacy single-product mode when `unified` is false. */
  product?: PackProduct;
  /** Inside the docs shell — no back link; URL is `?components=#/pack`. */
  embedded?: boolean;
  locale?: PackLocale;
  /**
   * Single page: k3ui groups then k3ux groups.
   * Default `true` when embedded.
   */
  unified?: boolean;
  /** @deprecated Product switch removed in unified mode. */
  onProductChange?: (product: PackProduct) => void;
}

type Checkbox = HTMLElement & { checked: boolean; disabled: boolean };

function textFor(locale: PackLocale, unified: boolean) {
  const fr = locale === 'fr';
  return {
    back: fr ? '← Documentation' : '← Documentation',
    title: fr ? 'Pack sur mesure' : 'Custom pack',
    intro: unified
      ? fr
        ? 'Cochez les composants K3ui, puis K3ux en bas de liste. Chaque pack reste un fichier séparé (k3ui.custom.js / k3ux.custom.js) — les dépendances sont ajoutées automatiquement.'
        : 'Tick K3ui components, then K3ux at the bottom. Each pack stays its own file (k3ui.custom.js / k3ux.custom.js) — dependencies are added for you.'
      : fr
        ? 'Téléchargez le pack complet en un clic, ou cochez seulement les composants utiles : un seul fichier avec le socle et votre sélection. Les dépendances sont ajoutées automatiquement.'
        : 'Download the full pack in one click, or tick only the components you need: one file with the core and your selection. Dependencies are added for you.',
    loading: fr ? 'Chargement du catalogue…' : 'Loading the catalog…',
    loadError: fr
      ? 'Catalogue introuvable. En local, lancez « npm run build:lazy » puis rechargez la page.'
      : 'Catalog not found. Locally, run “npm run build:lazy” and reload the page.',
    components: fr ? 'Composants' : 'Components',
    fullTitle: fr ? 'Pack complet · AiO' : 'Full pack · AiO',
    fullBlurb: unified
      ? fr
        ? 'Tout le catalogue : k3ui.full.js puis k3ux.full.js. Indisponible dès qu’une sélection custom est active.'
        : 'Full catalog: k3ui.full.js then k3ux.full.js. Unavailable while a custom selection is active.'
      : fr
        ? 'Tous les composants, sans choix — prêt à brancher.'
        : 'Every component, no picking — ready to drop in.',
    aioLocked: fr
      ? 'Réinitialisez la sélection pour télécharger l’AiO.'
      : 'Reset the selection to download AiO.',
    customLocked: fr
      ? 'Cochez au moins un composant pour activer le pack sur mesure.'
      : 'Tick at least one component to enable the custom pack.',
    customTitle: fr ? 'Pack sur mesure' : 'Custom pack',
    customBlurb: fr
      ? 'Cochez à gauche → k3ui.custom.js et/ou k3ux.custom.js. La carte AiO se désactive.'
      : 'Tick on the left → k3ui.custom.js and/or k3ux.custom.js. The AiO card disables.',
    labelRaw: fr ? 'Non compressé' : 'Uncompressed',
    labelGzip: 'Gzip',
    labelCount: fr ? 'Composants' : 'Components',
    downloadFull: fr ? 'Télécharger AiO' : 'Download AiO',
    download: fr ? 'Télécharger Custom' : 'Download Custom',
    reset: fr ? 'Réinitialiser la sélection' : 'Reset selection',
    copyLink: fr ? 'Copier le lien' : 'Copy link',
    copyCli: fr ? 'Copier la commande CLI' : 'Copy CLI command',
    resetDone: fr ? 'Sélection effacée.' : 'Selection cleared.',
    usage: fr ? 'Utilisation' : 'Usage',
    usageText: unified
      ? fr
        ? 'Le pack K3ui remplace k3ui.js (+ CSS injecté). Le pack K3ux remplace k3ux.js et injecte k3ui.css + k3ux.css — il faut encore k3ui.js (ou le pack K3ui) en peer.'
        : 'The K3ui pack replaces k3ui.js (+ injected CSS). The K3ux pack replaces k3ux.js and injects k3ui.css + k3ux.css — you still need k3ui.js (or the K3ui pack) as a peer.'
      : fr
        ? 'Le pack remplace k3ui.js et embarque k3ui.css (minifié, injecté au chargement) — pas besoin d’un <link> séparé. Il enregistre tout ce qu’il contient au démarrage.'
        : 'The pack replaces k3ui.js and embeds k3ui.css (minified, injected on load) — no separate <link> needed. It registers everything it holds at start-up.',
    guardTitle: fr ? 'Un composant manque ?' : 'A component is missing?',
    guardText: fr
      ? 'Si une page utilise un composant absent du pack, la console le signale avec le lien qui rouvre cette page — votre sélection et le composant manquant déjà cochés.'
      : 'When a page uses a component the pack was built without, the console reports it with the link that reopens this page — your selection and the missing component already ticked.',
    core: fr ? 'Socle' : 'Core',
    coreName: 'K3UI Core',
    coreNote: fr
      ? 'indispensable — init, thème, registre, i18n, utilitaires'
      : 'required — init, theme, registry, i18n, helpers',
    uxSection: 'K3ux',
    uxBlurb: fr
      ? 'Companion UX — peer k3ui obligatoire. Cochez après la sélection K3ui.'
      : 'UX companion — k3ui peer required. Tick after your K3ui selection.',
    all: fr ? 'Tout' : 'All',
    none: fr ? 'Aucun' : 'None',
    requiredBy: fr ? 'requis par {list}' : 'required by {list}',
    brings: fr ? 'ajoute {list}' : 'adds {list}',
    empty: fr ? 'Cochez au moins un composant.' : 'Tick at least one component.',
    customEmpty: fr ? 'Aucun composant coché' : 'No component selected',
    building: fr ? 'Assemblage du pack…' : 'Building the pack…',
    built: fr ? 'Pack prêt : {n} composants, {size}.' : 'Pack ready: {n} components, {size}.',
    builtBoth:
      fr
        ? 'Packs prêts : K3ui {nUi} · K3ux {nUx}.'
        : 'Packs ready: K3ui {nUi} · K3ux {nUx}.',
    buildError: fr ? 'Échec de l’assemblage : {error}' : 'Build failed: {error}',
    linkCopied: fr ? 'Lien copié.' : 'Link copied.',
    cliCopied: fr ? 'Commande copiée.' : 'Command copied.',
    group: {
      actions: fr ? 'Actions' : 'Actions',
      inputs: fr ? 'Saisie' : 'Inputs',
      feedback: fr ? 'Retour utilisateur' : 'Feedback',
      containment: fr ? 'Conteneurs' : 'Containment',
      navigation: fr ? 'Navigation' : 'Navigation',
      pickers: fr ? 'Sélecteurs' : 'Pickers',
      theme: fr ? 'Thème' : 'Theme',
      animation: fr ? 'Animations' : 'Animation',
      charts: fr ? 'Graphiques' : 'Charts',
      media: fr ? 'Médias' : 'Media',
    } as Record<string, string>,
  };
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_m, key: string) => String(vars[key] ?? ''));
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderShell(root: HTMLElement, embedded: boolean): void {
  root.classList.add('pack');
  root.innerHTML = `
    <header class="pack-head">
      ${embedded ? '' : '<a class="pack-back" href="./" data-t="back">← Documentation</a>'}
      <p class="comp-category" data-t="category">Pack</p>
      <h1 data-t="title">Pack</h1>
      <p class="pack-intro" data-t="intro"></p>
    </header>
    <p class="pack-status" id="pack-status" role="status" data-t="loading"></p>
    <div class="pack-layout k3-toc-layout" id="pack-layout" hidden>
      <form class="pack-list k3-toc-layout__content" id="pack-list" density="compact" aria-labelledby="pack-list-title">
        <h2 id="pack-list-title" class="pack-visually-hidden" data-t="components">Components</h2>
      </form>
      <div class="pack-side k3-toc-layout__toc">
        <aside class="pack-summary pack-summary--full" id="pack-summary-full" aria-labelledby="pack-full-title">
          <p class="pack-summary-kicker">AiO</p>
          <h2 id="pack-full-title" data-t="fullTitle"></h2>
          <p class="pack-summary-blurb" data-t="fullBlurb"></p>
          <p class="pack-summary-lock" id="pack-aio-lock" hidden data-t="aioLocked"></p>
          <dl class="pack-totals" id="pack-full-totals"></dl>
          <div class="pack-actions">
            <k3-button id="pack-download-full" variant="filled" data-t="downloadFull"></k3-button>
          </div>
        </aside>
        <aside class="pack-summary pack-summary--custom" id="pack-summary-custom" aria-labelledby="pack-custom-title">
          <p class="pack-summary-kicker">Custom</p>
          <h2 id="pack-custom-title" data-t="customTitle"></h2>
          <p class="pack-summary-blurb" data-t="customBlurb"></p>
          <p class="pack-summary-lock" id="pack-custom-lock" hidden data-t="customLocked"></p>
          <dl class="pack-totals" id="pack-custom-totals"></dl>
          <div class="pack-actions">
            <k3-button id="pack-download" variant="tonal" data-t="download"></k3-button>
            <k3-button id="pack-reset" variant="outlined" data-t="reset"></k3-button>
            <k3-button id="pack-copy-link" variant="text" data-t="copyLink"></k3-button>
            <k3-button id="pack-copy-cli" variant="text" data-t="copyCli"></k3-button>
          </div>
          <p class="pack-feedback" id="pack-feedback" role="status" aria-live="polite"></p>
        </aside>
      </div>
    </div>
    <section class="pack-usage" id="pack-usage" hidden>
      <h2 data-t="usage"></h2>
      <p data-t="usageText"></p>
      <pre class="pack-code"><code id="pack-snippet"></code></pre>
      <h3 data-t="guardTitle"></h3>
      <p data-t="guardText"></p>
    </section>
  `;
}

/** Mount the builder into `root`. Returns a disposer. */
export async function mountPackBuilder(
  root: HTMLElement,
  options: MountPackOptions,
): Promise<() => void> {
  const embedded = options.embedded === true;
  const unified = options.unified ?? embedded;
  const legacyProduct: PackProduct = options.product ?? 'k3ui';
  const locale: PackLocale =
    options.locale ??
    ((new URLSearchParams(location.search).get('lang') ?? navigator.language).startsWith('fr')
      ? 'fr'
      : 'en');
  const T = textFor(locale, unified);
  const short = (tag: string): string => tag.replace(/^k3-/, '');
  const $ = <E extends HTMLElement>(id: string): E => root.querySelector(`#${id}`) as E;

  renderShell(root, embedded);
  root.dataset.packProduct = unified ? 'unified' : legacyProduct;
  for (const node of root.querySelectorAll<HTMLElement>('[data-t]')) {
    if (node.dataset.t === 'category') {
      node.textContent = 'Pack';
      continue;
    }
    const key = node.dataset.t as keyof typeof T;
    const value = T[key];
    if (typeof value === 'string') node.textContent = value;
  }

  let uiManifest: Manifest;
  let uxManifest: Manifest | null = null;
  let explicit = new Set<string>();
  const rows = new Map<
    string,
    { row: HTMLElement; box: Checkbox; note: HTMLElement; product: PackProduct }
  >();
  const ac = new AbortController();
  const { signal } = ac;

  const say = (message: string): void => {
    $('pack-feedback').textContent = message;
  };

  const uiLazy = new URL('./k3ui-lazy/', location.href).href;
  const uxLazy = new URL('./k3ux-lazy/', location.href).href;
  const publicBuilder = formatPackHref([], 'unified', 'https://k3ui-expressive.vercel.app');

  const snippet = (): string => {
    if (!unified) {
      return [
        '<!-- CSS is injected by the pack (k3ui.css) -->',
        '<script type="module" src="k3ui.custom.js"></script>',
        '',
        '<!-- or, with a bundler -->',
        "import { init } from './k3ui.custom.js';",
        "await init({ theme: { seed: '#3F51B5', variant: 'tonalspot' } });",
      ].join('\n');
    }
    return [
      '<!-- K3ui pack — CSS injected -->',
      '<script type="module" src="k3ui.custom.js"></script>',
      '<!-- Optional K3ux companion (peer: k3ui) — CSS injected -->',
      '<script type="module" src="k3ux.custom.js"></script>',
      '',
      "import { init } from './k3ui.custom.js';",
      "await init({ theme: { seed: '#3F51B5', variant: 'tonalspot' } });",
      "import { init as initUx } from './k3ux.custom.js';",
      'await initUx();',
    ].join('\n');
  };

  const syncUrl = (tags: readonly string[]): void => {
    const href = formatPackHref(tags, 'unified');
    const next = href.startsWith('http')
      ? new URL(href).pathname + new URL(href).search + new URL(href).hash
      : href;
    if (`${location.pathname}${location.search}${location.hash}` !== next) {
      history.replaceState(null, '', next);
    }
  };

  const shareHref = (tags: readonly string[]): string =>
    formatPackHref(tags, 'unified', location.origin);

  function buildRow(
    tag: string,
    label: string,
    size: number,
    product: PackProduct,
  ): HTMLLIElement {
    const row = el('li', 'pack-row');
    const box = document.createElement('k3-checkbox') as Checkbox;
    box.dataset.tag = tag;
    box.dataset.product = product;
    const name = el('span', 'pack-tag', label);
    const note = el('span', 'pack-note');
    box.append(name, note);
    row.append(box, el('span', 'pack-size', formatKb(size, locale)));
    rows.set(tag, { row, box, note, product });
    return row;
  }

  function appendGroups(form: HTMLElement, manifest: Manifest, product: PackProduct): void {
    const groups = [...new Set(Object.values(manifest.components).map((c) => c.group))].sort(
      (a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99),
    );
    for (const group of groups) {
      const tags = Object.keys(manifest.components).filter(
        (t) => manifest.components[t]!.group === group,
      );
      const fieldset = el('fieldset', 'pack-group');
      if (product === 'k3ux') fieldset.dataset.packProduct = 'k3ux';
      const head = el('div', 'pack-group-head');
      const title = el('h3', '', T.group[group] ?? group);
      const tools = el('div');
      for (const [label, on] of [
        [T.all, true],
        [T.none, false],
      ] as const) {
        const btn = document.createElement('k3-button');
        btn.setAttribute('variant', 'text');
        btn.textContent = label;
        btn.setAttribute('aria-label', `${T.group[group] ?? group} — ${label}`);
        btn.addEventListener(
          'click',
          () => {
            for (const tag of tags) on ? explicit.add(tag) : explicit.delete(tag);
            update();
          },
          { signal },
        );
        tools.append(btn);
      }
      head.append(title, tools);
      const list = el('ul', 'pack-rows');
      for (const tag of tags) list.append(buildRow(tag, tag, ownSize(manifest, tag), product));
      fieldset.append(head, list);
      form.append(fieldset);
    }
  }

  function buildList(): void {
    const form = $('pack-list');
    const core = el('fieldset', 'pack-group');
    const coreHead = el('div', 'pack-group-head');
    coreHead.append(el('h3', '', T.core));
    const coreRows = el('ul', 'pack-rows');
    const coreRow = buildRow('core', T.coreName, uiManifest.base.gzip, 'k3ui');
    const coreEntry = rows.get('core')!;
    rows.delete('core');
    coreEntry.box.checked = true;
    coreEntry.box.disabled = true;
    coreEntry.note.textContent = T.coreNote;
    coreRow.dataset.included = '';
    coreRows.append(coreRow);
    core.append(coreHead, coreRows);
    form.append(core);

    appendGroups(form, uiManifest, 'k3ui');

    if (unified && uxManifest) {
      const divider = el('div', 'pack-ux-divider');
      divider.append(el('h2', 'pack-ux-title', T.uxSection), el('p', 'pack-ux-blurb', T.uxBlurb));
      form.append(divider);
      appendGroups(form, uxManifest, 'k3ux');
    }

    form.addEventListener(
      'k3-change',
      (event) => {
        const box = event.target as Checkbox;
        const tag = box.dataset?.tag;
        if (!tag || tag === 'core') return;
        const inUi = tag in uiManifest.components;
        const inUx = !!uxManifest && tag in uxManifest.components;
        if (!inUi && !inUx) return;
        box.checked ? explicit.add(tag) : explicit.delete(tag);
        update();
      },
      { signal },
    );
  }

  function splitExplicit(): { ui: string[]; ux: string[] } {
    const ui: string[] = [];
    const ux: string[] = [];
    for (const tag of explicit) {
      if (tag in uiManifest.components) ui.push(tag);
      else if (uxManifest && tag in uxManifest.components) ux.push(tag);
    }
    return { ui, ux };
  }

  function update(): void {
    const { ui, ux } = splitExplicit();
    const uiSel = resolveSelection(uiManifest, ui);
    const uxSel = uxManifest ? resolveSelection(uxManifest, ux) : null;
    explicit = new Set([...uiSel.explicit, ...(uxSel?.explicit ?? [])]);

    const includedUi = new Set(uiSel.included);
    const includedUx = new Set(uxSel?.included ?? []);

    for (const [tag, { row, box, note, product }] of rows) {
      const manifest = product === 'k3ux' ? uxManifest! : uiManifest;
      const selection = product === 'k3ux' ? uxSel! : uiSel;
      const included = product === 'k3ux' ? includedUx : includedUi;
      const needs = selection.requiredBy.get(tag);
      box.checked = included.has(tag);
      box.disabled = !!needs;
      row.toggleAttribute('data-included', included.has(tag));
      row.toggleAttribute('data-locked', !!needs);
      const brings = manifest.components[tag]?.requires ?? [];
      note.textContent = needs
        ? fill(T.requiredBy, { list: needs.map(short).join(', ') })
        : brings.length
          ? fill(T.brings, { list: brings.map(short).join(', ') })
          : '';
    }

    const uiSizes = totals(uiManifest, uiSel.included);
    const uxSizes = uxManifest && uxSel ? totals(uxManifest, uxSel.included) : null;
    const add = (a: { raw: number; gzip: number }, b: { raw: number; gzip: number }) => ({
      raw: a.raw + b.raw,
      gzip: a.gzip + b.gzip,
    });
    const customTotal = uxSizes ? add(uiSizes.total, uxSizes.total) : uiSizes.total;
    const fullTotal = uxSizes ? add(uiSizes.everything, uxSizes.everything) : uiSizes.everything;
    const customCount = uiSel.included.length + (uxSel?.included.length ?? 0);
    const fullCount = uiSizes.everythingCount + (uxSizes?.everythingCount ?? 0);

    const fillSizeDl = (id: string, raw: number, gzip: number, count: number): void => {
      const dl = $(id);
      dl.replaceChildren();
      for (const [label, value] of [
        [T.labelRaw, formatKb(raw, locale)],
        [T.labelGzip, formatKb(gzip, locale)],
        [T.labelCount, String(count)],
      ] as const) {
        dl.append(el('dt', '', label), el('dd', '', value));
      }
    };
    fillSizeDl('pack-full-totals', fullTotal.raw, fullTotal.gzip, fullCount);
    fillSizeDl('pack-custom-totals', customTotal.raw, customTotal.gzip, customCount);

    syncUrl([...explicit]);
    const none = customCount === 0;
    const hasCustom = !none;

    const aioCard = $('pack-summary-full');
    const aioLock = $('pack-aio-lock');
    const aioBtn = $('pack-download-full') as HTMLElement & { disabled: boolean };
    aioCard.toggleAttribute('data-disabled', hasCustom);
    aioCard.setAttribute('aria-disabled', hasCustom ? 'true' : 'false');
    aioLock.hidden = !hasCustom;
    aioBtn.disabled = hasCustom;

    const customCard = $('pack-summary-custom');
    const customLock = $('pack-custom-lock');
    customCard.toggleAttribute('data-disabled', none);
    customCard.setAttribute('aria-disabled', none ? 'true' : 'false');
    customLock.hidden = !none;
    ($('pack-download') as HTMLElement & { disabled: boolean }).disabled = none;
    ($('pack-reset') as HTMLElement & { disabled: boolean }).disabled = none;
    ($('pack-copy-link') as HTMLElement & { disabled: boolean }).disabled = none;
    ($('pack-copy-cli') as HTMLElement & { disabled: boolean }).disabled = none;

    if (none) {
      if ($('pack-feedback').dataset.kind !== 'reset') say('');
      $('pack-feedback').dataset.kind = 'empty';
    } else if ($('pack-feedback').dataset.kind === 'empty') {
      say('');
      $('pack-feedback').dataset.kind = '';
    }
  }

  async function copy(text: string, done: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      say(done);
    } catch {
      say(text);
    }
  }

  function setBusy(busy: boolean): void {
    const none = [...explicit].length === 0;
    const hasCustom = !none;
    ($('pack-download-full') as HTMLElement & { disabled: boolean }).disabled =
      busy || hasCustom;
    ($('pack-download') as HTMLElement & { disabled: boolean }).disabled = busy || none;
    ($('pack-reset') as HTMLElement & { disabled: boolean }).disabled = busy || none;
    ($('pack-copy-cli') as HTMLElement & { disabled: boolean }).disabled = busy || none;
  }

  async function buildOne(
    product: PackProduct,
    manifest: Manifest,
    included: readonly string[],
    kind: 'full' | 'custom',
  ): Promise<{ n: number; sizeLabel: string }> {
    const { buildPack, gzipSize } = await import('./bundle.js');
    const stem = product === 'k3ux' ? 'k3ux' : 'k3ui';
    const lazyUrl = product === 'k3ux' ? uxLazy : uiLazy;
    const localBuilder = formatPackHref([], 'unified', location.origin);
    const code = await buildPack({
      manifest,
      included,
      baseUrl: lazyUrl,
      cssUrl: new URL('./k3ui-pack/k3ui.css', location.href).href,
      extraCssUrls:
        product === 'k3ux' ? [new URL('./k3ux-pack/k3ux.css', location.href).href] : undefined,
      product,
      name: kind === 'full' ? `${stem}.full` : `${stem}.custom`,
      builder: /^(localhost|127\.|\[::1\])/.test(location.host) ? publicBuilder : localBuilder,
    });
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'full' ? `${stem}.full.js` : `${stem}.custom.js`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    const gz = await gzipSize(code);
    return {
      n: included.length,
      sizeLabel: gz ? `${formatKb(gz, locale)} gzip` : formatKb(code.length, locale),
    };
  }

  async function download(kind: 'full' | 'custom'): Promise<void> {
    if (kind === 'full' && explicit.size > 0) {
      say(T.aioLocked);
      return;
    }
    const { ui, ux } = splitExplicit();
    const uiIncluded =
      kind === 'full'
        ? Object.keys(uiManifest.components)
        : resolveSelection(uiManifest, ui).included;
    const uxIncluded =
      kind === 'full'
        ? uxManifest
          ? Object.keys(uxManifest.components)
          : []
        : uxManifest
          ? resolveSelection(uxManifest, ux).included
          : [];

    if (!uiIncluded.length && !uxIncluded.length) return say(T.empty);
    setBusy(true);
    say(T.building);
    try {
      let nUi = 0;
      let nUx = 0;
      let lastSize = '';
      if (uiIncluded.length) {
        const r = await buildOne('k3ui', uiManifest, uiIncluded, kind);
        nUi = r.n;
        lastSize = r.sizeLabel;
      }
      if (uxManifest && uxIncluded.length) {
        /* Brief gap so both downloads are not cancelled by the browser. */
        await new Promise((r) => setTimeout(r, 400));
        const r = await buildOne('k3ux', uxManifest, uxIncluded, kind);
        nUx = r.n;
        lastSize = r.sizeLabel;
      }
      if (nUi && nUx) say(fill(T.builtBoth, { nUi, nUx }));
      else say(fill(T.built, { n: nUi || nUx, size: lastSize }));
    } catch (err) {
      say(fill(T.buildError, { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  }

  function resetSelection(): void {
    explicit = new Set();
    update();
    $('pack-feedback').dataset.kind = 'reset';
    say(T.resetDone);
  }

  const status = $('pack-status');
  try {
    const uiRes = await fetch(`${uiLazy}components.json`, { signal });
    const uiData: unknown = uiRes.ok ? await uiRes.json() : null;
    if (!isManifest(uiData)) throw new Error('manifest');
    uiManifest = uiData;

    if (unified && k3uxSibling) {
      try {
        const uxRes = await fetch(`${uxLazy}components.json`, { signal });
        const uxData: unknown = uxRes.ok ? await uxRes.json() : null;
        if (isManifest(uxData)) uxManifest = uxData;
      } catch {
        /* k3ux optional at runtime */
      }
    } else if (!unified && legacyProduct === 'k3ux') {
      const uxRes = await fetch(`${uxLazy}components.json`, { signal });
      const uxData: unknown = uxRes.ok ? await uxRes.json() : null;
      if (!isManifest(uxData)) throw new Error('manifest');
      /* Single-product k3ux: swap so list uses ux as “ui” slot. */
      uiManifest = uxData;
      uxManifest = null;
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return () => ac.abort();
    status.textContent = T.loadError;
    status.dataset.error = '';
    return () => {
      ac.abort();
      root.replaceChildren();
    };
  }

  explicit = new Set(
    unified
      ? parseLocationSelectionDual(uiManifest, uxManifest)
      : parseLocationSelection(uiManifest),
  );
  buildList();
  $('pack-snippet').textContent = snippet();
  status.hidden = true;
  $('pack-layout').hidden = false;
  $('pack-usage').hidden = false;
  await customElements.whenDefined('k3-checkbox').catch(() => undefined);
  update();

  $('pack-download-full').addEventListener('click', () => void download('full'), { signal });
  $('pack-download').addEventListener('click', () => void download('custom'), { signal });
  $('pack-reset').addEventListener('click', () => resetSelection(), { signal });
  $('pack-copy-link').addEventListener(
    'click',
    () => void copy(shareHref([...explicit]), T.linkCopied),
    { signal },
  );
  $('pack-copy-cli').addEventListener(
    'click',
    () => {
      const { ui, ux } = splitExplicit();
      const lines = [
        ui.length ? cliCommand(ui, 'k3ui') : '',
        ux.length ? cliCommand(ux, 'k3ux') : '',
      ].filter(Boolean);
      void copy(lines.join('\n') || cliCommand([], 'k3ui'), T.cliCopied);
    },
    { signal },
  );

  return () => {
    ac.abort();
    root.replaceChildren();
  };
}
