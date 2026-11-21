import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import '../src/register.js';
import {
  DIAL_CONTACTS,
  T9_COMBOS,
  filterContactsByT9,
  nameToT9,
} from '../src/data/dialer.js';
import { mountDialer } from '../src/pages/dialer.js';

describe('showcase T9 dialer data', () => {
  it('exposes six demo contacts and four combos', () => {
    expect(DIAL_CONTACTS).toHaveLength(6);
    expect(T9_COMBOS).toHaveLength(4);
  });

  it('maps names to T9 digit sequences used in the Rivo playground', () => {
    expect(nameToT9('Alex')).toBe('2539');
    expect(nameToT9('Sophia')).toBe('767442');
    expect(nameToT9('Emma')).toBe('3662');
    expect(nameToT9('Liam')).toBe('5426');
  });

  it('filters contacts by T9 name prefix and phone digits', () => {
    expect(filterContactsByT9('').map((c) => c.id)).toHaveLength(6);
    expect(filterContactsByT9('2539').map((c) => c.id)).toEqual(['alex']);
    expect(filterContactsByT9('7674').map((c) => c.id)).toContain('sophia');
    expect(filterContactsByT9('4155550189').map((c) => c.id)).toContain('ava');
    expect(filterContactsByT9('99999')).toHaveLength(0);
  });
});

describe('showcase dialer page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('fr');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts the phone pad and live results panel', async () => {
    const unmount = mountDialer(host);
    await customElements.whenDefined('k3-icon-button');
    expect(host.querySelector('.dial-phone')).toBeTruthy();
    expect(host.querySelectorAll('.dial-key')).toHaveLength(12);
    expect(host.querySelectorAll('k3-list-item.dial-result')).toHaveLength(6);
    expect(host.querySelector('#dialer-title')?.textContent).toMatch(/t9|clavier/i);

    const keys = [...host.querySelectorAll('.dial-key')] as HTMLButtonElement[];
    const press = (d: string) =>
      keys.find((el) => el.getAttribute('aria-label')?.startsWith(d))!.click();
    press('2');
    press('5');
    press('3');
    press('9');
    expect(host.querySelector('.dial-phone__digits')?.textContent?.replace(/\s/g, '')).toBe(
      '2539',
    );
    expect(host.querySelectorAll('k3-list-item.dial-result')).toHaveLength(1);

    unmount();
    expect(host.querySelector('.page--dialer')).toBeNull();
  });

  it('applies a T9 combo chip to filter Alex', async () => {
    const unmount = mountDialer(host);
    await customElements.whenDefined('k3-chip');
    const combo = [...host.querySelectorAll('.dial-combos__row k3-chip')].find((el) =>
      (el.textContent ?? '').includes('2539'),
    ) as HTMLElement;
    expect(combo).toBeTruthy();
    combo.click();
    expect(host.querySelector('.dial-phone__digits')?.textContent?.replace(/\s/g, '')).toBe(
      '2539',
    );
    expect(host.querySelectorAll('k3-list-item.dial-result')).toHaveLength(1);
    expect(host.querySelector('.dial-result__name')?.textContent).toMatch(/Alex/i);
    unmount();
  });

  it('opens the in-call screen with a rotating shape and ends via hangup', async () => {
    const unmount = mountDialer(host);
    await customElements.whenDefined('k3-icon-button');
    await customElements.whenDefined('k3-snackbar');
    await customElements.whenDefined('k3-list');

    const callAlex = host.querySelector(
      '.dial-result__call',
    ) as HTMLElement;
    /* First visible match row call — list is full until filtered; call Sophia card */
    const sophiaCall = [...host.querySelectorAll('k3-list-item.dial-result')].find((row) =>
      (row.querySelector('.dial-result__name')?.textContent ?? '').includes('Sophia'),
    )?.querySelector('.dial-result__call') as HTMLElement;
    expect(sophiaCall || callAlex).toBeTruthy();
    (sophiaCall ?? callAlex).dispatchEvent(
      new CustomEvent('k3-click', { detail: { source: 'user' }, bubbles: true, composed: true }),
    );

    expect(host.querySelector('.dial-in-call')).toBeTruthy();
    expect(host.querySelector('.dial-phone--in-call')).toBeTruthy();
    expect(host.querySelector('.dial-phone__bg')).toBeTruthy();
    expect(host.querySelector('.dial-in-call__orbit')).toBeNull();
    expect(host.querySelector('.dial-in-call__face')).toBeTruthy();
    expect(host.querySelector('.dial-pad')).toBeNull();
    expect(host.querySelector('.dial-in-call__name')?.textContent).toMatch(/Sophia/i);
    expect(host.querySelectorAll('.dial-result__photo')).toHaveLength(1);
    expect(host.querySelector('.dial-in-call__timer')?.textContent?.trim()).toMatch(
      /^\d{2}:\d{2}$/,
    );

    (host.querySelector('.dial-in-call__hangup') as HTMLButtonElement).click();
    expect(host.querySelector('.dial-in-call')).toBeNull();
    expect(host.querySelector('.dial-pad')).toBeTruthy();
    expect(document.body.querySelector('k3-snackbar')).toBeTruthy();

    unmount();
    document.body.querySelectorAll('k3-snackbar').forEach((n) => n.remove());
  });
});
