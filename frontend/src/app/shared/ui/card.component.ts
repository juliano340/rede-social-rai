import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article [class]="cardClasses">
      @if (header) {
        <header class="card__header">
          <h3 class="card__title">{{ header }}</h3>
        </header>
      }
      
      <div class="card__content">
        <ng-content></ng-content>
      </div>
      
      @if (footer) {
        <footer class="card__footer">
          <ng-content select="[card-footer]"></ng-content>
        </footer>
      }
    </article>
  `,
  styles: [`
    .card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      background: var(--background-secondary);
      overflow: hidden;
    }
    
    .card--default {
      border: 1px solid var(--border);
    }
    
    .card--elevated {
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border);
      
      &:hover {
        box-shadow: var(--shadow-lg);
      }
    }
    
    .card--outlined {
      border: 2px solid var(--border);
      background: transparent;
    }
    
    .card--interactive {
      cursor: pointer;
      transition: transform var(--duration-150) var(--ease-out),
                  box-shadow var(--duration-150) var(--ease-out);
      
      &:hover {
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-4);
      border-bottom: 1px solid var(--border);
    }
    
    .card__title {
      font-size: var(--font-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;
    }
    
    .card__content {
      padding: var(--space-4);
      flex: 1;
    }
    
    .card__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4);
      border-top: 1px solid var(--border);
      background: var(--background-tertiary);
    }
  `]
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() header = '';
  @Input() footer = false;
  @Input() interactive = false;
  
  get cardClasses(): string {
    const classes = [`card`, `card--${this.variant}`];
    if (this.interactive) classes.push('card--interactive');
    return classes.join(' ');
  }
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="card-header">
      <ng-content></ng-content>
    </header>
  `,
  styles: [`
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-4);
      border-bottom: 1px solid var(--border);
    }
  `]
})
export class CardHeaderComponent {}

@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-content">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-content {
      padding: var(--space-4);
      flex: 1;
    }
  `]
})
export class CardContentComponent {}

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="card-footer">
      <ng-content></ng-content>
    </footer>
  `,
  styles: [`
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4);
      border-top: 1px solid var(--border);
      background: var(--background-tertiary);
    }
  `]
})
export class CardFooterComponent {}
