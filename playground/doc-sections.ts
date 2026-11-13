/** Doc narrative sections per page — theming / keyboard / focus / motion / a11y / versions. */
export type DocNa = { na: string };
export type DocSectionTable = string[][];
export type DocSectionProse = string | DocNa;
export type DocSectionRows = DocSectionTable | DocNa;

export interface DocSections {
  theming: DocSectionRows;
  keyboard: DocSectionRows;
  focus: DocSectionProse;
  motion: DocSectionRows;
  a11y: DocSectionProse;
  versions: DocSectionProse;
}

export function isDocNa(v: unknown): v is DocNa {
  return !!v && typeof v === 'object' && 'na' in v && typeof (v as DocNa).na === 'string';
}

export const DOC_SECTIONS: Record<string, DocSections> = {
  'buttons': {
    theming: [
      ['--k3-btn-height', '2.5rem (sm)', 'Control height'],
      ['--k3-btn-radius', 'height/2', 'Resting corner (round)'],
      ['--k3-btn-pad-inline', '1rem (sm)', 'Horizontal padding'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate (native button)'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.button.focus',
    motion: [
      ['Press', 'Corner radius morphs to pressed token', 'Instant / no spring'],
      ['Select', 'Round ↔ square soft morph', 'Reduced motion skips'],
    ],
    a11y: 'doc.button.a11y',
    versions: { na: 'Single CE — no alternate layouts' },
  },
  'buttons-grid': {
    theming: [
      ['--k3-btn-grid-gap', '2dp snapped', 'Cell gap (device-pixel snap)'],
      ['--k3-btn-grid-size', '3×48 + gaps', 'Host / grid box'],
    ],
    keyboard: [
      ['Arrow keys', 'Move between cells'],
      ['Enter / Space', 'Select cell'],
      ['Escape', 'Collapse FAB mode'],
    ],
    focus: 'doc.button-grid.focus',
    motion: [
      ['FAB expand', 'Grid reveal from centre', 'Forced pad when reduced motion'],
    ],
    a11y: 'doc.button-grid.a11y',
    versions: 'doc.button-grid.versions.blurb',
  },
  'buttons-group': {
    theming: [
      ['variant', 'standard|connected', 'Gap vs 2dp seams'],
      ['size / shape', 'xs–xl · round|square', 'Propagated with sync'],
    ],
    keyboard: [
      ['Arrow keys', 'Move between children'],
      ['Enter / Space', 'Toggle selection on focused child'],
    ],
    focus: 'doc.button-group.focus',
    motion: [
      ['Select (standard)', 'Round ↔ square morph', 'Respects reduced motion'],
    ],
    a11y: 'doc.button-group.a11y',
    versions: 'doc.button-group.versions.blurb',
  },
  'buttons-icon': {
    theming: [
      ['--k3-icon-btn-size', 'size ladder', 'Host height / painted width'],
      ['variant colors', 'sys roles', 'filled · tonal · outlined · standard'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate / toggle'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.icon-button.focus',
    motion: [
      ['Press', 'Corner morph + state layer', 'Instant when reduced'],
      ['Select', 'Shape morph round ↔ square', 'Respects reduced motion'],
    ],
    a11y: 'doc.icon-button.a11y',
    versions: { na: 'Single CE — sizes/shapes/widths are scale options' },
  },
  'buttons-menu': {
    theming: [
      ['variant', 'filled|tonal|outlined|…', 'Trigger button chrome'],
      ['size', 'xs–lg', 'Trigger height'],
    ],
    keyboard: [
      ['Enter / Space', 'Open menu'],
      ['Escape', 'Close menu'],
      ['Arrow keys', 'Navigate menu items'],
    ],
    focus: 'doc.button-menu.focus',
    motion: [
      ['Open / close', 'Menu enter/exit', 'Instant when reduced'],
    ],
    a11y: 'doc.button-menu.a11y',
    versions: { na: 'Single trigger + menu layout' },
  },
  'buttons-pad': {
    theming: [
      ['variant', 'filled|tonal|outlined', 'Cell chrome'],
      ['mode', 'diagonal|cardinal', 'Geometry'],
    ],
    keyboard: [
      ['Arrow keys', 'Navigate directions'],
      ['Enter / Space', 'Activate focused cell'],
    ],
    focus: 'doc.button-pad.focus',
    motion: { na: 'Press state layer only' },
    a11y: 'doc.button-pad.a11y',
    versions: 'doc.button-pad.versions.blurb',
  },
  'buttons-pill': {
    theming: [
      ['layout', 'vertical|horizontal', 'Icon+label arrangement'],
      ['selected', 'secondary-container', 'Active destination chrome'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.button-pill.focus',
    motion: [
      ['Press', 'Hover / press morph', 'Respects reduced motion'],
    ],
    a11y: 'doc.button-pill.a11y',
    versions: 'doc.button-pill.versions.blurb',
  },
  'buttons-segmented': {
    theming: [
      ['shape', 'rounded|square', 'Outer / segment radius'],
      ['show-check', 'boolean', 'Check on selected'],
    ],
    keyboard: [
      ['Arrow keys', 'Move between segments'],
      ['Enter / Space', 'Toggle segment'],
    ],
    focus: 'doc.button-segmented.focus',
    motion: [
      ['Select', 'Segment state change', 'Respects reduced motion'],
    ],
    a11y: 'doc.button-segmented.a11y',
    versions: 'doc.button-segmented.versions.blurb',
  },
  'buttons-smart': {
    theming: [
      ['active', 'primary-container squircle', 'ON morph'],
      ['inactive', 'charcoal pill', 'OFF resting'],
    ],
    keyboard: [
      ['Enter / Space', 'Toggle active'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.button-smart.focus',
    motion: [
      ['Toggle', 'Pill ↔ squircle morph + haptic', 'Instant when reduced'],
    ],
    a11y: 'doc.button-smart.a11y',
    versions: { na: 'Single Quick Settings tile' },
  },
  'buttons-split': {
    theming: [
      ['variant / size', 'same as buttons', 'Primary + chevron pair'],
      ['gap', '2dp', 'Between primary and menu trigger'],
    ],
    keyboard: [
      ['Enter / Space (primary)', 'Primary action'],
      ['Enter / Space (chevron)', 'Open menu'],
      ['Escape', 'Close menu'],
    ],
    focus: 'doc.button-split.focus',
    motion: [
      ['Menu open', 'Menu enter/exit', 'Instant when reduced'],
    ],
    a11y: 'doc.button-split.a11y',
    versions: { na: 'Primary + menu chevron pair' },
  },
  'fab': {
    theming: [
      ['--k3-fab-size / --k3-fab-icon', '56·80·96 dp', 'Host / glyph size by size attr'],
      ['--k3-fab-radius', '16·20·28 dp', 'Soft squircle resting corner'],
      ['--k3-fab-bg / --k3-fab-fg', 'optional', 'Override role colors'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate (native button)'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.fab.focus',
    motion: [
      ['Press', 'Corner softens + elevation 3→4', 'Instant when reduced'],
      ['show / hide', 'Scale + fade visibility', 'Respects reduced motion'],
      ['round spring', 'Soft → circle pulse (menu open)', 'Skipped when reduced'],
    ],
    a11y: 'doc.fab.a11y',
    versions: { na: 'Icon-only FAB — use k3-extended-fab for labeled' },
  },
  'fab-dial': {
    theming: [
      ['position', 'corner dock', 'top/bottom × left/right'],
      ['layout', 'flower', 'Radial fan (linear → FAB Rail)'],
      ['fab-icon', 'ligature', 'Trigger Material Symbol'],
    ],
    keyboard: [
      ['Enter / Space', 'Toggle dial on trigger'],
      ['Escape', 'Close dial'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.fab-dial.focus',
    motion: [
      ['Open / close', 'Flower fan stagger + scrim', 'Instant when reduced'],
    ],
    a11y: 'doc.fab-dial.a11y',
    versions: { na: 'Flower fan only — linear stacks use k3-fab-rail' },
  },
  'fab-extended': {
    theming: [
      ['size', '40 · 56 · 96', 'Height ladder (small/medium/large)'],
      ['variant colors', 'sys roles', 'primary · secondary · tertiary · surface'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate (native button)'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.extended-fab.focus',
    motion: [
      ['Press', 'Corner morph + elevation', 'Instant when reduced'],
      ['show / hide', 'Scale + fade visibility', 'Respects reduced motion'],
      ['setRailCollapsed', 'Pill ↔ square width spring', 'Instant when reduced'],
    ],
    a11y: 'doc.extended-fab.a11y',
    versions: { na: 'Always expanded icon+label — pair with k3-fab for icon-only' },
  },
  'fab-menu': {
    theming: [
      ['size', 'default·medium·large', 'Closed trigger 56·80·96; close FAB stays 56'],
      ['variant', 'primary|…|surface', 'Trigger + pill role colors'],
      ['placement', 'bottom-end|…|top-start', 'Corner / edge dock'],
    ],
    keyboard: [
      ['Enter / Space', 'Open / activate item'],
      ['Escape', 'Close menu'],
      ['Arrow keys', 'Roving focus items ↔ FAB'],
    ],
    focus: 'doc.fab-menu.focus',
    motion: [
      ['Open / close', 'Staggered pill reveal + FAB retract', 'Instant when reduced'],
    ],
    a11y: 'doc.fab-menu.a11y',
    versions: { na: 'Single Expressive FAB menu layout' },
  },
  'fab-rail': {
    theming: [
      ['position', 'corner dock', 'top/bottom × left/right'],
      ['direction', 'up|down|left|right', 'Expansion axis (corner default if empty)'],
      ['auto-fit', 'boolean', 'Scale actions to viewport'],
    ],
    keyboard: [
      ['Enter / Space', 'Toggle rail on trigger'],
      ['Escape', 'Close rail'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.fab-rail.focus',
    motion: [
      ['Open / close', 'Linear stagger + scrim', 'Instant when reduced'],
    ],
    a11y: 'doc.fab-rail.a11y',
    versions: { na: 'Linear rail — radial flower uses k3-fab-dial' },
  },
  'ripple': {
    theming: [
      ['unbounded', 'boolean', '40dp circle (icon) vs clipped surface'],
      ['ink / hover', 'sys on-surface', 'Press grow + hover state layer'],
    ],
    keyboard: { na: 'Decorative — no keyboard handling; host control owns keys' },
    focus: 'doc.ripple.focus',
    motion: [
      ['Press', 'Circular ink grow from pointer', 'Skipped when reduced / global off'],
    ],
    a11y: 'doc.ripple.a11y',
    versions: { na: 'Bounded (default) vs unbounded icon ink' },
  },
  'shape-chip': {
    theming: [
      ['--k3-shape-chip-color', 'CSS color', 'Shape + accent fill'],
      ['size', 'xs–xl', 'Same height ladder as Buttons'],
      ['placement', 'leading|trailing', 'Shape on pill edge'],
    ],
    keyboard: [
      ['Enter / Space', 'Toggle when toggle attr set'],
      ['Tab', 'Focus only when interactive'],
    ],
    focus: 'doc.shape-chip.focus',
    motion: [
      ['Press (toggle)', 'State layer on pill', 'N/A when static legend'],
    ],
    a11y: 'doc.shape-chip.a11y',
    versions: { na: 'Static legend by default; toggle opt-in for selection' },
  },
  'text-field': {
    theming: [
      ['--k3-text-field-max-width', '26rem', 'Host max width (ISO ranges fit)'],
      ['--k3-tf-h', '3.5rem', 'Field height (56dp)'],
      ['--k3-tf-outline', 'sys outline / primary', 'Stroke color by state'],
    ],
    keyboard: [
      ['Tab', 'Focus field'],
      ['Escape (clearable)', 'Does not clear — use clear button'],
    ],
    focus: 'doc.text-field.focus',
    motion: [
      ['Label float', 'WAAPI float on populate / focus', 'Instant when reduced'],
      ['Outline cutout', 'Notch scaleX short3', 'Respects reduced motion'],
    ],
    a11y: 'doc.text-field.a11y',
    versions: { na: 'Variants are chrome only — same element' },
  },
  'textarea': {
    theming: [
      ['--k3-text-field-max-width', '26rem', 'Host max width (shared with text-field)'],
      ['--k3-tf-h', '3.5rem', 'Base field token (chrome)'],
      ['--k3-tf-outline', 'sys outline / primary', 'Stroke color by state'],
    ],
    keyboard: [
      ['Tab', 'Focus textarea'],
      ['Enter', 'Insert newline (native)'],
    ],
    focus: 'doc.textarea.focus',
    motion: [
      ['Label float', 'WAAPI float on populate / focus', 'Instant when reduced'],
      ['Outline cutout', 'Notch scaleX short3', 'Respects reduced motion'],
    ],
    a11y: 'doc.textarea.a11y',
    versions: { na: 'Extends k3-text-field — multiline locked; variants are chrome only' },
  },
  'field-group': {
    theming: [
      ['border', '2px sys outline', 'Fieldset stroke (matches outlined fields)'],
      ['border-radius', 'corner-medium', 'Shell radius'],
      ['gap', 'space200', 'Stack gap between slotted fields'],
    ],
    keyboard: { na: 'No host key handling — children own keyboard' },
    focus: 'doc.field-group.focus',
    motion: { na: 'No host motion — static fieldset chrome' },
    a11y: 'doc.field-group.a11y',
    versions: { na: 'Single layout — fieldset + legend' },
  },
  'pin-field': {
    theming: [
      ['--k3-pin-cell', '3rem', 'Cell size'],
      ['--k3-pin-gap', '0.5rem', 'Gap between cells'],
      ['--k3-pin-success', 'sys success / #146c2e', 'Success chrome'],
    ],
    keyboard: [
      ['Digit / letter', 'Fill cell (charset-filtered)'],
      ['Backspace', 'Clear cell / move left'],
      ['ArrowLeft / ArrowRight', 'Move between cells'],
    ],
    focus: 'doc.pin-field.focus',
    motion: { na: 'No host spring — cell focus uses outline only' },
    a11y: 'doc.pin-field.a11y',
    versions: { na: 'Single layout — cells in a row' },
  },
  'select': {
    theming: [
      ['max-width', '22rem', 'Host max width'],
      ['chevron', 'on-surface-variant', 'Trailing icon color'],
      ['panel z-index', '50', 'Dropdown stacking'],
    ],
    keyboard: [
      ['ArrowDown / Enter / Space', 'Open menu'],
      ['Escape', 'Close when open'],
    ],
    focus: 'doc.select.focus',
    motion: [
      ['Open / close', 'runOpenClose + chevron rotate', 'Respects reduced motion'],
    ],
    a11y: 'doc.select.a11y',
    versions: { na: 'Single exposed-dropdown layout' },
  },
  'checkbox': {
    theming: [
      ['--k3-checkbox-size', '1.125rem', '18dp box'],
      ['box-shadow inset', '2px on-surface-variant', 'Unchecked stroke'],
    ],
    keyboard: [
      ['Space / Enter', 'Toggle (native button role)'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.checkbox.focus',
    motion: [
      ['Check-in', 'Icon scale + clip-path short2', 'Instant when reduced'],
    ],
    a11y: 'doc.checkbox.a11y',
    versions: { na: 'Single control — no alternate layouts' },
  },
  'radio': {
    theming: [
      ['--k3-radio-size', '1.25rem', '20dp outer'],
      ['--k3-radio-inner', '0.75rem', '12dp inner'],
    ],
    keyboard: [
      ['Space / Enter', 'Select (and clear siblings with same name)'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.radio.focus',
    motion: [
      ['Select', 'Inner scale spatial-fast', 'Instant when reduced'],
    ],
    a11y: 'doc.radio.a11y',
    versions: { na: 'Single control — group via shared name' },
  },
  'switch': {
    theming: [
      ['track', '52×32', 'Track size'],
      ['--k3-switch-travel', 'spatial-fast spring', 'Thumb travel'],
      ['--k3-switch-status-off', 'error', 'Status off track (variant=status)'],
      ['--k3-switch-status-on', 'green-700', 'Status on track (variant=status)'],
    ],
    keyboard: [
      ['Space / Enter', 'Toggle selected'],
      ['Tab', 'Move focus'],
    ],
    focus: 'doc.switch.focus',
    motion: [
      ['Toggle', 'Thumb FastSpatial spring + haptic', 'Instant when reduced'],
    ],
    a11y: 'doc.switch.a11y',
    versions: 'doc.switch.versions.blurb',
  },
  'chip': {
    theming: [
      ['elevated', 'elevation 1', 'Lift without outline (not input)'],
      ['status tones', 'semantic colors', 'available · success · error · …'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate / toggle filter'],
      ['Backspace / Delete', 'Remove when removable / input'],
      ['Arrow keys (in chip-set)', 'Move between chips'],
    ],
    focus: 'doc.chip.focus',
    motion: [
      ['Select / remove', 'State-layer + haptic', 'Instant when reduced'],
    ],
    a11y: 'doc.chip.a11y',
    versions: 'doc.chip.versions.blurb',
  },
  'autocomplete': {
    theming: [
      ['field chrome', 'text-field tokens', 'Same variants as k3-text-field'],
      ['panel', 'menu surface', 'Listbox under field'],
    ],
    keyboard: [
      ['ArrowDown / ArrowUp', 'Move active option'],
      ['Enter', 'Commit highlighted option'],
      ['Escape', 'Close panel'],
    ],
    focus: 'doc.autocomplete.focus',
    motion: [
      ['Open / close', 'Panel toggle', 'Respects reduced motion'],
    ],
    a11y: 'doc.autocomplete.a11y',
    versions: { na: 'Single combobox layout' },
  },
  'counter': {
    theming: [
      ['size ladder', 'xs–xl', 'Circle diameter from CounterSpecs'],
      ['primary / tonal', 'sys colors', '± pills vs value surface'],
    ],
    keyboard: [
      ['ArrowUp / ArrowRight', 'Increment'],
      ['ArrowDown / ArrowLeft', 'Decrement'],
      ['Home / End', 'Min / max when set'],
    ],
    focus: 'doc.counter.focus',
    motion: [
      ['± press', 'State layer on circles', 'Instant when reduced'],
    ],
    a11y: 'doc.counter.a11y',
    versions: { na: 'Single pill layout — sizes are scale only' },
  },
  'signature': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'slider': {
    theming: [
      ['color', 'primary|secondary|tertiary|error', 'Active track / handle role'],
      ['size', 'xs–xl', 'Track and handle scale'],
    ],
    keyboard: [
      ['Arrow keys', 'Nudge value by step'],
      ['Home / End', 'Min / max'],
      ['PageUp / PageDown', 'Larger step when supported'],
    ],
    focus: 'doc.slider.focus',
    motion: [
      ['Drag', 'Handle follows pointer', 'Instant when reduced'],
      ['Value indicator', 'Bubble while dragging', 'Hidden when reduced'],
    ],
    a11y: 'doc.slider.a11y',
    versions: 'doc.slider.versions.blurb',
  },
  'rating': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'date-picker': {
    theming: [
      ['surface', 'dialog / popover', 'Docked vs modal chrome'],
      ['calendar cells', 'sys primary', 'Selected / range highlight'],
    ],
    keyboard: [
      ['Arrow keys', 'Move focus in calendar grid'],
      ['Enter / Space', 'Select day'],
      ['Escape', 'Dismiss (close-start cancelable)'],
    ],
    focus: 'doc.date-picker.focus',
    motion: [
      ['Open / close', 'Overlay enter/exit', 'Instant when reduced'],
    ],
    a11y: 'doc.date-picker.a11y',
    versions: 'doc.date-picker.versions.blurb',
  },
  'mood-calendar': {
    theming: [
      ['legend colors', 'MoodMeta[]', 'Per-mood swatches'],
      ['day cells', 'grid', 'Year heatmap'],
    ],
    keyboard: [
      ['Tab', 'Move between year tabs / legend / days'],
      ['Enter / Space', 'Open journal dialog for focused day'],
    ],
    focus: 'doc.mood-calendar.focus',
    motion: { na: 'No host spring — dialog uses standard overlay motion' },
    a11y: 'doc.mood-calendar.a11y',
    versions: { na: 'Single year-grid layout with year tabs' },
  },
  'time-picker': {
    theming: [
      ['dial', 'clock face', 'Hour / minute rings'],
      ['surface', 'docked / modal', 'Overlay chrome'],
    ],
    keyboard: [
      ['Arrow keys (input mode)', 'Adjust focused segment'],
      ['Tab', 'Hour → minute → second'],
      ['Escape', 'Dismiss'],
    ],
    focus: 'doc.time-picker.focus',
    motion: [
      ['Open / close', 'Overlay enter/exit', 'Instant when reduced'],
      ['Dial hand', 'Spatial motion to value', 'Respects reduced motion'],
    ],
    a11y: 'doc.time-picker.a11y',
    versions: 'doc.time-picker.versions.blurb',
  },
  'wheel-picker': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'progress': {
    theming: [
      ['--k3-sys-color-primary', 'sys', 'Active indicator'],
      ['thickness / size', '4dp · 40/48', 'Stroke · circular diameter'],
      ['shape', 'flat|wavy|oscillation', 'Track paint style'],
    ],
    keyboard: [
      ['Arrow / Home / End', 'Seek when interactive (linear determinate)'],
      ['Tab', 'Focus seekable host'],
    ],
    focus: 'doc.progress.focus',
    motion: [
      ['Determinate', 'Ease to value', 'Reduced motion snaps'],
      ['Indeterminate / wavy', 'Continuous loop when visible', 'Paused off-screen'],
    ],
    a11y: 'doc.progress.a11y',
    versions: 'doc.progress.versions.blurb',
  },
  'loading': {
    theming: [
      ['--k3-loading-size', '3rem (48dp)', 'Host box'],
      ['contained', 'boolean', 'Primary-container disc + on-container fill'],
      ['path fill', 'sys primary', 'Morphing Material shape'],
    ],
    keyboard: { na: 'Decorative indicator — no keyboard handling' },
    focus: 'doc.loading.focus',
    motion: [
      ['Morph cycle', 'SoftBurst→…→Oval + spin', 'Frozen when reduced / off-screen'],
    ],
    a11y: 'doc.loading.a11y',
    versions: { na: 'Single morph spinner — contained is chrome only' },
  },
  'skeleton': {
    theming: [
      ['animation', 'wave|pulse|none', 'Bone shimmer'],
      ['shape', 'auto|circular|rounded|square', 'Corner of bone'],
      ['surface tokens', 'sys surface-variant', 'Bone fill'],
    ],
    keyboard: { na: 'Non-interactive placeholder — no host keys' },
    focus: 'doc.skeleton.focus',
    motion: [
      ['wave / pulse', 'CSS shimmer while loading', 'Skipped when reduced or loaded'],
    ],
    a11y: 'doc.skeleton.a11y',
    versions: { na: 'Single bone / content-mimic layout' },
  },
  'lazy': {
    theming: [
      ['--k3-lazy-min-block-size', 'CSS length', 'Reserve height before ready'],
      ['fallback', 'skeleton|indicator|none', 'Placeholder chrome'],
      ['animation', 'wave|pulse|none', 'Forwarded to k3-skeleton'],
    ],
    keyboard: [
      ['Enter / Space', 'Retry control when state=error'],
      ['Tab', 'Focus retry / slotted interactive content when ready'],
    ],
    focus: 'doc.lazy.focus',
    motion: [
      ['Reveal', 'Fallback → content when ready', 'No spring — state swap'],
    ],
    a11y: 'doc.lazy.a11y',
    versions: { na: 'Single region — trigger/fallback are options' },
  },
  'snackbar': {
    theming: [
      ['inverse surface', 'sys inverse', 'Bar chrome (M3)'],
      ['position', 'center|start|end|auto', 'Bottom edge placement'],
      ['chrome-inset', 'boolean', 'Nudge above FAB / bottom bar'],
    ],
    keyboard: [
      ['Escape', 'Dismiss when open (if dismissible / action path)'],
      ['Tab', 'Action and dismiss controls'],
    ],
    focus: 'doc.snackbar.focus',
    motion: [
      ['Open / close', 'Slide + fade via runOpenClose', 'Respects reduced motion'],
    ],
    a11y: 'doc.snackbar.a11y',
    versions: { na: 'Single bottom bar — queue behaviors are options' },
  },
  'alert': {
    theming: [
      ['variant', 'theme + semantic tones', 'Container + accent bar'],
      ['shape', 'rounded|square', 'Corner'],
      ['accent bar', '4dp', 'Leading status stripe'],
    ],
    keyboard: [
      ['Enter / Space', 'Activate dismiss when dismissible'],
      ['Tab', 'Action slot + dismiss control'],
    ],
    focus: 'doc.alert.focus',
    motion: { na: 'Static callout — no host enter/exit motion' },
    a11y: 'doc.alert.a11y',
    versions: { na: 'Single callout layout — variants/shapes are options' },
  },
  'dialog': {
    theming: [
      ['--k3-sys-shape-corner-extra-large', '28dp', 'Basic panel radius'],
      ['--k3-sys-elevation-level3', 'level3', 'Panel shadow'],
    ],
    keyboard: [
      ['Escape', 'Dismiss (close-start cancelable)'],
      ['Tab', 'Focus trap inside panel'],
    ],
    focus: 'doc.dialog.focus',
    motion: [
      ['Open', 'enterScaleY / dialog spring', 'Instant when reduced'],
      ['Close', 'Reverse enter + scrim fade', 'Instant when reduced'],
    ],
    a11y: 'doc.dialog.a11y',
    versions: 'doc.dialog.versions.blurb',
  },
  'tooltip': {
    theming: [
      ['variant', 'plain|rich', 'Inverse one-line · surface + actions'],
      ['--k3-tooltip-gap', '8dp', 'Gap from anchor'],
      ['position', 'sides + corners', 'Logical start/end + physical L/R'],
    ],
    keyboard: [
      ['Escape', 'Dismiss rich tip when open'],
      ['Tab / focus', 'Show on focus of anchor'],
    ],
    focus: 'doc.tooltip.focus',
    motion: [
      ['Enter / exit', 'Slide + scale + fade', 'Popover / fixed escape overflow'],
    ],
    a11y: 'doc.tooltip.a11y',
    versions: 'doc.tooltip.versions.blurb',
  },
  'badge': {
    theming: [
      ['dot / large', '6dp · label', 'Size modes'],
      ['position', 'logical|physical corners', 'Anchor corner'],
      ['error container', 'sys', 'Badge fill'],
    ],
    keyboard: { na: 'Decorative overlay — anchor owns keyboard' },
    focus: 'doc.badge.focus',
    motion: { na: 'No host motion — static badge' },
    a11y: 'doc.badge.a11y',
    versions: { na: 'Single overlay — dot vs large are options' },
  },
  'countdown': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'marquee': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'sound-fx': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'confetti': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  snow: {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  firework: {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'voice-ring': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'text-bounce': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'text-scramble': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'icons-burst': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'halftone': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'card-holo': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'card-lenticular': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'card-scratch': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'audio-player': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'qr-code': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'charts-bar': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'charts-line': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'charts-other': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'avatar': {
    theming: [
      ['size', 'sm|md|lg', '32 · 40 · 56 face'],
      ['variant', 'filled|outlined|elevated', 'Surface'],
      ['tone', 'auto|semantic', 'Container color'],
      ['status badge', 'sys', 'Presence indicator'],
    ],
    keyboard: [
      ['Tab / Enter / Space', 'When interactive (button face)'],
    ],
    focus: 'doc.avatar.focus',
    motion: { na: 'No host enter motion — status badge is static' },
    a11y: 'doc.avatar.a11y',
    versions: { na: 'Single face — group layouts are options on k3-avatar-group' },
  },
  'bubble': {
    theming: [
      ['placement', 'start|end', 'Incoming vs outgoing'],
      ['color', 'default|semantic', 'Body tone'],
      ['radius', 'sys shape', 'Bubble corners'],
    ],
    keyboard: { na: 'Presentational row — no host keyboard handling' },
    focus: 'doc.bubble.focus',
    motion: { na: 'Static chat row' },
    a11y: 'doc.bubble.a11y',
    versions: { na: 'Single bubble row — placement/color are options' },
  },
  'quote': {
    theming: [
      ['card / offset', 'sys surface + primary', 'Tilted card + colored back'],
      ['layout', 'author-start|author-end', 'Column order'],
    ],
    keyboard: [
      ['Tab', 'Action slot (prefer k3-button text)'],
    ],
    focus: 'doc.quote.focus',
    motion: [
      ['Hover tilt', 'Deepens resting tilt', 'Skipped when reduced'],
    ],
    a11y: 'doc.quote.a11y',
    versions: { na: 'Single testimonial layout — author-start/end are options' },
  },
  'codeblock': {
    theming: [
      ['theme', 'dark|material|okaidia', 'Token colours'],
      ['panel', 'dark rounded', 'Code surface'],
      ['--k3-codeblock-radius', '1rem', 'Corner override'],
    ],
    keyboard: [
      ['Tab', 'Tabs + copy / download / expand controls'],
      ['Enter / Space', 'Activate focused control'],
    ],
    focus: 'doc.codeblock.focus',
    motion: [
      ['Expand / collapse', 'Height morph on Show code', 'Instant when reduced'],
    ],
    a11y: 'doc.codeblock.a11y',
    versions: { na: 'Single panel — multi-sample via slotted pre tabs' },
  },
  'carousel': {
    theming: [
      ['layout', 'multi-browse|hero|uncontained|full-screen', 'M3 layouts'],
      ['keylines', 'large|medium|small', 'Item mask sizes'],
      ['indicators', 'none|sides', 'Page dots'],
    ],
    keyboard: [
      ['Arrow keys', 'Step when focused'],
      ['Home / End', 'First / last item'],
    ],
    focus: 'doc.carousel.focus',
    motion: [
      ['Scroll settle', 'Snap / loop settle', 'Respects reduced motion'],
    ],
    a11y: 'doc.carousel.a11y',
    versions: 'doc.carousel.versions.blurb',
  },
  'coverflow': {
    theming: [
      ['effect', 'coverflow|slide', '3D vs flat grow'],
      ['orientation', 'horizontal|vertical', 'Axis'],
      ['reflection', 'mirror', 'Optional under covers'],
    ],
    keyboard: [
      ['Arrow keys', 'Step covers'],
      ['Escape', 'Close lightbox'],
    ],
    focus: 'doc.coverflow.focus',
    motion: [
      ['Cover transform', 'Rotate / depth / scale', 'Reduced motion flattens'],
    ],
    a11y: 'doc.coverflow.a11y',
    versions: 'doc.coverflow.versions.blurb',
  },
  'card': {
    theming: [
      ['variant', 'filled|outlined|elevated', 'Surface'],
      ['radius morph', '12→16→20', 'Rest · hover · press'],
      ['media-layout', 'bleed|inset', 'Media framing'],
    ],
    keyboard: [
      ['Tab', 'When interactive'],
      ['Enter / Space', 'Emit k3-click when interactive'],
    ],
    focus: 'doc.card.focus',
    motion: [
      ['Corner morph', 'Hover / press shape', 'Skipped when reduced'],
    ],
    a11y: 'doc.card.a11y',
    versions: { na: 'Single card — orientation and media layouts are options' },
  },
  'menu': {
    theming: [
      ['variant', 'vertical|baseline', 'Chrome / gaps'],
      ['color', 'standard|vibrant', 'Surface tint'],
      ['density', '0|-1|-2|-3', 'Item height'],
    ],
    keyboard: [
      ['↓ ↑ Enter Space', 'Open from trigger / navigate items'],
      ['Home / End', 'First / last item'],
      ['→ / Enter', 'Open submenu'],
      ['← / Escape', 'Close level'],
    ],
    focus: 'doc.menu.focus',
    motion: [
      ['Open / close', 'Opacity + scale from trigger', 'Spatial-fast; instant when reduced'],
    ],
    a11y: 'doc.menu.a11y',
    versions: 'doc.menu.versions.blurb',
  },
  'list': {
    theming: [
      ['variant', 'standard|segmented', 'Continuous vs M3E gaps'],
      ['item radius', 'sys shape', 'Segmented corner morph'],
      ['selection chrome', 'radio|checkbox|switch', 'Trailing / leading'],
    ],
    keyboard: [
      ['Arrow / Home / End', 'Move among interactive items'],
      ['Enter / Space', 'Activate / toggle selection'],
    ],
    focus: 'doc.list.focus',
    motion: [
      ['Segmented select', 'Shape morph', 'Skipped when reduced'],
      ['Expand', 'Height reveal', 'Instant when reduced'],
    ],
    a11y: 'doc.list.a11y',
    versions: { na: 'Single list host — standard/segmented are options' },
  },
  'iso-filter': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'masonry': {
    theming: { na: "Pending gabarit migration" },
    keyboard: { na: "Pending gabarit migration" },
    focus: { na: "Pending gabarit migration" },
    motion: { na: "Pending gabarit migration" },
    a11y: { na: "Pending gabarit migration" },
    versions: { na: "Pending gabarit migration" },
  },
  'table': {
    theming: [
      ['variant', 'outlined|filled', 'Frame'],
      ['density', 'default|compact', 'Row height'],
      ['header tint', 'surface-container', 'material.io style'],
    ],
    keyboard: { na: 'Native table / generated cells — no host keyboard API' },
    focus: 'doc.table.focus',
    motion: { na: 'Static data table' },
    a11y: 'doc.table.a11y',
    versions: { na: 'Single table — outlined/filled and density are options' },
  },
  'sheet': {
    theming: [
      ['placement', 'bottom|side', 'Sheet type'],
      ['width', 'standard|full', 'Bottom max 640dp vs edge'],
      ['corners', '28dp top', 'Bottom sheet radii'],
    ],
    keyboard: [
      ['Escape', 'Dismiss when modal'],
      ['Tab', 'Focus trap inside sheet'],
    ],
    focus: 'doc.sheet.focus',
    motion: [
      ['Open / close', 'Slide + scrim', 'Instant when reduced'],
    ],
    a11y: 'doc.sheet.a11y',
    versions: 'doc.sheet.versions.blurb',
  },
  'breadcrumb': {
    theming: [
      ['variant', 'plain|tonal|filled', 'Crumb chrome'],
      ['separator', 'chevron|slash|dot|arrow', 'Divider'],
      ['size', 'sm|md|lg', 'Type scale'],
    ],
    keyboard: [
      ['Tab / Enter', 'Activate non-current crumb'],
    ],
    focus: 'doc.breadcrumb.focus',
    motion: { na: 'Static trail — no host motion API' },
    a11y: 'doc.breadcrumb.a11y',
    versions: { na: 'Single trail — variant/separator are options' },
  },
  'app-bar': {
    theming: [
      ['size', 'small|medium|large', 'Bar height'],
      ['elevated / scrolled', 'surface-container', 'Scroll fill'],
      ['sticky', 'blur mix', 'Pinned top'],
    ],
    keyboard: { na: 'Actions are slotted controls — host has no keyboard API' },
    focus: 'doc.app-bar.focus',
    motion: { na: 'Static bar — sticky is CSS only' },
    a11y: 'doc.app-bar.a11y',
    versions: 'doc.app-bar.versions.blurb',
  },
  'footer-bar': {
    theming: [
      ['elevated', 'shadow', 'Surface lift'],
      ['sticky', 'blur mix', 'Pinned bottom'],
      ['corners', 'extra-large top', 'Bottom bar radii'],
    ],
    keyboard: { na: 'Actions are slotted controls — host has no keyboard API' },
    focus: 'doc.footer-bar.focus',
    motion: { na: 'Static bar — sticky is CSS only' },
    a11y: 'doc.footer-bar.a11y',
    versions: { na: 'Single footer — sticky/elevated/FAB are options' },
  },
  'tabs': {
    theming: [
      ['variant', 'primary|secondary', 'Indicator style'],
      ['indicator', 'primary pill / full cell', 'M3 tokens'],
    ],
    keyboard: [
      ['Arrow Left/Right', 'Move between tabs (roving)'],
      ['Home / End', 'First / last tab'],
      ['Enter / Space', 'Activate focused tab'],
    ],
    focus: 'doc.tabs.focus',
    motion: [
      ['Indicator', 'Spatial fast slide', 'Instant when reduced'],
    ],
    a11y: 'doc.tabs.a11y',
    versions: 'doc.tabs.versions.blurb',
  },
  'navigation-bar': {
    theming: [
      ['layout', 'vertical|horizontal', 'Item arrangement'],
      ['surface', 'surface-container', 'Bar fill'],
    ],
    keyboard: { na: 'Destinations are slotted k3-nav-item — host has no keyboard API' },
    focus: 'doc.nav-bar.focus',
    motion: [
      ['Active pill', 'Expand center→sides', 'Respect reduced motion'],
    ],
    a11y: 'doc.nav-bar.a11y',
    versions: 'doc.nav-bar.versions.blurb',
  },
  'navigation-rail': {
    theming: [
      ['size', 'compact|large', 'Width / destination layout'],
      ['layout', 'modal|standard', 'Expanded chrome'],
      ['position', 'start|center|bottom', 'Leading group'],
    ],
    keyboard: { na: 'Destinations are slotted k3-nav-item — host has no keyboard API' },
    focus: 'doc.nav-rail.focus',
    motion: [
      ['Expand / collapse', 'Width spring + FAB morph', 'Instant when reduced'],
    ],
    a11y: 'doc.nav-rail.a11y',
    versions: 'doc.nav-rail.versions.blurb',
  },
  'index-list': {
    theming: [
      ['show-rail', 'boolean', 'A–Z scrub rail'],
      ['sticky-headers', 'boolean', 'Pin section titles'],
    ],
    keyboard: { na: 'List rows / rail buttons use native focus — no host keyboard API' },
    focus: 'doc.index-list.focus',
    motion: [
      ['scrollToKey', 'Smooth scroll', 'auto when reduced'],
    ],
    a11y: 'doc.index-list.a11y',
    versions: { na: 'Single directory — rail/sticky are options' },
  },
  'pagination': {
    theming: [
      ['page buttons', 'tonal selected', 'Numeric cells'],
    ],
    keyboard: [
      ['Tab / Enter', 'Activate page or nav button'],
    ],
    focus: 'doc.pagination.focus',
    motion: { na: 'Instant page swap — no host motion API' },
    a11y: 'doc.pagination.a11y',
    versions: { na: 'Single numeric pager' },
  },
  'pagination-alpha': {
    theming: [
      ['size', 'sm|md|lg', 'Hit target'],
      ['orientation', 'horizontal|vertical', 'Layout'],
    ],
    keyboard: [
      ['Tab / Enter', 'Select letter'],
    ],
    focus: 'doc.pagination-alpha.focus',
    motion: { na: 'Instant letter select — no host motion API' },
    a11y: 'doc.pagination-alpha.a11y',
    versions: 'doc.pagination-alpha.versions.blurb',
  },
  'prev-next': {
    theming: [
      ['card', 'surface-container → secondary-container', 'Hover/focus'],
      ['radius', '24 → 48', 'Pressed morph'],
    ],
    keyboard: [
      ['Tab', 'Move between previous / next cards'],
      ['Enter', 'Follow href'],
    ],
    focus: 'doc.doc-nav.focus',
    motion: [
      ['Hover / press', 'Fill + radius morph 300ms', 'Instant when reduced'],
    ],
    a11y: 'doc.doc-nav.a11y',
    versions: { na: 'Single pager — previous and/or next cards' },
  },
  'scroll-to-top': {
    theming: [
      ['variant', 'primary|secondary|tertiary|surface', 'FAB roles'],
      ['show-progress', 'SVG ring', 'Scroll depth'],
    ],
    keyboard: [
      ['Tab / Enter', 'Activate control'],
    ],
    focus: 'doc.scroll-to-top.focus',
    motion: [
      ['scrollToTop', 'Smooth ms duration', 'auto when reduced'],
    ],
    a11y: 'doc.scroll-to-top.a11y',
    versions: { na: 'Single FAB control — variant/progress are options' },
  },
  'toolbar': {
    theming: [
      ['variant', 'docked|floating', 'Strip vs pill'],
      ['color', 'standard|vibrant', 'Surface'],
      ['shape', 'full|rounded', 'Floating corners'],
    ],
    keyboard: { na: 'Actions are slotted controls — host has no keyboard API' },
    focus: 'doc.toolbar.focus',
    motion: [
      ['expanded panel', 'scaleY enter', 'Instant when reduced'],
    ],
    a11y: 'doc.toolbar.a11y',
    versions: 'doc.toolbar.versions.blurb',
  },
  'gestures': {
    theming: { na: 'Utility API — no host surface tokens' },
    keyboard: { na: 'Pointer/touch gestures — provide non-gesture fallbacks' },
    focus: 'doc.gestures.focus',
    motion: { na: 'Gesture phases are input-driven' },
    a11y: 'doc.gestures.a11y',
    versions: { na: 'detectGesture helpers + k3-*-gesture events' },
  },
  'keyboard': {
    theming: { na: 'Utility API — no host surface tokens' },
    keyboard: [
      ['Any key', 'down / up via attachKeyboard'],
      ['Chords', 'bindChord / bindChords'],
    ],
    focus: 'doc.keyboard.focus',
    motion: { na: 'No motion — event helpers only' },
    a11y: 'doc.keyboard.a11y',
    versions: { na: 'attachKeyboard · bindChord(s)' },
  },
  'keyboard-media': {
    theming: { na: 'Utility API — no host surface tokens' },
    keyboard: [
      ['Space / K', 'Toggle'],
      ['← / →', 'Seek'],
      ['N / P', 'Next / prev'],
      ['M', 'Mute'],
    ],
    focus: 'doc.keyboard-media.focus',
    motion: { na: 'No motion — hotkey map only' },
    a11y: 'doc.keyboard-media.a11y',
    versions: { na: 'bindMediaHotkeys helper' },
  },
  'mouse': {
    theming: { na: 'Utility API — no host surface tokens' },
    keyboard: { na: 'Pointer utility — not keyboard' },
    focus: 'doc.mouse.focus',
    motion: { na: 'Drag thresholds are input-driven' },
    a11y: 'doc.mouse.a11y',
    versions: { na: 'attachMouse · K3UI.mouse' },
  },
  'dnd': {
    theming: { na: 'Utility API — no host surface tokens' },
    keyboard: { na: 'Provide keyboard reorder alternatives beside drag handles' },
    focus: 'doc.dnd.focus',
    motion: { na: 'Drag feedback is input-driven' },
    a11y: 'doc.dnd.a11y',
    versions: { na: 'attachSortable · attachDraggable · attachDroppable' },
  },
  'scrollbar': {
    theming: [
      ['--k3-scroll-size', '6dp', 'Thumb thickness'],
      ['--k3-scroll-track-inset', '0+', 'Corner clearance'],
    ],
    keyboard: { na: 'Native scrollport — no host keyboard API' },
    focus: 'doc.scrollbar.focus',
    motion: { na: 'Static chrome' },
    a11y: 'doc.scrollbar.a11y',
    versions: { na: '.k3-scroll · edgeScrollbarStyles' },
  },
};
