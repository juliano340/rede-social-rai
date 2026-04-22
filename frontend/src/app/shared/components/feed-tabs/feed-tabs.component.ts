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
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    
    .feed-tab {
      flex: 1;
      padding: 12px;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .feed-tab:hover {
      color: var(--text-primary);
      background: var(--background-secondary);
    }
    
    .feed-tab.active {
      color: var(--text-primary);
      border-bottom-color: var(--primary);
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
