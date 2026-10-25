/**
 * Docs catalog — one entry per component (material.io /components style).
 */
export interface DocComponent {
  id: string;
  category: string;
  title: string;
  titleKey: string;
  blurbKey: string;
}

export const DOC_CATEGORIES = [
  'Buttons',
  'Actions',
  'Inputs',
  'Feedback',
  'Containment',
  'Navigation',
  'Utilities',
  'Styles',
] as const;

/**
 * Nav / catalog labels follow **Family → Type**, then alphabetical.
 * Base type = family name alone (e.g. "Buttons", "FAB").
 * Variants = "Family Type" (e.g. "Buttons Group", "FAB Extended").
 */
/**
 * Legacy hash → canonical slug (title-aligned: Family-Type kebab).
 * Old bookmarks keep working via {@link resolvePageId}.
 */
export const PAGE_ID_ALIASES: Record<string, string> = {
  button: 'buttons',
  'icon-button': 'buttons-icon',
  'button-arrow': 'buttons-arrow',
  'button-grid': 'buttons-grid',
  'button-group': 'buttons-group',
  'button-menu': 'buttons-menu',
  'button-pad': 'buttons-pad',
  'button-pill': 'buttons-pill',
  'button-smart': 'buttons-smart',
  'split-button': 'buttons-split',
  'extended-fab': 'fab-extended',
  'doc-nav': 'prev-next',
  'nav-bar': 'navigation-bar',
  'nav-rail': 'navigation-rail',
  colors: 'color-roles',
  'colors-roles': 'color-roles',
  'colors-palettes': 'color-palettes',
  'colors-m2': 'color-extras',
  'm2-colors': 'color-extras',
};

/** Canonical page id (applies aliases). */
export function resolvePageId(id: string): string {
  return PAGE_ID_ALIASES[id] ?? id;
}

