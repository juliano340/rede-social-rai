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
      padding: 60px 20px;
    }
    
    .error-state p {
      color: var(--text-secondary);
      margin-top: 12px;
    }
    
    .error-state button {
      margin-top: 16px;
      padding: 10px 20px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .error-state button:hover {
      background: var(--primary-hover);
    }
  `]
})
export class FeedErrorComponent {
  retry = output<void>();

  onRetry() {
    this.retry.emit();
  }
}
