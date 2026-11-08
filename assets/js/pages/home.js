import '../components/site-chrome.js';
import { initReveal, $ } from '../core/ui.js';
import { mountHeroField } from '../fx/hero-field.js';

initReveal();
mountHeroField($('.hero-canvas'));
