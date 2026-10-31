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
  { category: 'Actions', icon: 'gesture', labelKey: 'doc.nav.actions' },
  { category: 'Inputs', icon: 'input', labelKey: 'doc.nav.inputs' },
  { category: 'Feedback', icon: 'notifications', labelKey: 'doc.nav.feedback' },
  { category: 'Containment', icon: 'dashboard', labelKey: 'doc.nav.containment' },
  { category: 'Navigation', icon: 'menu', labelKey: 'doc.nav.navigation' },
];

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
    id: 'styles',
    category: 'Styles',
    icon: 'palette',
    labelKey: 'doc.nav.styles',
    href: '',
  },
  {
    id: 'resources',
    category: 'Resources',
    icon: 'inventory_2',
    labelKey: 'doc.nav.resources',
    href: '',
  },
];

export function isComponentCategory(category: string): boolean {
  return COMPONENT_MENU_GROUPS.some((g) => g.category === category);
}

export function destinationForPage(
  pageId: string,
  categoryOf: (id: string) => string | undefined,
): NavDestination | null {
  if (pageId === 'home') return null;
  if (pageId === 'quick-start') {
    return NAV_DESTINATIONS.find((d) => d.id === 'quick-start') ?? null;
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
  if (cat === 'Resources') {
    return NAV_DESTINATIONS.find((d) => d.id === 'resources') ?? null;
  }
  if (isComponentCategory(cat)) {
    return NAV_DESTINATIONS.find((d) => d.id === 'components') ?? null;
  }
  return null;
}
