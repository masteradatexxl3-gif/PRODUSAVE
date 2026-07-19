import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
      className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
