/**
 * Doc sections rendered exclusively via `<k3-table>` (Specs, Properties, …).
 */
import { COMPONENT_SPECS, type SpecRow } from './specs.js';

export type DocTableId =
  | 'specs'
  | 'properties'
  | 'methods'
  | 'events'
  | 'slots'
  | 'css-parts'
  | 'options'
  | 'init'
  | 'theming'
  | 'keyboard'
  | 'motion';

/** Motivated absence — table skipped, reason retained for audits. */
export type DocTableNa = { na: string };

export interface DocTableSection {
  id: DocTableId;
  title: string;
  /** Comma-separated header labels for k3-table `columns` */
  columns: string;
  rows: string[][];
}

const SPEC_COLS = 'Token, Value, Notes';
const PROP_COLS = 'Name, Type, Default, Description';
const METHOD_COLS = 'Name, Signature, Description';
const EVENT_COLS = 'Name, Detail, Description';
const SLOT_COLS = 'Name, Description';
const PART_COLS = 'Name, Description';
const OPTION_COLS = 'Name, Type, Default, Description';
const THEMING_COLS = 'Token, Default, Description';
const KEYBOARD_COLS = 'Key, Action';
const MOTION_COLS = 'Interaction, Effect, Reduced motion';

export function isDocTableNa(v: unknown): v is DocTableNa {
  return !!v && typeof v === 'object' && 'na' in v && typeof (v as DocTableNa).na === 'string';
}

function specsToRows(rows: SpecRow[]): string[][] {
  return rows.map((r) => [r.token, r.value, r.note ?? '']);
}

function section(
  id: DocTableId,
  title: string,
  columns: string,
  rows: string[][],
): DocTableSection | null {
  if (!rows.length) return null;
  return { id, title, columns, rows };
}

/** Curated Properties / Methods / Events / Slots / CSS parts per page id. */
export type ComponentApiTables = Partial<
  Record<Exclude<DocTableId, 'specs'>, string[][] | DocTableNa>
>;