export const DOC_COMPONENTS: DocComponent[] = [
  // Buttons — Family Type · alpha: Arrow · Grid · Group · Icon · Menu · Pad · Pill · Smart · Split
  {
    id: 'buttons',
    category: 'Buttons',
    title: 'Buttons',
    titleKey: 'doc.button.title',
    blurbKey: 'doc.button.blurb',
  },
  {
    id: 'buttons-arrow',
    category: 'Buttons',
    title: 'Buttons Arrow',
    titleKey: 'doc.button-arrow.title',
    blurbKey: 'doc.button-arrow.blurb',
  },
  {
    id: 'buttons-grid',
    category: 'Buttons',
    title: 'Buttons Grid',
    titleKey: 'doc.button-grid.title',
    blurbKey: 'doc.button-grid.blurb',
  },
  {
    id: 'buttons-group',
    category: 'Buttons',
    title: 'Buttons Group',
    titleKey: 'doc.button-group.title',
    blurbKey: 'doc.button-group.blurb',
  },
  {
    id: 'buttons-icon',
    category: 'Buttons',
    title: 'Buttons Icon',
    titleKey: 'doc.icon-button.title',
    blurbKey: 'doc.icon-button.blurb',
  },
  {
    id: 'buttons-menu',
    category: 'Buttons',
    title: 'Buttons Menu',
    titleKey: 'doc.button-menu.title',
    blurbKey: 'doc.button-menu.blurb',
  },
  {
    id: 'buttons-pad',
    category: 'Buttons',
    title: 'Buttons Pad',
    titleKey: 'doc.button-pad.title',
    blurbKey: 'doc.button-pad.blurb',
  },
  {
    id: 'buttons-pill',
    category: 'Buttons',
    title: 'Buttons Pill',
    titleKey: 'doc.button-pill.title',
    blurbKey: 'doc.button-pill.blurb',
  },
  {
    id: 'buttons-smart',
    category: 'Buttons',
    title: 'Buttons Smart',
    titleKey: 'doc.button-smart.title',
    blurbKey: 'doc.button-smart.blurb',
  },
  {
    id: 'buttons-split',
    category: 'Buttons',
    title: 'Buttons Split',
    titleKey: 'doc.split-button.title',
    blurbKey: 'doc.split-button.blurb',
  },
  // Actions — FAB family · alpha: FAB · Dial · Extended · Menu · Rail · then Ripple
  {
    id: 'fab',
    category: 'Actions',
    title: 'FAB',
    titleKey: 'doc.fab.title',
    blurbKey: 'doc.fab.blurb',
  },
  {
    id: 'fab-dial',
    category: 'Actions',
    title: 'FAB Dial',
    titleKey: 'doc.fab-dial.title',
    blurbKey: 'doc.fab-dial.blurb',
  },
  {
    id: 'fab-extended',
    category: 'Actions',
    title: 'FAB Extended',
    titleKey: 'doc.extended-fab.title',
    blurbKey: 'doc.extended-fab.blurb',
  },
  {
    id: 'fab-menu',
    category: 'Actions',
    title: 'FAB Menu',
    titleKey: 'doc.fab-menu.title',
    blurbKey: 'doc.fab-menu.blurb',
  },
  {
    id: 'fab-rail',
    category: 'Actions',
    title: 'FAB Rail',
    titleKey: 'doc.fab-rail.title',
    blurbKey: 'doc.fab-rail.blurb',
  },
  {
    id: 'ripple',
    category: 'Actions',
    title: 'Ripple',
    titleKey: 'doc.ripple.title',
    blurbKey: 'doc.ripple.blurb',
  },
  {
    id: 'shape-chip',
    category: 'Actions',
    title: 'Shape Chip',
    titleKey: 'doc.shape-chip.title',
    blurbKey: 'doc.shape-chip.blurb',
  },
  // Inputs
  {
    id: 'text-field',
    category: 'Inputs',
    title: 'Text fields',
    titleKey: 'doc.text-field.title',
    blurbKey: 'doc.text-field.blurb',
  },
  {
    id: 'textarea',
    category: 'Inputs',
    title: 'Text area',
    titleKey: 'doc.textarea.title',
    blurbKey: 'doc.textarea.blurb',
  },
  {
    id: 'field-group',
    category: 'Inputs',
    title: 'Field group',
    titleKey: 'doc.field-group.title',
    blurbKey: 'doc.field-group.blurb',
  },
  {
    id: 'pin-field',
    category: 'Inputs',
    title: 'PIN field',
    titleKey: 'doc.pin-field.title',
    blurbKey: 'doc.pin-field.blurb',
  },
  {
    id: 'select',
    category: 'Inputs',
    title: 'Select',
    titleKey: 'doc.select.title',
    blurbKey: 'doc.select.blurb',
  },
  {
    id: 'checkbox',
    category: 'Inputs',
    title: 'Checkbox',
    titleKey: 'doc.checkbox.title',
    blurbKey: 'doc.checkbox.blurb',
  },
  {
    id: 'radio',
    category: 'Inputs',
    title: 'Radio',
    titleKey: 'doc.radio.title',
    blurbKey: 'doc.radio.blurb',
  },
  {
    id: 'switch',
    category: 'Inputs',
    title: 'Switch',
    titleKey: 'doc.switch.title',
    blurbKey: 'doc.switch.blurb',
  },
  {
    id: 'chip',
    category: 'Inputs',
    title: 'Chips',
    titleKey: 'doc.chip.title',
    blurbKey: 'doc.chip.blurb',
  },
  {
    id: 'counter',
    category: 'Inputs',
    title: 'Counter',
    titleKey: 'doc.counter.title',
    blurbKey: 'doc.counter.blurb',
  },
  {
    id: 'slider',
    category: 'Inputs',
    title: 'Slider',
    titleKey: 'doc.slider.title',
    blurbKey: 'doc.slider.blurb',
  },
  {
    id: 'date-picker',
    category: 'Inputs',
    title: 'Date picker',
    titleKey: 'doc.date-picker.title',
    blurbKey: 'doc.date-picker.blurb',
  },
  {
    id: 'mood-calendar',
    category: 'Inputs',
    title: 'Mood Calendar',
    titleKey: 'doc.mood-calendar.title',
    blurbKey: 'doc.mood-calendar.blurb',
  },
  {
    id: 'time-picker',
    category: 'Inputs',
    title: 'Time picker',
    titleKey: 'doc.time-picker.title',
    blurbKey: 'doc.time-picker.blurb',
  },
  // Feedback
  {
    id: 'progress',
    category: 'Feedback',
    title: 'Progress',
    titleKey: 'doc.progress.title',
    blurbKey: 'doc.progress.blurb',
  },
  {
    id: 'loading',
    category: 'Feedback',
    title: 'Loading indicator',
    titleKey: 'doc.loading.title',
    blurbKey: 'doc.loading.blurb',
  },
  {
    id: 'skeleton',
    category: 'Feedback',
    title: 'Skeleton',
    titleKey: 'doc.skeleton.title',
    blurbKey: 'doc.skeleton.blurb',
  },
  {
    id: 'snackbar',
    category: 'Feedback',
    title: 'Snackbar',
    titleKey: 'doc.snackbar.title',
    blurbKey: 'doc.snackbar.blurb',
  },
  {
    id: 'dialog',
    category: 'Feedback',
    title: 'Dialog',
    titleKey: 'doc.dialog.title',
    blurbKey: 'doc.dialog.blurb',
  },
  {
    id: 'tooltip',
    category: 'Feedback',
    title: 'Tooltip',
    titleKey: 'doc.tooltip.title',
    blurbKey: 'doc.tooltip.blurb',
  },
  {
    id: 'badge',
    category: 'Feedback',
    title: 'Badge',
    titleKey: 'doc.badge.title',
    blurbKey: 'doc.badge.blurb',
  },
  // Containment
  {
    id: 'avatar',
    category: 'Containment',
    title: 'Avatars',
    titleKey: 'doc.avatar.title',
    blurbKey: 'doc.avatar.blurb',
  },
  {
    id: 'card',
    category: 'Containment',
    title: 'Cards',
    titleKey: 'doc.card.title',
    blurbKey: 'doc.card.blurb',
  },
  {
    id: 'menu',
    category: 'Containment',
    title: 'Menus',
    titleKey: 'doc.menu.title',
    blurbKey: 'doc.menu.blurb',
  },
  {
    id: 'list',
    category: 'Containment',
    title: 'Lists',
    titleKey: 'doc.list.title',
    blurbKey: 'doc.list.blurb',
  },
  {
    id: 'table',
    category: 'Containment',
    title: 'Tables',
    titleKey: 'doc.table.title',
    blurbKey: 'doc.table.blurb',
  },
  {
    id: 'sheet',
    category: 'Containment',
    title: 'Sheets',
    titleKey: 'doc.sheet.title',
    blurbKey: 'doc.sheet.blurb',
  },
  // Navigation
  {
    id: 'app-bar',
    category: 'Navigation',
    title: 'App bars',
    titleKey: 'doc.app-bar.title',
    blurbKey: 'doc.app-bar.blurb',
  },
  {
    id: 'footer-bar',
    category: 'Navigation',
    title: 'Footer bar',
    titleKey: 'doc.footer-bar.title',
    blurbKey: 'doc.footer-bar.blurb',
  },
  {
    id: 'tabs',
    category: 'Navigation',
    title: 'Tabs',
    titleKey: 'doc.tabs.title',
    blurbKey: 'doc.tabs.blurb',
  },
  {
    id: 'navigation-bar',
    category: 'Navigation',
    title: 'Navigation Bar',
    titleKey: 'doc.nav-bar.title',
    blurbKey: 'doc.nav-bar.blurb',
  },
  {
    id: 'navigation-rail',
    category: 'Navigation',
    title: 'Navigation Rail',
    titleKey: 'doc.nav-rail.title',
    blurbKey: 'doc.nav-rail.blurb',
  },
  {
    id: 'prev-next',
    category: 'Navigation',
    title: 'Prev Next',
    titleKey: 'doc.doc-nav.title',
    blurbKey: 'doc.doc-nav.blurb',
  },
  {
    id: 'toolbar',
    category: 'Navigation',
    title: 'Toolbar',
    titleKey: 'doc.toolbar.title',
    blurbKey: 'doc.toolbar.blurb',
  },
  // Utilities
  {
    id: 'gestures',
    category: 'Utilities',
    title: 'Gestures',
    titleKey: 'doc.gestures.title',
    blurbKey: 'doc.gestures.blurb',
  },
  {
    id: 'dnd',
    category: 'Utilities',
    title: 'Drag & drop',
    titleKey: 'doc.dnd.title',
    blurbKey: 'doc.dnd.blurb',
  },
  {
    id: 'scrollbar',
    category: 'Utilities',
    title: 'Scrollbar',
    titleKey: 'doc.scrollbar.title',
    blurbKey: 'doc.scrollbar.blurb',
  },
  // Styles — Color family (submenu under Color in Styles nav)
  {
    id: 'color-roles',
    category: 'Styles',
    title: 'Roles',
    titleKey: 'doc.color-roles.title',
    blurbKey: 'doc.color-roles.blurb',
  },
  {
    id: 'color-palettes',
    category: 'Styles',
    title: 'Palettes',
    titleKey: 'doc.color-palettes.title',
    blurbKey: 'doc.color-palettes.blurb',
  },
  {
    id: 'color-extras',
    category: 'Styles',
    title: 'Additional colors',
    titleKey: 'doc.color-extras.title',
    blurbKey: 'doc.color-extras.blurb',
  },
  {
    id: 'elevation',
    category: 'Styles',
    title: 'Elevation',
    titleKey: 'doc.elevation.title',
    blurbKey: 'doc.elevation.blurb',
  },
  {
    id: 'icons',
    category: 'Styles',
    title: 'Icons',
    titleKey: 'doc.icons.title',
    blurbKey: 'doc.icons.blurb',
  },
  {
    id: 'motion',
    category: 'Styles',
    title: 'Motion',
    titleKey: 'doc.motion.title',
    blurbKey: 'doc.motion.blurb',
  },
  {
    id: 'shapes',
    category: 'Styles',
    title: 'Shape',
    titleKey: 'doc.shapes.title',
    blurbKey: 'doc.shapes.blurb',
  },
  {
    id: 'spacing',
    category: 'Styles',
    title: 'Spacing',
    titleKey: 'doc.spacing.title',
    blurbKey: 'doc.spacing.blurb',
  },
  {
    id: 'typography',
    category: 'Styles',
    title: 'Typography',
    titleKey: 'doc.typography.title',
    blurbKey: 'doc.typography.blurb',
  },
];

