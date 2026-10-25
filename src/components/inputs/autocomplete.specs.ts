/**
 * Autocomplete — M3 combobox + filterable listbox panel.
 *
 * @see https://m3.material.io/components/text-fields/overview
 */

export type AutocompleteFilterMode = 'contains' | 'starts-with' | 'ends-with' | 'none';

export type AutocompleteOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type AutocompleteOptionInput = string | AutocompleteOption;

export const AutocompleteSpecs = {
  behaviors: {
    filter: 'contains' as AutocompleteFilterMode,
    caseSensitive: false,
    openOnFocus: true,
    closeOnSelect: true,
    hideNoData: false,
    hideLoading: false,
    loading: false,
  },
  accessibility: {
    comboboxRole: 'combobox' as const,
    listboxRole: 'listbox' as const,
    optionRole: 'option' as const,
  },
} as const;

export function resolveAutocompleteFilter(raw: string | null | undefined): AutocompleteFilterMode {
  if (
    raw === 'contains' ||
    raw === 'starts-with' ||
    raw === 'ends-with' ||
    raw === 'none'
  ) {
    return raw;
  }
  return AutocompleteSpecs.behaviors.filter;
}

/** Normalize string or object options to `{ value, label, disabled? }`. */
export function normalizeAutocompleteOptions(
  raw: AutocompleteOptionInput[],
): AutocompleteOption[] {
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      return { value: entry, label: entry };
    }
    return {
      value: entry.value,
      label: entry.label,
      disabled: !!entry.disabled,
    };
  });
}
