import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'rai-theme';
  
  theme = signal<'light' | 'dark'>(this.getStoredTheme());

  constructor() {
    // Aplicar tema inicial
    this.applyTheme(this.theme());
    
    // Observar mudanças no tema
    effect(() => {
      this.applyTheme(this.theme());
      this.storeTheme(this.theme());
    });
  }

  private getStoredTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    
    // Verificar preferência do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  private storeTheme(theme: 'light' | 'dark') {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggle() {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }
}