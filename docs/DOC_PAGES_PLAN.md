# Plan — pages doc playground

Constats et lots pour appliquer `.cursor/rules/doc-page-template.mdc`.

## Outillage (phase 0)

Voir `DOC_PAGES_TASK.md` étape B : `k3-codeblock`, `createExample`, `doc-sections.ts`, tables theming/keyboard/motion, `mountDocPage`, garde-fou `doc-pages.test.ts`, CEM optionnel.

## Pages concernées

Tous les `DOC_COMPONENTS` hors catégories `Styles` et `Resources`.

## Ordre des lots (étape C)

### Pilotes (d’abord)

1. `buttons`
2. `text-field`
3. `dialog`

### Inputs

`textarea`, `field-group`, `pin-field`, `select`, `checkbox`, `radio`, `switch`, `chip`, `autocomplete`, `counter`, `slider`, `date-picker`, `mood-calendar`, `time-picker`  
(+ `signature`, `rating`, `wheel-picker` si encore au catalogue produit actif)

### Buttons

`buttons-icon`, `buttons-grid`, `buttons-group`, `buttons-menu`, `buttons-pad`, `buttons-pill`, `buttons-segmented`, `buttons-smart`, `buttons-split`

### Actions

`fab`, `fab-extended`, `fab-menu`, `fab-dial`, `fab-rail`, `ripple`, `shape-chip`

### Feedback

`progress`, `loading`, `skeleton`, `lazy`, `snackbar`, `alert`, `tooltip`, `badge`, `text-marquee` (si catalogue)

### Containment

`avatar`, `bubble`, `quote`, `codeblock`, `carousel`, `coverflow`, `card`, `menu`, `list`, `table`, `sheet`

### Navigation

`breadcrumb`, `app-bar`, `footer-bar`, `tabs`, `navigation-bar`, `navigation-rail`, `index-list`, `prev-next`

### Charts / Animation / Utilities

Selon catalogue `k3ui` actif au moment du lot — ignorer les pages `product: 'k3ux'` hors scope k3ui, ou les traiter après.

## Structure `DOC_SECTIONS`

```ts
type Na = { na: string };
type DocSections = {
  theming: SpecRow[] | Na;
  keyboard: SpecRow[] | Na;
  focus: string | Na;      // prose i18n key or short text
  motion: SpecRow[] | Na;
  a11y: string | Na;
  versions: string | Na;
};
```

## Reprise

`PENDING_PAGES` dans `tests/unit/doc-pages.test.ts` = pages pas encore migrées. Vide → étape D.
