import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { ButtonComponent } from '../../ui/button.component';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, ButtonComponent],
  template: `
    @if (show) {
      <div class="modal-overlay" (click)="onClose()" role="dialog" aria-modal="true" [attr.aria-labelledby]="'modal-title-' + id">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__icon modal__icon--error">
            <lucide-icon name="alert-triangle" [size]="32"></lucide-icon>
          </div>
          
          <h2 class="modal__title" [id]="'modal-title-' + id">{{ title }}</h2>
          
          <p class="modal__description">
            {{ description || 'Tem certeza que deseja excluir ' + itemType + '? Esta ação não pode ser desfeita.' }}
          </p>
          
          <div class="modal__actions">
            <app-button variant="secondary" size="md" (onClick)="onClose()">
              Cancelar
            </app-button>
            <app-button variant="danger" size="md" (onClick)="onConfirm()">
              Excluir
            </app-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn var(--duration-150) var(--ease-out);
      padding: var(--space-4);
    }
    
    .modal {
      background: var(--background-secondary);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: var(--shadow-2xl);
      animation: slideUp var(--duration-200) var(--ease-spring);
    }
    
    .modal__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      margin-bottom: var(--space-4);
      
      &--error {
        background: var(--error-light);
        color: var(--error);
      }
    }
    
    .modal__title {
      font-size: var(--font-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }
    
    .modal__description {
      font-size: var(--font-base);
      color: var(--text-secondary);
      margin: 0 0 var(--space-6) 0;
      line-height: var(--leading-normal);
    }
    
    .modal__actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px) scale(0.98);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .modal-overlay, .modal {
        animation: none;
      }
    }
  `]
})
export class DeleteConfirmModalComponent {
  @Input() show = false;
  @Input() title = 'Excluir';
  @Input() itemType = 'este item';
  @Input() description = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  
  id = Math.random().toString(36).slice(2, 9);
  
  onClose() {
    this.close.emit();
  }
  
  onConfirm() {
    this.confirm.emit();
  }
}
