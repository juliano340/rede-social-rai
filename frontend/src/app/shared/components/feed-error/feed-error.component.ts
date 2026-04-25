import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-state" role="alert">
      <p>Algo deu errado ao carregar o feed.</p>
      <button (click)="onRetry()" type="button">Tentar novamente</button>
    </div>
  `,
  styles: [`
    .error-state {
      text-align: center;
      padding: var(--space-16) var(--space-6);
      
      p {
        color: var(--text-secondary);
        margin-top: var(--space-3);
        font-size: var(--font-sm);
      }
      
      button {
        margin-top: var(--space-4);
        padding: var(--space-2) var(--space-5);
        background: var(--primary);
        color: var(--text-inverse);
        border: none;
        border-radius: var(--radius-full);
        font-weight: var(--font-semibold);
        font-size: var(--font-sm);
        cursor: pointer;
        transition: background var(--duration-150) var(--ease-out);
        
        &:hover {
          background: var(--primary-hover);
        }
        
        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
      }
    }
  `]
})
export class FeedErrorComponent {
  retry = output<void>();

  onRetry() {
    this.retry.emit();
  }
}
