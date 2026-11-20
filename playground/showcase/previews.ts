import { ms } from './ms.js';

export type ShowcasePreview = {
  /** Live demo markup (k3-* preferred). */
  html: string;
  /** Extra class on `.gallery-demo` (layout helpers). */
  demoClass?: string;
  /** Span 2 columns when the gallery is wide enough. */
  wide?: boolean;
};

const iconBtn = (label: string, icon: string, variant = 'tonal'): string =>
  `<k3-icon-button label="${label}" variant="${variant}" size="sm">${ms(icon)}</k3-icon-button>`;

/** Live previews keyed by catalog page id — K3ui (and personal) components. */
export const SHOWCASE_PREVIEWS: Record<string, ShowcasePreview> = {
  /* —— Buttons —— */
  buttons: {
    html: `<k3-button variant="filled">Hello, K3ui</k3-button>`,
  },
  'buttons-group': {
    demoClass: 'gallery-demo--stack',
    html: `<k3-button-group>
      ${iconBtn('Previous', 'arrow_back')}
      ${iconBtn('Next', 'arrow_forward')}
      ${iconBtn('Add', 'add', 'filled')}
    </k3-button-group>
    <k3-button-group variant="connected" selection="multiple">
      ${iconBtn('Bold', 'format_bold')}
      ${iconBtn('Italic', 'format_italic')}
      ${iconBtn('Underline', 'format_underlined')}
    </k3-button-group>`,
  },
  'buttons-icon': {
    html: `<k3-icon-button label="Favorite" variant="tonal">${ms('favorite')}</k3-icon-button>`,
  },
  'buttons-split': {
    html: `<k3-split-button size="sm" variant="filled">
      Edit
      <k3-menu-item slot="menu" value="rename">Rename</k3-menu-item>
      <k3-menu-item slot="menu" value="duplicate">Duplicate</k3-menu-item>
    </k3-split-button>`,
  },
  'buttons-segmented': {
    html: `<k3-button-segmented segments='[{"label":"Day"},{"label":"Week"},{"label":"Month"}]'></k3-button-segmented>`,
  },
  'buttons-pill': {
    html: `<k3-button-pill variant="tonal">${ms('bolt', 'icon')} Boost</k3-button-pill>`,
  },
  'buttons-menu': {
    html: `<k3-button-menu variant="tonal" label="Open menu">
      <k3-menu-item value="1">First option</k3-menu-item>
      <k3-menu-item value="2">Second option</k3-menu-item>
    </k3-button-menu>`,
  },
  'buttons-smart': {
    html: `<k3-button-smart label="Smart action" active-subtitle="On" inactive-subtitle="Off">
      ${ms('light_off', 'icon', 'gallery-smart-icon gallery-smart-icon--off')}
      ${ms('lightbulb', 'icon', 'gallery-smart-icon gallery-smart-icon--on')}
    </k3-button-smart>`,
  },
  'buttons-pad': {
    html: `<k3-button-pad>
      <k3-button>1</k3-button><k3-button>2</k3-button><k3-button>3</k3-button>
    </k3-button-pad>`,
  },
  'buttons-grid': {
    html: `<k3-button-grid>
      <k3-button variant="tonal">${ms('home')}</k3-button>
      <k3-button variant="tonal">${ms('search')}</k3-button>
      <k3-button variant="tonal">${ms('person')}</k3-button>
    </k3-button-grid>`,
  },

  /* —— Actions —— */
  fab: {
    html: `<k3-fab size="default" variant="primary" aria-label="Add">${ms('add', 'icon')}</k3-fab>`,
  },
  'fab-extended': {
    html: `<k3-extended-fab size="medium">${ms('edit', 'icon')} Compose</k3-extended-fab>`,
  },
  'fab-menu': {
    /*
     * bottom-end = FAB docked low → menu prefers ABOVE when there is room
     * (M3: top-* opens below; bottom-* opens above).
     * Stage carries data-k3-fab-menu-clip so flip uses the card, not the panel.
     */
    demoClass: 'gallery-demo--fab-menu',
    html: `<div class="gallery-fab-menu-clip" data-k3-fab-menu-clip>
      <k3-fab-menu size="default" variant="primary" placement="bottom-end">
        ${ms('edit', 'icon')}
        <k3-fab-menu-item icon="mail">Email</k3-fab-menu-item>
        <k3-fab-menu-item icon="chat">Message</k3-fab-menu-item>
      </k3-fab-menu>
    </div>`,
  },
  'fab-dial': {
    demoClass: 'gallery-demo--fab-stage',
    html: `<k3-fab-dial position="bottom-right" layout="flower" fab-icon="add">
      <k3-fab-dial-item item-id="camera" label="Camera" icon="camera"></k3-fab-dial-item>
      <k3-fab-dial-item item-id="image" label="Gallery" icon="image"></k3-fab-dial-item>
      <k3-fab-dial-item item-id="list" label="List" icon="list"></k3-fab-dial-item>
    </k3-fab-dial>`,
  },
  'fab-rail': {
    demoClass: 'gallery-demo--fab-stage',
    html: `<k3-fab-rail position="bottom-right" direction="left" fab-icon="add">
      <k3-fab-rail-item item-id="camera" label="Camera" icon="camera"></k3-fab-rail-item>
      <k3-fab-rail-item item-id="image" label="Gallery" icon="image"></k3-fab-rail-item>
      <k3-fab-rail-item item-id="list" label="List" icon="list"></k3-fab-rail-item>
    </k3-fab-rail>`,
  },
  ripple: {
    html: `<k3-button variant="tonal" class="gallery-ripple-host">Ripple</k3-button>`,
  },
  'shape-chip': {
    html: `<k3-shape-chip shape="SoftBurst">${ms('star', 'icon', '', true)}Special</k3-shape-chip>`,
  },

  /* —— Inputs —— */
  'text-field': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-text-field label="Your name" variant="outlined"></k3-text-field>`,
  },
  textarea: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-textarea label="Notes" variant="outlined" rows="2"></k3-textarea>`,
  },
  select: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-select label="Favorite fruit">
      <k3-menu-item value="apple">Apple</k3-menu-item>
      <k3-menu-item value="orange">Orange</k3-menu-item>
      <k3-menu-item value="banana">Banana</k3-menu-item>
    </k3-select>`,
  },
  checkbox: {
    html: `<k3-checkbox checked>Keep me updated</k3-checkbox>`,
  },
  radio: {
    html: `<k3-radio name="gallery-view" value="list" checked>List</k3-radio>
      <k3-radio name="gallery-view" value="grid">Grid</k3-radio>`,
  },
  switch: {
    html: `<k3-switch checked>Notifications</k3-switch>`,
  },
  chip: {
    html: `<k3-chip selected>Design</k3-chip><k3-chip>Code</k3-chip>`,
  },
  slider: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-slider value="40" min="0" max="100" labeled></k3-slider>`,
  },
  autocomplete: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-autocomplete
      label="Fruit"
      supporting-text="Type to filter"
      options='[{"value":"ananas","label":"ANANAS"},{"value":"banane","label":"BANANE"},{"value":"cassis","label":"CASSIS"}]'
    ></k3-autocomplete>`,
  },
  counter: {
    html: `<k3-counter value="3" min="0" max="9"></k3-counter>`,
  },
  'pin-field': {
    html: `<k3-pin-field length="4" label="PIN"></k3-pin-field>`,
  },
  'field-group': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-field-group label="Name">
      <k3-text-field label="First"></k3-text-field>
      <k3-text-field label="Last"></k3-text-field>
    </k3-field-group>`,
  },
  'date-picker': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-text-field id="gallery-date" variant="outlined" label="Date" supporting-text="yyyy-MM-dd" clearable>
      <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Open date picker">
        ${ms('calendar_today')}
        <k3-date-picker-toggle for="gallery-dp"></k3-date-picker-toggle>
      </k3-icon-button>
    </k3-text-field>
    <k3-date-picker id="gallery-dp" for="gallery-date" variant="docked"></k3-date-picker>`,
  },
  'time-picker': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-text-field id="gallery-time" variant="outlined" label="Time" supporting-text="HH:MM" clearable>
      <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Open time picker">
        ${ms('schedule')}
        <k3-time-picker-toggle for="gallery-tp"></k3-time-picker-toggle>
      </k3-icon-button>
    </k3-text-field>
    <k3-time-picker id="gallery-tp" for="gallery-time" variant="docked" mode="dial" format="auto"></k3-time-picker>`,
  },
  'mood-calendar': {
    html: `<k3-button variant="tonal">${ms('sentiment_satisfied', 'icon')} Mood</k3-button>`,
  },

  /* —— Feedback —— */
  badge: {
    html: `<k3-badge value="3">${iconBtn('Inbox', 'mail', 'tonal')}</k3-badge>
      <k3-badge value="NEW">${iconBtn('Notifications', 'notifications', 'tonal')}</k3-badge>`,
  },
  progress: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-progress variant="linear" value="0.45"></k3-progress>`,
  },
  loading: {
    html: `<k3-loading-indicator></k3-loading-indicator>
      <k3-loading-indicator contained></k3-loading-indicator>`,
  },
  skeleton: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-skeleton style="width:100%;height:1rem"></k3-skeleton>
      <k3-skeleton style="width:70%;height:1rem"></k3-skeleton>`,
  },
  snackbar: {
    html: `<k3-button variant="filled" data-gallery-snack>Show message</k3-button>
      <k3-snackbar id="gallery-snack" duration="short" dismissible>Hello from K3ui!</k3-snackbar>`,
  },
  tooltip: {
    html: `<k3-tooltip content="Helpful information" position="top">
      <k3-icon-button label="Help" variant="tonal">${ms('info')}</k3-icon-button>
    </k3-tooltip>`,
  },
  dialog: {
    html: `<k3-button variant="tonal" data-gallery-dialog>Open dialog</k3-button>
      <k3-dialog id="gallery-dialog">
        <span slot="headline">Hello there</span>
        <p>This is a live dialog preview.</p>
        <k3-button slot="actions" variant="filled" data-gallery-dialog-close>Close</k3-button>
      </k3-dialog>`,
  },
  alert: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-alert severity="info">Good to know — a helpful message.</k3-alert>`,
  },
  banner: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-banner position="static" variant="primary">Make it yours — adjust settings.</k3-banner>`,
  },
  kbd: {
    html: `<k3-kbd keys="Ctrl K"></k3-kbd>`,
  },
  lazy: {
    html: `<k3-lazy><span class="gallery-lazy-label">Lazy content</span></k3-lazy>`,
  },

  /* —— Containment —— */
  avatar: {
    html: `<k3-avatar initials="AB"></k3-avatar>
      <k3-avatar
        name="Ada Lovelace"
        src="https://api.dicebear.com/9.x/avataaars/svg?seed=Ada"
      ></k3-avatar>`,
  },
  card: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-card variant="outlined" media-layout="bleed">
      <div slot="media" class="gallery-card-banner" aria-hidden="true"></div>
      <strong slot="headline">A little note</strong>
      <span slot="supporting">A place for your content.</span>
    </k3-card>`,
  },
  list: {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-list variant="standard" label="Gallery list">
      <k3-list-item leading="icon">
        ${ms('folder', 'leading')}
        <span slot="headline">Projects</span>
      </k3-list-item>
      <k3-list-item leading="icon">
        ${ms('lightbulb', 'leading')}
        <span slot="headline">Notes</span>
      </k3-list-item>
    </k3-list>`,
  },
  menu: {
    html: `<k3-menu>
      <k3-button slot="trigger" variant="tonal">Open menu</k3-button>
      <k3-menu-item>First option</k3-menu-item>
      <k3-menu-item>Second option</k3-menu-item>
    </k3-menu>`,
  },
  'expansion-panel': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-expansion-panel>
      <span slot="header">More details</span>
      <span slot="supporting">There is more to explore.</span>
      <p>Expanded content for the gallery preview.</p>
    </k3-expansion-panel>`,
  },
  tree: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-tree selection="single" label="Files">
      <k3-tree-item label="Projects" value="projects" expanded>
        <k3-tree-item label="Design" value="design"></k3-tree-item>
        <k3-tree-item label="Development" value="dev"></k3-tree-item>
      </k3-tree-item>
      <k3-tree-item label="README.md" value="readme"></k3-tree-item>
    </k3-tree>`,
  },
  carousel: {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-carousel layout="multi-browse" label="Gallery" style="--k3-carousel-height:7rem">
      <k3-carousel-item label="Coast"><span slot="label">Coast</span></k3-carousel-item>
      <k3-carousel-item label="Forest"><span slot="label">Forest</span></k3-carousel-item>
      <k3-carousel-item label="Lake"><span slot="label">Lake</span></k3-carousel-item>
    </k3-carousel>`,
  },
  table: {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<div class="gallery-table-demo">Name · Role<br/>Ada · Engineer</div>`,
  },
  sheet: {
    html: `<k3-button variant="tonal" data-gallery-sheet>${ms('bottom_sheets', 'icon')} Open sheet</k3-button>
      <k3-sheet id="gallery-sheet">
        <span slot="headline">Sheet</span>
        <p>A live bottom sheet preview.</p>
        <k3-button slot="actions" variant="filled" data-gallery-sheet-close>Done</k3-button>
      </k3-sheet>`,
  },
  bubble: {
    html: `<k3-bubble>A chat bubble</k3-bubble>`,
  },
  quote: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-quote>Made to be expressive.</k3-quote>`,
  },
  codeblock: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-codeblock language="js"><code>import 'k3ui';</code></k3-codeblock>`,
  },
  coverflow: {
    html: `${ms('view_carousel')} Coverflow`,
  },
  'command-palette': {
    html: `<k3-button variant="tonal">${ms('search', 'icon')} Command palette</k3-button>`,
  },

  /* —— Navigation —— */
  'app-bar': {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-top-app-bar size="small">
      <span slot="headline">My app</span>
      ${iconBtn('Search', 'search', 'standard')}
    </k3-top-app-bar>`,
  },
  tabs: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-tabs labels="Photos,Video"></k3-tabs>`,
  },
  breadcrumb: {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-breadcrumb
      show-icons
      items='[{"text":"Home","href":"#/","icon":"home"},{"text":"Components","href":"#/buttons"},{"text":"Breadcrumb","current":true}]'
    ></k3-breadcrumb>`,
  },
  'navigation-bar': {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-nav-bar>
      <k3-nav-item icon="home" label="Home" active></k3-nav-item>
      <k3-nav-item icon="search" label="Search"></k3-nav-item>
    </k3-nav-bar>`,
  },
  'navigation-rail': {
    demoClass: 'gallery-demo--rail',
    html: `<k3-nav-rail size="compact">
      <k3-nav-item icon="home" label="Home" active></k3-nav-item>
      <k3-nav-item icon="favorite" label="Favorites"></k3-nav-item>
    </k3-nav-rail>`,
  },
  stepper: {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-stepper>
      <k3-step>Start here.</k3-step>
      <k3-step>Next</k3-step>
      <k3-step>All set!</k3-step>
    </k3-stepper>`,
  },
  toc: {
    demoClass: 'gallery-demo--fill',
    html: `<k3-toc label="On this page">
      <a href="#gallery-title">Overview</a>
      <a href="#home-stats">Stats</a>
    </k3-toc>`,
  },
  pagination: {
    html: `<k3-pagination page="2" count="5"></k3-pagination>`,
  },
  'pagination-alpha': {
    html: `<k3-pagination-alpha active-letter="K"></k3-pagination-alpha>`,
  },
  toolbar: {
    html: `<k3-toolbar>
      ${iconBtn('Bold', 'format_bold')}
      ${iconBtn('Italic', 'format_italic')}
      ${iconBtn('Underline', 'format_underlined')}
    </k3-toolbar>`,
  },
  'index-list': {
    html: `${ms('sort_by_alpha')} Index list`,
  },
  'prev-next': {
    demoClass: 'gallery-demo--fill',
    wide: true,
    html: `<k3-doc-nav
      previous-href="#/"
      previous-title="Home"
      next-href="#/buttons"
      next-title="Buttons"
    ></k3-doc-nav>`,
  },
  'scroll-to-top': {
    demoClass: 'gallery-demo--scroll-top',
    html: `<k3-scroll-to-top show-progress data-visible threshold="-1"></k3-scroll-to-top>`,
  },
  'footer-bar': {
    demoClass: 'gallery-demo--fill',
    html: `<k3-footer-bar>Footer bar</k3-footer-bar>`,
  },

  /* —— Utilities —— */
  gestures: {
    html: `<button type="button" class="gallery-tap" data-gallery-tap>Tap me</button>
      <span class="gallery-tap-result" data-gallery-tap-result>Taps: 0</span>`,
  },
  scrollbar: {
    demoClass: 'gallery-demo--fill',
    html: `<div class="gallery-scroll-demo k3-scroll" style="max-height:6rem">
      <p>Scrollable preview with edge scrollbar.</p>
      <p>More content below the fold.</p>
      <p>Keep scrolling…</p>
    </div>`,
  },
  keyboard: {
    html: `<k3-kbd keys="A"></k3-kbd> <k3-kbd keys="S"></k3-kbd> <k3-kbd keys="D"></k3-kbd>`,
  },
  'keyboard-media': {
    html: `${ms('keyboard')} Media keys`,
  },
  mouse: {
    html: `${ms('mouse')} Mouse`,
  },
  dnd: {
    html: `${ms('drag_indicator')} Drag & drop`,
  },

  /* —— Styles (token previews) —— */
  'color-roles': {
    demoClass: 'gallery-demo--swatches',
    html: `<span class="gallery-swatch gallery-swatch--primary"></span>
      <span class="gallery-swatch gallery-swatch--secondary"></span>
      <span class="gallery-swatch gallery-swatch--tertiary"></span>`,
  },
  'color-palettes': {
    demoClass: 'gallery-demo--swatches',
    html: `<span class="gallery-swatch gallery-swatch--primary"></span>
      <span class="gallery-swatch gallery-swatch--primary-container"></span>`,
  },
  'color-extras': {
    demoClass: 'gallery-demo--swatches',
    html: `<span class="gallery-swatch gallery-swatch--error"></span>
      <span class="gallery-swatch gallery-swatch--outline"></span>`,
  },
  elevation: {
    html: `<div class="gallery-elev k3-elevation-2">Level 2</div>`,
  },
  shapes: {
    html: `<span class="gallery-shape" data-k3-shape="SoftBurst"></span>`,
  },
  spacing: {
    html: `<div class="gallery-space-demo"><span></span><span></span><span></span></div>`,
  },
  typography: {
    html: `<span class="k3-title-medium">Title medium</span>`,
  },
  motion: {
    html: `${ms('animation')} Motion`,
  },
  grid: {
    html: `${ms('grid_view')} Layout grid`,
  },
};

/** Fallback when a catalog id has no dedicated live preview. */
export function fallbackPreview(icon = 'widgets'): ShowcasePreview {
  return {
    html: `<span class="gallery-fallback">${ms(icon)}</span>`,
  };
}
