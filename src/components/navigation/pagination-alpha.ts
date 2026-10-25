import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  PaginationAlphaSpecs,
  buildLetterCounts,
  type PaginationAlphaOrientation,
  type PaginationAlphaSize,
} from './pagination-alpha.specs.js';
import { paginationAlphaStyles } from './pagination-alpha.styles.js';

export {
  PaginationAlphaSpecs,
  buildLetterCounts,
  type PaginationAlphaSize,
  type PaginationAlphaOrientation,
} from './pagination-alpha.specs.js';

function parseItemsAttr(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * A–Z index strip — counts optional, horizontal or vertical.
 *
 * @fires k3-select - `{ letter }`
 */
export class K3PaginationAlpha extends K3Element {
  static override styles = [hostReset, paginationAlphaStyles];

  @property({
    attribute: 'items',
    converter: {
      fromAttribute: parseItemsAttr,
      toAttribute: (v: string[]) => JSON.stringify(v),
    },
  })
  items: string[] = [];

  @property({ attribute: 'active-letter', reflect: true })
  activeLetter = PaginationAlphaSpecs.defaultActiveLetter;

  @property({ reflect: true })
  size: PaginationAlphaSize = PaginationAlphaSpecs.defaultSize;

  @property({ reflect: true })
  orientation: PaginationAlphaOrientation = PaginationAlphaSpecs.defaultOrientation;

  @property({ type: Boolean, attribute: 'show-count', reflect: true })
  showCount = PaginationAlphaSpecs.showCount;

  @property({ type: Boolean, attribute: 'show-disabled', reflect: true })
  showDisabled = PaginationAlphaSpecs.showDisabled;

  private selectLetter(letter: string): void {
    this.activeLetter = letter;
    this.emit('k3-select', { letter });
  }

  override render() {
    const counts = buildLetterCounts(this.items);
    const active = this.activeLetter.toUpperCase().charAt(0) || 'A';

    return html`
      <nav class="nav" aria-label="Alphabetical index">
        ${PaginationAlphaSpecs.alphabet.map((letter) => {
          const count = counts[letter] ?? 0;
          const disabled = count === 0;
          if (!this.showDisabled && disabled) return nothing;

          const isActive = letter === active;
          const label =
            count === 0 ? `${letter} — 0 entries` : `${letter} — ${count} entries`;

          return html`<button
            type="button"
            class=${classMap({
              'letter-btn': true,
              'letter-btn--active': isActive,
            })}
            data-letter=${letter}
            ?disabled=${disabled}
            aria-label=${label}
            title=${label}
            aria-current=${isActive ? 'true' : nothing}
            @click=${() => this.selectLetter(letter)}
          >
            <span class="letter">${letter}</span>
            ${this.showCount
              ? html`<span class="count" aria-hidden="true"
                  >${count > 9999 ? '9999+' : String(count)}</span
                >`
              : nothing}
          </button>`;
        })}
      </nav>
    `;
  }
}

export default K3PaginationAlpha;

if (!customElements.get('k3-pagination-alpha')) {
  customElements.define('k3-pagination-alpha', K3PaginationAlpha);
}
