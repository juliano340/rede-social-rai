import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [class.skeleton-text]="type === 'text'" [class.skeleton-avatar]="type === 'avatar'" [class.skeleton-card]="type === 'card'" [class.skeleton-circle]="type === 'circle'" [class.skeleton-thumbnail]="type === 'thumbnail'" [style.width]="width" [style.height]="height" [style.border-radius]="type === 'circle' ? '50%' : undefined"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--background-secondary) 25%, var(--background-tertiary) 50%, var(--background-secondary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite;
      border-radius: var(--radius-md);
    }

    .skeleton-text {
      height: 16px;
      width: 100%;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
    }

    .skeleton-card {
      width: 100%;
      height: 140px;
      border-radius: var(--radius-lg);
    }

    .skeleton-circle {
      width: 48px;
      height: 48px;
    }

    .skeleton-thumbnail {
      width: 100%;
      height: 200px;
      border-radius: var(--radius-md);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: var(--background-tertiary);
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'avatar' | 'card' | 'circle' | 'thumbnail' = 'text';
  @Input() width = '100%';
  @Input() height = '16px';
}