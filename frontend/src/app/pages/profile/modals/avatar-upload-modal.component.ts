import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-avatar-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    @if (show()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="avatar-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Alterar foto de perfil</h2>
            <button class="modal-close" (click)="close.emit()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="avatar-option" (click)="fileClick.emit()">
              <span class="option-icon">📁</span>
              <span class="option-copy">
                <span class="option-label">Enviar e cortar foto</span>
                <span class="option-description">Escolha uma imagem do aparelho e ajuste o enquadramento.</span>
              </span>
            </div>
            <div class="avatar-option-divider"><span>ou</span></div>
            <div class="avatar-url-option">
              <label>Link da imagem</label>
              <input type="url" [(ngModel)]="urlInput" placeholder="https://exemplo.com/foto.jpg" />
              <button class="btn-save" (click)="saveUrl.emit(urlInput)" [disabled]="!urlInput.trim() || uploading()">
                @if (uploading()) {
                  <span class="spinner-sm"></span>
                  Salvando...
                } @else {
                  Salvar
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; animation: fadeIn 0.15s ease; padding: 16px;
    }
    .avatar-modal {
      background: var(--popover);
      border-radius: var(--radius-xl);
      width: min(100%, 380px); max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-shadow: var(--shadow-2xl);
      border: 1px solid var(--border);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
    }
    h2 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
    .modal-close {
      background: none; border: none; font-size: 22px; color: var(--text-tertiary);
      cursor: pointer; padding: 6px; border-radius: var(--radius-md); line-height: 1;
      transition: all 0.15s;
    }
    .modal-close:hover { background: var(--accent); color: var(--text-primary); }
    .modal-body { padding: 20px 22px 22px; }
    .avatar-option {
      display: flex; align-items: center; gap: 14px;
      padding: 16px; border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); cursor: pointer;
      transition: all 0.15s;
      background: var(--accent);
    }
    .avatar-option:hover { border-color: var(--border-strong); background: var(--muted); }
    .option-icon { font-size: 24px; flex-shrink: 0; }
    .option-copy { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .option-label { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .option-description { color: var(--text-tertiary); font-size: 12px; line-height: 1.4; }
    .avatar-option-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 14px 0; color: var(--text-muted); font-size: 12px; font-weight: 500;
    }
    .avatar-option-divider::before, .avatar-option-divider::after {
      content: ''; flex: 1; height: 1px; background: var(--border);
    }
    .avatar-url-option label { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 7px; }
    .avatar-url-option input {
      width: 100%;
      border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      padding: 11px 13px; font-size: 14px; color: var(--text-primary);
      background: var(--surface-input); margin-bottom: 12px;
      transition: border-color 0.15s;
    }
    .avatar-url-option input:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px var(--primary-light); }
    .btn-save {
      width: 100%; background: var(--primary); color: var(--text-inverse);
      border: none; padding: 11px 16px; border-radius: var(--radius-md);
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
    .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: middle; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AvatarUploadModalComponent {
  show = input.required<boolean>();
  uploading = input.required<boolean>();

  fileClick = output<void>();
  saveUrl = output<string>();
  close = output<void>();

  urlInput = '';
}
