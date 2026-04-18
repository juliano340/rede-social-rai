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
      padding: 20px;
    }

    .settings-header {
      margin-bottom: 32px;

      h1 {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .settings-section {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-bottom: 16px;
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
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);

      h2 {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--background-tertiary);
      }

      &.setting-link {
        text-decoration: none;
      }
    }

    .setting-item--full {
      width: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      border: none;
      background: transparent;
      text-align: left;
      font: inherit;
      padding: 16px 20px;
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-label {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .setting-value {
      font-size: 13px;
      color: var(--text-tertiary);
    }

    .setting-hint {
      font-size: 13px;
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
        border-radius: 14px;
        position: relative;
        transition: background 0.2s;
      }

      .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        color: var(--text-tertiary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      &.active .toggle-track {
        background: var(--primary);

        .toggle-thumb {
          transform: translateX(20px);
          color: var(--primary);
        }
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }

    .delete-modal {
      background: var(--background);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 440px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideDown 0.15s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .modal-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--radius-sm);

        &:hover {
          background: var(--background-secondary);
        }
      }
    }

    .modal-body {
      padding: 20px;
    }

    .warning-box {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: var(--error-light);
      border: 1px solid rgba(224, 36, 94, 0.2);
      border-radius: var(--radius-md);
      margin-bottom: 20px;

      .warning-icon {
        color: var(--error);
        flex-shrink: 0;
      }

      .warning-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--error);
        margin: 0 0 4px 0;
      }

      .warning-desc {
        font-size: 13px;
        color: var(--error);
        margin: 0;
        line-height: 1.4;
      }
    }

    .form-group {
      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 15px;
        background: var(--background);
        color: var(--text-primary);

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
        font-size: 13px;
        color: var(--error);
        margin-top: 6px;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--border);

      .btn-cancel {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        background: var(--background-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);

        &:hover {
          background: var(--border);
        }
      }

      .btn-delete {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        background: var(--error);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover:not(:disabled) {
          background: #c71d2f;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
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
