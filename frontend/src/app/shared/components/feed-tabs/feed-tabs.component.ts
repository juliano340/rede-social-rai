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
      margin-bottom: var(--space-4);
      border-bottom: 1px solid var(--border);
    }
    
    .feed-tab {
      flex: 1;
      padding: var(--space-3) var(--space-4);
      background: transparent;
      border: none;
      font-size: var(--font-sm);
      font-weight: var(--font-semibold);
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color var(--duration-150) var(--ease-out),
                  background var(--duration-150) var(--ease-out);
      
      &:hover {
        color: var(--text-primary);
        background: var(--background-hover);
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
      
      &.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
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
