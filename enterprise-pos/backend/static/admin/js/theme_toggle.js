/* ===================================================================
   SanSons POS – Theme Toggle Script
   Adds a light/dark mode toggle to the admin header.
   Uses django-unfold's built-in dark mode class toggling.
   =================================================================== */
(function () {
  'use strict';

  // Utility – read/write cookies
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';path=/;expires=' + d.toUTCString();
  }

  // Determine saved preference (default: follow system)
  var saved = getCookie('sanson_theme') || 'auto';

  function applyTheme(mode) {
    var html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('dark');
    } else if (mode === 'light') {
      html.classList.remove('dark');
    } else {
      // Auto – use OS preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }

  function iconForMode(mode) {
    if (mode === 'dark') return 'dark_mode';
    if (mode === 'light') return 'light_mode';
    return 'brightness_auto';
  }
  function labelForMode(mode) {
    if (mode === 'dark') return 'Dark';
    if (mode === 'light') return 'Light';
    return 'Auto';
  }

  // Cycle: auto → light → dark → auto
  function nextMode(current) {
    var order = ['auto', 'light', 'dark'];
    var i = order.indexOf(current);
    return order[(i + 1) % order.length];
  }

  // Apply on load (before DOMContentLoaded to avoid flash)
  applyTheme(saved);

  document.addEventListener('DOMContentLoaded', function () {
    // Find the header area to inject the toggle button
    var header = document.querySelector('header') ||
                 document.querySelector('.header') ||
                 document.querySelector('#header') ||
                 document.querySelector('nav');

    if (!header) return; // Safety – nothing to attach to

    // Create toggle button
    var btn = document.createElement('button');
    btn.id = 'sanson-theme-toggle';
    btn.type = 'button';
    btn.innerHTML =
      '<span class="material-symbols-outlined">' + iconForMode(saved) + '</span>' +
      '<span class="toggle-label">' + labelForMode(saved) + '</span>';

    btn.addEventListener('click', function () {
      saved = nextMode(saved);
      setCookie('sanson_theme', saved, 365);
      applyTheme(saved);
      btn.querySelector('.material-symbols-outlined').textContent = iconForMode(saved);
      btn.querySelector('.toggle-label').textContent = labelForMode(saved);
    });

    // Try to append in a sensible place
    var target = header.querySelector('.flex') || header;
    target.appendChild(btn);
  });

  // Listen for OS preference changes (for auto mode)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (getCookie('sanson_theme') === 'auto' || !getCookie('sanson_theme')) {
        applyTheme('auto');
      }
    });
  }
})();
