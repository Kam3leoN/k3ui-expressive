/**
 * Toast playground demos — Expressive-compatible API via K3UI.toast / showToast.
 */
import { showToast } from '../src/components/feedback/toast.js';

function t(key: string, fallback: string): string {
  return window.K3UI?.i18n.t(key) || fallback;
}

function wire(id: string, fn: () => void): void {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    void fn();
  });
}

export function wireToastDemo(): void {
  wire('btn-toast-success', () => {
    void showToast.success(t('doc.toast.demo.success', 'Changes saved'), {
      description: t('doc.toast.demo.success.desc', 'Synced across devices.'),
    });
  });

  wire('btn-toast-info', () => {
    void showToast.info(t('doc.toast.demo.info', 'New update available'), {
      description: t('doc.toast.demo.info.desc', 'Version 2.1 is ready to install.'),
    });
  });

  wire('btn-toast-warning', () => {
    void showToast.warning(t('doc.toast.demo.warning', 'Storage almost full'), {
      description: t('doc.toast.demo.warning.desc', 'Free up space to keep syncing.'),
    });
  });

  wire('btn-toast-error', () => {
    void showToast.error(t('doc.toast.demo.error', "Couldn't send"), {
      description: t('doc.toast.demo.error.desc', 'Check your connection and try again.'),
      action: {
        label: t('doc.toast.demo.retry', 'Retry'),
        onClick: () => {
          void showToast.info(t('doc.toast.demo.retrying', 'Retrying…'));
        },
      },
    });
  });

  wire('btn-toast-plain', () => {
    void showToast({
      title: t('doc.toast.demo.plain', 'Draft saved'),
      timeout: 4000,
    });
  });

  wire('btn-toast-promise', () => {
    const upload = () =>
      new Promise<{ name: string }>((resolve, reject) => {
        window.setTimeout(() => {
          if (Math.random() > 0.25) resolve({ name: 'photo.jpg' });
          else reject(new Error('network'));
        }, 1800);
      });
    void showToast.promise(upload(), {
      loading: t('doc.toast.demo.uploading', 'Uploading…'),
      success: (r) =>
        t('doc.toast.demo.uploaded', 'Uploaded {name}').replace('{name}', r.name),
      error: t('doc.toast.demo.uploadFailed', 'Upload failed'),
    });
  });

  wire('btn-toast-stack', () => {
    void (async () => {
      await showToast.success(t('doc.toast.demo.stack1', 'First toast'));
      await showToast.info(t('doc.toast.demo.stack2', 'Second toast'), {
        description: t('doc.toast.demo.stack2.desc', 'Hover the stack to fan out.'),
      });
      await showToast.warning(t('doc.toast.demo.stack3', 'Third toast'));
      await showToast.error(t('doc.toast.demo.stack4', 'Fourth — waits in queue'));
    })();
  });

  wire('btn-toast-dismiss', () => {
    showToast.dismiss();
  });
}