export const COMPONENT_API: Record<string, ComponentApiTables> = {
  buttons: {
    properties: [
      ['variant', "'filled'|'tonal'|'elevated'|'outlined'|'text'", 'filled', 'Visual style'],
      ['size', "'xs'|'sm'|'md'|'lg'|'xl'", 'sm', 'Height scale (default sm=40)'],
      ['shape', "'round'|'square'", 'round', 'Corner family'],
      ['disabled', 'boolean', 'false', 'Disables press'],
      ['selected', 'boolean', 'false', 'Selected / toggle look (aria-pressed)'],
      ['radio', 'boolean', 'false', 'Attr data-radio — group single-select → role=radio'],
      ['type', "'button'|'submit'|'reset'", 'button', 'Native button type'],
    ],
    events: [['k3-click', '{ source: "user" }', 'Activated (click / keyboard)']],
    slots: [
      ['(default)', 'Label text'],
      ['icon', 'Leading icon'],
      ['trailing-icon', 'Trailing icon'],
    ],
    'css-parts': [
      ['container', 'Inner button surface'],
      ['icon', 'Leading icon wrapper'],
      ['label', 'Label wrapper'],
      ['trailing-icon', 'Trailing icon wrapper'],
    ],
  },
  'buttons-icon': {
    properties: [
      [
        'variant',
        "'filled'|'tonal'|'outlined'|'standard'",
        'filled',
        'Color style (M3E default = filled)',
      ],
      [
        'size',
        "'xs'|'sm'|'md'|'lg'|'xl'",
        'sm',
        'H 32/40/56/96/136 — XS & S target ≥48dp',
      ],
      ['shape', "'round'|'square'", 'round', 'Resting corners · select morphs'],
      [
        'width',
        "'narrow'|'default'|'wide'",
        'default',
        'Painted width (default = H · see specs)',
      ],
      ['toggle', 'boolean', 'false', 'Click flips selected + k3-change'],
      ['selected', 'boolean', 'false', 'Toggle / group selected'],
      ['disabled', 'boolean', 'false', 'Disables press'],
      ['label', 'string', "''", 'Accessible name (required — action, not glyph)'],
      ['value', 'string', "''", 'Value for groups / forms'],
    ],
    events: [
      ['k3-click', 'selected', 'Activated'],
      ['k3-change', 'selected · value', 'Toggle selection changed'],
    ],
    methods: [
      ['select', '() => void', 'Select without k3-change'],
      ['deselect', '() => void', 'Deselect without k3-change'],
      ['toggleSelected', '() => void', 'Flip without k3-change'],
    ],
    slots: [
      ['(default)', 'Icon (Material Symbol / svg) · aria-hidden'],
      ['selected-icon', 'Optional icon while selected (toggle)'],
    ],
  },
  fab: {
    properties: [
      ['size', "'default'|'medium'|'large'|'small'", 'default', '56 / 80 / 96 / 40 (small deprecated)'],
      ['variant', "'primary'|'surface'|'secondary'|'tertiary'", 'primary', 'Color role'],
      ['round', 'boolean', 'false', 'Circle morph (menu open)'],
      ['disabled', 'boolean', 'false', 'Disables press'],
      ['extended', 'boolean', 'false', 'Deprecated — use k3-extended-fab'],
    ],
    events: [['k3-click', '—', 'Activated']],
    slots: [
      ['icon', 'FAB icon'],
      ['(default)', 'Optional label (extended)'],
    ],
  },
  'fab-extended': {
    properties: [
      ['size', "'small'|'medium'|'large'", 'medium', '40 / 56 / 96 dp height'],
      ['variant', "'primary'|'surface'|'secondary'|'tertiary'", 'primary', 'Color role'],
      ['disabled', 'boolean', 'false', 'Disables press'],
    ],
    events: [['k3-click', '—', 'Activated']],
    slots: [
      ['icon', 'Leading icon'],
      ['(default)', 'Label'],
    ],
  },
  'fab-menu': {
    properties: [
      ['open', 'boolean', 'false', 'Expanded menu'],
      ['variant', "'primary'|'secondary'|'tertiary'|'surface'", 'primary', 'Color role'],
      ['size', "'default'|'small'|'medium'|'large'", 'default', 'Closed trigger size'],
      ['placement', "'bottom-end'|…|'top-start'", 'bottom-end', 'Corner / edge'],
      ['fixed', 'boolean', 'false', 'Viewport / contained dock'],
      ['contained', 'boolean', 'false', 'Position absolute in parent'],
      ['disabled', 'boolean', 'false', 'Disables trigger'],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open with stagger motion'],
      ['hide', "(source?) => Promise<boolean>", 'Close with stagger motion'],
    ],
    events: [
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open lifecycle'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close lifecycle'],
    ],
    slots: [
      ['icon', 'Trigger icon (closed)'],
      ['(default)', 'k3-fab-menu-item children'],
    ],
  },
  'prev-next': {
    properties: [
      ['previous-href', 'string', "''", 'Previous link'],
      ['previous-title', 'string', "''", 'Previous page title'],
      ['previous-label', 'string', "''", 'Eyebrow override (i18n)'],
      ['next-href', 'string', "''", 'Next link'],
      ['next-title', 'string', "''", 'Next page title'],
      ['next-label', 'string', "''", 'Eyebrow override (i18n)'],
    ],
    events: [['k3-navigate', '{ direction, href }', 'Card activated']],
  },
  card: {
    properties: [
      ['variant', "'filled'|'outlined'|'elevated'", 'filled', 'Surface style'],
      ['interactive', 'boolean', 'false', 'Hover border morph'],
    ],
    events: [['k3-click', '—', 'When interactive']],
    slots: [
      ['media', 'Image / video header'],
      ['headline', 'Title'],
      ['(default)', 'Supporting text'],
      ['actions', 'Action buttons'],
    ],
  },
  dialog: {
    properties: [
      ['open', 'boolean', 'false', 'Visibility'],
      ['modal', 'boolean', 'true', 'Scrim + focus trap'],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open'],
      ['hide', "(source?) => Promise<boolean>", 'Close'],
    ],
    events: [
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close'],
    ],
    slots: [
      ['headline', 'Title'],
      ['(default)', 'Body'],
      ['actions', 'Buttons'],
      ['icon', 'Optional leading icon'],
    ],
  },
  menu: {
    properties: [
      ['open', 'boolean', 'false', 'Visibility'],
      ['variant', "'vertical'|'baseline'", 'vertical', 'Chrome / gaps'],
      [
        'position',
        "'bottom-*'|'top-*'|'end-*'|'start-*'",
        'bottom-start',
        'Panel vs trigger (side = nav-rail)',
      ],
      ['color', "'standard'|'vibrant'", 'standard', 'Surface tint'],
      [
        'density',
        '0 | -1 | -2 | -3',
        '0',
        'M3 list density (item height 48→32)',
      ],
      [
        'dismiss-ignore',
        'string (CSS selectors)',
        "''",
        'Owners that toggle the menu (e.g. #nav-rail)',
      ],
      [
        'checkable (item)',
        'boolean',
        'false',
        'On k3-menu-item — leading check when selected',
      ],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open'],
      ['hide', "(source?) => Promise<boolean>", 'Close'],
    ],
    slots: [
      ['(default)', 'k3-menu-item / k3-menu-group'],
      ['trigger', 'Optional opener'],
      [
        'item › supporting-text',
        'Second line under label (M3 OK — no nested buttons/switches)',
      ],
      ['item › icon', 'Leading icon'],
      ['item › trailing', 'End meta (badge, etc.)'],
      ['item › submenu', 'Nested flyout items'],
    ],
  },
  table: {
    properties: [
      ['variant', "'outlined'|'filled'", 'outlined', 'Frame style'],
      ['density', "'default'|'compact'", 'default', 'Row height'],
      ['columns', 'string', "''", 'CSV headers (generated mode)'],
      ['rows', 'string (JSON)', "''", 'JSON string[][]'],
      ['align', 'string', "''", 'CSV start|end|center'],
      ['caption', 'string', "''", 'Optional caption'],
    ],
    slots: [['(default)', 'Native <table> when columns empty']],
  },
  'buttons-group': {
    properties: [
      [
        'variant',
        "'standard'|'connected'",
        'standard',
        'Standard gaps + press morph · or connected 2dp joins',
      ],
      ['selection', "'none'|'single'|'multi'", 'single', 'Toggle mode'],
      [
        'size',
        "'xs'|'sm'|'md'|'lg'|'xl'",
        'sm',
        'Standard gap 18/12/8/8/8 · connected corners 4/8/8/16/20',
      ],
      [
        'shape',
        "'round'|'square'",
        'round',
        'Connected: round=CornerFull+inner · square=outer token / seams 4dp',
      ],
      ['orientation', "'horizontal'|'vertical'", 'horizontal', 'Axis'],
      ['labels', "'always'|'selected'", 'always', 'Hide labels until selected'],
      ['required', 'boolean', 'false', 'Cannot clear last selection'],
      ['equal-width', 'boolean', 'false', 'Equal flex widths (opt-in)'],
      ['sync', 'boolean', 'false', 'Push size/shape onto children'],
      ['disabled', 'boolean', 'false', 'Disables all children'],
      ['label', 'string', "''", 'Accessible name (aria-label)'],
    ],
    events: [
      ['k3-change', 'selected, values', 'Selection changed'],
      ['k3-select-start / k3-select-end', '—', 'Lifecycle around toggle'],
    ],
    methods: [['selectedValues', '() => string[]', 'Selected values in order']],
    slots: [['(default)', 'k3-button · k3-icon-button (styles preserved)']],
  },
  'buttons-split': {
    properties: [
      ['variant', "'filled'|'tonal'|'outlined'|'elevated'", 'filled', 'Same as buttons'],
      [
        'size',
        "'xs'|'sm'|'md'|'lg'|'xl'",
        'sm',
        '32 / 40 / 56 / 96 / 136 · gap 2 · outer H/2',
      ],
      ['label', 'string', "''", 'A11y name when leading is icon-only'],
      ['open', 'boolean', 'false', 'Trailing selected (circle morph)'],
      ['disabled', 'boolean', 'false', 'Disables both segments'],
    ],
    events: [['k3-select', 'value', 'Menu item (bubbles)']],
    methods: [
      ['openMenu', '() => Promise<boolean>', 'Open trailing menu'],
      ['closeMenu', '(source?) => Promise<boolean>', 'Close menu'],
      ['toggleMenu', '() => Promise<void>', 'Toggle trailing menu'],
    ],
    slots: [
      ['(default)', 'Leading label only (not clickable; omit for icon-only)'],
      ['icon', 'Leading icon'],
      ['menu', 'k3-menu-item × ≥2 (first/last edges)'],
    ],
  },
  'buttons-grid': {
    properties: [
      ['variant', "'filled'|'tonal'|'outlined'", 'filled', 'Cell / FAB style'],
      ['trigger-fab', 'boolean', 'true', 'FAB reveal vs always-open pad'],
      ['labels', 'string[] (CSV)', '1…9', 'Nine cell labels'],
    ],
    events: [['k3-select', '{ index, label }', 'Cell chosen (0-based)']],
    methods: [
      ['expand', '() => void', 'Open FAB grid'],
      ['collapse', '() => void', 'Close FAB grid'],
      ['select', '(index) => void', 'Emit + collapse FAB'],
    ],
  },
  'buttons-pad': {
    properties: [
      ['mode', "'diagonal'|'cardinal'", 'diagonal', 'Corner vs rotated cardinal'],
      ['variant', "'filled'|'tonal'|'outlined'", 'filled', 'Cell style'],
    ],
    events: [['k3-navigate', '{ direction }', 'Cell pressed']],
    methods: [['navigate', '(direction) => void', 'Emit direction']],
  },
  'buttons-smart': {
    properties: [
      ['label', 'string', "''", 'Primary label / aria-label'],
      ['active', 'boolean', 'false', 'ON squircle state'],
      ['active-subtitle', 'string', "'On'", 'Subtitle when active'],
      ['inactive-subtitle', 'string', "''", 'Subtitle when inactive'],
      ['haptic-duration', 'number', '15', 'Vibrate ms (0 = light)'],
      ['disabled', 'boolean', 'false', 'Disables toggle'],
    ],
    events: [['k3-toggle', '{ active }', 'After state change']],
    methods: [
      ['toggle', '() => void', 'Flip active'],
      ['setActive', '(active) => void', 'Set + emit'],
    ],
    slots: [['icon', 'Leading Material Symbol']],
  },
  'fab-dial': {
    properties: [
      ['open', 'boolean', 'false', 'Expanded dial'],
      ['position', "'bottom-right'|…|'top-left'", 'bottom-right', 'Corner'],
      ['layout', "'flower'|'vertical'", 'flower', 'Flower fan (prefer); vertical → use FAB Rail'],
      ['fixed', 'boolean', 'false', 'Viewport dock'],
      ['show-labels', 'boolean', 'false', 'Action labels'],
      ['scrim', 'boolean', 'true', 'Dismiss scrim'],
      ['fab-icon', 'string', 'add', 'Trigger ligature'],
      ['disabled', 'boolean', 'false', 'Disables trigger'],
    ],
    events: [['k3-item-click', '{ item }', 'Action activated']],
    slots: [['(default)', 'k3-fab-dial-item children']],
  },
  'fab-rail': {
    properties: [
      ['open', 'boolean', 'false', 'Expanded rail'],
      ['position', "'bottom-right'|…|'top-left'", 'bottom-right', 'Corner'],
      ['direction', "'up'|'down'|'left'|'right'|''", "''", 'Axis (corner default)'],
      ['fixed', 'boolean', 'false', 'Viewport dock'],
      ['auto-fit', 'boolean', 'true', 'Scale to viewport'],
      ['scrim', 'boolean', 'true', 'Dismiss scrim'],
      ['fab-icon', 'string', 'add', 'Trigger ligature'],
      ['disabled', 'boolean', 'false', 'Disables trigger'],
    ],
    events: [['k3-item-click', '{ item }', 'Action activated']],
    slots: [['(default)', 'k3-fab-rail-item children']],
  },
  counter: {
    properties: [
      ['value', 'number', '0', 'Current value'],
      ['size', "'xs'|'sm'|'md'|'lg'|'xl'", 'md', 'Circle diameter ladder'],
      ['step', 'number', '1', 'Increment amount (e.g. 10)'],
      ['min / max', 'number', '—', 'Optional bounds'],
      ['decimals', 'number', '0', 'Display precision'],
      ['allow-negative', 'boolean', 'false', 'Values < 0 (also if min < 0)'],
      ['disabled', 'boolean', 'false', 'Non-interactive · faded'],
      ['readonly', 'boolean', 'false', 'Display only · no ±'],
    ],
    events: [
      ['k3-change', '{ value }', 'Value changed'],
      ['k3-increment / k3-decrement', '{ value }', 'After ±'],
    ],
    methods: [
      ['getValue', '() => number', 'Current value'],
      ['setValue', '(next) => void', 'Clamp + emit'],
    ],
  },
  signature: {
    properties: [
      ['pen-color', 'string', 'on-surface', 'Stroke color (CSS color)'],
      ['background-color', 'string', 'transparent', 'Canvas fill'],
      ['min-width / max-width', 'number', '0.5 / 2.5', 'Stroke width range'],
      ['show-clear', 'boolean', 'true', 'Clear action under pad'],
      ['show-initials', 'boolean', 'true', 'Initials input + apply'],
      ['initials', 'string', "''", 'Controlled initials (max 4)'],
      ['show-hint', 'boolean', 'true', 'Placeholder when empty'],
      ['disabled', 'boolean', 'false', 'Non-interactive · faded'],
      ['readonly', 'boolean', 'false', 'View only · no actions'],
    ],
    events: [
      ['k3-begin-stroke / k3-end-stroke', '—', 'Stroke lifecycle'],
      ['k3-clear', '—', 'Pad cleared'],
      ['k3-initials', '{ initials }', 'Initials stamped'],
      ['k3-change', '{ empty, dataUrl? }', 'After stroke end, clear, or initials'],
    ],
    methods: [
      ['isEmpty', '() => boolean', 'No strokes / stamp'],
      ['clear', '() => void', 'Wipe + emit'],
      ['applyInitials', '(text?) => void', 'Stamp initials'],
      ['toDataURL / toSVG / toData', '…', 'Export'],
      ['fromData / fromDataURL', '…', 'Restore'],
    ],
  },
  autocomplete: {
    properties: [
      ['label', 'string', "''", 'Field label'],
      ['value', 'string', "''", 'Committed value'],
      ['options / options attr', 'AutocompleteOption[]', '[]', 'Choices'],
      ['variant', "'filled'|'outlined'|'standard'", 'outlined', 'Field chrome'],
      ['filter', "'contains'|'starts-with'", 'contains', 'Match mode'],
      ['open', 'boolean', 'false', 'Panel open'],
      ['loading', 'boolean', 'false', 'Shows loading row'],
      ['disabled', 'boolean', 'false', 'Disables field + panel'],
    ],
    events: [
      ['k3-input', '{ value }', 'Typing'],
      ['k3-query', '{ term }', 'Lazy-load hook'],
      ['k3-change', '{ value, label }', 'Selection committed'],
      ['k3-toggle', '{ open }', 'Panel visibility'],
    ],
  },
  'wheel-picker': {
    properties: [
      ['length', 'number', '3', 'Column count'],
      ['value', 'string', 'AAA', 'Initial string'],
      ['allowed-chars', 'string', 'A–Z', 'Per-column charset'],
      ['show-preview', 'boolean', 'true', 'Live preview label'],
      ['show-submit-button', 'boolean', 'true', 'Confirm button'],
    ],
    events: [
      ['k3-change', '{ value }', 'Value updated'],
      ['k3-submit', '{ value }', 'Submit pressed'],
    ],
    methods: [
      ['getValue', '() => string', 'Current string'],
      ['setValue', '(next) => void', 'Set + emit k3-change'],
    ],
  },
  'buttons-segmented': {
    properties: [
      ['segments', 'ButtonSegmentedSegment[]', '[]', 'JSON segments'],
      ['shape', "'rounded'|'square'", 'rounded', 'Outer / segment radius'],
      ['multi-select', 'boolean', 'false', 'Multiple active segments'],
      ['show-check', 'boolean', 'false', 'Check on selected'],
      ['selected-indices', 'number[]', '[0]', 'Controlled selection'],
    ],
    events: [['k3-change', '{ indices, values }', 'User changed selection']],
    methods: [
      ['getSelectedIndices', '() => number[]', 'Current indices'],
      ['setSelectedIndices', '(indices) => void', 'Programmatic (no emit)'],
    ],
  },
  bubble: {
    properties: [
      ['placement', "'start'|'end'", 'start', 'Incoming vs outgoing'],
      ['color', 'BubbleColor', 'default', 'Body tone'],
    ],
    slots: [
      ['image', 'Avatar or thumbnail'],
      ['header', 'Name · timestamp'],
      ['(default)', 'Message body'],
      ['footer', 'Status · meta'],
    ],
    'css-parts': [
      ['root', 'Row wrapper'],
      ['body', 'Bubble surface'],
    ],
  },
  quote: {
    properties: [
      ['author', 'string', "''", 'Name (or slot author)'],
      ['job (attr: role)', 'string', "''", 'Subtitle (or slot role)'],
      ['layout', "'author-start'|'author-end'", 'author-start', 'Avatar left or right'],
      ['tilt', 'boolean', 'true', 'Resting tilt; hover deepens it'],
      ['tilt-dir', "'auto'|'ccw'|'cw'", 'auto', 'Sense (±3°); auto = random once'],
    ],
    slots: [
      ['avatar', 'k3-avatar or image'],
      ['author', 'Overrides author prop'],
      ['role', 'Overrides job prop'],
      ['(default)', 'Citation body'],
      ['action', 'CTA — prefer k3-button text'],
    ],
    'css-parts': [
      ['root', 'Outer wrapper'],
      ['motion', 'Hover tilt layer'],
      ['offset', 'Colored back layer'],
      ['card', 'Surface card'],
      ['mark', 'Top-right quote mark'],
      ['author', 'Author column'],
      ['quote', 'Citation column'],
      ['body', 'blockquote'],
      ['action', 'CTA slot host'],
    ],
  },
  'qr-code': {
    properties: [
      ['value', 'string', "''", 'Text to encode (see buildQrPayload)'],
      ['ecc', "'L'|'M'|'Q'|'H'", 'M', 'Error correction 7 · 15 · 25 · 30 %'],
      ['size', "'xs'|'sm'|'md'|'lg'|'xl'", 'md', 'XS 96 · SM 128 · MD 192 · LG 256 · XL 320'],
      ['fluid', 'boolean', 'false', 'Fill the container width'],
      ['margin', 'number', '2', 'Quiet zone (modules)'],
      ['dot-style', "'square'|'rounded'|'extra-rounded'|'dots'|'classy'|'diamond'|'vertical'|'horizontal'|'tiny'", 'square', 'Pattern'],
      ['eye-frame-style / eye-ball-style', "'square'|'rounded'|'extra-rounded'|'circle'|'leaf'|'diamond'", 'square', 'Finder shapes'],
      ['color / background', 'string', '#000000 / #ffffff', 'Ink and background (transparent ok)'],
      ['gradient · gradient-color · gradient-rotation', "'none'|'linear'|'radial' · string · number", 'none', 'Dots gradient'],
      ['eye-frame-color / eye-ball-color', 'string', "''", 'Finder colours (empty = dots)'],
      ['logo / logo-icon', 'string', "''", 'Image URL or preset vector icon'],
      ['logo-size · logo-margin · logo-keep-dots', 'number · number · boolean', '0.22 · 1 · false', 'Clamped to the ECC budget'],
      ['frame', "'none'|'box'|'box-top'|'bubble'|'pill'|'corners'|'clipboard'|'bag'|'phone'|'circle'|'banner'", 'none', 'CTA frame (qr.io + classic)'],
      ['frame-text · frame-color · frame-font', "string · string · 'sans'|'serif'|'mono'", 'Scan me', 'Frame phrase'],
      ['export-size · filename', 'number · string', '1024 · qr-code', 'Download defaults'],
    ],
    methods: [
      ['toSvg', '(size?) => string', 'Standalone SVG markup'],
      ['toBlob / toDataUrl', '(format?, size?) => Promise', 'png · svg · jpeg · webp'],
      ['download', '(format?, { size, filename }) => Promise<boolean>', 'Fires k3-download first'],
      ['copy', '(format?) => Promise<boolean>', 'PNG image or SVG text'],
    ],
    events: [
      ['k3-render', '{ version, modules, ecc, mask, mode, length }', 'New code drawn'],
      ['k3-error', "{ reason: 'overflow' }", 'Payload too long'],
      ['k3-download', '{ format, filename, blob, width }', 'Cancelable — save it yourself'],
      ['k3-copy', '{ format, ok }', 'After copy()'],
    ],
    'css-parts': [
      ['code', 'Wrapper of the rendered SVG'],
      ['state', 'Empty / overflow placeholder'],
    ],
  },
  codeblock: {
    properties: [
      ['label', 'string', "''", 'Single-sample tab title (falls back to language)'],
      ['language', 'string', "''", 'Language id or alias — html, php, sql, c++, c#, react…'],
      ['index', 'number', '0', 'Active sample when several slotted <pre> blocks'],
      ['theme', "'dark'|'material'|'okaidia'", 'dark', 'Token colours — dark panel (default), M3 adaptive, or okaidia alias'],
      ['show-copy / show-download', 'boolean', 'true', 'Icon buttons in the chrome'],
      ['code', 'string', "''", 'Source when no slot (single sample)'],
    ],
    events: [
      ['k3-copy', '{ text }', 'Copy succeeded'],
      ['k3-tab', '{ index }', 'Active sample tab changed'],
    ],
    slots: [['(default)', 'One or more <pre data-label="…"><code class="language-…">']],
    'css-parts': [
      ['shell', 'Outer layout'],
      ['header', 'Tabs chrome + actions'],
      ['panel', 'Dark rounded code surface'],
      ['tabs', 'Title k3-tabs'],
      ['actions', 'Copy / Download cluster'],
      ['copy · download', 'Icon buttons'],
      ['content', 'Highlighted pre/code'],
    ],
  },
  carousel: {
    properties: [
      [
        'layout',
        "'multi-browse'|'uncontained'|'hero'|'full-screen'",
        'multi-browse',
        'M3 layout',
      ],
      ['align', "'start'|'center'", 'start', 'Hero only'],
      ['item-width', 'number', '186', 'Preferred large width (px)'],
      ['label', 'string', "''", 'Region accessible name'],
      ['controls', 'boolean', 'false', 'Prev / next icon buttons'],
      [
        'indicators',
        "'none'|'top'|'bottom'|'left'|'right'",
        'none',
        'Page dots position',
      ],
      ['mode', "'continuous'|'loop'", 'continuous', 'End stop vs wrap'],
      ['mouse-drag', 'boolean', 'true', 'Click-drag scroll'],
      ['index', 'number', '0', 'Focal item (set to navigate)'],
    ],
    events: [
      ['k3-change-start', '{ source }', 'Before settle (cancelable)'],
      ['k3-change-end', '{ source, index }', 'After settle'],
      ['k3-change', '{ index }', 'Focal item settled'],
    ],
    slots: [['(default)', 'k3-carousel-item children']],
    'css-parts': [
      ['viewport', 'Padded clipping box'],
      ['scroller', 'Native scroll container'],
      ['controls', 'Prev / next wrapper'],
      ['indicators', 'Page dots wrapper'],
      ['dot', 'One page dot'],
    ],
    methods: [
      ['prev / next', '() => void', 'Step by one'],
      ['goTo', '(index) => void', 'Jump to item'],
    ],
  },
  coverflow: {
    properties: [
      ['label', 'string', "''", 'Region accessible name'],
      ['index', 'number', '0', 'Centred cover (set to navigate)'],
      ['mode', "'loop'|'bounded'", 'loop', 'Endless ring vs stop at the ends'],
      ['orientation', "'horizontal'|'vertical'", 'horizontal', 'Vertical: stacked top to bottom, ↑ ↓, no reflection'],
      ['effect', "'coverflow'|'slide'", 'coverflow', 'Slide: flat row, the centred cover grows'],
      ['active-scale', 'number', '1.4', 'Slide: scale of the centred cover'],
      ['angle', 'number', '60', 'Side rotation (deg)'],
      ['gap', 'number', '0.72', 'Centre → first side cover (× width)'],
      ['spacing', 'number', '0.24', 'Between side covers (× width)'],
      ['depth', 'number', '0.62', 'Side covers depth (× width)'],
      ['visible', 'number', '4', 'Side covers per side'],
      ['no-reflection', 'boolean', 'false', 'Hide the mirror reflection'],
      ['wheel', 'boolean', 'false', 'Vertical wheel also navigates'],
      ['arrows', 'boolean', 'false', 'Previous / next buttons on the sides'],
      ['bullets', 'boolean', 'false', 'Bullets — active one 3× wider, follows the motion'],
      ['full-width', 'boolean', 'false', 'Side covers reach the container edges (top / bottom when vertical)'],
      ['lightbox', 'boolean', 'false', 'Link covers open their image in a viewer'],
    ],
    events: [
      ['k3-change', '{ index }', 'A new cover is centred'],
      ['k3-open / k3-close', '{ index }', 'Lightbox opened / closed'],
    ],
    slots: [['(default)', 'k3-coverflow-item children']],
    'css-parts': [
      ['viewport', 'Clipping, perspective, gestures'],
      ['stage', '3D stage'],
      ['arrow · arrow-prev · arrow-next', 'Side buttons'],
      ['bullets · bullet', 'Bullet row · each bullet'],
      ['lightbox · lightbox-image · lightbox-button', 'Viewer layer, image, buttons'],
    ],
    methods: [
      ['prev / next', '() => void', 'Step by one'],
      ['goTo', '(index) => void', 'Centre a cover'],
      ['open / close', '(index?) => void', 'Lightbox'],
    ],
  },
  'coverflow-item': {
    properties: [
      ['href / target / rel', 'string', "''", 'Centred cover is a link'],
      ['flip', 'boolean', 'false', 'Centred cover turns over'],
      ['flipped', 'boolean', 'false', 'Back side showing'],
      ['label', 'string', "''", 'Accessible name (else the img alt)'],
    ],
    events: [['k3-flip', '{ flipped }', 'Card turned (k3-change-start cancels)']],
    slots: [
      ['(default)', 'Front (img / video / any content)'],
      ['back', 'Back side (flip)'],
    ],
    'css-parts': [
      ['card', '3D card'],
      ['front', 'Front face (the link with href)'],
      ['back', 'Back face'],
    ],
    methods: [['toggle', '(force?) => void', 'Turn over (flip)']],
  },
  'iso-filter': {
    properties: [
      ['filter', 'string', "'*'", 'Active token (* = all)'],
      ['layout', "'masonry'|'grid'", 'masonry', 'Pack mode'],
      ['gap', 'number', '8', 'Gutter (px)'],
      ['column-width', 'number', '72', 'Target column width (masonry)'],
    ],
    methods: [
      ['setFilter', '(value) => void', 'Set filter + relayout'],
      ['refresh', '() => void', 'Re-apply filter + pack'],
    ],
    events: [['k3-filter-change', '{ filter }', 'After filter changes']],
    slots: [
      ['filters', 'Chip set / filter UI (listens to k3-change)'],
      ['(default)', 'Items with data-filter or data-category'],
    ],
    'css-parts': [
      ['toolbar', 'Filters row'],
      ['board', 'Items board'],
    ],
  },
  masonry: {
    properties: [
      ['gap', 'number', '8', 'Gutter (px)'],
      ['column-width', 'number', '180', 'Target column width'],
      ['columns', 'number', '0', 'Fixed column count (0 = auto)'],
    ],
    methods: [['layout', '() => void', 'Force re-pack']],
    slots: [['(default)', 'Tiles / cards of any height']],
    'css-parts': [['viewport', 'Positioned pack root']],
  },
  lazy: {
    properties: [
      ['trigger', "'visible'|'idle'|'interaction'|'eager'|'manual'", 'visible', 'When loading starts'],
      ['root-margin', 'string', '200px', 'Viewport margin for visible'],
      ['fallback', "'skeleton'|'indicator'|'none'", 'skeleton', 'Placeholder until ready'],
      ['animation', "'wave'|'pulse'|'none'", 'wave', 'Skeleton animation'],
      ['delay · min-duration', 'number', '150 · 300', 'Indicator anti-flicker (ms)'],
      ['state', "'idle'|'loading'|'ready'|'error'", 'idle', 'Reflected'],
      ['loader', '() => Promise', 'null', 'Async work after registration (JS)'],
    ],
    methods: [
      ['load', '() => Promise<void>', 'Start now (any trigger)'],
      ['retry', '() => Promise<void>', 'Try again after an error'],
    ],
    events: [
      ['k3-load-start', "{ source: 'auto' | 'api' }", 'Loading begins'],
      ['k3-load-end', '{ ok, tags }', 'Ready or failed — tags registered'],
      ['k3-error', '{ error }', 'Loader or registration failed'],
    ],
    slots: [
      ['(default)', 'Content revealed once ready'],
      ['fallback', 'Custom placeholder'],
      ['error', 'Custom error message'],
    ],
  },
  countdown: {
    properties: [
      ['time', 'number', '0', 'Duration ms (if no end-date)'],
      ['end-date', 'string', 'null', 'ISO end timestamp'],
      ['format', 'string', 'HH : mm : ss', 'Display format'],
      ['segments', 'boolean', 'false', 'Separate cells'],
      ['with-labels', 'boolean', 'false', 'Unit labels under segments'],
      ['auto-start', 'boolean', 'true', 'Start on connect'],
    ],
    events: [
      ['k3-change', '{ remaining }', 'Tick (ms left)'],
      ['k3-end', '—', 'Reached zero'],
    ],
    methods: [
      ['start / pause / reset', '() => void', 'Playback control'],
    ],
  },
  marquee: {
    properties: [
      ['mode', "'infinite'|'classic'", 'infinite', 'Seamless loop · edge-to-edge pass'],
      ['start', "'filled'|'edge'", 'filled', 'Infinite: covered at once · enters from the far edge'],
      ['direction', "'left'|'right'|'up'|'down'", 'left', 'Scroll direction (up / down need a height)'],
      ['speed', 'number', 'null', 'Px/s (MarqueeJS) — overrides duration'],
      ['duration', 'number', '20', 'Seconds per loop when speed is unset'],
      ['gap', 'number', '80', 'Px between items and copies'],
      ['separator', 'string', "''", 'Text between copies (e.g. •)'],
      ['clone-count', "'auto'|number", 'auto', 'Copies (max 15)'],
      ['pause-on-hover', 'boolean', 'false', 'Pause while hovered'],
      ['pause-on-focus', 'boolean', 'true', 'Pause while focus is inside'],
      ['pause-at-items', 'boolean', 'false', 'Dwell when each item’s start hits the near edge'],
      ['item-pause', 'number', '1.5', 'Dwell seconds when pause-at-items is on'],
      ['text-size · text-font · text-weight', 'string', "''", 'Text version: 26 · "Georgia, serif" · 700'],
      ['html', 'string', 'null', 'Untrusted HTML — sanitized (allowlist), fires k3-sanitize'],
      ['drag', 'boolean', 'false', 'Grab to move (mouse, pen, touch)'],
      ['pause-on-scroll', 'boolean', 'false', 'Pause while the page scrolls'],
      ['variant', "'plain'|'tonal'|'filled'|'outlined'", 'plain', 'Band surface (templates)'],
      ['paused · autoplay', 'boolean', 'false · true', 'Paused by API / control · start on connect'],
    ],
    methods: [
      ['start / play · pause / stop · resume · toggle', '() => void', 'Playback (stop keeps the position)'],
      ['restart', '() => void', 'Back to the starting position'],
      ['addContent · replaceContent', '(items, { html? }) => void', 'Text items, or sanitized HTML with { html: true }'],
      ['getContentList', '() => string[]', 'Text of each item (label excluded)'],
      ['recalculate', '() => void', 'Re-measure after layout changes'],
    ],
    events: [
      ['k3-pause · k3-play', '{ source }', 'Paused / resumed by the API or a control'],
      ['k3-item-pause', '{ index, offset }', 'Item dwell started (pause-at-items)'],
      ['k3-loop', '{ count }', 'A full lap was completed'],
      ['k3-sanitize', '{ removed }', 'HTML content was cleaned (what was removed)'],
    ],
    slots: [
      ['(default)', 'Items: text, links, images, chips…'],
      ['label', 'Fixed badge before the band (e.g. Live)'],
    ],
    'css-parts': [
      ['band · label', 'Surface (variant) · fixed badge'],
      ['viewport · track · set', 'Clip area · moving strip · one copy'],
    ],
  },
  'text-bounce': {
    properties: [
      ['text', 'string', 'HELLO WORLD', 'String to split into characters'],
      ['loop', 'boolean', 'false', 'Replay forever'],
      ['loop-delay', 'number', '1000', 'Pause between loops (ms)'],
      ['stagger', 'number', '50', 'Delay between characters (ms)'],
      ['autoplay', 'boolean', 'true', 'Play on connect / when text changes'],
    ],
    methods: [
      ['play / stop / restart', '() => void', 'WAAPI control'],
    ],
  },
  'text-scramble': {
    properties: [
      ['text', 'string', '(blurb)', 'Target string to reveal'],
      [
        'chars',
        "'default'|'braille'|'blocks'|'numbers'|string",
        'default',
        'Noise set (presets or literal / a-z ranges)',
      ],
      ['from', "'left'|'center'|'right'|'random'", 'left', 'Reveal wave origin'],
      ['loop', 'boolean', 'false', 'Replay after loop-delay'],
      ['loop-delay', 'number', '2000', 'Pause between loops (ms)'],
      ['reveal-rate · settle-rate', 'number', '55 · 28', 'Reveal / settle pacing'],
      ['autoplay', 'boolean', 'true', 'Play on connect'],
    ],
    methods: [
      ['play', '(text?) => Promise<void>', 'Scramble toward text (or current)'],
      ['stop / restart', '() => void', 'Cancel or replay'],
    ],
  },
  'heart-burst': {
    properties: [
      ['trigger', "'hover'|'click'|'both'", 'hover', 'When to spawn particles'],
      ['continuous', 'boolean', 'true', 'Keep pulsing at the pointer while hovered'],
      ['block', 'boolean', 'false', 'Block host for cards / full-width targets'],
      ['clip', 'boolean', 'false', 'Keep flight inside the target (soft fade, no hard cut)'],
      ['icon', "'heart'|'star'|'like'", 'heart', 'Particle glyph'],
      ['count', 'number', '10', 'Particles per burst'],
      ['color', 'string', "''", 'Accent (also --k3-heart-burst-color)'],
      [
        '--k3-heart-burst-particle-size',
        'CSS length',
        '1.25rem',
        'Base particle size (likes / hearts / stars)',
      ],
    ],
    methods: [['burst', '(count?) => void', 'Fire at last pointer (or centre)']],
    slots: [['(default)', 'Any target surface (button, card, h1, p, …)']],
  },
  halftone: {
    properties: [
      ['mode', "'auto'|'print'|'overlay'", 'auto', 'print for images, overlay otherwise'],
      ['preset', "'poster'|'cmyk'|'riso'|'mono'", 'poster', 'Ink set (print)'],
      ['inks', 'JSON', "''", 'Custom inks [{color, angle, channel, offset}]'],
      ['shape', "'circle'|'ellipse'|'square'|'line'", 'circle', 'Dot shape (print)'],
      ['size', 'number', '10', 'Screen pitch (CSS px)'],
      ['contrast · black · dot-gain', 'number', '1.25 · 0.9 · 0', 'Tones · black generation · ink spread'],
      ['angle · misregistration', 'number', '0 · 1', 'Screen rotation · plate offset'],
      ['paper · grain · roughness', 'string · number', 'cream · 0.12 · 0', 'Stock (print)'],
      ['ink-opacity', 'number', '1', 'Ink opacity (print)'],
      ['src · alt', 'string', "''", 'Image without slot · accessible name'],
      ['intensity · color', 'number · string', '0.55 · #0a0a0a', 'Overlay opacity · dot / mono ink colour'],
      ['tone', "'dark'|'light'", 'dark', 'Ink on paper · light ink on dark stock'],
      ['animated · duration', 'boolean · number', 'false · 12000', 'Drifting register / grid (ms)'],
    ],
    methods: [
      ['toBlob', '(type?, width?) => Promise<Blob>', 'Composited print'],
      ['download', '(filename?) => Promise<void>', 'Save as PNG / JPEG'],
      ['refresh', '() => void', 'Re-print (e.g. after drawing into a slotted canvas)'],
    ],
    events: [
      ['k3-render', '{ mode, width, height, dots, ms }', 'After each print'],
      ['k3-error', "{ reason: 'load'|'cross-origin'|'canvas' }", 'Falls back to the overlay'],
    ],
    slots: [['(default)', '<img> / <canvas> / <video> to print, or any content (overlay)']],
    'css-parts': [
      ['print', 'Paper + ink plates'],
      ['screen', 'Overlay dot screen'],
    ],
  },
  'card-holo': {
    properties: [
      ['effect', "'prism'|'none'|string", 'prism', 'Built-in foil; 13 more with k3ui/holo-effects.css (GPL-3.0)'],
      [
        'effect (add-on)',
        "'holo'|'reverse'|'cosmos'|'rainbow'|'rainbow-alt'|'secret'|'v'|'vmax'|'vstar'|'full-art'|'shiny'|'radiant'|'full-art-wave'",
        '—',
        'Foils of k3ui/holo-effects.css',
      ],
      ['max-rotate', 'number', '15', 'Maximum tilt (deg), 0 = flat'],
      ['reset-delay', 'number', '250', 'Delay before settling back (ms)'],
      ['motion-range', 'number', '20', 'Device tilt reaching the card edge (deg)'],
    ],
    methods: [
      ['enableMotion', '() => Promise<boolean>', 'Follow the device tilt (call from a tap)'],
      ['disableMotion', '() => void', 'Back to pointer / touch'],
      ['motionActive', 'boolean (get)', 'Device tilt drives the card'],
    ],
    slots: [['(default)', 'Card artwork (<img>, <picture>, <svg>…)']],
    'css-parts': [
      ['card', 'Tilted card, clips the light layers'],
      ['shine', 'Foil layer (::before / ::after free for effects)'],
      ['glare', 'Light reflection'],
    ],
  },
  'card-lenticular': {
    properties: [
      ['axis', "'x'|'y'", 'x', 'Views change left → right or top → bottom'],
      ['rest-frame', 'number', '0', 'View shown at rest'],
      ['transition', 'number', '0.5', 'Switch width, 0 sharp … 1 gradual'],
      ['max-rotate', 'number', '12', 'Maximum tilt (deg), 0 = flat'],
      ['reset-delay', 'number', '400', 'Delay before the rest view (ms)'],
      ['motion-range', 'number', '20', 'Device tilt to the last view (deg)'],
      ['keyboard', 'boolean', 'true', 'Arrow / Home / End keys ("false" to turn off)'],
    ],
    methods: [
      ['show', '(index) => void', 'Go to a view and stay there'],
      ['enableMotion', '() => Promise<boolean>', 'Follow the device tilt (call from a tap)'],
      ['disableMotion', '() => void', 'Back to pointer / touch / keys'],
      ['index', 'number (get)', 'Most visible view'],
    ],
    events: [['k3-change', '{ index, label }', 'The most visible view changed']],
    slots: [['(default)', 'Views, first to last — each child gets slot="frame-N"']],
    'css-parts': [
      ['card', 'Tilted card'],
      ['frame', 'Wrapper of each view'],
      ['lens', 'Plastic ridges'],
    ],
  },
  'card-scratch': {
    properties: [
      ['type', "'line'|'circle'|'spray'|'brush'", 'line', 'Erase style'],
      ['radius', 'number', '30', 'Line width · circle radius · spray diameter (px)'],
      ['spray-points · spray-dot-size', 'number', '30 · 4', 'Spray dots per step · dot size (px)'],
      ['brush', 'string', "''", 'Brush image URL (empty = built-in)'],
      ['cover', "'silver'|'gold'|URL", 'silver', 'Scratch layer'],
      ['label', 'string', 'Scratch here', 'Engraved text (localized; "" = none)'],
      ['reveal-at', 'number', '50', 'Share (%) revealing the rest on release'],
      ['reveal-duration', 'number', '0', 'Final fade (ms), 0 = at once'],
      ['revealed', 'boolean', 'false', 'Everything revealed — set to reveal'],
    ],
    methods: [
      ['reveal', '() => void', 'Reveal everything'],
      ['reset', '() => void', 'Put an intact cover back'],
      ['percent', 'number (get)', 'Scratched share, 0 … 100'],
    ],
    events: [
      ['k3-scratch', '{ percent }', 'While scratching, and on reset'],
      ['k3-reveal', '{ percent: 100 }', 'Once, when everything is revealed'],
      ['k3-error', "{ reason: 'cover'|'brush' }", 'Image not loaded (silver / built-in brush used)'],
    ],
    slots: [['(default)', 'Content to reveal']],
    'css-parts': [
      ['content', 'Revealed content'],
      ['cover', 'Scratch layer (canvas)'],
      ['reveal', 'Keyboard “Reveal all” button'],
    ],
  },
  'charts-bar': {
    properties: [
      ['type', "'bar'|…", 'bar', 'Chart type (bar on this page)'],
      ['data', 'ChartData', '{}', 'labels + datasets'],
      ['options', 'ChartOptions', 'null', 'Merged over K3 theme defaults'],
      ['height', 'number', '280', 'Frame height (CSS px); unset → --k3-chart-height'],
      ['update-mode', 'UpdateMode', 'default', 'Update mode on data / options change'],
      ['label', 'string', "''", 'aria-label override'],
    ],
    methods: [
      ['getChart', '() => Chart|null', 'Underlying chart instance'],
      ['refresh', '(mode?) => void', 'Force a chart update'],
      ['toBase64Image', '(type?, quality?) => string', 'PNG / JPEG data URL'],
    ],
    'css-parts': [
      ['frame', 'Sized chart frame'],
      ['canvas', 'Chart canvas'],
    ],
  },
  'charts-line': {
    properties: [
      ['type', "'line'|…", 'line', 'Chart type (line on this page)'],
      ['data', 'ChartData', '{}', 'labels + datasets (fill / tension supported)'],
      ['options', 'ChartOptions', 'null', 'Merged over K3 theme defaults'],
      ['height', 'number', '280', 'Frame height (CSS px); unset → --k3-chart-height'],
    ],
    methods: [
      ['getChart / refresh / toBase64Image', '—', 'Same as Bar charts'],
    ],
    'css-parts': [
      ['frame', 'Sized chart frame'],
      ['canvas', 'Chart canvas'],
    ],
  },
  'charts-other': {
    properties: [
      [
        'type',
        "'pie'|'doughnut'|'radar'|'polarArea'|'bubble'|'scatter'",
        'pie',
        'Non bar/line chart types',
      ],
      ['data', 'ChartData', '{}', 'Type-specific datasets'],
      ['options', 'ChartOptions', 'null', 'Merged over K3 theme defaults'],
      ['height', 'number', '280', 'Frame height (CSS px); unset → --k3-chart-height'],
    ],
    methods: [
      ['getChart / refresh / toBase64Image', '—', 'Same as Bar charts'],
    ],
    'css-parts': [
      ['frame', 'Sized chart frame'],
      ['canvas', 'Chart canvas'],
    ],
  },
  breadcrumb: {
    properties: [
      ['items', 'BreadcrumbItem[]', '[]', 'Trail JSON'],
      ['variant', "'plain'|'tonal'|'filled'", 'plain', 'Crumb chrome'],
      ['separator', "'chevron'|'slash'|'dot'|'arrow'", 'chevron', 'Divider style'],
      ['size', "'sm'|'md'|'lg'", 'md', 'Type scale'],
      ['show-icons', 'boolean', 'true', 'Leading icons'],
      ['collapse-after', 'number', 'null', 'Collapse middle crumbs'],
    ],
    events: [['k3-select', '{ item, index }', 'Crumb activated']],
  },
  pagination: {
    properties: [
      ['page', 'number', '1', 'Current page (1-based)'],
      ['count', 'number', '10', 'Total pages'],
      ['sibling-count', 'number', '1', 'Neighbors around current'],
      ['show-first / show-last / show-prev / show-next', 'boolean', 'true', 'Nav buttons'],
      ['disabled', 'boolean', 'false', 'Non-interactive'],
    ],
    events: [['k3-change', '{ page }', 'Page changed']],
    methods: [['goTo', '(page) => void', 'Navigate if in range']],
  },
  'pagination-alpha': {
    properties: [
      ['items', 'string[]', '[]', 'Labels for counts'],
      ['active-letter', 'string', 'A', 'Highlighted letter'],
      ['size', "'sm'|'md'|'lg'", 'md', 'Hit target scale'],
      ['orientation', "'horizontal'|'vertical'", 'horizontal', 'Layout'],
      ['show-count', 'boolean', 'true', 'Per-letter counts'],
      ['show-disabled', 'boolean', 'true', 'Show zero-count letters'],
    ],
    events: [['k3-select', '{ letter }', 'Letter chosen']],
  },
  'index-list': {
    properties: [
      ['items', 'IndexListItem[]', '[]', 'Directory rows'],
      ['show-rail', 'boolean', 'true', 'A–Z scrub rail'],
      ['sticky-headers', 'boolean', 'true', 'Pin section titles'],
      ['rail-scrub', 'boolean', 'true', 'Drag on rail'],
      ['hide-empty-keys', 'boolean', 'false', 'Omit empty sections'],
    ],
    events: [['k3-section-change', '{ key }', 'Active section']],
    methods: [['scrollToKey', '(key, fromUser?) => void', 'Scroll to section']],
  },
  'scroll-to-top': {
    properties: [
      [
        'variant',
        "'primary'|'secondary'|'tertiary'|'surface'",
        'primary',
        'Same roles as k3-fab-menu trigger',
      ],
      ['threshold', 'number', '80', 'Show after scrollY > threshold'],
      ['size', 'number', '56', 'FAB diameter'],
      ['show-progress', 'boolean', 'true', 'SVG progress ring'],
      ['scroll-container', 'string', '—', 'CSS selector · empty = window'],
      ['icon', 'string', 'keyboard_arrow_up', 'Inner glyph'],
      ['scroll-duration', 'number', '450', 'Smooth scroll ms'],
    ],
    events: [['k3-scroll-top', '—', 'Scroll animation finished']],
    methods: [['scrollToTop', '() => void', 'Scroll active root to top']],
  },
  'buttons-menu': {
    properties: [
      ['label', 'string', 'Menu', 'Trigger label'],
      ['variant', "'filled'|'tonal'|'outlined'|'text'|'elevated'", 'filled', 'Trigger style'],
      ['size', "'xs'|'sm'|'md'|'lg'", 'sm', 'Height'],
      ['align', "'start'|'end'", 'start', 'Menu align'],
      ['open', 'boolean', 'false', 'Menu open'],
      ['disabled', 'boolean', 'false', 'Disables trigger'],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open menu'],
      ['hide', "(source?) => Promise<boolean>", 'Close menu'],
    ],
    slots: [['(default)', 'k3-menu-item children']],
  },
  'buttons-pill': {
    properties: [
      [
        'layout',
        "'vertical'|'horizontal'",
        'vertical',
        'Icon pill + label below · or icon+label row pill',
      ],
      ['selected', 'boolean', 'false', 'Active indicator (secondary-container)'],
      ['menu-open', 'boolean', 'false', 'Keep hover pill while a flyout is open'],
      ['stretch', 'boolean', 'false', 'Full-width host (rail expanded rows)'],
      ['icon', 'string', "''", 'Material Symbols ligature (or slot=icon)'],
      ['label', 'string', "''", 'Visible label'],
      ['href', 'string', "''", 'Optional link — renders <a>'],
      ['disabled', 'boolean', 'false', 'Disables'],
    ],
    events: [
      ['k3-activate', 'href, label, selected', 'Activated (click)'],
      ['k3-press-start / k3-press-end', '—', 'Lifecycle around press'],
    ],
    slots: [
      ['(default)', 'Extra label content'],
      ['icon', 'Custom icon when icon attribute empty'],
    ],
  },
  'text-field': {
    properties: [
      ['label', 'string', "''", 'Floating label'],
      ['value', 'string', "''", 'Input value'],
      ['variant', "'filled'|'outlined'|'standard'", 'filled', 'Chrome'],
      ['type', "'text'|…|'number'", 'text', 'Native input type'],
      ['multiline', 'boolean', 'false', 'Use textarea (prefer k3-textarea)'],
      ['supporting-text', 'string', "''", 'Helper under field'],
      ['error', 'string', "''", 'Error — replaces supporting + error colors'],
      ['prefix-text', 'string', "''", 'Affix before value'],
      ['suffix-text', 'string', "''", 'Affix after value'],
      ['max-length', 'number', 'null', 'Limit + character counter'],
      ['password-toggle', 'boolean', 'true', 'Eye toggle when type=password'],
      ['clearable', 'boolean', 'false', 'Trailing clear when value non-empty'],
      ['disabled', 'boolean', 'false', 'Disables'],
      ['readonly', 'boolean', 'false', 'Read-only'],
      ['required', 'boolean', 'false', 'Required'],
    ],
    events: [
      ['k3-input', 'value', 'Each keystroke'],
      ['k3-change', 'value', 'Commit'],
      ['k3-password-toggle', 'revealed', 'Password visibility toggled'],
      ['k3-clear', '—', 'Clearable trailing pressed'],
    ],
    slots: [
      ['leading-icon', '24 dp start icon'],
      ['trailing-icon', '24 dp end icon (skipped if password-toggle)'],
    ],
    'css-parts': [
      ['container', 'Field chrome'],
      ['outline', 'Outlined fieldset cutout'],
      ['label', 'Floating label'],
      ['input', 'Native control'],
      ['supporting', 'Helper / error row'],
      ['counter', 'n/max'],
    ],
  },
  textarea: {
    properties: [
      ['label', 'string', "''", 'Floating / static label'],
      ['value', 'string', "''", 'Text'],
      ['variant', "'filled'|'outlined'|'standard'", 'filled', 'Chrome'],
      ['rows', 'number', '4', 'Visible rows'],
      ['supporting-text', 'string', "''", 'Helper'],
      ['error', 'string', "''", 'Error message'],
      ['max-length', 'number', 'null', 'Counter'],
      ['clearable', 'boolean', 'false', 'Trailing clear'],
      ['disabled', 'boolean', 'false', 'Disables'],
    ],
    events: [
      ['k3-input', 'value', 'Each keystroke'],
      ['k3-change', 'value', 'Commit'],
      ['k3-clear', '—', 'Clearable trailing pressed'],
    ],
    slots: [
      ['leading-icon', 'Optional'],
      ['trailing-icon', 'Optional'],
    ],
  },
  'field-group': {
    properties: [
      ['label', 'string', "''", 'Legend (cuts top border)'],
      ['supporting-text', 'string', "''", 'Helper under group'],
      ['error', 'string', "''", 'Error — replaces supporting + outline'],
      ['disabled', 'boolean', 'false', 'Disables fieldset + children'],
    ],
    events: [],
    slots: [['(default)', 'k3-text-field · k3-select · k3-checkbox · …']],
    'css-parts': [
      ['fieldset', 'Fieldset shell'],
      ['legend', 'Legend label'],
      ['body', 'Stacked content'],
      ['supporting', 'Helper / error'],
    ],
  },
  'pin-field': {
    properties: [
      ['label', 'string', "''", 'Static label above cells'],
      ['value', 'string', "''", 'Joined code'],
      ['length', 'number', '6', 'Cell count (2–12)'],
      ['charset', "'numeric'|'alpha'|'alphanumeric'", 'numeric', 'Allowed characters'],
      ['mask', 'boolean', 'false', 'Show bullets'],
      ['group-size', 'number', '0', 'Separator every N cells'],
      ['separator', 'string', "'–'", 'Between groups'],
      ['variant', "'filled'|'outlined'|'standard'", 'outlined', 'Cell chrome'],
      ['supporting-text', 'string', "''", 'Helper'],
      ['error', 'string', "''", 'Error message (red borders)'],
      ['success-text', 'string', "''", 'Success helper (green borders when active)'],
      ['disabled', 'boolean', 'false', 'Disables'],
    ],
    methods: [
      ['success', '(message?: string) => void', 'Mark PIN correct — green borders'],
      ['clearSuccess', '() => void', 'Clear success chrome'],
    ],
    events: [
      ['k3-input', 'value', 'Each change'],
      ['k3-change', 'value', 'Commit'],
      ['k3-complete', 'value', 'All cells filled'],
      ['k3-success', 'value, message', 'After success()'],
    ],
    slots: [],
    'css-parts': [
      ['label', 'Static label'],
      ['row', 'Cell row'],
      ['cell', 'Single character input'],
      ['supporting', 'Helper / error / success'],
    ],
  },
  select: {
    properties: [
      ['label', 'string', "''", 'Passed to k3-text-field trigger'],
      ['value', 'string', "''", 'Selected option value'],
      ['variant', "'outlined'|'filled'|'standard'", 'outlined', 'Trigger = text-field chrome'],
      ['placeholder', 'string', "''", 'Empty-state text'],
      ['supporting-text', 'string', "''", 'Helper under trigger'],
      ['disabled', 'boolean', 'false', 'Disables control'],
      ['required', 'boolean', 'false', 'Required'],
      ['error', 'string', "''", 'Supporting error text'],
      ['open', 'boolean', 'false', 'Menu open (reflect)'],
    ],
    methods: [['syncSelection', '() => void', 'Re-sync checks from value']],
    events: [['k3-change', 'value', 'Selection changed']],
    slots: [['(default)', 'k3-menu-item options']],
    'css-parts': [
      ['container', 'k3-text-field trigger'],
      ['menu', 'Dropdown panel'],
      ['trailing-icon', 'Chevron'],
    ],
  },
  checkbox: {
    properties: [
      ['checked', 'boolean', 'false', 'Checked'],
      ['indeterminate', 'boolean', 'false', 'Mixed'],
      ['disabled', 'boolean', 'false', 'Disables'],
      ['name', 'string', "''", 'Form name'],
      ['value', 'string', 'on', 'Form value'],
    ],
    events: [['k3-change', 'checked', 'Toggled']],
  },
  radio: {
    properties: [
      ['checked', 'boolean', 'false', 'Selected'],
      ['disabled', 'boolean', 'false', 'Disables'],
      ['name', 'string', "''", 'Group name'],
      ['value', 'string', "''", 'Option value'],
    ],
    events: [['k3-change', 'checked', 'Selected']],
  },
  switch: {
    properties: [
      ['selected', 'boolean', 'false', 'On'],
      ['disabled', 'boolean', 'false', 'Disables'],
      ['name', 'string', "''", 'Form name'],
      ['value', 'string', 'on', 'Form value'],
    ],
    events: [['k3-change', 'selected', 'Toggled']],
  },
  chip: {
    properties: [
      [
        'variant',
        "'assist'|'filter'|'input'|'suggestion'|''",
        "''",
        'input → clear; filter → check when selected',
      ],
      ['selected', 'boolean', 'false', 'Selected / filter'],
      ['elevated', 'boolean', 'false', 'Elevation 1 (not input)'],
      ['removable', 'boolean', 'false', 'Trailing close (also on when variant=input)'],
      ['disabled', 'boolean', 'false', 'Disables'],
      [
        'disabled-interactive',
        'boolean',
        'false',
        'Disabled but focusable',
      ],
      ['dragged', 'boolean', 'false', 'M3 dragged affordance'],
      [
        'drag-handle',
        'boolean',
        'false',
        'Leading ⋮⋮ grip (auto on chip-set sortable)',
      ],
      ['value', 'string', "''", 'Id for chip-set'],
      [
        'status',
        "'available'|…|'warning'|''",
        "''",
        'Static pill — table + forced tones',
      ],
      ['has-icon', 'boolean', 'false', 'Leading icon 18 / filter check'],
      ['has-avatar', 'boolean', 'false', 'Leading avatar 24 (input)'],
      ['has-trailing', 'boolean', 'false', 'Trailing icon slotted'],
    ],
    events: [
      ['k3-change', 'selected, value', 'Toggled (filter) / activated'],
      ['k3-remove', 'value', 'Remove / Backspace / Delete'],
      ['k3-trailing-click', 'value', 'Filter trailing menu button'],
    ],
    slots: [
      ['(default)', 'Label text'],
      ['icon', 'Leading icon (18)'],
      ['avatar', 'Leading avatar (24 · input)'],
      ['trailing', 'Trailing icon (filter → menu button)'],
    ],
    methods: [
      [
        'k3-chip-set › selectedValues()',
        '() => string[]',
        'Selected values in the set',
      ],
    ],
    /* chip-set host attrs (documented on Chips page) */
    options: [
      [
        'k3-chip-set selection',
        "'multi'|'single'|'none'",
        'multi',
        'Selection model',
      ],
      ['k3-chip-set label', 'string', "''", 'aria-label on group'],
      [
        'k3-chip-set sortable',
        'boolean',
        'false',
        'Reorder chips via drag (attachSortable)',
      ],
      [
        'k3-chip-set › k3-reorder',
        'CustomEvent',
        '—',
        '{ from, to, item, values } after drop',
      ],
    ],
  },
  slider: {
    properties: [
      ['variant', "'standard'|'centered'|'range'", 'standard', 'Range = horizontal only (M3)'],
      ['size', "'xs'|'sm'|'md'|'lg'|'xl'", 'xs', 'Track / handle scale'],
      ['orientation', "'horizontal'|'vertical'", 'horizontal', 'Vertical default: min at bottom'],
      ['top-to-bottom', 'boolean', 'false', 'Vertical only — min at top'],
      ['color', "'primary'|'secondary'|'tertiary'|'error'", 'primary', 'Active / handle role'],
      ['value', 'number', '0', 'Standard / centered value'],
      ['value-start / value-end', 'number', '0 / 100', 'Range handles'],
      ['min / max / step', 'number', '0 / 100 / 1', 'Bounds + snap'],
      ['stops', 'boolean', 'false', 'Discrete stop indicators'],
      ['stop-labels', 'string', "''", 'Comma labels aligned to stops'],
      ['value-indicator', 'boolean', 'false', 'Bubble while dragging (range: active handle only)'],
      ['inset-icon', 'boolean', 'false', 'Icon in track (standard · md+)'],
      ['label', 'string', "''", 'Visible + a11y label'],
      ['for / for-start / for-end', 'string', "''", 'Linked input / k3-text-field id(s)'],
      ['disabled', 'boolean', 'false', 'Track 12% · active/handle 38% on-surface'],
    ],
    slots: [
      ['label-icon', 'Leading icon in the label row (optional)'],
      ['icon', 'Inset icon in the track (standard · md+)'],
      [
        'icon-min',
        'Alternate inset glyph at min (any icon — volume_off, mic_off, wifi_off, …)',
      ],
      ['start', 'Addon toward min (−); vertical → bottom (or top if top-to-bottom)'],
      ['end', 'Addon toward max (+)'],
    ],
    events: [
      ['k3-input', '{ value [, valueStart, valueEnd] }', 'Live updates'],
      ['k3-change', '{ value [, valueStart, valueEnd] }', 'Commit on pointer up'],
    ],
    'css-parts': [
      ['root', 'Host layout'],
      ['rail', 'start · stack · end'],
      ['stack', 'label + area (4dp gap)'],
      ['label / label-icon', 'Label row (−90° when vertical)'],
      ['start / end', 'Addon wrappers'],
      ['area', 'Interactive track hit target'],
      ['track', 'Track container'],
      ['active / inactive', 'Track segments'],
      ['handle', 'Bar handle(s) + k3-focus-ring'],
      ['stop / end-stop / stop-label', 'Stops + optional tick labels'],
      ['inset-icon', 'Optional track icon'],
      ['value-indicator', 'Drag bubble'],
    ],
  },
  'mood-calendar': {
    properties: [
      ['year', 'number', 'current', 'Active year tab'],
      ['years', 'number[]', 'n−1 · current', 'Year tabs (property; defaultMoodYears())'],
      ['entries', 'MoodEntry[]', 'null', 'App data; null + demo → generated'],
      ['legend', 'MoodMeta[]', '8 moods', 'Colors + labels (property)'],
      ['demo', 'boolean', 'true', 'Generate fake year when entries empty'],
    ],
    events: [
      ['k3-change', '{ date, entry }', 'Day selected → opens k3-dialog'],
      ['k3-year-change', '{ year }', 'Year tab changed'],
      ['k3-filter-change', '{ mood }', 'Legend filter (null = clear)'],
    ],
  },
  'date-picker': {
    properties: [
      ['value', 'string', "''", 'yyyy-MM-dd'],
      ['for', 'string', "''", 'Single date, or one-field range (Du/Au)'],
      ['for-start / for-end', 'string', "''", 'Two-field range (one ISO each)'],
      ['variant', "'docked'|'modal'|'auto'", 'docked', 'Single date only — range always modal'],
      ['range', 'boolean', 'false', 'Modal range · scroll months · OK needs both ends'],
      ['range-start / range-end', 'string', "''", 'Range bounds (yyyy-MM-dd)'],
      ['layout', "'paged'|'scroll'|'auto'", 'auto', 'auto → scroll when range (Noph)'],
      ['months', 'number', '1', 'Paged panes / scroll viewport hint'],
      ['min-date / max-date', 'string', "''", 'Selectable bounds'],
      ['start-view', "'month'|'year'|'multi-year'", 'month', 'Initial calendar view'],
      ['start-at', 'string', "''", 'Initial visible month/year'],
      ['clearable', 'boolean', 'false', 'Show Clear action'],
      ['disabled', 'boolean', 'false', 'Blocks open'],
      ['blackoutDates / specialDates', '(d) => boolean', '—', 'JS predicates'],
    ],
    events: [
      ['k3-input', '{ value, date, rangeStart, rangeEnd }', 'Draft changes'],
      ['k3-change', '{ value, date, rangeStart, rangeEnd }', 'Confirmed with OK'],
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close'],
    ],
    methods: [
      ['show(anchor?)', 'Promise<boolean>', 'Open the picker'],
      ['hide(commit?)', 'Promise<boolean>', 'Close; commit=true writes value'],
      ['toggle(anchor?)', 'Promise<boolean>', 'Toggle open state'],
    ],
    'css-parts': [['surface', 'Dialog / popover surface']],
  },
  'time-picker': {
    properties: [
      ['value', 'string', "''", 'HH:mm or HH:mm:ss'],
      ['for', 'string', "''", 'Id of field to sync on OK'],
      ['variant', "'docked'|'modal'|'auto'", 'docked', 'Docked anchors to `for` field'],
      ['mode', "'dial'|'input'|'auto'", 'dial', 'Default selection mode'],
      ['format', "'12'|'24'|'auto'", '12', 'Hour cycle'],
      ['orientation', "'vertical'|'horizontal'|'auto'", 'vertical', 'Dial layout only · keyboard always vertical'],
      ['min-time', 'string', "''", 'Earliest selectable time'],
      ['max-time', 'string', "''", 'Latest selectable time'],
      ['show-seconds', 'boolean', 'false', 'Show seconds segment'],
      ['minute-step', 'number', '1', 'Snap minutes on dial / keyboard'],
      ['second-step', 'number', '1', 'Snap seconds when shown'],
      ['disabled', 'boolean', 'false', 'Blocks open and interaction'],
      ['hide-mode-toggle', 'boolean', 'false', 'Hide dial/keyboard toggle'],
      ['hide-format-toggle', 'boolean', 'false', 'Hide 12h/24h icon toggle'],
      ['blackoutTimes', '(t) => boolean', '—', 'JS predicate — blocked times'],
    ],
    events: [
      ['k3-input', '{ value, hour, minute, second }', 'Draft changes (live)'],
      ['k3-change', '{ value, hour, minute, second }', 'Confirmed with OK'],
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close'],
    ],
    methods: [
      ['show(anchor?)', 'Promise<boolean>', 'Open the picker'],
      ['hide(commit?)', 'Promise<boolean>', 'Close; commit=true writes value'],
      ['toggle(anchor?)', 'Promise<boolean>', 'Toggle open state'],
    ],
    'css-parts': [['surface', 'Dialog / popover surface']],
  },
  progress: {
    properties: [
      ['variant', "'linear'|'circular'", 'linear', 'Bar or ring'],
      ['value', 'number', '0', '0–1 determinate'],
      ['indeterminate', 'boolean', 'false', 'Indeterminate'],
      ['shape', "'flat'|'wavy'", 'flat', 'M3E wavy track'],
      ['layout', "'default'|'top'|'bottom'", 'default', 'Linear chrome (label/value vs bar)'],
      ['show-percent', 'boolean', 'false', 'Show trailing value %'],
      [
        'percent-position',
        "'trailing'|'inside'|'below'",
        'trailing',
        'Circular: inside ring or below',
      ],
      ['label', 'string', "''", 'Leading caption (or slot=leading)'],
      ['supporting-text', 'string', "''", 'Under chrome (or slot=supporting)'],
      ['show-stop', 'boolean', 'true', 'Linear determinate end stop'],
      ['thickness', 'number', '4', 'Stroke dp (track + active)'],
      ['size', 'number', '0', 'Circular diameter dp (0 = 40 / 48 wavy)'],
    ],
    slots: [
      ['leading', 'Label ± icon'],
      ['trailing', 'Value % (default from show-percent)'],
      ['supporting', 'Optional text under everything'],
    ],
  },
  loading: {
    properties: [['indeterminate', 'boolean', 'true', 'Morph spinner']],
  },
  snackbar: {
    properties: [
      [
        'duration',
        "'short'|'long'|'indefinite'|number",
        'short',
        '4s · 10s · stay open · or ms (`0` = indefinite)',
      ],
      ['action', 'string', "''", 'Optional text action (or use slot)'],
      ['dismissible', 'boolean', 'false', 'Trailing close after action'],
      ['close-label', 'string', "''", 'a11y label for dismiss'],
      [
        'position',
        "'center'|'start'|'end'|'auto'",
        'center',
        'Bottom edge — center default (MDC); start/end opt-in',
      ],
      ['stacked', 'boolean', 'false', 'Force 3rd row — also auto if action > 128 dp'],
      [
        'queue-behavior',
        "'queue'|'replace'|'bypass'",
        'queue',
        'One-at-a-time queue (M3)',
      ],
      ['chrome-inset', 'boolean', 'true', 'Nudge above FAB / bottom bar'],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open via queue'],
      ['showNow', '() => Promise<boolean>', 'Open immediately (no queue)'],
      ['hide', "(source?) => Promise<boolean>", 'Close'],
    ],
    events: [
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close'],
      ['k3-action', '{ source }', 'Action clicked (then dismisses)'],
    ],
    slots: [
      ['(default)', 'Supporting text (1–2 lines)'],
      ['action', 'Optional action control'],
      ['trailing', 'Optional trailing content (before built-in close)'],
    ],
    'css-parts': [
      ['container', 'Bar surface'],
      ['label', 'Supporting text'],
      ['trailing-group', 'Action + trailing + dismiss'],
      ['action', 'Action wrapper'],
      ['action-button', 'Built-in action button'],
      ['trailing', 'Trailing slot wrapper'],
      ['dismiss', 'Close icon button'],
    ],
  },
  tooltip: {
    properties: [
      ['variant', "'plain'|'rich'", 'plain', 'Plain inverse · rich surface + actions'],
      ['content', 'string', "''", 'Plain label · rich supporting text'],
      ['headline', 'string', "''", 'Rich subhead / title'],
      [
        'position',
        "'top'|'bottom'|'left'|'right'|'start'|'end'|'top-start'|'top-end'|'bottom-start'|'bottom-end'",
        'top',
        'Side of the anchor (logical start/end + corners)',
      ],
    ],
    events: [['k3-action', '{ source }', 'Action button clicked (rich)']],
    slots: [
      ['(default)', 'Anchor content'],
      ['headline', 'Rich title (optional)'],
      ['content', 'Plain / rich body (optional)'],
      ['actions', 'Rich action buttons (k3-button)'],
    ],
  },
  badge: {
    properties: [
      ['value', 'string | number', "''", 'Count / label (large)'],
      ['max', 'number', '999', 'Above → "{max}+" (M3 4-char cap)'],
      ['dot', 'boolean', 'false', '6 dp notification dot'],
      [
        'position',
        "'top-end'|…|'bottom-left'",
        'top-end',
        'Corner — logical (*-start/end) or physical (*-left/right)',
      ],
      ['show-zero', 'boolean', 'false', 'Show large badge when value is 0'],
    ],
    slots: [
      ['(default)', 'Anchor (icon / button)'],
      ['badge', 'Optional custom badge content'],
    ],
  },
  avatar: {
    properties: [
      ['size', "'sm'|'md'|'lg'", 'md', 'Face size 32 · 40 · 56'],
      ['variant', "'filled'|'outlined'|'elevated'", 'filled', 'Surface'],
      ['shape', "'circle'|'rounded'|'square'", 'circle', 'Corner'],
      ['tone', "'auto'|semantic", 'auto', 'Container color (auto from name)'],
      ['name', 'string', "''", 'Accessible label + initials source'],
      ['src', 'string', "''", 'Image URL'],
      ['initials', 'string', "''", 'Override initials'],
      ['status', 'online|offline|idle|away|dnd|busy', "''", 'Presence badge'],
      ['badge-icon', 'string', "''", 'Symbol inside status badge'],
      ['interactive', 'boolean', 'false', 'Button face (menu trigger)'],
      ['max', 'number', '0', 'Group: visible avatars before +N'],
      ['layout', "'stack'|'grid'", 'stack', 'Group layout'],
    ],
    slots: [
      ['(default)', 'Optional overlay content'],
      ['fallback', 'Custom fallback instead of initials'],
      ['icon', 'Fallback icon when no name'],
      ['badge', 'Custom badge (replaces status)'],
    ],
    'css-parts': [
      ['face', 'Circle / square surface'],
      ['image', 'Loaded photo'],
      ['fallback', 'Initials or icon'],
      ['badge', 'Status / custom badge'],
      ['container', 'Group row / grid'],
      ['count', 'Overflow +N chip'],
    ],
  },
  list: {
    properties: [['elevated', 'boolean', 'false', 'Elevated surface']],
    slots: [['(default)', 'k3-list-item children']],
  },
  'app-bar': {
    properties: [
      ['size', "'small'|'medium'|'large'", 'small', 'Bar height'],
      ['align', "'start'|'center'", 'start', 'Title align (small)'],
      ['sticky', 'boolean', 'false', 'position sticky'],
      ['elevated', 'boolean', 'false', 'Scroll fill'],
    ],
    slots: [
      ['leading', 'Leading actions'],
      ['headline', 'Title'],
      ['trailing', 'Trailing actions'],
    ],
  },
  'footer-bar': {
    properties: [
      ['elevated', 'boolean', 'false', 'Surface lift'],
      ['sticky', 'boolean', 'false', 'Stick to bottom'],
    ],
    slots: [['actions', 'Buttons'], ['fab', 'FAB slot']],
  },
  tabs: {
    properties: [
      ['variant', "'primary'|'secondary'", 'secondary', 'Indicator style'],
      ['index', 'number', '0', 'Active tab'],
      ['labels', 'string', 'Tab 1,Tab 2', 'CSV labels'],
      ['icons', 'string', "''", 'CSV icon names'],
    ],
    events: [['k3-change', '{ index }', 'Tab changed']],
  },
  'navigation-rail': {
    properties: [
      ['active', 'number', '0', 'Active index'],
      ['size', "'compact'|'large'", 'compact', 'Width'],
      ['expanded', 'boolean', 'false', 'Large layout (synced with size)'],
      ['collapsible', 'boolean', 'false', 'menu / menu_open toggle'],
      ['layout', "'modal'|'standard'", 'modal', 'Expanded chrome — modal (edge-docked, end radii, elev-1) · standard (flush, no sheet)'],
      ['position', "'start'|'center'|'bottom'", 'start', 'Leading destinations group alignment'],
      ['appearance', "'modal'|'standard'", 'modal', 'Deprecated alias of layout'],
    ],
    events: [
      ['k3-change', '{ index }', 'Selection'],
      ['k3-expand', '{ expanded }', 'Collapsed ↔ expanded'],
    ],
    slots: [
      ['(default)', 'Leading k3-nav-item children'],
      ['leading', 'Leading destinations (same as default)'],
      ['trailing', 'Bottom destinations — horizontal divider'],
      ['fab', 'k3-extended-fab (header morph · optional k3-fab twin hidden)'],
      ['foot', 'Deprecated alias of trailing'],
    ],
  },
  'navigation-bar': {
    properties: [
      ['active', 'number', '0', 'Active index'],
      ['layout', "'vertical'|'horizontal'", 'vertical', 'Item layout'],
    ],
    events: [['k3-change', '{ index }', 'Selection']],
    slots: [['(default)', 'k3-nav-item children']],
  },
  toolbar: {
    properties: [
      ['variant', "'docked'|'floating'", 'floating', 'Docked strip · floating bar'],
      ['shape', "'full'|'rounded'", 'full', 'Floating: pill · Extra large 28dp (Meet)'],
      ['expanded', 'boolean', 'false', 'Show slot=expand (scaleY upward · menu enter)'],
      ['color', "'standard'|'vibrant'", 'standard', 'Surface vs primary-container'],
      ['orientation', "'horizontal'|'vertical'", 'horizontal', 'Vertical = floating only'],
      ['layout', "'cluster'|'spread'", 'cluster', 'Docked: 32dp gaps · fill groups'],
      ['sticky', 'boolean', 'false', 'Docked — stick to scrollport bottom'],
      ['elevated', 'boolean', 'false', 'Docked — top elevation shadow'],
      ['label', 'string', "''", 'aria-label for role=toolbar'],
    ],
    slots: [
      ['(default)', 'Actions — icon buttons, buttons, text fields'],
      ['expand', 'Panel above actions (Meet reactions · scaleY)'],
      ['leading', 'Docked spread — start group'],
      ['trailing', 'Docked spread — end group'],
      ['fab', 'Paired FAB (8dp gap)'],
    ],
  },
  sheet: {
    properties: [
      ['placement', "'bottom'|'side'", 'bottom', 'Sheet type'],
      ['side', "'start'|'end'", 'end', 'Side sheet edge'],
      [
        'width',
        "'standard'|'full'",
        'standard',
        'Bottom: M3 max 640dp centered · full = edge-to-edge',
      ],
      ['modal', 'boolean', 'true', 'Scrim + trap'],
      ['close-action', 'boolean', 'true', 'Trailing close icon (LTR/RTL end)'],
      ['open', 'boolean', 'false', 'Visibility'],
      [
        'rail-attached',
        'boolean',
        'false',
        'Nav-rail extension — no body portal, under rail',
      ],
      ['draggable', 'boolean', 'true', 'Drag dismiss'],
    ],
    methods: [
      ['show', '() => Promise<boolean>', 'Open'],
      ['hide', "(source?) => Promise<boolean>", 'Close'],
    ],
    events: [
      ['k3-open-start / k3-open-end', 'LifecycleDetail', 'Open'],
      ['k3-close-start / k3-close-end', 'LifecycleDetail', 'Close'],
    ],
    slots: [['headline', 'Title'], ['(default)', 'Body'], ['actions', 'Buttons']],
  },
  'color-roles': {
    init: [
      ['theme.seed', 'string (hex)', '#6750A4', 'Dynamic color seed'],
      [
        'theme.mode',
        "'light'|'dark'|'auto'|'system'",
        'auto',
        'auto = 07–18h light · system = OS',
      ],
      [
        'theme.variant',
        "'tonalspot'|'vibrant'|'fidelity'|'expressive'|'monochrome'|'neutral'|'rainbow'|'fruitsalad'",
        'expressive',
        'MCU scheme',
      ],
      ['theme.contrast', "'default'|'medium'|'high'", 'default', 'MCU contrastLevel 0 / 0.5 / 1'],
      ['theme.motion', "'expressive'|'standard'", 'expressive', 'Motion scheme'],
    ],
    options: [
      ['locale', 'LocaleCode', 'detect', 'i18n locale'],
      ['components', "'all'|string[]", 'all', 'Registry load set'],
      ['debug', 'boolean|{level}', 'false', 'Logger'],
      ['haptic', 'boolean', 'true', 'Vibrate feedback'],
    ],
    methods: [
      ['K3UI.init(options?)', '() => Promise<K3UIGlobal>', 'Bootstrap'],
      ['K3UI.theme.apply(options)', 'void', 'Apply dynamic color / motion'],
      ['K3UI.i18n.setLocale(code)', 'void', 'Switch locale'],
    ],
  },
  'color-palettes': {
    init: [
      ['theme.seed', 'string (hex)', '#6750A4', 'Dynamic color seed'],
      [
        'theme.variant',
        "'tonalspot'|'vibrant'|'fidelity'|'expressive'|'monochrome'|'neutral'|'rainbow'|'fruitsalad'",
        'expressive',
        'MCU scheme',
      ],
      ['theme.contrast', "'default'|'medium'|'high'", 'default', 'MCU contrastLevel'],
    ],
    methods: [
      ['K3UI.theme.apply(options)', 'void', 'Rebuild tonal ladders from seed'],
    ],
  },
  'color-extras': {
    init: [
      [
        '--k3-ref-palette-*',
        'CSS custom property',
        'static',
        'Reference ladders (not overwritten by theme.apply)',
      ],
    ],
    methods: [
      ['m2PaletteVar(name, tone)', 'string', 'var(--k3-ref-palette-…)'],
      ['m2PaletteHex(name, tone)', 'string|undefined', 'Raw hex swatch'],
    ],
  },
};

