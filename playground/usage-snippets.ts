/**
 * Copy-paste Usage snippets per doc page (HTML / CSS / JS).
 * Mounted before Specs when the page has no `.doc-usage` yet.
 */

export type UsageSnippet = {
  /** CE tag(s) for K3UI.init components list */
  components: string[];
  html: string;
  css?: string;
  jsExtra?: string;
};

const MS = (name: string) =>
  `<span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="${name}" aria-hidden="true"></span>`;

const defaultCss = `/* Optional — k3ui.css already ships .ms + [data-k3-icon]::before */
.ms {
  font-family: "Material Symbols Rounded", "Material Symbols Outlined", sans-serif;
  font-feature-settings: "liga";
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  line-height: 1;
  speak: never;
}
.ms[data-k3-icon]::before {
  content: attr(data-k3-icon);
  font-feature-settings: "liga";
}`;

function jsInit(components: string[], extra = ''): string {
  const list = components.map((c) => `"${c}"`).join(', ');
  return `import { K3UI } from "k3ui";
import "k3ui/k3ui.css";

await K3UI.init({
  locale: "en",
  theme: { seed: "#6750A4", mode: "auto", motion: "expressive" },
  components: [${list}],
});
${extra}`.trim();
}

/** Page id → snippet (component pages only). */
export const USAGE_BY_PAGE: Record<string, UsageSnippet> = {
  buttons: {
    components: ['k3-button'],
    html: `<k3-button variant="filled">${MS('favorite')}Filled</k3-button>
<k3-button variant="tonal" shape="square">Square</k3-button>
<k3-button variant="outlined">${MS('add')}Outlined</k3-button>`,
    css: defaultCss,
  },
  'buttons-icon': {
    components: ['k3-icon-button'],
    html: `<k3-icon-button label="Favorite" variant="filled">
  ${MS('favorite')}
</k3-icon-button>
<k3-icon-button toggle label="Mute" variant="tonal">
  ${MS('volume_up')}
  <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="volume_off" slot="selected-icon" aria-hidden="true"></span>
</k3-icon-button>`,
    css: defaultCss,
    jsExtra: `
const fav = document.querySelector("k3-icon-button[toggle]");
fav?.addEventListener("k3-change", (e) => {
  console.log("selected", e.detail.selected);
});`,
  },
  'buttons-group': {
    components: ['k3-button-group', 'k3-button'],
    html: `<k3-button-group selection="single" size="sm" label="Time">
  <k3-button variant="tonal" value="am" selected>Morning</k3-button>
  <k3-button variant="tonal" value="pm">Evening</k3-button>
</k3-button-group>`,
  },
  'buttons-split': {
    components: ['k3-split-button', 'k3-menu-item'],
    html: `<k3-split-button size="sm" variant="filled">
  ${MS('edit')}
  Label
  <k3-menu-item slot="menu">Schedule</k3-menu-item>
  <k3-menu-item slot="menu">Save draft</k3-menu-item>
</k3-split-button>`,
    css: defaultCss,
  },
  'buttons-card': {
    components: ['k3-button-card'],
    html: `<k3-button-card
  label="Alpha"
  subtitle="@handle"
  icon="share"
  href="#"
></k3-button-card>`,
    css: `${defaultCss}

k3-button-card {
  --k3-button-card-icon-bg: var(--k3-sys-color-primary-container);
  --k3-button-card-icon-fg: var(--k3-sys-color-on-primary-container);
  /* Hover fills the card with brand */
  --k3-button-card-brand: var(--k3-sys-color-primary);
}`,
  },
  'buttons-arrow': {
    components: ['k3-button-arrow'],
    html: `<k3-button-arrow
  direction="horizontal"
  variant="filled"
  list="Alpha,Beta,Gamma"
  index="0"
></k3-button-arrow>
<p>Value: <span id="arrow-val">Alpha</span></p>`,
    css: defaultCss,
    jsExtra: `
const arrow = document.querySelector("k3-button-arrow");
const label = document.getElementById("arrow-val");
arrow?.addEventListener("k3-change", (e) => {
  if (label) label.textContent = e.detail.value;
});`,
  },
  'buttons-grid': {
    components: ['k3-button-grid'],
    html: `<k3-button-grid variant="filled" trigger-fab></k3-button-grid>
<k3-button-grid variant="tonal" trigger-fab="false"></k3-button-grid>`,
    css: defaultCss,
  },
  'buttons-pad': {
    components: ['k3-button-pad'],
    html: `<k3-button-pad mode="diagonal" variant="filled"></k3-button-pad>
<k3-button-pad mode="cardinal" variant="tonal"></k3-button-pad>`,
    css: defaultCss,
    jsExtra: `
document.querySelector("k3-button-pad")?.addEventListener("k3-navigate", (e) => {
  console.log("direction", e.detail.direction);
});`,
  },
  'buttons-smart': {
    components: ['k3-button-smart'],
    html: `<div class="btn-smart-grid">
  <k3-button-smart label="Do Not Disturb">
    ${MS('do_not_disturb_on')}
  </k3-button-smart>
  <k3-button-smart label="Flashlight">
    ${MS('flashlight_on')}
  </k3-button-smart>
  <k3-button-smart label="Airplane mode" active>
    ${MS('airplanemode_active')}
  </k3-button-smart>
</div>`,
    css: `${defaultCss}

.btn-smart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px; /* AOSP qs_tile_margin_horizontal — snapped at runtime by k3-button-smart */
}
.btn-smart-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}`,
  },
  'buttons-menu': {
    components: ['k3-button-menu', 'k3-menu-item'],
    html: `<k3-button-menu label="Options" variant="tonal" size="sm">
  <k3-menu-item>Edit</k3-menu-item>
  <k3-menu-item>Duplicate</k3-menu-item>
  <k3-menu-item>Delete</k3-menu-item>
</k3-button-menu>`,
  },
  'buttons-pill': {
    components: ['k3-button-pill'],
    html: `<k3-button-pill icon="home" label="Home" selected></k3-button-pill>
<k3-button-pill icon="explore" label="Explore"></k3-button-pill>
<k3-button-pill layout="horizontal" icon="bookmark" label="Saved"></k3-button-pill>
<k3-button-pill layout="horizontal" stretch icon="home" label="Home" selected></k3-button-pill>`,
  },
  fab: {
    components: ['k3-fab'],
    html: `<k3-fab size="default" variant="primary">${MS('add')}</k3-fab>
<k3-fab size="large" variant="secondary">${MS('edit')}</k3-fab>`,
    css: defaultCss,
  },
  'fab-extended': {
    components: ['k3-extended-fab'],
    html: `<k3-extended-fab variant="primary" size="medium">
  ${MS('edit')}Compose
</k3-extended-fab>`,
    css: defaultCss,
  },
  'fab-menu': {
    components: ['k3-fab-menu', 'k3-fab', 'k3-menu-item'],
    html: `<k3-fab-menu size="default" variant="primary" placement="bottom-end">
  <k3-menu-item>Copy</k3-menu-item>
  <k3-menu-item>Cut</k3-menu-item>
  <k3-menu-item>Paste</k3-menu-item>
</k3-fab-menu>`,
  },
  'fab-dial': {
    components: ['k3-fab-dial', 'k3-fab-dial-item'],
    html: `<k3-fab-dial position="bottom-right" layout="flower" fab-icon="add">
  <k3-fab-dial-item item-id="camera" label="Camera" icon="camera"></k3-fab-dial-item>
  <k3-fab-dial-item item-id="image" label="Gallery" icon="image"></k3-fab-dial-item>
  <k3-fab-dial-item item-id="list" label="List" icon="list"></k3-fab-dial-item>
</k3-fab-dial>`,
    css: defaultCss,
  },
  'fab-rail': {
    components: ['k3-fab-rail', 'k3-fab-rail-item'],
    html: `<k3-fab-rail position="bottom-right" direction="up" fab-icon="add">
  <k3-fab-rail-item item-id="camera" label="Camera" icon="camera"></k3-fab-rail-item>
  <k3-fab-rail-item item-id="image" label="Gallery" icon="image"></k3-fab-rail-item>
  <k3-fab-rail-item item-id="list" label="List" icon="list"></k3-fab-rail-item>
</k3-fab-rail>`,
    css: defaultCss,
  },
  ripple: {
    components: ['k3-ripple'],
    html: `<button type="button" style="position:relative; overflow:hidden">
  <k3-ripple></k3-ripple>
  Press me
</button>`,
  },
  'shape-chip': {
    components: ['k3-shape-chip'],
    html: `<k3-shape-chip shape="Cookie7Sided" style="--k3-shape-chip-color:#e91e63">
  Special
</k3-shape-chip>
<k3-shape-chip shape="Cookie7Sided" style="--k3-shape-chip-color:#7c4dff">
  <span class="ms notranslate" slot="icon" translate="no" lang="zxx" data-k3-icon="favorite" aria-hidden="true"></span>
  Favorite
</k3-shape-chip>
<k3-shape-chip placement="trailing" style="--k3-shape-chip-color:#26a69a">
  <span class="ms notranslate" slot="icon" translate="no" lang="zxx" data-k3-icon="bookmark" aria-hidden="true"></span>
  Bookmark
</k3-shape-chip>`,
  },
  'text-field': {
    components: ['k3-text-field'],
    html: `<k3-text-field
  variant="outlined"
  label="Email"
  placeholder="name@domain.com"
  type="email"
></k3-text-field>`,
  },
  textarea: {
    components: ['k3-textarea'],
    html: `<k3-textarea variant="outlined" label="Bio" rows="3"></k3-textarea>`,
  },
  'field-group': {
    components: ['k3-field-group', 'k3-text-field'],
    html: `<k3-field-group label="Account">
  <k3-text-field label="Email" type="email"></k3-text-field>
  <k3-text-field label="Password" type="password"></k3-text-field>
</k3-field-group>`,
  },
  'pin-field': {
    components: ['k3-pin-field'],
    html: `<k3-pin-field length="4" label="Code"></k3-pin-field>`,
  },
  select: {
    components: ['k3-select', 'k3-menu-item'],
    html: `<k3-select label="Fruit">
  <k3-menu-item value="apple">Apple</k3-menu-item>
  <k3-menu-item value="pear">Pear</k3-menu-item>
</k3-select>`,
  },
  checkbox: {
    components: ['k3-checkbox'],
    html: `<k3-checkbox checked>Updates</k3-checkbox>
<k3-checkbox indeterminate>Partial</k3-checkbox>`,
  },
  radio: {
    components: ['k3-radio'],
    html: `<k3-radio name="plan" value="free" checked>Free</k3-radio>
<k3-radio name="plan" value="pro">Pro</k3-radio>`,
  },
  switch: {
    components: ['k3-switch'],
    html: `<k3-switch>Bluetooth</k3-switch>
<k3-switch selected>Wi‑Fi</k3-switch>`,
  },
  chip: {
    components: ['k3-chip', 'k3-chip-set'],
    html: `<k3-chip-set selection="multi" label="Topics">
  <k3-chip variant="filter" value="design" selected>Design</k3-chip>
  <k3-chip variant="filter" value="code">Code</k3-chip>
</k3-chip-set>`,
    css: defaultCss,
  },
  counter: {
    components: ['k3-counter'],
    html: `<k3-counter value="3" min="0" max="10" size="md"></k3-counter>
<k3-counter value="20" min="0" max="100" step="10"></k3-counter>
<k3-counter value="0" min="-20" max="20" allow-negative></k3-counter>
<k3-counter value="3" disabled></k3-counter>`,
  },
  signature: {
    components: ['k3-signature'],
    html: `<k3-signature></k3-signature>
<k3-signature pen-color="#6750a4" initials="JD"></k3-signature>
<k3-signature disabled></k3-signature>`,
  },
  rating: {
    components: ['k3-rating'],
    html: `<!-- Default · 5 stars -->
<k3-rating value="3" label="Score"></k3-rating>

<!-- Half steps · size -->
<k3-rating value="3.5" step="0.5" size="lg" label="Review"></k3-rating>

<!-- Theme color roles -->
<k3-rating value="4" color="secondary"></k3-rating>
<k3-rating value="2" color="error"></k3-rating>

<!-- Custom colors -->
<k3-rating value="5" active-color="#f59e0b" inactive-color="#e5e7eb"></k3-rating>

<!-- Readonly · disabled -->
<k3-rating value="4" readonly></k3-rating>
<k3-rating value="2" disabled></k3-rating>

<!-- Custom icons (Material Symbol or SVG slot) -->
<k3-rating value="3" icon="favorite" color="error"></k3-rating>
<k3-rating value="4" max="5">
  <span slot="unchecked" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="star" aria-hidden="true"></span>
  <span slot="checked" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="star" aria-hidden="true"></span>
</k3-rating>`,
  },
  slider: {
    components: ['k3-slider', 'k3-icon-button'],
    html: `<!-- Standard · XS -->
<k3-slider value="40" min="0" max="100" label="Volume"></k3-slider>

<!-- Stops (discrete) · value indicator -->
<k3-slider value="50" step="10" stops value-indicator label="Alarm"></k3-slider>

<!-- Centered (−50…50) -->
<k3-slider variant="centered" min="-50" max="50" value="-25" label="Brightness"></k3-slider>

<!-- Range -->
<k3-slider variant="range" value-start="20" value-end="70" label="Price"></k3-slider>

<!-- MD + inset icon · optional icon-min at value=min (any pair: volume, mic, wifi, …) -->
<k3-slider size="md" value="60" inset-icon label="Media" color="secondary">
  <span slot="icon" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="volume_up" aria-hidden="true"></span>
  <span slot="icon-min" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="volume_off" aria-hidden="true"></span>
</k3-slider>
<!-- Same pattern for mic → mic_off, wifi → wifi_off, videocam → videocam_off, … -->

<!-- Stops + tick labels · linked field -->
<input id="vol" type="number" />
<k3-slider for="vol" value="50" step="25" stops stop-labels="0,25,50,75,100" label="Level"></k3-slider>

<!-- Label (4dp above track) · ± addons -->
<k3-slider value="40" label="Volume">
  <k3-icon-button slot="start" variant="standard" size="sm" label="Decrease">
    <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="remove" aria-hidden="true"></span>
  </k3-icon-button>
  <k3-icon-button slot="end" variant="standard" size="sm" label="Increase">
    <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="add" aria-hidden="true"></span>
  </k3-icon-button>
</k3-slider>

<!-- Vertical top→bottom -->
<k3-slider orientation="vertical" top-to-bottom value="30" label="Volume"></k3-slider>`,
    css: defaultCss,
  },
  'date-picker': {
    components: ['k3-date-picker', 'k3-date-picker-toggle', 'k3-text-field', 'k3-icon-button'],
    html: `<k3-text-field id="date" variant="outlined" label="Date" clearable>
  <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Open date picker">
    ${MS('calendar_today')}
    <k3-date-picker-toggle for="dp"></k3-date-picker-toggle>
  </k3-icon-button>
</k3-text-field>
<k3-date-picker id="dp" for="date" variant="docked"></k3-date-picker>

<!-- Short range — 2 months + multiline Du/Au field (both dates visible) -->
<k3-text-field id="range" variant="outlined" label="Date range" multiline rows="2" clearable style="min-width:16rem">
  <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Open">
    ${MS('calendar_today')}
    <k3-date-picker-toggle for="dpr2"></k3-date-picker-toggle>
  </k3-icon-button>
</k3-text-field>
<k3-date-picker id="dpr2" range months="2" for="range" variant="modal"></k3-date-picker>

<!-- Long range — 1 month + dual fields, edge per icon -->
<k3-text-field id="start" variant="outlined" label="Start date" clearable>
  <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Start">
    ${MS('calendar_today')}
    <k3-date-picker-toggle for="dprl" edge="start"></k3-date-picker-toggle>
  </k3-icon-button>
</k3-text-field>
<k3-text-field id="end" variant="outlined" label="End date" clearable>
  <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="End">
    ${MS('calendar_today')}
    <k3-date-picker-toggle for="dprl" edge="end"></k3-date-picker-toggle>
  </k3-icon-button>
</k3-text-field>
<k3-date-picker id="dprl" range months="1" for-start="start" for-end="end" variant="modal"></k3-date-picker>`,
    css: defaultCss,
  },
  'mood-calendar': {
    components: ['k3-mood-calendar'],
    html: `<k3-mood-calendar demo></k3-mood-calendar>`,
    jsExtra: `const cal = document.querySelector("k3-mood-calendar");
cal.entries = [
  { date: "2026-10-22", mood: "excellent", icon: "music_note",
    title: "October 22, 2026", body: "Shipped a small fix that felt huge." },
];
cal.addEventListener("k3-change", (e) => console.log(e.detail));`,
  },
  'time-picker': {
    components: ['k3-time-picker', 'k3-time-picker-toggle', 'k3-text-field', 'k3-icon-button'],
    html: `<k3-text-field id="time" variant="outlined" label="Time" clearable>
  <k3-icon-button slot="trailing-icon" variant="tonal" width="default" label="Open time picker">
    ${MS('schedule')}
    <k3-time-picker-toggle for="tp"></k3-time-picker-toggle>
  </k3-icon-button>
</k3-text-field>
<k3-time-picker id="tp" for="time" variant="docked" mode="dial" format="auto"></k3-time-picker>
<!-- Modal + keyboard input -->
<k3-time-picker id="tp-kb" for="time" variant="modal" mode="input" format="12"></k3-time-picker>`,
    css: defaultCss,
  },
  progress: {
    components: ['k3-progress'],
    html: `<!-- Linear default: Label ==== value% -->
<k3-progress value="0.65" label="Downloading" show-percent layout="default"
  supporting-text="About 2 minutes left"></k3-progress>

<!-- Shapes: flat · wavy · oscillation (PCM) -->
<k3-progress shape="flat" value="0.65" show-percent></k3-progress>
<k3-progress shape="wavy" value="0.65" show-percent></k3-progress>
<k3-progress shape="oscillation" src="/sounds/hello.mp3" value="0.42" show-percent
  ></k3-progress>

<!-- Linear top / bottom -->
<k3-progress value="0.65" label="Uploading" show-percent layout="top"></k3-progress>
<k3-progress value="0.65" label="Syncing" show-percent layout="bottom"></k3-progress>

<!-- Circular: label top · value inside or below -->
<k3-progress variant="circular" value="0.65" label="Battery" show-percent
  percent-position="inside"></k3-progress>
<k3-progress variant="circular" value="0.65" label="Sync" show-percent
  percent-position="below" supporting-text="Almost done"></k3-progress>

<k3-progress indeterminate></k3-progress>`,
  },
  loading: {
    components: ['k3-loading'],
    html: `<k3-loading size="medium"></k3-loading>`,
  },
  skeleton: {
    components: ['k3-skeleton'],
    html: `<k3-skeleton variant="text"></k3-skeleton>
<k3-skeleton variant="circular"></k3-skeleton>`,
  },
  snackbar: {
    components: ['k3-snackbar'],
    html: `<!-- Host once, then show via API -->
<k3-snackbar id="toast" duration="2000" dismissible></k3-snackbar>`,
    jsExtra: `
await window.K3UI.snackbar.show({ message: "Saved", duration: 2000 });`,
  },
  alert: {
    components: ['k3-alert', 'k3-button'],
    html: `<!-- Default · secondary -->
<k3-alert label="Secondary">
  Supplemental information stays in the body.
</k3-alert>

<!-- Semantic tones -->
<k3-alert variant="success" label="Success">Saved successfully.</k3-alert>
<k3-alert variant="warning" label="Warning">Check your connection.</k3-alert>
<k3-alert variant="error" label="Error">Something went wrong.</k3-alert>
<k3-alert variant="info" label="Info">New features are available.</k3-alert>

<!-- Shape · dismissible · action -->
<k3-alert variant="primary" shape="square" dismissible label="Update">
  A new version is ready.
  <k3-button slot="action" variant="text" size="sm">Undo</k3-button>
</k3-alert>

<!-- Custom icon -->
<k3-alert variant="tertiary" label="Tip">
  <span slot="icon" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="bolt" aria-hidden="true"></span>
  Keyboard shortcuts speed up your workflow.
</k3-alert>`,
  },
  dialog: {
    components: ['k3-dialog', 'k3-button'],
    html: `<k3-dialog id="dlg" headline="Confirm">
  <p>Delete this item?</p>
  <k3-button slot="actions" variant="text">Cancel</k3-button>
  <k3-button slot="actions" variant="filled">Delete</k3-button>
</k3-dialog>`,
    jsExtra: `
document.getElementById("dlg")?.show?.();`,
  },
  tooltip: {
    components: ['k3-tooltip'],
    html: `<k3-tooltip plain="Helpful tip">
  <button type="button">Hover me</button>
</k3-tooltip>`,
  },
  badge: {
    components: ['k3-badge'],
    html: `<k3-badge value="3">${MS('notifications')}</k3-badge>`,
    css: defaultCss,
  },
  avatar: {
    components: ['k3-avatar'],
    html: `<k3-avatar label="Ada Lovelace"></k3-avatar>
<k3-avatar src="/avatar.jpg" label="Photo"></k3-avatar>`,
  },
  card: {
    components: ['k3-card', 'k3-card-set', 'k3-button', 'k3-chip', 'k3-avatar', 'k3-icon-button'],
    html: `<k3-card variant="filled">
  <k3-avatar slot="avatar" name="Daniel Maas" size="sm"></k3-avatar>
  <span slot="headline">Clay pot fair on Saturday?</span>
  <span slot="subhead">Daniel Maas · Yesterday</span>
  <k3-icon-button slot="header-actions" variant="standard" size="sm" label="More">
    <span class="ms" data-k3-icon="more_vert"></span>
  </k3-icon-button>
</k3-card>

<k3-card-set layout="grid" sortable dismissible label="Cards">
  <k3-card variant="outlined" interactive media-layout="inset">
    <img slot="media" alt="" width="640" height="360" src="…" />
    <span slot="headline">Nimbus Financial</span>
  </k3-card>
</k3-card-set>`,
  },
  list: {
    components: ['k3-list', 'k3-list-item', 'k3-checkbox', 'k3-radio'],
    html: `<!-- Segmented · single-select -->
<k3-list variant="segmented" selection="single" label="Folders">
  <k3-list-item value="inbox" leading="icon">
    <span slot="leading" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="inbox"></span>
    <span slot="headline">Inbox</span>
    <span slot="trailing" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="chevron_right"></span>
  </k3-list-item>
  <k3-list-item value="sent" leading="icon" selected>
    <span slot="leading" class="ms notranslate" translate="no" lang="zxx" data-k3-icon="send"></span>
    <span slot="headline">Sent</span>
  </k3-list-item>
</k3-list>

<!-- Multi-select · hide indicator -->
<k3-list selection="multiple" hide-selection-indicator>
  <k3-list-item value="a"><span slot="headline">Alpha</span></k3-list-item>
  <k3-list-item value="b" selected><span slot="headline">Beta</span></k3-list-item>
</k3-list>

<!-- M3E expand — standard (continuous) or segmented + exclusive -->
<k3-list variant="standard">
  <k3-list-item expandable>
    <span slot="headline">Section</span>
    <div slot="expand">Details in the same row surface</div>
  </k3-list-item>
</k3-list>

<k3-list variant="segmented" accordion>
  <k3-list-item expandable expanded>
    <span slot="headline">Open</span>
    <div slot="expand">Exclusive: one row open</div>
  </k3-list-item>
  <k3-list-item expandable>
    <span slot="headline">Closed</span>
    <div slot="expand">…</div>
  </k3-list-item>
</k3-list>`,
  },
  table: {
    components: ['k3-table'],
    html: `<k3-table id="specs"></k3-table>`,
    jsExtra: `
// Prefer playground mountDocTables / createDocTable helpers for docs.`,
  },
  menu: {
    components: ['k3-menu', 'k3-menu-item', 'k3-button'],
    html: `<k3-menu>
  <k3-button slot="trigger" variant="tonal">Open</k3-button>
  <k3-menu-item>Edit</k3-menu-item>
  <k3-menu-item>Share</k3-menu-item>
</k3-menu>`,
  },
  sheet: {
    components: ['k3-sheet', 'k3-button'],
    html: `<k3-sheet id="sheet" headline="Sheet">
  Content
  <k3-button slot="actions" variant="filled">Done</k3-button>
</k3-sheet>`,
  },
  'app-bar': {
    components: ['k3-top-app-bar'],
    html: `<k3-top-app-bar headline="ScreenBox"></k3-top-app-bar>`,
  },
  'footer-bar': {
    components: ['k3-footer-bar', 'k3-button'],
    html: `<k3-footer-bar>
  <k3-button variant="filled">Continue</k3-button>
</k3-footer-bar>`,
  },
  tabs: {
    components: ['k3-tabs', 'k3-tab'],
    html: `<k3-tabs>
  <k3-tab selected>One</k3-tab>
  <k3-tab>Two</k3-tab>
  <k3-tab>Three</k3-tab>
</k3-tabs>`,
  },
  'navigation-bar': {
    components: ['k3-nav-bar', 'k3-nav-item'],
    html: `<k3-nav-bar>
  <k3-nav-item selected label="Home">${MS('home')}</k3-nav-item>
  <k3-nav-item label="Search">${MS('search')}</k3-nav-item>
</k3-nav-bar>`,
    css: defaultCss,
  },
  'navigation-rail': {
    components: ['k3-nav-rail', 'k3-nav-item'],
    html: `<k3-nav-rail>
  <k3-nav-item selected label="Home">${MS('home')}</k3-nav-item>
  <k3-nav-item label="Tune">${MS('tune')}</k3-nav-item>
</k3-nav-rail>`,
    css: defaultCss,
  },
  'prev-next': {
    components: ['k3-doc-nav'],
    html: `<k3-doc-nav
  prev-href="#buttons"
  prev-label="Buttons"
  next-href="#fab"
  next-label="FAB"
></k3-doc-nav>`,
  },
  toolbar: {
    components: [
      'k3-toolbar',
      'k3-button',
      'k3-button-group',
      'k3-fab',
      'k3-split-button',
      'k3-menu-item',
    ],
    html: `<!-- Meet-style · rounded + expand reactions (scaleY) + FAB 56 -->
<k3-toolbar variant="floating" shape="rounded" color="standard" label="Call controls">
  <div slot="expand" class="meet-emoji-bar" role="toolbar" aria-label="Reactions">
    <div class="meet-emoji-strip">…emojis…</div>
  </div>
  <k3-split-button size="md" variant="tonal" label="Microphone options">
    <span slot="icon" class="ms">mic</span>
    <k3-menu-item slot="menu">Mute</k3-menu-item>
  </k3-split-button>
  <k3-button-group variant="standard" selection="single" size="md" shape="round" sync label="Call actions">
    <k3-button variant="tonal" value="reactions" aria-label="Reactions"><span slot="icon" class="ms">mood</span></k3-button>
    <k3-button variant="tonal" value="captions" aria-label="Captions"><span slot="icon" class="ms">closed_caption</span></k3-button>
  </k3-button-group>
  <k3-fab slot="fab" size="default" variant="primary" class="toolbar-demo-hangup" aria-label="Leave call">
    <span slot="icon" class="ms">call_end</span>
  </k3-fab>
</k3-toolbar>
<!-- Toggle: click Reactions again to collapse (optional single, no required) -->`,
    css: `${defaultCss}

/* Hang-up FAB — error role · square default 56 */
.toolbar-demo-hangup {
  --k3-fab-bg: var(--k3-sys-color-error);
  --k3-fab-fg: var(--k3-sys-color-on-error);
}`,
  },
  autocomplete: {
    components: ['k3-autocomplete'],
    html: `<k3-autocomplete
  label="Country"
  options='[{"value":"fr","label":"France"},{"value":"de","label":"Germany"}]'
></k3-autocomplete>`,
  },
  'wheel-picker': {
    components: ['k3-wheel-picker'],
    html: `<k3-wheel-picker length="3" value="K3U" show-preview show-submit-button></k3-wheel-picker>`,
  },
  'buttons-segmented': {
    components: ['k3-button-segmented'],
    html: `<k3-button-segmented
  segments='[{"label":"Day"},{"label":"Week"},{"label":"Month"}]'
></k3-button-segmented>`,
  },
  bubble: {
    components: ['k3-bubble', 'k3-avatar'],
    html: `<k3-bubble placement="start" color="neutral">
  <k3-avatar slot="image" initials="AL"></k3-avatar>
  <span slot="header">Alex · <time datetime="12:45">12:45</time></span>
  Hello from K3ui
</k3-bubble>`,
  },
  quote: {
    components: ['k3-quote', 'k3-avatar', 'k3-button'],
    html: `<k3-quote author="Alex" role="Product designer" layout="author-start" tilt>
  <k3-avatar slot="avatar" initials="AL"></k3-avatar>
  K3ui tokens make themed testimonial cards effortless.
  <k3-button slot="action" variant="text" size="sm">
    Read more
    <span slot="trailing-icon" class="ms" data-k3-icon="arrow_forward" aria-hidden="true"></span>
  </k3-button>
</k3-quote>`,
  },
  codeblock: {
    components: ['k3-codeblock'],
    html: `<k3-codeblock label="Usage" language="html">
<pre><code>&lt;k3-button variant="filled"&gt;Save&lt;/k3-button&gt;</code></pre>
</k3-codeblock>`,
  },
  carousel: {
    components: ['k3-carousel', 'k3-carousel-item'],
    html: `<k3-carousel
  layout="multi-browse"
  label="Landscapes"
  controls
  indicators="bottom"
  mode="loop"
>
  <k3-carousel-item label="Mountains">
    <img src="/landscapes/mountains.jpg" alt="" />
    <span slot="label">Mountains</span>
  </k3-carousel-item>
  <k3-carousel-item label="Lake">
    <img src="/landscapes/lake.jpg" alt="" />
    <span slot="label">Lake</span>
  </k3-carousel-item>
  <k3-carousel-item label="Forest">
    <img src="/landscapes/forest.jpg" alt="" />
    <span slot="label">Forest</span>
  </k3-carousel-item>
</k3-carousel>`,
  },
  countdown: {
    components: ['k3-countdown', 'k3-text-field'],
    html: `<!-- Duration (ms) -->
<k3-countdown time="3600000" format="HH : mm : ss" segments with-labels></k3-countdown>

<!-- Absolute end (ISO) -->
<k3-countdown end-date="2030-01-01T00:00:00.000Z" format="DD : HH : mm : ss" segments with-labels></k3-countdown>

<!-- Pair with a datetime field -->
<k3-text-field id="end" type="datetime-local" label="End"></k3-text-field>
<k3-countdown id="cd" format="DD : HH : mm : ss" segments with-labels></k3-countdown>`,
    jsExtra: `
const end = document.getElementById("end");
const cd = document.getElementById("cd");
end?.addEventListener("k3-change", () => {
  if (end.value) cd.endDate = new Date(end.value).toISOString();
});`,
  },
  marquee: {
    components: ['k3-marquee'],
    html: `<k3-marquee pause-on-hover>
  <span>K3ui · Material 3 Expressive · Playground demo · </span>
</k3-marquee>`,
  },
  confetti: {
    components: ['k3-confetti', 'k3-button'],
    html: `<k3-confetti id="celebrate"></k3-confetti>
<k3-button variant="filled" onclick="document.getElementById('celebrate').presetFire('basic')">
  Celebrate
</k3-button>`,
    jsExtra: `import { ConfettiPresets } from 'k3ui';
// Imperative (no element required):
ConfettiPresets.fireBasic();
ConfettiPresets.fireFireworks();`,
  },
  'sound-fx': {
    components: ['k3-sound-fx', 'k3-button'],
    html: `<k3-sound-fx sounds-path="/sounds/"></k3-sound-fx>
<k3-button
  data-k3-sound-click="click"
  data-k3-sound-hover="hover"
  data-k3-sound-enter="enter"
  data-k3-sound-leave="leave"
>Interactive</k3-button>`,
  },
  'qr-code': {
    components: ['k3-qr-code'],
    html: `<k3-qr-code value="https://github.com/Kam3leoN/k3ui-expressive"></k3-qr-code>

<!-- Styled: rounded dots · round eyes · gradient · logo · frame -->
<k3-qr-code
  value="https://k3ui.dev"
  ecc="H"
  size="lg"
  dot-style="ellipse"
  eye-frame-style="rounded"
  eye-ball-style="circle"
  color="#00639b"
  gradient="linear"
  gradient-color="#6750a4"
  logo-icon="link"
  frame="box"
  frame-text="Scannez-moi"
></k3-qr-code>`,
    jsExtra: `const qr = document.querySelector("k3-qr-code");
await qr.download("png", { size: 1024, filename: "k3ui" });
// Sandboxed host? Handle the file yourself:
qr.addEventListener("k3-download", (e) => {
  e.preventDefault();
  share(e.detail.blob, e.detail.filename);
});`,
  },
  'audio-player': {
    components: ['k3-audio-player'],
    html: `<k3-audio-player
  variant="card"
  expandable
  hotkeys
  dynamic-color="on"
  loop-playlist
  tracks='[
    {"src":"/track.mp3","title":"Néon Caramel","artist":"Les Faux Jumeaux","duration":214,"seed":"#E8A0BF"}
  ]'
></k3-audio-player>

<!-- Compact · Toolbar (click → sticky · playlist upward) · Phone · Full -->
<k3-audio-player variant="compact" tracks='[...]'></k3-audio-player>
<!-- dock-toggle = demo undock only; sticky respects --k3-shell-rail-inline-size -->
<k3-audio-player variant="toolbar" dock-toggle tracks='[...]'></k3-audio-player>
<!-- Prefer phone on smartphone viewports -->
<k3-audio-player variant="phone" tracks='[...]'></k3-audio-player>
<k3-audio-player variant="full" tracks='[...]'></k3-audio-player>`,
  },
  breadcrumb: {
    components: ['k3-breadcrumb'],
    html: `<k3-breadcrumb
  variant="tonal"
  items='[{"text":"Home","href":"/","icon":"home"},{"text":"Components","href":"/components"},{"text":"Bubble","current":true}]'
></k3-breadcrumb>`,
  },
  pagination: {
    components: ['k3-pagination'],
    html: `<k3-pagination page="5" count="12"></k3-pagination>`,
  },
  'pagination-alpha': {
    components: ['k3-pagination-alpha'],
    html: `<k3-pagination-alpha
  active-letter="M"
  items='["Alice","Bob","Marta","Mike","Zoe"]'
></k3-pagination-alpha>`,
  },
  'index-list': {
    components: ['k3-index-list'],
    html: `<k3-index-list
  style="max-height:16rem"
  items='[{"label":"Alice"},{"label":"Bob"},{"label":"Zoe"}]'
></k3-index-list>`,
  },
  'scroll-to-top': {
    components: ['k3-scroll-to-top'],
    html: `<k3-scroll-to-top threshold="200" show-progress></k3-scroll-to-top>`,
  },
  gestures: {
    components: [],
    html: `<!-- See Gestures utility demos — attach via K3UI.gestures -->`,
    jsExtra: `// import { attachGestures } from "k3ui";`,
  },
  keyboard: {
    components: [],
    html: `<!-- Focus target + attachKeyboard / bindChords — see Keyboard demos -->`,
    jsExtra: `import { bindChords, attachKeyboard } from "k3ui";
const off = bindChords(document, {
  "control+k": () => console.log("chord"),
}, { ignoreFields: true });
// off();`,
  },
  'keyboard-media': {
    components: ['k3-audio-player'],
    html: `<k3-audio-player hotkeys tracks='[{"src":"/track.mp3","title":"Demo"}]'></k3-audio-player>`,
    jsExtra: `import { bindMediaHotkeys } from "k3ui";
// Or rely on k3-audio-player hotkeys attribute (uses bindMediaHotkeys).`,
  },
  mouse: {
    components: [],
    html: `<!-- attachMouse on a surface — see Mouse demos -->`,
    jsExtra: `import { attachMouse } from "k3ui";
const m = attachMouse(el, { dragThreshold: 4 });
m.on("drag", (d) => console.log(d.totalX, d.totalY));`,
  },
  dnd: {
    components: [],
    html: `<!-- Sortable surfaces use attachSortable / K3UI.dnd -->`,
    jsExtra: `// import { attachSortable } from "k3ui";`,
  },
  scrollbar: {
    components: [],
    html: `<div class="k3-scrollbar" style="max-height:12rem; overflow:auto">
  …scrollable content…
</div>`,
    css: `/* Tokens: --k3-sys-scrollbar-* · see Styles / tokens */`,
  },
};

export function buildUsageJs(snip: UsageSnippet): string {
  return jsInit(snip.components, snip.jsExtra ?? '');
}

export function buildUsageCss(snip: UsageSnippet): string {
  return (snip.css ?? '/* k3ui.css ships M3 tokens — override only if needed */').trim();
}
