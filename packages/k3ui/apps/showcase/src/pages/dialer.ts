import { html, nothing, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import K3Snackbar from '@k3ui/components/feedback/snackbar.js';
import {
  DIAL_CONTACTS,
  DIAL_KEYS,
  T9_COMBOS,
  filterContactsByT9,
  splitT9Highlight,
  type DialContactRow,
  type DialContactShape,
} from '../data/dialer.js';
import { pageTitleRow } from '../demo-chrome.js';
import { shapeAvatar, shapeAvatarSpinning } from '../shape-icon.js';

/** Dialer page is built with k3ui components only (no k3ux). */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string, vars?: Record<string, string | number>) =>
  i18n.t(key, undefined, vars);

function msIcon(name: string): TemplateResult {
  return html`
    <span
      class="ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>
  `;
}

function formatDialDisplay(raw: string): string {
  /* Raw sequence only — no US-style digit grouping. */
  return raw;
}

function formatCallTimer(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

interface ActiveCall {
  name: string;
  phone: string;
  accent: string;
  shape: DialContactShape;
  avatar: string | null;
  startedAt: number;
}

function resolveCallTarget(digits: string, contact?: DialContactRow): ActiveCall {
  if (contact) {
    return {
      name: contact.name,
      phone: contact.phone,
      accent: contact.accent,
      shape: contact.shape,
      avatar: contact.avatar,
      startedAt: Date.now(),
    };
  }
  const digitOnly = digits.replace(/[^\d]/g, '');
  const match = digitOnly
    ? DIAL_CONTACTS.find(
        (c) => c.phoneDigits === digitOnly || c.phoneDigits.endsWith(digitOnly),
      )
    : undefined;
  if (match) {
    return {
      name: match.name,
      phone: match.phone,
      accent: match.accent,
      shape: match.shape,
      avatar: match.avatar,
      startedAt: Date.now(),
    };
  }
  return {
    name: digits ? formatDialDisplay(digits) : t('showcase.dialer.unknown'),
    phone: digits ? formatDialDisplay(digits) : '',
    accent: 'var(--k3-sys-color-primary)',
    shape: 'Cookie12Sided',
    avatar: null,
    startedAt: Date.now(),
  };
}

function notify(message: string, icon = 'call'): void {
  /* Instantiated directly — tag already defined in showcase register.ts */
  const el = new K3Snackbar();
  el.textContent = message;
  el.icon = icon;
  el.duration = 2200;
  el.dismissible = true;
  el.queueBehavior = 'replace';
  el.mode = 'expressive';
  document.body.appendChild(el);
  const cleanup = (): void => {
    el.removeEventListener('k3-close-end', cleanup);
    el.remove();
  };
  el.addEventListener('k3-close-end', cleanup);
  void el.show();
}

function contactRow(c: DialContactRow, query: string, onCall: () => void): TemplateResult {
  const hi = splitT9Highlight(c.name, query);
  return html`
    <k3-list-item class="dial-result" lines="two" leading="avatar" value=${c.id}>
      <span
        slot="leading"
        class="dial-result__avatar"
        style="--dial-accent: ${c.accent}"
        aria-hidden="true"
      >
        ${shapeAvatar(c.shape, c.avatar, 'dial-result__photo', `dial-list-${c.id}`)}
      </span>
      <span slot="headline" class="dial-result__name">
        ${hi
          ? html`<mark class="dial-result__mark">${hi.head}</mark>${hi.rest}`
          : c.name}
      </span>
      <span slot="supporting" class="dial-result__phone">${c.phone}</span>
      <k3-icon-button
        slot="trailing"
        class="dial-result__call"
        variant="tonal"
        size="sm"
        label=${t('showcase.dialer.callContact', { name: c.name })}
        @k3-click=${onCall}
      >
        ${msIcon('call')}
      </k3-icon-button>
    </k3-list-item>
  `;
}

function inCallControl(
  icon: string,
  label: string,
  onClick: () => void,
  selected = false,
): TemplateResult {
  return html`
    <button
      type="button"
      class="dial-in-call__ctrl ${selected ? 'dial-in-call__ctrl--on' : ''}"
      aria-pressed=${selected ? 'true' : 'false'}
      @click=${onClick}
    >
      ${msIcon(icon)}
      <span>${label}</span>
    </button>
  `;
}

export function mountDialer(host: HTMLElement): () => void {
  const showTitle = !host.closest('.showcase-doc');
  let digits = '';
  let sim: 1 | 2 = 1;
  let activeCall: ActiveCall | null = null;
  let muted = false;
  let onHold = false;
  let speakerOn = false;
  let callTick = 0;

  const stopCallTimer = (): void => {
    window.clearInterval(callTick);
    callTick = 0;
  };

  const startCallTimer = (): void => {
    stopCallTimer();
    callTick = window.setInterval(() => paint(), 1000);
  };

  const beginCall = (contact?: DialContactRow): void => {
    if (!contact && !digits) {
      notify(t('showcase.dialer.callEmpty'), 'info');
      return;
    }
    activeCall = resolveCallTarget(digits, contact);
    muted = false;
    onHold = false;
    speakerOn = false;
    notify(
      t('showcase.dialer.calling', {
        number: activeCall.phone || activeCall.name,
        sim,
      }),
      'call',
    );
    startCallTimer();
    paint();
  };

  const endCall = (): void => {
    if (!activeCall) return;
    activeCall = null;
    muted = false;
    onHold = false;
    speakerOn = false;
    stopCallTimer();
    notify(t('showcase.dialer.callEnded'), 'call_end');
    paint();
  };

  const paint = (): void => {
    const matches = filterContactsByT9(digits);
    const matchCount = matches.length;
    const elapsed = activeCall ? Date.now() - activeCall.startedAt : 0;

    render(
      html`
        <section
          class="page page--dialer"
          aria-labelledby=${showTitle ? 'dialer-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.nav.dialer')}
        >
          ${showTitle
            ? pageTitleRow('showcase.nav.dialer', PAGE_STACK, 'dialer-title')
            : null}

          <p class="dialer-lead">${t('showcase.dialer.lead')}</p>

          <div class="dialer-stage k3-layout-grid k3-demo-cols-2">
            <div
              class="dial-phone ${activeCall ? 'dial-phone--in-call' : ''}"
              role="group"
              aria-label=${t('showcase.dialer.phoneAria')}
              style=${activeCall?.avatar
                ? `--dial-call-bg: url(${JSON.stringify(activeCall.avatar)})`
                : nothing}
            >
              ${activeCall?.avatar
                ? html`<div class="dial-phone__bg" aria-hidden="true"></div>`
                : null}
              <div class="dial-phone__status" aria-hidden="true">
                <span>9:41</span>
                <span class="dial-phone__notch"></span>
                <span>5G · 100%</span>
              </div>

              ${activeCall
                ? html`
                    <div
                      class="dial-in-call"
                      role="group"
                      aria-label=${t('showcase.dialer.inCallAria')}
                    >
                      <div
                        class="dial-in-call__hero"
                        style="--dial-accent: ${activeCall.accent}"
                      >
                        <div class="dial-in-call__photo" aria-hidden="true">
                          ${activeCall.avatar
                            ? shapeAvatarSpinning(
                                activeCall.shape,
                                activeCall.avatar,
                                'dial-in-call__face',
                                'dial-call-face',
                              )
                            : html`<span class="dial-in-call__initial"
                                >${activeCall.name.charAt(0)}</span
                              >`}
                        </div>
                      </div>

                      <p class="dial-in-call__name">${activeCall.name}</p>
                      ${activeCall.phone && activeCall.phone !== activeCall.name
                        ? html`<p class="dial-in-call__phone">${activeCall.phone}</p>`
                        : null}
                      <p class="dial-in-call__timer" aria-live="polite">
                        ${formatCallTimer(elapsed)}
                      </p>

                      <div class="dial-in-call__secondary">
                        <button
                          type="button"
                          class="dial-in-call__pill"
                          @click=${() => notify(t('showcase.dialer.notesInfo'), 'notes')}
                        >
                          ${msIcon('notes')}
                          <span>${t('showcase.dialer.notes')}</span>
                        </button>
                        <button
                          type="button"
                          class="dial-in-call__pill"
                          @click=${() => notify(t('showcase.dialer.messageInfo'), 'chat')}
                        >
                          ${msIcon('chat')}
                          <span>${t('showcase.dialer.message')}</span>
                        </button>
                      </div>

                      <div class="dial-in-call__grid" role="group">
                        ${inCallControl(
                          muted ? 'mic_off' : 'mic',
                          muted ? t('showcase.dialer.unmute') : t('showcase.dialer.mute'),
                          () => {
                            muted = !muted;
                            notify(
                              t(muted ? 'showcase.dialer.mutedOn' : 'showcase.dialer.mutedOff'),
                              muted ? 'mic_off' : 'mic',
                            );
                            paint();
                          },
                          muted,
                        )}
                        ${inCallControl('dialpad', t('showcase.dialer.keypad'), () =>
                          notify(t('showcase.dialer.keypadInfo'), 'dialpad'),
                        )}
                        ${inCallControl(
                          'volume_up',
                          t('showcase.dialer.speaker'),
                          () => {
                            speakerOn = !speakerOn;
                            notify(
                              t(
                                speakerOn
                                  ? 'showcase.dialer.speakerOn'
                                  : 'showcase.dialer.speakerOff',
                              ),
                              'volume_up',
                            );
                            paint();
                          },
                          speakerOn,
                        )}
                        ${inCallControl('fiber_manual_record', t('showcase.dialer.record'), () =>
                          notify(t('showcase.dialer.recordInfo'), 'fiber_manual_record'),
                        )}
                        ${inCallControl(
                          'pause',
                          onHold ? t('showcase.dialer.resume') : t('showcase.dialer.hold'),
                          () => {
                            onHold = !onHold;
                            notify(
                              t(onHold ? 'showcase.dialer.holdOn' : 'showcase.dialer.holdOff'),
                              'pause',
                            );
                            paint();
                          },
                          onHold,
                        )}
                        ${inCallControl('add', t('showcase.dialer.addCall'), () =>
                          notify(t('showcase.dialer.addCallInfo'), 'add'),
                        )}
                      </div>

                      <button
                        type="button"
                        class="dial-in-call__hangup"
                        aria-label=${t('showcase.dialer.endCall')}
                        @click=${endCall}
                      >
                        ${msIcon('call_end')}
                      </button>
                    </div>
                  `
                : html`
                    <div class="dial-phone__top">
                      <k3-chip
                        class="dial-phone__sim"
                        elevated
                        @click=${() => {
                          sim = sim === 1 ? 2 : 1;
                          paint();
                        }}
                      >
                        ${t(sim === 1 ? 'showcase.dialer.sim1' : 'showcase.dialer.sim2')}
                        ${msIcon('swap_horiz')}
                      </k3-chip>
                      <k3-icon-button
                        variant="standard"
                        size="sm"
                        label=${t('showcase.dialer.speaker')}
                      >
                        ${msIcon('volume_up')}
                      </k3-icon-button>
                    </div>

                    <div class="dial-phone__display">
                      <p
                        class="dial-phone__digits ${digits ? '' : 'dial-phone__digits--empty'}"
                        aria-live="polite"
                      >
                        ${digits
                          ? formatDialDisplay(digits)
                          : t('showcase.dialer.placeholder')}
                      </p>
                      <k3-icon-button
                        variant="standard"
                        size="sm"
                        label=${t('showcase.dialer.backspace')}
                        ?disabled=${!digits}
                        @k3-click=${() => {
                          digits = digits.slice(0, -1);
                          paint();
                        }}
                      >
                        ${msIcon('backspace')}
                      </k3-icon-button>
                    </div>

                    <div class="dial-pad" role="group" aria-label=${t('showcase.dialer.padAria')}>
                      ${DIAL_KEYS.map(
                        (key) => html`
                          <button
                            type="button"
                            class="dial-key"
                            aria-label=${key.letters
                              ? `${key.digit} ${key.letters}`
                              : key.digit}
                            @click=${() => {
                              digits += key.digit;
                              paint();
                            }}
                          >
                            <span class="dial-key__digit">${key.digit}</span>
                            ${key.letters
                              ? html`<span class="dial-key__letters">${key.letters}</span>`
                              : html`<span class="dial-key__letters dial-key__letters--blank"
                                  >&nbsp;</span
                                >`}
                          </button>
                        `,
                      )}
                    </div>

                    <div class="dial-phone__actions">
                      <k3-icon-button
                        variant="tonal"
                        size="md"
                        label=${t('showcase.dialer.addContact')}
                      >
                        ${msIcon('person_add')}
                      </k3-icon-button>
                      <button
                        type="button"
                        class="dial-call"
                        aria-label=${t('showcase.dialer.call')}
                        @click=${() => beginCall()}
                      >
                        ${msIcon('call')}
                      </button>
                      <k3-icon-button
                        variant="tonal"
                        size="md"
                        label=${t('showcase.dialer.backspace')}
                        ?disabled=${!digits}
                        @k3-click=${() => {
                          digits = digits.slice(0, -1);
                          paint();
                        }}
                      >
                        ${msIcon('backspace')}
                      </k3-icon-button>
                    </div>
                  `}
            </div>

            <aside class="dial-results" aria-labelledby="dial-results-title">
              <header class="dial-results__head">
                <div>
                  <h2 id="dial-results-title" class="dial-results__title">
                    <span class="dial-results__live" aria-hidden="true"></span>
                    ${t('showcase.dialer.resultsTitle')}
                  </h2>
                  <p class="dial-results__blurb">${t('showcase.dialer.resultsBlurb')}</p>
                </div>
                <k3-chip elevated>
                  ${t('showcase.dialer.matches', { count: matchCount })}
                </k3-chip>
              </header>

              <k3-list class="dial-results__list" aria-labelledby="dial-results-title">
                ${matches.length
                  ? matches.map((c) =>
                      contactRow(c, digits, () => {
                        digits = c.phoneDigits.replace(/^1/, '');
                        beginCall(c);
                      }),
                    )
                  : html`
                      <k3-list-item class="dial-results__empty" disabled>
                        <span slot="headline">${t('showcase.dialer.noMatch')}</span>
                      </k3-list-item>
                    `}
              </k3-list>

              <div class="dial-combos">
                <p class="dial-combos__label">${t('showcase.dialer.tryCombos')}</p>
                <div class="dial-combos__row">
                  ${T9_COMBOS.map(
                    (combo) => html`
                      <k3-chip
                        elevated
                        @click=${() => {
                          digits = combo.digits;
                          paint();
                        }}
                      >
                        “${combo.digits}” → ${combo.hintName}
                      </k3-chip>
                    `,
                  )}
                </div>
              </div>

            </aside>
          </div>
        </section>
      `,
      host,
    );
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.defaultPrevented) return;
    const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'Escape' && activeCall) {
      e.preventDefault();
      endCall();
      return;
    }
    if (activeCall) return;
    if (e.key >= '0' && e.key <= '9') {
      digits += e.key;
      paint();
      return;
    }
    if (e.key === '*' || e.key === '#') {
      digits += e.key;
      paint();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      digits = digits.slice(0, -1);
      paint();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      beginCall();
    }
  };

  paint();
  window.addEventListener('keydown', onKey);

  return () => {
    window.removeEventListener('keydown', onKey);
    stopCallTimer();
    render(null, host);
  };
}

/** Exposed for tests — contact corpus size. */
export const DIALER_CONTACT_COUNT = DIAL_CONTACTS.length;