/** Global Init table (also shown on home). */
export const INIT_SECTION: DocTableSection = {
  id: 'init',
  title: 'Init',
  columns: OPTION_COLS,
  rows: [
    ['locale', 'LocaleCode', 'detect', 'i18n locale (fr / en / …)'],
    ['theme.seed', 'string', '#6750A4', 'Dynamic color seed'],
    [
      'theme.mode',
      "'light'|'dark'|'auto'|'system'",
      'auto',
      'auto = 07–18h light · system = OS',
    ],
    [
      'theme.variant',
      "'tonalspot'|'vibrant'|'fidelity'|'expressive'|'monochrome'|'neutral'|'rainbow'|'fruitsalad'",
      'expressive',
      'MCU scheme variant',
    ],
    ['theme.contrast', "'default'|'medium'|'high'", 'default', 'MCU contrastLevel 0 / 0.5 / 1'],
    ['theme.motion', "'expressive'|'standard'", 'expressive', 'Motion tokens'],
    ['components', "'all'|string[]", 'all', 'Which CE to register'],
    ['debug', 'boolean|{level}', 'false', 'Verbose logger'],
    ['haptic', 'boolean', 'true', 'Mobile vibrate'],
  ],
};

const SECTION_META: { id: DocTableId; title: string; columns: string }[] = [
  { id: 'specs', title: 'Specs', columns: SPEC_COLS },
  { id: 'properties', title: 'Properties', columns: PROP_COLS },
  { id: 'methods', title: 'Methods', columns: METHOD_COLS },
  { id: 'events', title: 'Events', columns: EVENT_COLS },
  { id: 'slots', title: 'Slots', columns: SLOT_COLS },
  { id: 'css-parts', title: 'CSS parts', columns: PART_COLS },
  { id: 'options', title: 'Options', columns: OPTION_COLS },
  { id: 'init', title: 'Init', columns: OPTION_COLS },
  { id: 'theming', title: 'Theming', columns: THEMING_COLS },
  { id: 'keyboard', title: 'Keyboard', columns: KEYBOARD_COLS },
  { id: 'motion', title: 'Motion', columns: MOTION_COLS },
];

