import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../shared/services/toast.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideIconsModule],
  template: `
    <div class="settings-page">
      <div class="settings-header">
        <h1>Configurações</h1>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <lucide-icon name="palette" [size]="20"></lucide-icon>
          <h2>Aparência</h2>
        </div>
        <div class="setting-item" (click)="themeService.toggle()">
          <div class="setting-info">
            <span class="setting-label">Tema</span>
            <span class="setting-value">{{ themeService.isDark() ? 'Escuro' : 'Claro' }}</span>
          </div>
          <div class="setting-toggle" [class.active]="themeService.isDark()">
            <div class="toggle-track">
              <div class="toggle-thumb">
                @if (themeService.isDark()) {
                  <lucide-icon name="moon" [size]="14"></lucide-icon>
                } @else {
                  <lucide-icon name="sun" [size]="14"></lucide-icon>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <lucide-icon name="user" [size]="20"></lucide-icon>
          <h2>Conta</h2>
        </div>
        <a [routerLink]="['/profile', authService.currentUser()?.username]" class="setting-item setting-link">
          <div class="setting-info">
            <span class="setting-label">Editar perfil</span>
            <span class="setting-hint">Alterar nome, bio e foto</span>
          </div>
          <lucide-icon name="chevron-right" [size]="18" class="setting-arrow"></lucide-icon>
        </a>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <lucide-icon name="alert-triangle" [size]="20" class="danger-icon"></lucide-icon>
          <h2>Zona de perigo</h2>
        </div>
        <button class="setting-item setting-item--full" (click)="openDeleteModal()">
          <div class="setting-info">
            <span class="setting-label">Excluir conta</span>
            <span class="setting-hint">Remover permanentemente sua conta e todos os dados</span>
          </div>
        </button>
      </div>
    </div>

    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="closeDeleteModal()">
        <div class="delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Excluir conta</h2>
            <button class="modal-close" (click)="closeDeleteModal()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-box">
              <lucide-icon name="alert-triangle" [size]="24" class="warning-icon"></lucide-icon>
              <div class="warning-text">
                <p class="warning-title">Esta ação é irreversível</p>
                <p class="warning-desc">Todos os seus dados serão permanentemente removidos, incluindo posts, comentários e seguidores.</p>
              </div>
            </div>
            <div class="form-group">
              <label for="delete-password">Digite sua senha para confirmar:</label>
              <input
                id="delete-password"
                type="password"
                [(ngModel)]="deletePassword"
                placeholder="Sua senha atual"
                (keyup.enter)="confirmDelete()"
              />
              @if (deleteError()) {
                <span class="field-error">{{ deleteError() }}</span>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeDeleteModal()">Cancelar</button>
            <button
              class="btn-delete"
              (click)="confirmDelete()"
              [disabled]="deleteLoading() || !deletePassword.trim()"
            >
              @if (deleteLoading()) {
                <span class="spinner-sm"></span>
                Excluindo...
              } @else {
                Excluir minha conta
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-page {
      max-width: 600px;
      margin: 0 auto;
      padding: var(--space-5);
    }
    
    .settings-header {
      margin-bottom: var(--space-8);
      
      h1 {
        font-size: var(--font-3xl);
        font-weight: var(--font-bold);
        color: var(--text-primary);
        margin: 0;
      }
    }
    
    .settings-section {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      overflow: hidden;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .danger-icon {
        color: var(--error);
      }
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
      
      h2 {
        font-size: var(--font-sm);
        font-weight: var(--font-semibold);
        margin: 0;
        color: var(--text-primary);
      }
    }
    
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      transition: background var(--duration-150) var(--ease-out);
      
      &:hover {
        background: var(--background-hover);
      }
      
      &.setting-link {
        text-decoration: none;
      }
      
      &.setting-item--full {
        width: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        border: none;
        background: transparent;
        text-align: left;
        font: inherit;
        padding: var(--space-4) var(--space-5);
      }
    }
    
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    
    .setting-label {
      font-size: var(--font-base);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }
    
    .setting-value {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
    }
    
    .setting-hint {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
    }
    
    .setting-arrow {
      color: var(--text-tertiary);
    }
    
    .setting-toggle {
      .toggle-track {
        width: 48px;
        height: 28px;
        background: var(--border);
        border-radius: var(--radius-full);
        position: relative;
        transition: background var(--duration-200) var(--ease-out);
      }
      
      .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background: var(--background-secondary);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--duration-200) var(--ease-out);
        color: var(--text-tertiary);
        box-shadow: var(--shadow-sm);
      }
      
      &.active {
        .toggle-track {
          background: var(--primary);
          
          .toggle-thumb {
            transform: translateX(20px);
            color: var(--primary);
          }
        }
      }
    }
    
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn var(--duration-150) var(--ease-out);
      padding: var(--space-4);
    }
    
    .delete-modal {
      background: var(--background-secondary);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-2xl);
      animation: slideDown var(--duration-200) var(--ease-spring);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
      
      h2 {
        font-size: var(--font-lg);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin: 0;
      }
      
      .modal-close {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background var(--duration-150) var(--ease-out);
        
        &:hover {
          background: var(--background-hover);
        }
        
        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
      }
    }
    
    .modal-body {
      padding: var(--space-5);
    }
    
    .warning-box {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--error-light);
      border: 1px solid var(--error-lighter);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-5);
      
      .warning-icon {
        color: var(--error);
        flex-shrink: 0;
      }
      
      .warning-title {
        font-size: var(--font-sm);
        font-weight: var(--font-semibold);
        color: var(--error);
        margin: 0 0 var(--space-1) 0;
      }
      
      .warning-desc {
        font-size: var(--font-xs);
        color: var(--error);
        margin: 0;
        line-height: var(--leading-normal);
      }
    }
    
    .form-group {
      label {
        display: block;
        font-size: var(--font-sm);
        font-weight: var(--font-medium);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }
      
      input {
        width: 100%;
        padding: var(--space-3) var(--space-3);
        border: 2px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: var(--font-base);
        background: var(--background);
        color: var(--text-primary);
        transition: border-color var(--duration-150) var(--ease-out);
        
        &:focus {
          outline: none;
          border-color: var(--error);
        }
        
        &::placeholder {
          color: var(--text-tertiary);
        }
      }
      
      .field-error {
        display: block;
        font-size: var(--font-xs);
        color: var(--error);
        margin-top: var(--space-2);
      }
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-top: 1px solid var(--border);
      
      .btn-cancel {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        font-size: var(--font-sm);
        font-weight: var(--font-medium);
        cursor: pointer;
        background: var(--background-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);
        transition: background var(--duration-150) var(--ease-out);
        
        &:hover {
          background: var(--background-hover);
        }
        
        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
      }
      
      .btn-delete {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        font-size: var(--font-sm);
        font-weight: var(--font-medium);
        cursor: pointer;
        background: var(--error);
        color: var(--text-inverse);
        border: none;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        transition: background var(--duration-150) var(--ease-out);
        
        &:hover:not(:disabled) {
          background: #d91e2a;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--text-inverse);
          border-radius: var(--radius-full);
          animation: spin 0.8s linear infinite;
        }
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideDown {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SettingsComponent {
  showDeleteModal = signal(false);
  deletePassword = '';
  deleteLoading = signal(false);
  deleteError = signal('');

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private toast: ToastService
  ) {}

  openDeleteModal() {
    this.deletePassword = '';
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletePassword = '';
    this.deleteError.set('');
  }

  confirmDelete() {
    if (!this.deletePassword.trim()) return;

    this.deleteLoading.set(true);
    this.deleteError.set('');

    this.authService.deleteAccount(this.deletePassword).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.toast.success('Conta excluída com sucesso');
        this.authService.logout();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        
        if (err.status === 401) {
          this.deleteError.set('Senha incorreta');
        } else {
          const msg = err.error?.message || err.message || 'Erro ao excluir conta. Tente novamente.';
          this.deleteError.set(msg);
        }
      }
    });
  }
}
