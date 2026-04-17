import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [class.skeleton-text]="type === 'text'" [class.skeleton-avatar]="type === 'avatar'" [class.skeleton-card]="type === 'card'" [style.width]="width" [style.height]="height"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--background-secondary) 25%, var(--background-tertiary, #2a2a2a) 50%, var(--background-secondary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    .skeleton-text {
      height: 16px;
      width: 100%;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }

    .skeleton-card {
      width: 100%;
      height: 120px;
      border-radius: 12px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'avatar' | 'card' = 'text';
  @Input() width = '100%';
  @Input() height = '16px';
}