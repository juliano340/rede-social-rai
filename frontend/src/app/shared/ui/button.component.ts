import { Component, Input, Output, EventEmitter, HostBinding, ClassProvider } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="onClick.emit($event)"
      attr.aria-label="{{ ariaLabel || null }}"
      attr.aria-busy="{{ loading }}"
    >
      @if (loading) {
        <svg class="btn__spinner" viewBox="0 0 24 24" fill="none">
          <circle class="btn__spinner-track" cx="12" cy="12" r="10" stroke-width="3"/>
          <circle class="btn__spinner-indicator" cx="12" cy="12" r="10" stroke-width="3" stroke-linecap="round"/>
        </svg>
      }
      @if (icon && !loading) {
        <ng-content select="[icon]"></ng-content>
      }
      <span class="btn__label"><ng-content></ng-content></span>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-family: var(--font-family);
      font-weight: var(--font-semibold);
      border-radius: var(--radius-full);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--duration-150) var(--ease-out);
      white-space: nowrap;
      user-select: none;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }
    
    .btn--sm {
      height: 32px;
      padding: 0 var(--space-3);
      font-size: var(--font-sm);
    }
    
    .btn--md {
      height: 40px;
      padding: 0 var(--space-4);
      font-size: var(--font-base);
    }
    
    .btn--lg {
      height: 48px;
      padding: 0 var(--space-6);
      font-size: var(--font-lg);
    }
    
    .btn--primary {
      background: var(--primary);
      color: var(--text-inverse);
      border-color: var(--primary);
      
      &:hover:not(:disabled) {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
      }
      
      &:active:not(:disabled) {
        background: var(--primary-active);
        border-color: var(--primary-active);
      }
    }
    
    .btn--secondary {
      background: var(--background-tertiary);
      color: var(--text-primary);
      border-color: var(--background-tertiary);
      
      &:hover:not(:disabled) {
        background: var(--background-hover);
        border-color: var(--background-hover);
      }
      
      &:active:not(:disabled) {
        background: var(--background-active);
        border-color: var(--background-active);
      }
    }
    
    .btn--ghost {
      background: transparent;
      color: var(--text-secondary);
      border-color: transparent;
      
      &:hover:not(:disabled) {
        background: var(--background-tertiary);
        color: var(--text-primary);
      }
      
      &:active:not(:disabled) {
        background: var(--background-hover);
      }
    }
    
    .btn--danger {
      background: var(--error);
      color: var(--text-inverse);
      border-color: var(--error);
      
      &:hover:not(:disabled) {
        background: var(--error-hover, #dc2626);
        border-color: var(--error-hover, #dc2626);
      }
      
      &:active:not(:disabled) {
        background: var(--error-active, #b91c1c);
        border-color: var(--error-active, #b91c1c);
      }
    }
    
    .btn--outline {
      background: transparent;
      color: var(--primary);
      border-color: var(--border);
      
      &:hover:not(:disabled) {
        background: var(--primary-light);
        border-color: var(--primary);
      }
      
      &:active:not(:disabled) {
        background: var(--primary-lighter);
        border-color: var(--primary-hover);
      }
    }
    
    .btn__label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: var(--leading-none);
    }
    
    .btn__spinner {
      width: 1em;
      height: 1em;
      animation: spin 0.8s linear infinite;
      
      &-track {
        stroke: currentColor;
        opacity: 0.3;
      }
      
      &-indicator {
        stroke: currentColor;
        stroke-dasharray: 45;
        stroke-dashoffset: 30;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: ButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon = false;
  @Input() ariaLabel: string | null = null;
  
  @Output() onClick = new EventEmitter<MouseEvent>();
  
  @HostBinding('class') get hostClasses(): string {
    return '';
  }
  
  get buttonClasses(): string {
    return `btn btn--${this.variant} btn--${this.size}`;
  }
}
