/** Compact periodic-table dataset for the iso-filter demo (Isotope-style). */

export type ElementGroup =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'
  | 'lanthanide'
  | 'actinide';

export interface PeriodicElement {
  z: number;
  symbol: string;
  name: string;
  group: ElementGroup;
  /** Visual weight for masonry (1–3). */
  weight: 1 | 2 | 3;
}

export const ELEMENT_GROUPS: { id: ElementGroup | '*'; labelKey: string; label: string }[] = [
  { id: '*', labelKey: 'doc.iso-filter.group.all', label: 'All' },
  { id: 'alkali', labelKey: 'doc.iso-filter.group.alkali', label: 'Alkali' },
  { id: 'alkaline-earth', labelKey: 'doc.iso-filter.group.alkaline-earth', label: 'Alkaline earth' },
  { id: 'transition', labelKey: 'doc.iso-filter.group.transition', label: 'Transition' },
  { id: 'post-transition', labelKey: 'doc.iso-filter.group.post-transition', label: 'Post-transition' },
  { id: 'metalloid', labelKey: 'doc.iso-filter.group.metalloid', label: 'Metalloid' },
  { id: 'nonmetal', labelKey: 'doc.iso-filter.group.nonmetal', label: 'Nonmetal' },
  { id: 'halogen', labelKey: 'doc.iso-filter.group.halogen', label: 'Halogen' },
  { id: 'noble', labelKey: 'doc.iso-filter.group.noble', label: 'Noble gas' },
  { id: 'lanthanide', labelKey: 'doc.iso-filter.group.lanthanide', label: 'Lanthanide' },
  { id: 'actinide', labelKey: 'doc.iso-filter.group.actinide', label: 'Actinide' },
];

/** Representative subset (not all 118) — enough for a clear filter demo. */
export const PERIODIC_ELEMENTS: PeriodicElement[] = [
  { z: 1, symbol: 'H', name: 'Hydrogen', group: 'nonmetal', weight: 1 },
  { z: 2, symbol: 'He', name: 'Helium', group: 'noble', weight: 1 },
  { z: 3, symbol: 'Li', name: 'Lithium', group: 'alkali', weight: 1 },
  { z: 4, symbol: 'Be', name: 'Beryllium', group: 'alkaline-earth', weight: 1 },
  { z: 5, symbol: 'B', name: 'Boron', group: 'metalloid', weight: 1 },
  { z: 6, symbol: 'C', name: 'Carbon', group: 'nonmetal', weight: 2 },
  { z: 7, symbol: 'N', name: 'Nitrogen', group: 'nonmetal', weight: 1 },
  { z: 8, symbol: 'O', name: 'Oxygen', group: 'nonmetal', weight: 2 },
  { z: 9, symbol: 'F', name: 'Fluorine', group: 'halogen', weight: 1 },
  { z: 10, symbol: 'Ne', name: 'Neon', group: 'noble', weight: 1 },
  { z: 11, symbol: 'Na', name: 'Sodium', group: 'alkali', weight: 2 },
  { z: 12, symbol: 'Mg', name: 'Magnesium', group: 'alkaline-earth', weight: 1 },
  { z: 13, symbol: 'Al', name: 'Aluminium', group: 'post-transition', weight: 1 },
  { z: 14, symbol: 'Si', name: 'Silicon', group: 'metalloid', weight: 2 },
  { z: 15, symbol: 'P', name: 'Phosphorus', group: 'nonmetal', weight: 1 },
  { z: 16, symbol: 'S', name: 'Sulfur', group: 'nonmetal', weight: 1 },
  { z: 17, symbol: 'Cl', name: 'Chlorine', group: 'halogen', weight: 2 },
  { z: 18, symbol: 'Ar', name: 'Argon', group: 'noble', weight: 1 },
  { z: 19, symbol: 'K', name: 'Potassium', group: 'alkali', weight: 1 },
  { z: 20, symbol: 'Ca', name: 'Calcium', group: 'alkaline-earth', weight: 2 },
  { z: 22, symbol: 'Ti', name: 'Titanium', group: 'transition', weight: 2 },
  { z: 24, symbol: 'Cr', name: 'Chromium', group: 'transition', weight: 1 },
  { z: 26, symbol: 'Fe', name: 'Iron', group: 'transition', weight: 3 },
  { z: 28, symbol: 'Ni', name: 'Nickel', group: 'transition', weight: 1 },
  { z: 29, symbol: 'Cu', name: 'Copper', group: 'transition', weight: 2 },
  { z: 30, symbol: 'Zn', name: 'Zinc', group: 'transition', weight: 1 },
  { z: 33, symbol: 'As', name: 'Arsenic', group: 'metalloid', weight: 1 },
  { z: 35, symbol: 'Br', name: 'Bromine', group: 'halogen', weight: 1 },
  { z: 36, symbol: 'Kr', name: 'Krypton', group: 'noble', weight: 1 },
  { z: 47, symbol: 'Ag', name: 'Silver', group: 'transition', weight: 2 },
  { z: 50, symbol: 'Sn', name: 'Tin', group: 'post-transition', weight: 1 },
  { z: 53, symbol: 'I', name: 'Iodine', group: 'halogen', weight: 1 },
  { z: 54, symbol: 'Xe', name: 'Xenon', group: 'noble', weight: 1 },
  { z: 55, symbol: 'Cs', name: 'Caesium', group: 'alkali', weight: 1 },
  { z: 56, symbol: 'Ba', name: 'Barium', group: 'alkaline-earth', weight: 1 },
  { z: 74, symbol: 'W', name: 'Tungsten', group: 'transition', weight: 2 },
  { z: 78, symbol: 'Pt', name: 'Platinum', group: 'transition', weight: 1 },
  { z: 79, symbol: 'Au', name: 'Gold', group: 'transition', weight: 3 },
  { z: 80, symbol: 'Hg', name: 'Mercury', group: 'transition', weight: 2 },
  { z: 82, symbol: 'Pb', name: 'Lead', group: 'post-transition', weight: 2 },
  { z: 92, symbol: 'U', name: 'Uranium', group: 'actinide', weight: 3 },
  { z: 94, symbol: 'Pu', name: 'Plutonium', group: 'actinide', weight: 2 },
  { z: 57, symbol: 'La', name: 'Lanthanum', group: 'lanthanide', weight: 1 },
  { z: 58, symbol: 'Ce', name: 'Cerium', group: 'lanthanide', weight: 1 },
  { z: 60, symbol: 'Nd', name: 'Neodymium', group: 'lanthanide', weight: 2 },
  { z: 64, symbol: 'Gd', name: 'Gadolinium', group: 'lanthanide', weight: 1 },
];
