/** Define the k3ui tags this showcase needs (standalone, no playground). */
import K3Button from '@k3ui/components/actions/button.js';
import K3ButtonGroup from '@k3ui/components/actions/button-group.js';
import K3IconButton from '@k3ui/components/actions/icon-button.js';
import K3TextField from '@k3ui/components/inputs/text-field.js';
import K3Checkbox from '@k3ui/components/inputs/checkbox.js';
import K3Chip from '@k3ui/components/inputs/chip.js';
import K3Switch from '@k3ui/components/inputs/switch.js';
import K3Banner from '@k3ui/components/feedback/banner.js';
import K3Snackbar from '@k3ui/components/feedback/snackbar.js';
import K3Accordion from '@k3ui/components/containment/accordion.js';
import K3ExpansionPanel from '@k3ui/components/containment/expansion-panel.js';
import K3Divider from '@k3ui/components/containment/divider.js';
import K3List from '@k3ui/components/containment/list.js';
import K3ListItem from '@k3ui/components/containment/list-item.js';
import K3Dialog from '@k3ui/components/containment/dialog.js';

for (const [tag, ctor] of [
  ['k3-button', K3Button],
  ['k3-button-group', K3ButtonGroup],
  ['k3-icon-button', K3IconButton],
  ['k3-text-field', K3TextField],
  ['k3-checkbox', K3Checkbox],
  ['k3-chip', K3Chip],
  ['k3-switch', K3Switch],
  ['k3-banner', K3Banner],
  ['k3-snackbar', K3Snackbar],
  ['k3-accordion', K3Accordion],
  ['k3-expansion-panel', K3ExpansionPanel],
  ['k3-divider', K3Divider],
  ['k3-list', K3List],
  ['k3-list-item', K3ListItem],
  ['k3-dialog', K3Dialog],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}
