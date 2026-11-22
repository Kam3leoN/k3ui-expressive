/**
 * Snackbar doc page — interactive examples (mode, variant, leading content,
 * loading, edge, consecutive queue). The duration / action / dismissible
 * examples keep the static `<k3-snackbar>` hosts of index.html.
 */
import {
  showSnackbar,
  type ShowSnackbarOptions,
} from '../src/components/feedback/snackbar-queue.js';

/** Demo-only artwork (original, not a real brand). */
const DEMO_BRAND = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffb000%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%23ff4f7b%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238a5cff%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20fill%3D%22url%28%23g%29%22%20d%3D%22M32%202l7.6%2012.4L54%2010l-4.4%2014.4L62%2032l-12.4%207.6L54%2054l-14.4-4.4L32%2062l-7.6-12.4L10%2054l4.4-14.4L2%2032l12.4-7.6L10%2010l14.4%204.4z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M32%2019l3.4%209.6L45%2032l-9.6%203.4L32%2045l-3.4-9.6L19%2032l9.6-3.4z%22%2F%3E%3C%2Fsvg%3E';
const DEMO_AVATAR = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b%22%20cx%3D%22.3%22%20cy%3D%22.25%22%20r%3D%22.9%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%233a5bd9%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2316205c%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%2220%22%20r%3D%221.6%22%20fill%3D%22%23fff%22%20opacity%3D%22.8%22%2F%3E%3Ccircle%20cx%3D%2262%22%20cy%3D%2216%22%20r%3D%221.2%22%20fill%3D%22%23fff%22%20opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%2266%22%20cy%3D%2258%22%20r%3D%221.4%22%20fill%3D%22%23fff%22%20opacity%3D%22.6%22%2F%3E%3Cpath%20fill%3D%22%23ff8a3d%22%20d%3D%22M34%2058h12l-6%2014z%22%2F%3E%3Cpath%20fill%3D%22%23ffd166%22%20d%3D%22M37%2058h6l-3%207z%22%2F%3E%3Cpath%20fill%3D%22%23e8ecff%22%20d%3D%22M40%2010c9%208%2012%2020%2010%2034l-4%2014H34l-4-14c-2-14%201-26%2010-34z%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2230%22%20r%3D%225.5%22%20fill%3D%22%233a5bd9%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20fill%3D%22%23ff5d73%22%20d%3D%22M30%2040l-10%2012%2012-2zM50%2040l10%2012-12-2z%22%2F%3E%3C%2Fsvg%3E';

const LOADING_MS = 2500;

function t(key: string): string {
  return window.K3UI?.i18n.t(key) ?? key;
}

type SnackEl = HTMLElement & {
  show: () => Promise<boolean>;
  hide: (source?: 'user' | 'api' | 'auto') => Promise<boolean>;
};

/** Demo clicks replace the current snackbar (M3 one-at-a-time). */
function show(options: ShowSnackbarOptions): void {
  void showSnackbar({ queue: 'replace', ...options });
}

function on(id: string, handler: () => void): void {
  document.getElementById(id)?.addEventListener('click', handler);
}

export function wireSnackbarDemo(): void {
  /* mode */
  on('btn-snack-expressive', () =>
    show({ message: t('doc.snackbar.demo.saved'), icon: 'check_circle' }),
  );
  on('btn-snack-standard', () =>
    show({
      message: t('doc.snackbar.demo.archived'),
      mode: 'standard',
      action: t('doc.snackbar.demo.undo'),
      duration: 'long',
    }),
  );

  /* variant */
  on('btn-snack-inverse', () => show({ message: t('doc.snackbar.demo.wifi'), icon: 'wifi' }));
  on('btn-snack-emphasized', () =>
    show({ message: t('doc.snackbar.demo.emphasized'), icon: 'download', variant: 'emphasized' }),
  );
  on('btn-snack-tonal', () =>
    show({ message: t('doc.snackbar.demo.tonal'), icon: 'info', variant: 'tonal' }),
  );
  on('btn-snack-error', () =>
    show({
      message: t('doc.snackbar.demo.offline'),
      icon: 'cloud_off',
      variant: 'error',
      action: t('doc.snackbar.demo.retry'),
      duration: 'long',
    }),
  );

  /* leading content */
  on('btn-snack-icon', () =>
    show({
      message: t('doc.snackbar.demo.archived'),
      icon: 'archive',
      action: t('doc.snackbar.demo.undo'),
      duration: 'long',
    }),
  );
  on('btn-snack-avatar', () =>
    show({
      message: t('doc.snackbar.demo.welcome'),
      supportingText: t('doc.snackbar.demo.level'),
      avatar: DEMO_AVATAR,
    }),
  );
  on('btn-snack-brand', () =>
    show({
      message: t('doc.snackbar.demo.welcome'),
      supportingText: t('doc.snackbar.demo.level'),
      avatar: DEMO_AVATAR,
      brandIcon: DEMO_BRAND,
      edge: 'top',
    }),
  );

  /* loading → done */
  on('btn-snack-loading', () =>
    show({
      message: t('doc.snackbar.demo.uploading'),
      icon: 'check_circle',
      loading: true,
      duration: 'short',
      onCreate: (el) => {
        window.setTimeout(() => {
          el.textContent = t('doc.snackbar.demo.uploaded');
          el.loading = false;
        }, LOADING_MS);
      },
    }),
  );

  /* edge */
  on('btn-snack-bottom', () => show({ message: t('doc.snackbar.demo.sent'), icon: 'send' }));
  on('btn-snack-top', () =>
    show({ message: t('doc.snackbar.demo.top'), icon: 'info', edge: 'top' }),
  );

  /*
   * Consecutive queue (M3: one visible at a time — never stacked).
   * Burst enqueues five messages; each waits for the previous to finish.
   */
  on('btn-snack-burst', () => {
    const burst: ShowSnackbarOptions[] = [
      {
        message: t('doc.snackbar.demo.welcome'),
        supportingText: t('doc.snackbar.demo.level'),
        avatar: DEMO_AVATAR,
      },
      { message: t('doc.snackbar.demo.archived'), icon: 'archive' },
      { message: t('doc.snackbar.demo.wifi'), icon: 'wifi' },
      { message: t('doc.snackbar.demo.sent'), icon: 'send' },
      { message: t('doc.snackbar.demo.copied'), icon: 'content_copy' },
    ];
    burst.forEach((options) => {
      void showSnackbar({ queue: 'queue', duration: 2500, ...options });
    });
  });

  /* duration / action / dismissible — static hosts */
  const showStatic = (id: string): void => {
    const el = document.getElementById(id) as SnackEl | null;
    void el?.show();
  };
  on('btn-snack', () => showStatic('snack'));
  on('btn-snack-action', () => showStatic('snack-action'));
  on('btn-snack-dismiss', () => showStatic('snack-dismiss'));
  on('btn-snack-twoline', () => showStatic('snack-twoline'));
  on('btn-snack-stacked', () => showStatic('snack-stacked'));
  on('btn-snack-api', () => {
    void window.K3UI?.snackbar.show({
      message: 'Queued via K3UI.snackbar.show()',
      action: 'Undo',
      dismissible: true,
      duration: 'short',
      queue: 'replace',
    });
  });
}
