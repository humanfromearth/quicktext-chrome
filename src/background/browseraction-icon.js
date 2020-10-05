/**
 * Set the browserAction icon
 */

import browser from 'webextension-polyfill';

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    browser.browserAction.setIcon({
        path: {
            '16': '/icons/icon-16-dark.png',
            '32': '/icons/icon-32-dark.png'
        }
    });
}