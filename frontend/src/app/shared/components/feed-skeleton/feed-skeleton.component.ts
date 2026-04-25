import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-feed-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-feed">
      @for (i of [1,2,3,4,5]; track i) {
        <div class="skeleton-post">
          <div class="skeleton-post-header">
            <app-skeleton type="avatar" />
            <div class="skeleton-post-header-text">
              <app-skeleton type="text" width="120px" />
              <app-skeleton type="text" width="80px" height="12px" />
            </div>
          </div>
          <app-skeleton type="text" />
          <app-skeleton type="text" width="60%" />
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-feed {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4) 0;
    }
    
    .skeleton-post {
      background: var(--background-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .skeleton-post-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    
    .skeleton-post-header-text {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  `]
})
export class FeedSkeletonComponent {}