/** Alphabetical by English `title` (Family Type). */
export function compareDocTitle(a: DocComponent, b: DocComponent): number {
  return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
}

/** Components in a category, sorted Family → Type (alpha). */
export function componentsInCategory(category: string): DocComponent[] {
  return DOC_COMPONENTS.filter((c) => c.category === category).sort(compareDocTitle);
}

export function componentsByCategory(): Map<string, DocComponent[]> {
  const map = new Map<string, DocComponent[]>();
  for (const cat of DOC_CATEGORIES) {
    map.set(cat, componentsInCategory(cat));
  }
  for (const c of DOC_COMPONENTS) {
    if (!map.has(c.category)) {
      map.set(c.category, componentsInCategory(c.category));
    }
  }
  return map;
}

/** Flat catalog order: categories as declared, items alpha within each. */
export function orderedComponents(): DocComponent[] {
  const out: DocComponent[] = [];
  for (const cat of DOC_CATEGORIES) {
    out.push(...componentsInCategory(cat));
  }
  return out;
}

export function findComponent(id: string): DocComponent | undefined {
  const canonical = resolvePageId(id);
  return DOC_COMPONENTS.find((c) => c.id === canonical);
}

export function neighborComponents(id: string): {
  prev?: DocComponent;
  next?: DocComponent;
} {
  const list = orderedComponents();
  const i = list.findIndex((c) => c.id === resolvePageId(id));
  if (i < 0) return {};
  return {
    prev: list[i - 1],
    next: list[i + 1],
  };
}
