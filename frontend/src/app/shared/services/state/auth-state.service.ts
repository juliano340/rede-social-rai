import { Injectable, signal } from '@angular/core';
import { User } from '../../models';
import { API_STORAGE_KEYS } from '../../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly _currentUser = signal<User | null>(this.loadFromStorage());
  private readonly _isAuthenticated = signal<boolean>(!!this._currentUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  private loadFromStorage(): User | null {
    const stored = localStorage.getItem(API_STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  }

  setUser(user: User | null): void {
    if (user) {
      localStorage.setItem(API_STORAGE_KEYS.USER, JSON.stringify(user));
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
    } else {
      localStorage.removeItem(API_STORAGE_KEYS.USER);
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    }
  }

  updateUser(updates: Partial<User>): void {
    const current = this._currentUser();
    if (current) {
      const updated = { ...current, ...updates };
      this.setUser(updated);
    }
  }

  clear(): void {
    this.setUser(null);
  }

  refresh(): void {
    const stored = this.loadFromStorage();
    this._currentUser.set(stored);
    this._isAuthenticated.set(!!stored);
  }
}