/** Resolve all doc tables for a page id. */
export function docTablesForPage(pageId: string): DocTableSection[] {
  const out: DocTableSection[] = [];
  const specs = COMPONENT_SPECS[pageId];
  if (specs?.length) {
    out.push({
      id: 'specs',
      title: 'Specs',
      columns: SPEC_COLS,
      rows: specsToRows(specs),
    });
  }
  const api = COMPONENT_API[pageId];
  if (api) {
    for (const meta of SECTION_META) {
      if (meta.id === 'specs') continue;
      const rows = api[meta.id as keyof typeof api];
      if (!rows || isDocTableNa(rows) || !rows.length) continue;
      const s = section(meta.id, meta.title, meta.columns, rows);
      if (s) out.push(s);
    }
  }
  return out;
}

/** Build native <table> for light-DOM pierce styles (`_table.scss` = material.io). */
function buildSlottedTable(section: DocTableSection): HTMLTableElement {
  const cols = section.columns
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  for (const c of cols) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = c;
    hr.append(th);
  }
  thead.append(hr);
  const tbody = document.createElement('tbody');
  for (const row of section.rows) {
    const tr = document.createElement('tr');
    for (let i = 0; i < cols.length; i++) {
      const td = document.createElement('td');
      const raw = row[i] ?? '';
      /* Token / Name column — monospace like material.io type labels */
      if (i === 0 && raw && (section.id === 'specs' || section.id === 'properties')) {
        const code = document.createElement('code');
        code.textContent = raw;
        td.append(code);
      } else {
        td.textContent = raw;
      }
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(thead, tbody);
  return table;
}

/**
 * Build a k3-table section — slotted native <table> so `_table.scss`
 * applies (same path as the Tables demo / material.io Resources).
 */
export function createDocTable(section: DocTableSection): HTMLElement {
  const wrap = document.createElement('section');
  wrap.className = 'doc-table';
  wrap.dataset.docTable = section.id;

  const title = document.createElement('h2');
  title.className = 'doc-table-title';
  title.textContent = section.title;

  const host = document.createElement('k3-table');
  host.setAttribute('variant', 'outlined');
  host.append(buildSlottedTable(section));

  wrap.append(title, host);
  return wrap;
}

/** Mount all tables for a page (replaces prior `.doc-tables` block). */
export function mountDocTables(page: HTMLElement, pageId: string): void {
  page.querySelector('.doc-tables')?.remove();
  let sections = docTablesForPage(pageId);
  /* Styles pages already render Specs inside `.token-scale` */
  if (page.querySelector('.token-scale k3-table, .token-scale .doc-table-title')) {
    sections = sections.filter((s) => s.id !== 'specs');
  }
  if (!sections.length) return;

  const host = document.createElement('div');
  host.className = 'doc-tables';
  for (const s of sections) host.append(createDocTable(s));
  page.appendChild(host);
}

/** Mount a single table into a host (Styles token pages). */
export function mountTableIn(host: HTMLElement, section: DocTableSection): void {
  host.replaceChildren();
  const el = createDocTable(section);
  host.append(...el.children);
}
