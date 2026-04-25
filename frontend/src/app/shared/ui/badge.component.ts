import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      @if (dot) {
        <span class="badge__dot"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      font-family: var(--font-family);
      font-weight: var(--font-medium);
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    
    .badge--sm {
      height: 20px;
      padding: 0 var(--space-2);
      font-size: var(--font-xs);
      gap: var(--space-1);
    }
    
    .badge--md {
      height: 24px;
      padding: 0 var(--space-2);
      font-size: var(--font-sm);
      gap: var(--space-1);
    }
    
    .badge--lg {
      height: 28px;
      padding: 0 var(--space-3);
      font-size: var(--font-base);
      gap: var(--space-2);
    }
    
    .badge--default {
      background: var(--background-tertiary);
      color: var(--text-primary);
    }
    
    .badge--primary {
      background: var(--primary-light);
      color: var(--primary);
    }
    
    .badge--success {
      background: var(--success-light);
      color: var(--success);
    }
    
    .badge--warning {
      background: var(--warning-light);
      color: var(--warning);
    }
    
    .badge--error {
      background: var(--error-light);
      color: var(--error);
    }
    
    .badge--info {
      background: var(--info-light);
      color: var(--info);
    }
    
    .badge__dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background: currentColor;
    }
    
    .badge--sm .badge__dot {
      width: 4px;
      height: 4px;
    }
  `]
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;
  
  get badgeClasses(): string {
    return `badge badge--${this.variant} badge--${this.size}`;
  }
}
