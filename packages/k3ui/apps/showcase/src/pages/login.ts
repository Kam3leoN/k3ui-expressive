import { html, nothing, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Login page is built with k3ui components only (no k3ux). */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

type BrandOpts = { slotIcon?: boolean };

/** Official-ish brand marks (SVG) — not Material Symbols. */
function brandGoogle(opts: BrandOpts = {}): TemplateResult {
  return html`
    <svg
      slot=${opts.slotIcon ? 'icon' : nothing}
      class="login-brand"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  `;
}

function brandGithub(opts: BrandOpts = {}): TemplateResult {
  return html`
    <svg
      slot=${opts.slotIcon ? 'icon' : nothing}
      class="login-brand"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  `;
}

function brandLinkedin(opts: BrandOpts = {}): TemplateResult {
  return html`
    <svg
      slot=${opts.slotIcon ? 'icon' : nothing}
      class="login-brand"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z"
      />
    </svg>
  `;
}

function unlockAutofillGuard(e: Event): void {
  const el = e.currentTarget as HTMLElement & { readonly?: boolean };
  if (!el.readonly) return;
  el.readonly = false;
}

function toggleSecretReveal(e: Event): void {
  e.preventDefault();
  e.stopPropagation();
  const btn = e.currentTarget as HTMLElement;
  const field = btn.closest('k3-text-field');
  if (!field) return;
  const revealed = field.toggleAttribute('data-revealed');
  const icon = btn.querySelector('[data-k3-icon]') as HTMLElement | null;
  if (icon) {
    icon.setAttribute('data-k3-icon', revealed ? 'visibility_off' : 'visibility');
    icon.textContent = '';
  }
  btn.setAttribute(
    'aria-label',
    revealed ? t('showcase.login.hidePassword') : t('showcase.login.showPassword'),
  );
}

function loginForm(): TemplateResult {
  const icon = { slotIcon: true };
  return html`
    <form
      class="login-form"
      autocomplete="off"
      data-lpignore="true"
      data-1p-ignore
      data-bwignore
      data-form-type="other"
      @submit=${(e: Event) => {
        e.preventDefault();
      }}
    >
      <!-- Soak Chrome password manager so real fields stay clean -->
      <div class="login-autofill-trap" aria-hidden="true">
        <input tabindex="-1" autocomplete="username" />
        <input tabindex="-1" type="password" autocomplete="current-password" />
      </div>

      <k3-text-field
        class="login-field"
        variant="outlined"
        label=${t('showcase.login.email')}
        type="text"
        name="showcase_email_demo"
        autocomplete="off"
        readonly
        required
        @focus=${unlockAutofillGuard}
      >
        <span
          slot="leading-icon"
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="mail"
          aria-hidden="true"
        ></span>
      </k3-text-field>

      <!-- type=text + CSS disc — type=password always summons Chrome’s bubble -->
      <k3-text-field
        class="login-field login-field--secret"
        variant="outlined"
        label=${t('showcase.login.password')}
        type="text"
        name="showcase_secret_demo"
        autocomplete="off"
        .passwordToggle=${false}
        readonly
        required
        @focus=${unlockAutofillGuard}
      >
        <span
          slot="leading-icon"
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="lock"
          aria-hidden="true"
        ></span>
        <button
          type="button"
          slot="trailing-icon"
          class="login-secret-toggle"
          aria-label=${t('showcase.login.showPassword')}
          @click=${toggleSecretReveal}
        >
          <span
            class="ms notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="visibility"
            aria-hidden="true"
          ></span>
        </button>
      </k3-text-field>

      <div class="login-form__row">
        <k3-checkbox>${t('showcase.login.remember')}</k3-checkbox>
        <a class="login-link" href="#/login">${t('showcase.login.forgot')}</a>
      </div>

      <k3-button type="submit" variant="filled" size="md" class="login-form__submit">
        <span
          slot="icon"
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="arrow_forward"
          aria-hidden="true"
        ></span>
        ${t('showcase.login.submit')}
      </k3-button>
    </form>

    <p class="login-or"><span>${t('showcase.login.or')}</span></p>

    <k3-button-group
      class="login-social"
      variant="segmented"
      selection="none"
      equal-width
      size="md"
      sync
      shape="round"
      label=${t('showcase.login.or')}
    >
      <k3-button class="login-social__btn" variant="outlined" value="google">
        ${brandGoogle(icon)} ${t('showcase.login.google')}
      </k3-button>
      <k3-button class="login-social__btn" variant="outlined" value="github">
        ${brandGithub(icon)} ${t('showcase.login.github')}
      </k3-button>
      <k3-button class="login-social__btn" variant="outlined" value="linkedin">
        ${brandLinkedin(icon)} ${t('showcase.login.linkedin')}
      </k3-button>
    </k3-button-group>
  `;
}

function openLoginDialog(host: HTMLElement): void {
  const dlg = host.querySelector('k3-dialog.login-dialog') as
    | (HTMLElement & { show: () => Promise<boolean> })
    | null;
  void dlg?.show();
}

export function mountLogin(host: HTMLElement): () => void {
  const showTitle = !host.closest('.showcase-doc');

  render(
    html`
      <section
        class="page page--login"
        aria-labelledby=${showTitle ? 'login-title' : nothing}
        aria-label=${showTitle ? nothing : t('showcase.nav.login')}
      >
        ${showTitle
          ? pageTitleRow('showcase.nav.login', PAGE_STACK, 'login-title')
          : null}

        <p class="login-lead">${t('showcase.login.lead')}</p>

        <!-- Google-style account chip → opens dialog -->
        <button
          type="button"
          class="login-account-bar"
          @click=${() => openLoginDialog(host)}
        >
          ${brandGoogle()}
          <span class="login-account-bar__label"
            >${t('showcase.login.manageAccount')}</span
          >
        </button>

        <k3-dialog class="login-dialog" variant="basic">
          <span slot="headline">${t('showcase.login.title')}</span>
          <div class="login-dialog__body">${loginForm()}</div>
          <k3-button slot="actions" variant="text">
            ${t('showcase.login.signup')}
          </k3-button>
          <k3-button
            slot="actions"
            variant="text"
            @k3-click=${(e: Event) => {
              /* Dialog portals to body while open — resolve from the button, not host */
              const dlg = (e.currentTarget as HTMLElement).closest(
                'k3-dialog',
              ) as (HTMLElement & { hide: (s?: string) => Promise<boolean> }) | null;
              void dlg?.hide('user');
            }}
            >${t('dialog.close')}</k3-button
          >
        </k3-dialog>

        <div class="login-card">
          <header class="login-card__head">
            <h2>${t('showcase.login.title')}</h2>
          </header>
          ${loginForm()}
          <p class="login-signup">
            <a class="login-link" href="#/login">${t('showcase.login.signup')}</a>
          </p>
        </div>
      </section>
    `,
    host,
  );

  return () => render(null, host);
}
