import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feed-tabs">
      <button 
        class="feed-tab" 
        [class.active]="activeTab() === 'all'"
        (click)="onTabClick('all')"
        type="button"
      >
        Para você
      </button>
      <button 
        class="feed-tab" 
        [class.active]="activeTab() === 'following'"
        (click)="onTabClick('following')"
        type="button"
      >
        Seguindo
      </button>
    </div>
  `,
  styles: [`
    .feed-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: var(--background-secondary);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(12px);

      [data-theme="dark"] & {
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      }
    }
    
    .feed-tab {
      flex: 1;
      padding: var(--space-4);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: var(--font-base);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-150) var(--ease-out);
      
      &:hover {
        color: var(--text-primary);
        background: var(--background-hover);
      }
      
      &:focus-visible {
        outline: none;
        background: var(--background-hover);
      }
      
      &.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
        background: transparent;
        font-weight: var(--font-semibold);
      }
    }
  `]
})
export class FeedTabsComponent {
  activeTab = input.required<'all' | 'following'>();
  tabChange = output<'all' | 'following'>();

  onTabClick(tab: 'all' | 'following') {
    if (tab !== this.activeTab()) {
      this.tabChange.emit(tab);
    }
  }
}
