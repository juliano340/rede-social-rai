import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    @if (show) {
      <div class="modal-overlay" (click)="onClose()">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <lucide-icon name="trash-2" [size]="48" class="modal-icon"></lucide-icon>
          <h2>{{ title }}</h2>
          <p>Tem certeza que deseja excluir {{ itemType }}? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="modal-cancel" (click)="onClose()">Cancelar</button>
            <button class="modal-confirm" (click)="onConfirm()">Excluir</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
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
      animation: fadeIn 0.2s ease;
    }

    .confirm-modal {
      background: var(--background);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.2s ease;

      .modal-icon {
        color: var(--error);
        margin-bottom: 12px;
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        font-size: 15px;
        color: var(--text-secondary);
        margin: 0 0 20px 0;
        line-height: 1.4;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .modal-cancel, .modal-confirm {
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }

      .modal-cancel {
        background: var(--background-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);

        &:hover {
          background: var(--border);
        }
      }

      .modal-confirm {
        background: var(--error);
        color: white;
        border: none;

        &:hover {
          background: #c71d2f;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class DeleteConfirmModalComponent {
  @Input() show = false;
  @Input() title = 'Excluir';
  @Input() itemType = 'este item';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
