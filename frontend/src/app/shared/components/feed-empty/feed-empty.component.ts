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
      padding: 60px 20px;
    }
    
    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: var(--text-tertiary);
    }
    
    .empty-state p {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    .empty-state span {
      color: var(--text-secondary);
    }
  `]
})
export class FeedEmptyComponent {}
