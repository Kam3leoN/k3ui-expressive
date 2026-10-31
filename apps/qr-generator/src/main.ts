/**
 * QR generator app — consumes k3ui (source alias in Vite).
 * Wizard CE is local to this app; it is not part of the published package.
 */
import '@k3ui/fonts/fonts-ui.css';
import '@k3ui/styles/k3ui.scss';
import { i18n } from '@k3ui/i18n/index.js';
import { watchIconLigatures } from '@k3ui/icons/ligature.js';
import { themeApi as theme } from '@k3ui/theme/apply.js';
import en from './i18n/en.json';
import fr from './i18n/fr.json';
import './qr-generator.js';

i18n.extend({ en, fr });
i18n.detect();
watchIconLigatures(document);

theme.apply({ source: '#6750a4' });
