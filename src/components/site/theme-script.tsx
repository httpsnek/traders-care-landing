// Ставит data-theme до первой отрисовки, чтобы не было вспышки не той темы.
// Ключ localStorage "theme" — тот же, что в приложении Traders Care: выбор переносится.
const script = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
