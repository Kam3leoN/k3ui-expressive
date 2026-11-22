/** Top-level adaptive destinations (rail / bar) — after FAB. */
export interface NavDestination {
  id: string;
  /** Meta key for grouping / active resolve */
  category: string;
  icon: string;
  labelKey: string;
  /**
   * Direct page hash (`#/quick-start`) — navigates on click.
   * Empty → opens the secondary components/styles menu.
   * Pack Builder is reached from Démarrage, not the rail.
   */
  href: string;
}

/** Component categories nested under the Components menu (parent → child pages). */
export interface ComponentMenuGroup {
  category: string;
  icon: string;
  labelKey: string;
}

/** Internal pages under the Resources rail destination (Sober-like). */
export interface ResourcePage {
  id: string;
  icon: string;
  labelKey: string;
}

export const COMPONENT_MENU_GROUPS: ComponentMenuGroup[] = [
  { category: 'Buttons', icon: 'touch_app', labelKey: 'doc.nav.buttons' },
  { category: 'Actions', icon: 'bolt', labelKey: 'doc.nav.actions' },
  { category: 'Inputs', icon: 'input', labelKey: 'doc.nav.inputs' },
  { category: 'Feedback', icon: 'notifications', labelKey: 'doc.nav.feedback' },
  { category: 'Charts', icon: 'bar_chart', labelKey: 'doc.nav.charts' },
  { category: 'Containment', icon: 'dashboard', labelKey: 'doc.nav.containment' },
  { category: 'Navigation', icon: 'navigation', labelKey: 'doc.nav.navigation' },
];

/** Top-level / non-component categories (Utilities · Animation · Styles · Resources). */
const OTHER_CATEGORY_ICONS: Record<string, string> = {
  Utilities: 'tune',
  Animation: 'animation',
  Styles: 'palette',
  Resources: 'inventory_2',
  'Quick start': 'rocket_launch',
};

/** Distinct leading icons for secondary menu / sheet leaves (subset ligatures only). */
export const COMPONENT_ITEM_ICONS: Record<string, string> = {
  buttons: 'touch_app',
  'buttons-grid': 'apps',
  'buttons-group': 'view_column',
  'buttons-icon': 'mood',
  'buttons-menu': 'menu_open',
  'buttons-pad': 'sports_esports',
  'buttons-pill': 'change_history',
  'buttons-segmented': 'view_list',
  'buttons-smart': 'bolt',
  'buttons-split': 'arrow_drop_down',
  fab: 'add',
  'fab-dial': 'radio',
  'fab-extended': 'open_in_full',
  'fab-menu': 'apps',
  'fab-rail': 'view_column',
  ripple: 'water_drop',
  'shape-chip': 'shapes',
  'text-field': 'title',
  textarea: 'notes',
  'field-group': 'view_list',
  'pin-field': 'grid_on',
  select: 'arrow_drop_down',
  checkbox: 'check_circle',
  radio: 'radio',
  switch: 'tune',
  chip: 'bookmark',
  autocomplete: 'search',
  counter: 'add',
  signature: 'edit',
  slider: 'straighten',
  rating: 'star',
  'date-picker': 'calendar_today',
  'mood-calendar': 'sentiment_satisfied',
  'time-picker': 'schedule',
  'wheel-picker': 'timer',
  progress: 'steps',
  loading: 'restart_alt',
  skeleton: 'dashboard',
  lazy: 'schedule',
  snackbar: 'info',
  alert: 'warning',
  banner: 'notifications',
  dialog: 'chat',
  tooltip: 'help',
  badge: 'notifications',
  status: 'check_circle',
  kbd: 'keyboard',
  countdown: 'timer',
  marquee: 'view_list',
  confetti: 'celebration',
  snow: 'rainy',
  firework: 'local_fire_department',
  'sparkle-mouse': 'flare',
  'voice-ring': 'mic',
  'sound-fx': 'volume_up',
  'audio-player': 'library_music',
  'qr-code': 'qr_code_2',
  'charts-bar': 'bar_chart',
  'charts-line': 'show_chart',
  'charts-other': 'pie_chart',
  'text-bounce': 'title',
  'text-scramble': 'shuffle',
  'icons-burst': 'favorite',
  halftone: 'grid_on',
  parallax: 'layers',
  avatar: 'account_circle',
  bubble: 'chat',
  quote: 'notes',
  codeblock: 'code',
  carousel: 'view_column',
  coverflow: 'image',
  card: 'dashboard',
  'card-holo': 'flare',
  'card-lenticular': 'layers',
  'card-scratch': 'content_cut',
  menu: 'menu',
  list: 'list',
  tree: 'account_tree',
  'expansion-panel': 'expand_more',
  'command-palette': 'keyboard',
  'iso-filter': 'filter_alt',
  masonry: 'widgets',
  table: 'grid_on',
  sheet: 'upload',
  breadcrumb: 'more_horiz',
  toc: 'menu_book',
  'app-bar': 'menu',
  'footer-bar': 'menu',
  tabs: 'view_column',
  stepper: 'linear_scale',
  'navigation-bar': 'menu',
  'navigation-rail': 'view_column',
  'index-list': 'list',
  pagination: 'last_page',
  'pagination-alpha': 'match_case',
  'prev-next': 'swap_horiz',
  'scroll-to-top': 'arrow_upward',
  toolbar: 'settings',
  gestures: 'gesture',
  keyboard: 'keyboard',
  'keyboard-media': 'queue_music',
  mouse: 'mouse',
  dnd: 'drag_indicator',
  scrollbar: 'swap_vert',
  'color-roles': 'palette',
  'color-palettes': 'palette',
  'color-extras': 'flare',
  elevation: 'layers',
  grid: 'grid_on',
  'material-symbols': 'mood',
  motion: 'animation',
  shapes: 'shapes',
  spacing: 'space_bar',
  typography: 'match_case',
};

