/**
 * Showcase app — live pricing + login composed with k3ui.
 * Not part of the published package.
 */
import '@k3ui/fonts/fonts-ui.css';
import '@k3ui/styles/k3ui.scss';
import './styles.css';
import { i18n } from '@k3ui/i18n/index.js';
import { watchIconLigatures } from '@k3ui/icons/ligature.js';
import { themeApi as theme } from '@k3ui/theme/apply.js';
import en from './i18n/en.json';
import fr from './i18n/fr.json';
import './register.js';
import { mountApp } from './app.js';

i18n.extend({ en, fr });
i18n.detect();
watchIconLigatures(document);
theme.apply({ source: '#6750a4' });

if (!location.hash || location.hash === '#') {
  location.hash = '#/pricing';
}

const root = document.getElementById('app');
if (root) mountApp(root);
