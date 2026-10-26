import type { CustomElementConstructor } from './register.js';

export interface ComponentDef {
  tag: string;
  load: () => Promise<{ default: CustomElementConstructor }>;
}

/**
 * Lazy catalog — each component registers itself via default export class.
 * Loaders keep the registry declarative; Vite still bundles them into one file.
 */
export const catalog: ComponentDef[] = [
  // actions
  { tag: 'k3-button', load: () => import('../components/actions/button.js') },
  { tag: 'k3-ripple', load: () => import('../components/actions/ripple.js') },
  { tag: 'k3-icon-button', load: () => import('../components/actions/icon-button.js') },
  { tag: 'k3-fab', load: () => import('../components/actions/fab.js') },
  { tag: 'k3-extended-fab', load: () => import('../components/actions/extended-fab.js') },
  { tag: 'k3-button-group', load: () => import('../components/actions/button-group.js') },
  { tag: 'k3-split-button', load: () => import('../components/actions/split-button.js') },
  { tag: 'k3-button-menu', load: () => import('../components/actions/button-menu.js') },
  { tag: 'k3-fab-menu', load: () => import('../components/actions/fab-menu.js') },
  { tag: 'k3-fab-menu-item', load: () => import('../components/actions/fab-menu-item.js') },
  { tag: 'k3-fab-dial', load: () => import('../components/actions/fab-dial.js') },
  { tag: 'k3-fab-dial-item', load: () => import('../components/actions/fab-dial-item.js') },
  { tag: 'k3-fab-rail', load: () => import('../components/actions/fab-rail.js') },
  { tag: 'k3-fab-rail-item', load: () => import('../components/actions/fab-rail-item.js') },
  { tag: 'k3-shape-chip', load: () => import('../components/actions/shape-chip.js') },
  { tag: 'k3-button-pill', load: () => import('../components/actions/button-pill.js') },
  { tag: 'k3-button-smart', load: () => import('../components/actions/button-smart.js') },
  { tag: 'k3-button-arrow', load: () => import('../components/actions/button-arrow.js') },
  { tag: 'k3-button-pad', load: () => import('../components/actions/button-pad.js') },
  { tag: 'k3-button-grid', load: () => import('../components/actions/button-grid.js') },
  {
    tag: 'k3-button-segmented',
    load: () => import('../components/actions/button-segmented.js'),
  },
  // inputs
  { tag: 'k3-text-field', load: () => import('../components/inputs/text-field.js') },
  { tag: 'k3-textarea', load: () => import('../components/inputs/textarea.js') },
  { tag: 'k3-field-group', load: () => import('../components/inputs/field-group.js') },
  { tag: 'k3-field-row', load: () => import('../components/inputs/field-row.js') },
  { tag: 'k3-pin-field', load: () => import('../components/inputs/pin-field.js') },
  { tag: 'k3-checkbox', load: () => import('../components/inputs/checkbox.js') },
  { tag: 'k3-switch', load: () => import('../components/inputs/switch.js') },
  { tag: 'k3-radio', load: () => import('../components/inputs/radio.js') },
  { tag: 'k3-chip', load: () => import('../components/inputs/chip.js') },
  { tag: 'k3-chip-set', load: () => import('../components/inputs/chip-set.js') },
  { tag: 'k3-counter', load: () => import('../components/inputs/counter.js') },
  { tag: 'k3-slider', load: () => import('../components/inputs/slider.js') },
  { tag: 'k3-select', load: () => import('../components/inputs/select.js') },
  { tag: 'k3-autocomplete', load: () => import('../components/inputs/autocomplete.js') },
  { tag: 'k3-search', load: () => import('../components/inputs/search.js') },
  // feedback
  { tag: 'k3-progress', load: () => import('../components/feedback/progress.js') },
  { tag: 'k3-loading-indicator', load: () => import('../components/feedback/loading-indicator.js') },
  { tag: 'k3-skeleton', load: () => import('../components/feedback/skeleton.js') },
  { tag: 'k3-snackbar', load: () => import('../components/feedback/snackbar.js') },
  { tag: 'k3-tooltip', load: () => import('../components/feedback/tooltip.js') },
  { tag: 'k3-badge', load: () => import('../components/feedback/badge.js') },
  { tag: 'k3-countdown', load: () => import('../components/feedback/countdown.js') },
  { tag: 'k3-marquee', load: () => import('../components/feedback/marquee.js') },
  { tag: 'k3-confetti', load: () => import('../components/feedback/confetti.js') },
  { tag: 'k3-sound-fx', load: () => import('../components/feedback/sound-fx.js') },
  // media
  { tag: 'k3-audio-player', load: () => import('../components/media/audio-player.js') },
  // containment
  { tag: 'k3-divider', load: () => import('../components/containment/divider.js') },
  { tag: 'k3-dialog', load: () => import('../components/containment/dialog.js') },
  { tag: 'k3-card', load: () => import('../components/containment/card.js') },
  { tag: 'k3-card-set', load: () => import('../components/containment/card-set.js') },
  { tag: 'k3-menu', load: () => import('../components/containment/menu.js') },
  { tag: 'k3-menu-item', load: () => import('../components/containment/menu-item.js') },
  { tag: 'k3-menu-group', load: () => import('../components/containment/menu-group.js') },
  { tag: 'k3-list', load: () => import('../components/containment/list.js') },
  { tag: 'k3-list-item', load: () => import('../components/containment/list-item.js') },
  { tag: 'k3-sheet', load: () => import('../components/containment/sheet.js') },
  { tag: 'k3-bottom-sheet', load: () => import('../components/containment/bottom-sheet.js') },
  { tag: 'k3-side-sheet', load: () => import('../components/containment/side-sheet.js') },
  { tag: 'k3-bubble', load: () => import('../components/containment/bubble.js') },
  { tag: 'k3-codeblock', load: () => import('../components/containment/codeblock.js') },
  { tag: 'k3-carousel', load: () => import('../components/containment/carousel.js') },
  { tag: 'k3-table', load: () => import('../components/containment/table.js') },
  { tag: 'k3-avatar', load: () => import('../components/containment/avatar.js') },
  {
    tag: 'k3-avatar-group',
    load: () => import('../components/containment/avatar-group.js'),
  },
  {
    tag: 'k3-avatar-group-count',
    load: () => import('../components/containment/avatar-group-count.js'),
  },
  // navigation
  { tag: 'k3-top-app-bar', load: () => import('../components/navigation/top-app-bar.js') },
  { tag: 'k3-footer-bar', load: () => import('../components/navigation/footer-bar.js') },
  { tag: 'k3-bottom-app-bar', load: () => import('../components/navigation/bottom-app-bar.js') },
  { tag: 'k3-nav-item', load: () => import('../components/navigation/nav-item.js') },
  { tag: 'k3-nav-bar', load: () => import('../components/navigation/nav-bar.js') },
  { tag: 'k3-nav-rail', load: () => import('../components/navigation/nav-rail.js') },
  { tag: 'k3-nav-drawer', load: () => import('../components/navigation/nav-drawer.js') },
  { tag: 'k3-tabs', load: () => import('../components/navigation/tabs.js') },
  { tag: 'k3-toolbar', load: () => import('../components/navigation/toolbar.js') },
  { tag: 'k3-doc-nav', load: () => import('../components/navigation/doc-nav.js') },
  { tag: 'k3-breadcrumb', load: () => import('../components/navigation/breadcrumb.js') },
  { tag: 'k3-pagination', load: () => import('../components/navigation/pagination.js') },
  {
    tag: 'k3-pagination-alpha',
    load: () => import('../components/navigation/pagination-alpha.js'),
  },
  { tag: 'k3-index-list', load: () => import('../components/navigation/index-list.js') },
  {
    tag: 'k3-scroll-to-top',
    load: () => import('../components/navigation/scroll-to-top.js'),
  },
  // pickers
  { tag: 'k3-calendar', load: () => import('../components/pickers/calendar.js') },
  { tag: 'k3-date-picker', load: () => import('../components/pickers/date-picker.js') },
  {
    tag: 'k3-date-picker-toggle',
    load: () => import('../components/pickers/date-picker-toggle.js'),
  },
  { tag: 'k3-time-picker', load: () => import('../components/pickers/time-picker.js') },
  {
    tag: 'k3-time-picker-dial',
    load: () => import('../components/pickers/time-picker-dial.js'),
  },
  {
    tag: 'k3-time-picker-toggle',
    load: () => import('../components/pickers/time-picker-toggle.js'),
  },
  {
    tag: 'k3-mood-calendar',
    load: () => import('../components/pickers/mood-calendar.js'),
  },
  { tag: 'k3-wheel-picker', load: () => import('../components/pickers/wheel-picker.js') },
  // theme
  { tag: 'k3-theme', load: () => import('../components/theme/theme.js') },
];

export const allTags = catalog.map((c) => c.tag);
