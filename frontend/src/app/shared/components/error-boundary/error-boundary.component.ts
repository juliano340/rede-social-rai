import { Component, Input, Output, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    @if (hasError()) {
      <div class="error-boundary">
        <div class="error-icon">
          <lucide-icon [name]="icon()" [size]="48"></lucide-icon>
        </div>
        <h2 class="error-title">{{ title() }}</h2>
        <p class="error-message">{{ message() }}</p>
        @if (showRetry()) {
          <button class="btn-retry" (click)="retry.emit()">
            <lucide-icon name="refresh-cw" [size]="16"></lucide-icon>
            Tentar novamente
          </button>
        }
        @if (fallbackActionLabel()) {
          <button class="btn-fallback" (click)="fallbackAction.emit()">
            {{ fallbackActionLabel() }}
          </button>
        }
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    .error-boundary {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-6);
      text-align: center;
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
    }

    .error-icon {
      color: var(--error);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: var(--radius-full);
      background: var(--error-light);
    }

    .error-title {
      font-size: var(--font-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .error-message {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
      max-width: 400px;
      line-height: var(--leading-relaxed);
    }

    .btn-retry,
    .btn-fallback {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-full);
      font-size: var(--font-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all var(--duration-150) var(--ease-out);
      margin-top: var(--space-2);
    }

    .btn-retry {
      background: var(--primary);
      color: var(--text-inverse);
      border: none;

      &:hover {
        background: var(--primary-hover);
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }

    .btn-fallback {
      background: var(--background-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border);

      &:hover {
        background: var(--background-hover);
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .btn-retry,
      .btn-fallback {
        &:hover {
          transform: none;
        }
      }
    }
  `]
})
export class ErrorBoundaryComponent {
  @Input() hasError = false;
  @Input() title = 'Ops! Algo deu errado';
  @Input() message = 'Não foi possível carregar o conteúdo. Verifique sua conexão e tente novamente.';
  @Input() icon = 'alert-circle';
  @Input() showRetry = true;
  @Input() fallbackActionLabel = '';

  retry = output<void>();
  fallbackAction = output<void>();
}
