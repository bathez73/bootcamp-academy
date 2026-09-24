export const THEME_STORAGE_KEY = 'novenetech-theme';

// Inline exécuté avant peinture pour éviter le flash (FOUC).
export const THEME_SWITCH_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;