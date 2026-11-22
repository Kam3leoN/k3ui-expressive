import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/text-field');
  await page.waitForFunction(() => !!window.K3UI);
  /* The playground defines components per page — register what the test mounts. */
  await page.evaluate((tags) => window.K3UI!.registry.registerAll(tags), ['k3-text-field', 'k3-select', 'k3-menu-item']);
});

test('k3-text-field takes part in native constraint validation', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const form = document.createElement('form');
    form.innerHTML = '<k3-text-field name="email" label="Email" required pattern="[a-z]+@x\\.io"></k3-text-field>';
    document.body.append(form);
    const tf = form.querySelector('k3-text-field') as HTMLElement & {
      value: string;
      updateComplete: Promise<unknown>;
      validity: ValidityState;
      checkValidity(): boolean;
      setCustomValidity(m: string): void;
      validationMessage: string;
    };
    await tf.updateComplete;
    let submitted = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted++;
    });
    const out: Record<string, unknown> = {};
    out.emptyValid = tf.checkValidity();
    out.emptyMissing = tf.validity.valueMissing;
    out.formValid = form.checkValidity();
    out.matchesInvalid = tf.matches(':invalid');
    form.requestSubmit();
    out.submittedWhenInvalid = submitted;
    tf.value = 'bad';
    await tf.updateComplete;
    out.pattern = tf.validity.patternMismatch;
    tf.value = 'me@x.io';
    await tf.updateComplete;
    out.okValid = tf.checkValidity();
    form.requestSubmit();
    out.submittedWhenValid = submitted;
    out.formData = new FormData(form).get('email');
    tf.setCustomValidity('Already taken');
    out.custom = [tf.checkValidity(), tf.validationMessage];
    tf.setCustomValidity('');
    form.reset();
    await tf.updateComplete;
    out.afterReset = tf.value;
    form.remove();
    return out;
  });
  expect(result).toEqual({
    emptyValid: false,
    emptyMissing: true,
    formValid: false,
    matchesInvalid: true,
    submittedWhenInvalid: 0,
    pattern: true,
    okValid: true,
    submittedWhenValid: 1,
    formData: 'me@x.io',
    custom: [false, 'Already taken'],
    afterReset: '',
  });
});

test('k3-select required blocks submit until a value is chosen; fieldset disables', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const form = document.createElement('form');
    form.innerHTML = `<fieldset><k3-select name="fruit" label="Fruit" required>
        <k3-menu-item value="apple">Apple</k3-menu-item></k3-select></fieldset>`;
    document.body.append(form);
    const sel = form.querySelector('k3-select') as HTMLElement & {
      value: string;
      disabled: boolean;
      updateComplete: Promise<unknown>;
      checkValidity(): boolean;
    };
    await sel.updateComplete;
    const before = form.checkValidity();
    sel.value = 'apple';
    await sel.updateComplete;
    const after = form.checkValidity();
    (form.querySelector('fieldset') as HTMLFieldSetElement).disabled = true;
    await sel.updateComplete;
    const disabled = sel.disabled;
    form.remove();
    return { before, after, disabled };
  });
  expect(result).toEqual({ before: false, after: true, disabled: true });
});
