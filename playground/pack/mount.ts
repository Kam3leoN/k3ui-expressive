/**
 * Pack builder UI — mounts inside the docs shell (`#/pack`) or a standalone root.
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
  resolveSelection,
  totals,
  type Manifest,
  type PackProduct,
} from './model.js';

export type PackLocale = 'fr' | 'en';

const k3uxSibling = import.meta.env.VITE_K3UX_SIBLING === '1';

export interface MountPackOptions {
  product: PackProduct;
  /** Inside the docs shell — no back link; URL is `?components=#/pack`. */
  embedded?: boolean;
  locale?: PackLocale;
  /** Second K3ui / K3ux switch above the summary (shell only). */
  onProductChange?: (product: PackProduct) => void;
}

type Checkbox = HTMLElement & { checked: boolean; disabled: boolean };

function textFor(product: PackProduct, locale: PackLocale) {
  const fr = locale === 'fr';
  const brand = product === 'k3ux' ? 'K3ux' : 'K3ui';
  return {
    back: fr ? '← Documentation' : '← Documentation',
    title: product === 'k3ux' ? (fr ? 'Pack K3ux sur mesure' : 'Custom K3ux pack') : fr ? 'Pack K3ui sur mesure' : 'Custom K3ui pack',
    intro:
      product === 'k3ux'
        ? fr
          ? 'Téléchargez le pack complet en un clic, ou cochez seulement les composants K3ux utiles : un seul fichier companion (K3ui reste un peer). Les dépendances sont ajoutées automatiquement.'
          : 'Download the full pack in one click, or tick only the K3ux components you need: one companion file (k3ui stays a peer). Dependencies are added for you.'
        : fr
          ? 'Téléchargez le pack complet en un clic, ou cochez seulement les composants utiles : un seul fichier avec le socle et votre sélection. Les dépendances sont ajoutées automatiquement.'
          : 'Download the full pack in one click, or tick only the components you need: one file with the core and your selection. Dependencies are added for you.',
    loading: fr ? 'Chargement du catalogue…' : 'Loading the catalog…',
    loadError:
      product === 'k3ux'
        ? fr
          ? 'Catalogue K3ux introuvable. En local, lancez « npm run build:lazy » dans k3ux puis rechargez.'
          : 'K3ux catalog not found. Locally, run “npm run build:lazy” in k3ux and reload.'
        : fr
          ? 'Catalogue introuvable. En local, lancez « npm run build:lazy » puis rechargez la page.'
          : 'Catalog not found. Locally, run “npm run build:lazy” and reload the page.',
    components: fr ? 'Composants' : 'Components',
    fullTitle: fr ? 'Pack complet · AiO' : 'Full pack · AiO',
    fullBlurb: fr
      ? 'Tous les composants, sans choix — prêt à brancher.'
      : 'Every component, no picking — ready to drop in.',
    customTitle: fr ? 'Pack sur mesure' : 'Custom pack',
    customBlurb: fr
      ? 'Cochez à gauche : le total suit votre sélection.'
      : 'Tick on the left — the total follows your selection.',
    labelRaw: fr ? 'Non compressé' : 'Uncompressed',
    labelGzip: 'Gzip',
    labelCount: fr ? 'Composants' : 'Components',
    downloadFull: fr ? `Télécharger ${brand} AiO` : `Download ${brand} AiO`,
    download: fr ? `Télécharger ${brand} Custom` : `Download ${brand} Custom`,
    reset: fr ? 'Réinitialiser la sélection' : 'Reset selection',
    copyLink: fr ? 'Copier le lien' : 'Copy link',
    copyCli: fr ? 'Copier la commande CLI' : 'Copy CLI command',
    resetDone: fr ? 'Sélection effacée.' : 'Selection cleared.',
    usage: fr ? 'Utilisation' : 'Usage',
    usageText:
      product === 'k3ux'
        ? fr
          ? 'Le pack remplace k3ux.js + les CSS (k3ui.css et k3ux.css minifiés injectés au chargement). Il faut encore k3ui.js en peer. Il enregistre tout ce qu’il contient au démarrage.'
          : 'The pack replaces k3ux.js and the stylesheets (minified k3ui.css + k3ux.css injected on load). You still need k3ui.js as a peer. It registers everything it holds at start-up.'
        : fr
          ? 'Le pack remplace k3ui.js et embarque k3ui.css (minifié, injecté au chargement) — pas besoin d’un <link> séparé. Il enregistre tout ce qu’il contient au démarrage.'
          : 'The pack replaces k3ui.js and embeds k3ui.css (minified, injected on load) — no separate <link> needed. It registers everything it holds at start-up.',
    guardTitle: fr ? 'Un composant manque ?' : 'A component is missing?',
    guardText:
      product === 'k3ux'
        ? fr
          ? 'Si une page utilise un composant K3ux absent du pack, la console le signale avec le lien qui rouvre cette page — votre sélection et le composant manquant déjà cochés.'
          : 'When a page uses a K3ux component the pack was built without, the console reports it with the link that reopens this page — your selection and the missing component already ticked.'
        : fr
          ? 'Si une page utilise un composant K3UI absent du pack, K3UI le signale : un bandeau en développement (localhost), une erreur dans la console en production, avec le lien qui rouvre cette page — votre sélection et le composant manquant déjà cochés.'
          : 'When a page uses a K3UI component the pack was built without, K3UI says so: a banner in development (localhost), a console error in production, with the link that reopens this page — your selection and the missing component already ticked.',
    core: fr ? 'Socle' : 'Core',
    coreName: product === 'k3ux' ? 'K3ux Core' : 'K3UI Core',
    coreNote:
      product === 'k3ux'
        ? fr
          ? 'indispensable — init, registre (peer : k3ui)'
          : 'required — init, registry (peer: k3ui)'
        : fr
          ? 'indispensable — init, thème, registre, i18n, utilitaires'
          : 'required — init, theme, registry, i18n, helpers',
    all: fr ? 'Tout' : 'All',
    none: fr ? 'Aucun' : 'None',
    requiredBy: fr ? 'requis par {list}' : 'required by {list}',
    brings: fr ? 'ajoute {list}' : 'adds {list}',
    empty: fr ? 'Cochez au moins un composant.' : 'Tick at least one component.',
    customEmpty: fr ? 'Aucun composant coché' : 'No component selected',
    building: fr ? 'Assemblage du pack…' : 'Building the pack…',
    built: fr ? 'Pack prêt : {n} composants, {size}.' : 'Pack ready: {n} components, {size}.',
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

function renderShell(root: HTMLElement, embedded: boolean, product: PackProduct): void {
  root.classList.add('pack');
  const switchHtml = embedded
    ? `
      <div class="pack-product-switch">
        <k3-button-group
          id="pack-product-switch"
          variant="connected"
          shape="round"
          selection="single"
          size="lg"
          sync
          required
          label="K3ui / K3ux"
        >
          <k3-button variant="tonal" value="k3ui" data-product-switch="k3ui"${product === 'k3ui' ? ' selected' : ''}>K3ui</k3-button>
          ${
            k3uxSibling
              ? `<k3-button variant="tonal" value="k3ux" data-product-switch="k3ux"${product === 'k3ux' ? ' selected' : ''}>K3ux</k3-button>`
              : ''
          }
        </k3-button-group>
      </div>`
    : '';
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
        ${switchHtml}
        <aside class="pack-summary pack-summary--full" aria-labelledby="pack-full-title">
          <p class="pack-summary-kicker">AiO</p>
          <h2 id="pack-full-title" data-t="fullTitle"></h2>
          <p class="pack-summary-blurb" data-t="fullBlurb"></p>
          <dl class="pack-totals" id="pack-full-totals"></dl>
          <div class="pack-actions">
            <k3-button id="pack-download-full" variant="filled" data-t="downloadFull"></k3-button>
          </div>
        </aside>
        <aside class="pack-summary pack-summary--custom" aria-labelledby="pack-custom-title">
          <p class="pack-summary-kicker">Custom</p>
          <h2 id="pack-custom-title" data-t="customTitle"></h2>
          <p class="pack-summary-blurb" data-t="customBlurb"></p>
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
  const product = options.product;
  const embedded = options.embedded === true;
  const onProductChange = options.onProductChange;
  const locale: PackLocale =
    options.locale ??
    ((new URLSearchParams(location.search).get('lang') ?? navigator.language).startsWith('fr')
      ? 'fr'
      : 'en');
  const stem = product === 'k3ux' ? 'k3ux' : 'k3ui';
  const fullFile = `${stem}.full.js`;
  const customFile = `${stem}.custom.js`;
  const lazyUrl = new URL(product === 'k3ux' ? './k3ux-lazy/' : './k3ui-lazy/', location.href).href;
  const publicBuilder = formatPackHref([], product, 'https://k3ui-expressive.vercel.app');
  const T = textFor(product, locale);
  const short = (tag: string): string => tag.replace(/^k3-/, '');
  const $ = <E extends HTMLElement>(id: string): E => root.querySelector(`#${id}`) as E;

  renderShell(root, embedded, product);
  root.dataset.packProduct = product;
  for (const node of root.querySelectorAll<HTMLElement>('[data-t]')) {
    const key = node.dataset.t as keyof typeof T;
    if (key === 'category') {
      node.textContent = 'Pack';
      continue;
    }
    const value = T[key];
    if (typeof value === 'string') node.textContent = value;
  }

  let manifest: Manifest;
  let explicit = new Set<string>();
  const rows = new Map<string, { row: HTMLElement; box: Checkbox; note: HTMLElement }>();
  const ac = new AbortController();
  const { signal } = ac;

  const say = (message: string): void => {
    $('pack-feedback').textContent = message;
  };

  const snippet = (): string => {
    if (product === 'k3ux') {
      return [
        '<!-- CSS is injected by the pack (k3ui.css + k3ux.css) -->',
        '<script type="module" src="k3ui.js"></script>',
        `<script type="module" src="${customFile}"></script>`,
        '',
        '<!-- or, with a bundler -->',
        "import 'k3ui';",
        `import { init } from './${customFile}';`,
        'await init();',
      ].join('\n');
    }
    return [
      '<!-- CSS is injected by the pack (k3ui.css) -->',
      `<script type="module" src="${customFile}"></script>`,
      '',
      '<!-- or, with a bundler -->',
      `import { init } from './${customFile}';`,
      "await init({ theme: { seed: '#3F51B5', variant: 'tonalspot' } });",
    ].join('\n');
  };

  const syncUrl = (tags: readonly string[]): void => {
    const href = formatPackHref(tags, product);
    const next = href.startsWith('http') ? new URL(href).pathname + new URL(href).search + new URL(href).hash : href;
    if (`${location.pathname}${location.search}${location.hash}` !== next) {
      history.replaceState(null, '', next);
    }
  };

  const shareHref = (tags: readonly string[]): string =>
    formatPackHref(tags, product, location.origin);

  function buildRow(tag: string, label: string, size: number): HTMLLIElement {
    const row = el('li', 'pack-row');
    const box = document.createElement('k3-checkbox') as Checkbox;
    box.dataset.tag = tag;
    const name = el('span', 'pack-tag', label);
    const note = el('span', 'pack-note');
    box.append(name, note);
    row.append(box, el('span', 'pack-size', formatKb(size, locale)));
    rows.set(tag, { row, box, note });
    return row;
  }

  function buildList(): void {
    const form = $('pack-list');
    const core = el('fieldset', 'pack-group');
    const coreHead = el('div', 'pack-group-head');
    coreHead.append(el('h3', '', T.core));
    const coreRows = el('ul', 'pack-rows');
    const coreRow = buildRow('core', T.coreName, manifest.base.gzip);
    const coreEntry = rows.get('core')!;
    rows.delete('core');
    coreEntry.box.checked = true;
    coreEntry.box.disabled = true;
    coreEntry.note.textContent = T.coreNote;
    coreRow.dataset.included = '';
    coreRows.append(coreRow);
    core.append(coreHead, coreRows);
    form.append(core);

    const groups = [...new Set(Object.values(manifest.components).map((c) => c.group))].sort(
      (a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99),
    );
    for (const group of groups) {
      const tags = Object.keys(manifest.components).filter((t) => manifest.components[t]!.group === group);
      const fieldset = el('fieldset', 'pack-group');
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
      for (const tag of tags) list.append(buildRow(tag, tag, ownSize(manifest, tag)));
      fieldset.append(head, list);
      form.append(fieldset);
    }

    form.addEventListener(
      'k3-change',
      (event) => {
        const box = event.target as Checkbox;
        const tag = box.dataset?.tag;
        if (!tag || !(tag in manifest.components)) return;
        box.checked ? explicit.add(tag) : explicit.delete(tag);
        update();
      },
      { signal },
    );
  }

  function update(): void {
    const selection = resolveSelection(manifest, explicit);
    explicit = new Set(selection.explicit);
    const included = new Set(selection.included);

    for (const [tag, { row, box, note }] of rows) {
      const needs = selection.requiredBy.get(tag);
      box.checked = included.has(tag);
      box.disabled = !!needs;
      row.toggleAttribute('data-included', included.has(tag));
      row.toggleAttribute('data-locked', !!needs);
      const brings = manifest.components[tag]!.requires;
      note.textContent = needs
        ? fill(T.requiredBy, { list: needs.map(short).join(', ') })
        : brings.length
          ? fill(T.brings, { list: brings.map(short).join(', ') })
          : '';
    }

    const sizes = totals(manifest, selection.included);
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
    fillSizeDl(
      'pack-full-totals',
      sizes.everything.raw,
      sizes.everything.gzip,
      sizes.everythingCount,
    );
    fillSizeDl('pack-custom-totals', sizes.total.raw, sizes.total.gzip, sizes.count);

    syncUrl(selection.explicit);
    const none = selection.included.length === 0;
    ($('pack-download') as HTMLElement & { disabled: boolean }).disabled = none;
    ($('pack-reset') as HTMLElement & { disabled: boolean }).disabled = none;
    ($('pack-copy-cli') as HTMLElement & { disabled: boolean }).disabled = none;
    if (none) {
      if ($('pack-feedback').dataset.kind !== 'reset') say(T.customEmpty);
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
    const none = resolveSelection(manifest, explicit).included.length === 0;
    ($('pack-download-full') as HTMLElement & { disabled: boolean }).disabled = busy;
    ($('pack-download') as HTMLElement & { disabled: boolean }).disabled = busy || none;
    ($('pack-reset') as HTMLElement & { disabled: boolean }).disabled = busy || none;
    ($('pack-copy-cli') as HTMLElement & { disabled: boolean }).disabled = busy || none;
  }

  async function download(
    tags: readonly string[] | undefined,
    kind: 'full' | 'custom',
  ): Promise<void> {
    const selection = resolveSelection(manifest, tags ?? explicit);
    if (!selection.included.length) return say(T.empty);
    setBusy(true);
    say(T.building);
    const fileName = kind === 'full' ? fullFile : customFile;
    try {
      const { buildPack, gzipSize } = await import('./bundle.js');
      const localBuilder = formatPackHref([], product, location.origin);
      const code = await buildPack({
        manifest,
        included: selection.included,
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
      a.download = fileName;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      const gz = await gzipSize(code);
      say(
        fill(T.built, {
          n: selection.included.length,
          size: gz ? `${formatKb(gz, locale)} gzip` : formatKb(code.length, locale),
        }),
      );
    } catch (err) {
      say(fill(T.buildError, { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  }

  /** AiO — build every tag without touching the custom checklist / URL. */
  async function downloadFull(): Promise<void> {
    await download(Object.keys(manifest.components), 'full');
  }

  function resetSelection(): void {
    explicit = new Set();
    update();
    $('pack-feedback').dataset.kind = 'reset';
    say(T.resetDone);
  }

  const status = $('pack-status');
  try {
    const res = await fetch(`${lazyUrl}components.json`, { signal });
    const data: unknown = res.ok ? await res.json() : null;
    if (!isManifest(data)) throw new Error('manifest');
    manifest = data;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return () => ac.abort();
    status.textContent = T.loadError;
    status.dataset.error = '';
    return () => {
      ac.abort();
      root.replaceChildren();
    };
  }

  explicit = new Set(parseLocationSelection(manifest));
  buildList();
  $('pack-snippet').textContent = snippet();
  status.hidden = true;
  $('pack-layout').hidden = false;
  $('pack-usage').hidden = false;
  await customElements.whenDefined('k3-checkbox').catch(() => undefined);
  update();

  $('pack-download-full').addEventListener('click', () => void downloadFull(), { signal });
  $('pack-download').addEventListener('click', () => void download(undefined, 'custom'), {
    signal,
  });
  $('pack-reset').addEventListener('click', () => resetSelection(), { signal });
  $('pack-copy-link').addEventListener(
    'click',
    () => void copy(shareHref(resolveSelection(manifest, explicit).explicit), T.linkCopied),
    { signal },
  );
  $('pack-copy-cli').addEventListener(
    'click',
    () =>
      void copy(cliCommand(resolveSelection(manifest, explicit).explicit, product), T.cliCopied),
    { signal },
  );

  const packSwitch = root.querySelector('#pack-product-switch');
  if (packSwitch && onProductChange) {
    const apply = (next: string | undefined): void => {
      if (next !== 'k3ui' && next !== 'k3ux') return;
      if (next === 'k3ux' && !k3uxSibling) return;
      if (next === product) return;
      onProductChange(next);
    };
    packSwitch.addEventListener(
      'k3-change',
      ((e: CustomEvent<{ values?: string[] }>) => apply(e.detail?.values?.[0])) as EventListener,
      { signal },
    );
    packSwitch.querySelectorAll<HTMLElement>('[data-product-switch]').forEach((btn) => {
      btn.addEventListener('click', () => apply(btn.dataset.productSwitch), { signal });
    });
  }

  return () => {
    ac.abort();
    root.replaceChildren();
  };
}
