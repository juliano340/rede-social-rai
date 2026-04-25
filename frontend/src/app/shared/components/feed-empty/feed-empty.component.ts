import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

@Component({
  selector: 'app-feed-empty',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="empty-state">
      <lucide-icon name="file-text" [size]="48" class="empty-icon"></lucide-icon>
      <p>Nenhuma publicação ainda.</p>
      <span>Seja o primeiro a compartilhar algo!</span>
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: var(--space-16) var(--space-6);
    }
    
    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-4);
      color: var(--text-tertiary);
    }
    
    p {
      font-size: var(--font-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }
    
    span {
      color: var(--text-secondary);
      font-size: var(--font-sm);
    }
  `]
})
export class FeedEmptyComponent {}