/** Leading icon for a catalog category (Components groups + other destinations). */
export function iconForCategory(category: string): string {
  const fromGroup = COMPONENT_MENU_GROUPS.find((g) => g.category === category)?.icon;
  if (fromGroup) return fromGroup;
  return OTHER_CATEGORY_ICONS[category] ?? 'widgets';
}

/** Leading icon for a component leaf — distinct when mapped, else category icon. */
export function iconForComponent(id: string, category: string): string {
  return COMPONENT_ITEM_ICONS[id] ?? iconForCategory(category);
}

/** Material Symbols browser — ligatures only (no ms-icon package). */
export const RESOURCE_PAGES: ResourcePage[] = [
  {
    id: 'material-symbols',
    icon: 'mood',
    labelKey: 'doc.nav.resources.material-symbols',
  },
];

export const NAV_DESTINATIONS: NavDestination[] = [
  {
    id: 'quick-start',
    category: 'Quick start',
    icon: 'rocket_launch',
    labelKey: 'doc.nav.quick-start',
    href: '#/quick-start',
  },
  {
    id: 'components',
    category: 'Components',
    icon: 'widgets',
    labelKey: 'doc.nav.components',
    href: '',
  },
  {
    id: 'utilities',
    category: 'Utilities',
    icon: 'tune',
    labelKey: 'doc.nav.utilities',
    href: '',
  },
  {
    id: 'animations',
    category: 'Animation',
    icon: 'animation',
    labelKey: 'doc.nav.animation',
    href: '',
  },
  {
    id: 'styles',
    category: 'Styles',
    icon: 'palette',
    labelKey: 'doc.nav.styles',
    href: '',
  },
  {
    id: 'showcase',
    category: 'Showcase',
    icon: 'apps',
    labelKey: 'doc.nav.showcase',
    href: '#/showcase',
  },
  {
    id: 'resources',
    category: 'Resources',
    icon: 'inventory_2',
    labelKey: 'doc.nav.resources',
    href: '',
  },
];

/**
 * Rail destinations — unified doc (k3ui + k3ux in one catalog).
 * `product` kept for call-site compat; ignored.
 */
export function navDestinationsForProduct(_product?: 'k3ui' | 'k3ux'): NavDestination[] {
  return [...NAV_DESTINATIONS];
}

export function isComponentCategory(category: string): boolean {
  return COMPONENT_MENU_GROUPS.some((g) => g.category === category);
}

export function destinationForPage(
  pageId: string,
  categoryOf: (id: string) => string | undefined,
): NavDestination | null {
  if (pageId === 'home') return null;
  if (pageId === 'quick-start' || pageId === 'pack') {
    /* Pack is reached from Démarrage — keep that rail item active. */
    return NAV_DESTINATIONS.find((d) => d.id === 'quick-start') ?? null;
  }
  if (
    pageId === 'showcase' ||
    pageId === 'showcase-pricing' ||
    pageId === 'showcase-login' ||
    pageId === 'showcase-dialer'
  ) {
    return NAV_DESTINATIONS.find((d) => d.id === 'showcase') ?? null;
  }
  /* Legacy Color hashes share the Styles destination */
  if (
    pageId === 'colors' ||
    pageId === 'colors-roles' ||
    pageId === 'colors-palettes' ||
    pageId === 'colors-m2' ||
    pageId === 'm2-colors'
  ) {
    return NAV_DESTINATIONS.find((d) => d.id === 'styles') ?? null;
  }
  const cat = categoryOf(pageId);
  if (!cat) return null;
  if (cat === 'Styles') {
    return NAV_DESTINATIONS.find((d) => d.id === 'styles') ?? null;
  }
  if (cat === 'Utilities') {
    return NAV_DESTINATIONS.find((d) => d.id === 'utilities') ?? null;
  }
  if (cat === 'Animation') {
    return NAV_DESTINATIONS.find((d) => d.id === 'animations') ?? null;
  }
  if (cat === 'Resources') {
    return NAV_DESTINATIONS.find((d) => d.id === 'resources') ?? null;
  }
  if (isComponentCategory(cat)) {
    return NAV_DESTINATIONS.find((d) => d.id === 'components') ?? null;
  }
  return null;
}
