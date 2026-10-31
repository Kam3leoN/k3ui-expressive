import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { avatarStyles } from './avatar.styles.js';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarVariant = 'filled' | 'outlined' | 'elevated';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type AvatarTone =
  | 'auto'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'neutral';
/** Presence — aligned with K3ui v1 + common chat status. */
export type AvatarStatus =
  | ''
  | 'online'
  | 'offline'
  | 'idle'
  | 'away'
  | 'dnd'
  | 'busy';

const TONES: Exclude<AvatarTone, 'auto'>[] = [
  'primary',
  'secondary',
  'tertiary',
  'error',
  'neutral',
];

/** Initials from a display name (max 2 chars). */
export function avatarInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function toneFromName(name: string): Exclude<AvatarTone, 'auto'> {
  if (!name) return 'secondary';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return TONES[h % TONES.length]!;
}

/**
 * User avatar — image, initials, or person icon, with optional status / badge.
 *
 * Composition (shadcn-inspired):
 * ```
 * k3-avatar
 * ├── (image via src / slotted img)
 * ├── fallback initials / icon
 * └── status badge · slot=badge
 * ```
 *
 * @see https://ui.shadcn.com/docs/components/base/avatar
 * @see https://k3ui-docs.vercel.app/avatar.php
 */
export class K3Avatar extends K3Element {
  static override styles = [hostReset, avatarStyles];

  @property({ reflect: true }) size: AvatarSize = 'md';
  @property({ reflect: true }) variant: AvatarVariant = 'filled';
  @property({ reflect: true }) shape: AvatarShape = 'circle';
  /** Semantic surface — `auto` hashes from `name`. */
  @property() tone: AvatarTone = 'auto';
  @property() name = '';
  @property() src = '';
  @property() alt = '';
  /** Override auto initials from `name`. */
  @property() initials = '';
  @property({ reflect: true }) status: AvatarStatus = '';
  /** Optional Material Symbol ligature inside the status badge. */
  @property({ attribute: 'badge-icon' }) badgeIcon = '';
  /** Render face as `<button>` (menu trigger / clickable). */
  @property({ type: Boolean, reflect: true }) interactive = false;

  @state() private imgFailed = false;
  @state() private imgLoaded = false;

  private get resolvedTone(): Exclude<AvatarTone, 'auto'> {
    if (this.tone !== 'auto') return this.tone;
    return toneFromName(this.name || this.initials);
  }

  private get resolvedInitials(): string {
    return (this.initials || avatarInitials(this.name)).slice(0, 2);
  }

  private get label(): string {
    return this.alt || this.name || 'Avatar';
  }

  private get showImage(): boolean {
    return Boolean(this.src) && !this.imgFailed;
  }

  private onImgError = (): void => {
    this.imgFailed = true;
    this.imgLoaded = false;
  };

  private onImgLoad = (): void => {
    this.imgLoaded = true;
    this.imgFailed = false;
  };

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('src')) {
      this.imgFailed = false;
      this.imgLoaded = false;
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.setAttribute('data-tone', this.resolvedTone);
  }

  private renderFallback() {
    if (this.hasSlot('fallback')) {
      return html`<span class="initials" part="fallback"><slot name="fallback"></slot></span>`;
    }
    const letters = this.resolvedInitials;
    if (letters) {
      return html`<span class="initials" part="fallback" aria-hidden="true">${letters}</span>`;
    }
    if (this.hasSlot('icon')) {
      return html`<span class="icon" part="fallback"><slot name="icon"></slot></span>`;
    }
    return html`<span
      class="icon notranslate"
      part="fallback"
      translate="no"
      lang="zxx"
      data-k3-icon="person"
      aria-hidden="true"
    ></span>`;
  }

  private renderBadge() {
    if (this.hasSlot('badge')) {
      return html`<slot name="badge"></slot>`;
    }
    if (!this.status) return nothing;
    /* Presence = CSS shapes (v1 idle crescent / dnd bar). Icons only via badge-icon. */
    const icon = this.badgeIcon.trim();
    return html`<span
      class="badge"
      part="badge"
      data-status=${this.status}
      aria-hidden="true"
      title=${this.status}
    >
      ${icon
        ? html`<span
            class="badge-icon notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon=${icon}
          ></span>`
        : nothing}
    </span>`;
  }

  private renderFaceContent() {
    const showFallback = !this.showImage || !this.imgLoaded;
    return html`
      ${this.showImage
        ? html`<img
            part="image"
            src=${this.src}
            alt=""
            draggable="false"
            ?hidden=${!this.imgLoaded}
            @error=${this.onImgError}
            @load=${this.onImgLoad}
          />`
        : nothing}
      ${showFallback ? this.renderFallback() : nothing}
      <slot></slot>
    `;
  }

  override render() {
    const face = this.interactive
      ? html`<button
          type="button"
          class="face"
          part="face"
          aria-label=${this.label}
        >
          ${this.renderFaceContent()}
        </button>`
      : html`<span class="face" part="face" role="img" aria-label=${this.label}>
          ${this.renderFaceContent()}
        </span>`;

    return html`${face}${this.renderBadge()}`;
  }
}

export default K3Avatar;

if (!customElements.get('k3-avatar')) {
  customElements.define('k3-avatar', K3Avatar);
}
