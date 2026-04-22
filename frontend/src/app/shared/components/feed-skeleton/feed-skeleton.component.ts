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
      gap: 16px;
      padding: 16px 0;
    }

    .skeleton-post {
      background: var(--background-secondary);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-post-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .skeleton-post-header-text {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `]
})
export class FeedSkeletonComponent {}
