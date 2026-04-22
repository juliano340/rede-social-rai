import { Injectable, signal, effect } from '@angular/core';
import { UI_THEMES } from '../../constants/ui.constants';
import { API_STORAGE_KEYS } from '../../constants/api.constants';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface Modal {
  id: string;
  data?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private readonly STORAGE_KEY = API_STORAGE_KEYS.THEME;

  private readonly _theme = signal<'light' | 'dark'>(this.loadTheme());
  private readonly _toasts = signal<Toast[]>([]);
  private readonly _activeModals = signal<Modal[]>([]);
  private readonly _isMenuOpen = signal<boolean>(false);
  private readonly _showLogoutModal = signal<boolean>(false);

  readonly theme = this._theme.asReadonly();
  readonly toasts = this._toasts.asReadonly();
  readonly activeModals = this._activeModals.asReadonly();
  readonly isMenuOpen = this._isMenuOpen.asReadonly();
  readonly showLogoutModal = this._showLogoutModal.asReadonly();

  constructor() {
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  private loadTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === UI_THEMES.DARK || stored === UI_THEMES.LIGHT) {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? UI_THEMES.DARK : UI_THEMES.LIGHT;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  toggleTheme(): void {
    this._theme.update(current => current === UI_THEMES.LIGHT ? UI_THEMES.DARK : UI_THEMES.LIGHT);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
  }

  showToast(message: string, type: Toast['type'] = 'info', duration = 3000): void {
    const id = crypto.randomUUID();
    this._toasts.update(toasts => [...toasts, { id, message, type }]);
    
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  removeToast(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  openModal(id: string, data?: unknown): void {
    this._activeModals.update(modals => [...modals, { id, data }]);
  }

  closeModal(id: string): void {
    this._activeModals.update(modals => modals.filter(m => m.id !== id));
  }

  isModalOpen(id: string): boolean {
    return this._activeModals().some(m => m.id === id);
  }

  toggleMenu(): void {
    this._isMenuOpen.update(open => !open);
  }

  setMenuOpen(open: boolean): void {
    this._isMenuOpen.set(open);
  }

  toggleLogoutModal(): void {
    this._showLogoutModal.update(show => !show);
  }

  setLogoutModal(show: boolean): void {
    this._showLogoutModal.set(show);
  }
}