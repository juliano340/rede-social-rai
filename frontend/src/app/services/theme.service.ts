import { Injectable } from '@angular/core';
import { UIStateService } from '../shared/services/state/ui-state.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  constructor(private uiState: UIStateService) {}

  get theme() {
    return this.uiState.theme;
  }

  toggle(): void {
    this.uiState.toggleTheme();
  }

  isDark(): boolean {
    return this.uiState.theme() === 'dark';
  }
}