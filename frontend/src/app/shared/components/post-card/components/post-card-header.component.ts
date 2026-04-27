import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { formatDate } from '../../../utils/date.utils';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'app-post-card-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="post-header">
      <div class="post-header__left">
        @if (authorLinkEnabled()) {
          <a [routerLink]="['/profile', post().author.username]" class="author-name">
            {{ post().author.name }}
          </a>
        } @else {
          <span class="author-name">{{ post().author.name }}</span>
        }
        <span class="author-username">&#64;{{ post().author.username }}</span>
        <span class="post-time">{{ formatDate(post().createdAt) }}</span>
      </div>
      
      @if (isOwnPost()) {
        <div class="post-header__actions">
          <button
            class="menu-btn"
            [class.active]="menuOpen()"
            (click)="toggleMenu($event)"
            aria-label="Mais opções"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          
          @if (menuOpen()) {
            <div class="menu-dropdown" (click)="$event.stopPropagation()">
              <button class="menu-item" (click)="onEditClick()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
                Editar
              </button>
              <button class="menu-item menu-item--danger" (click)="onDeleteClick()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Excluir
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .post-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }
    
    .post-header__left {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex-wrap: wrap;
    }
    
    .author-name {
      font-weight: var(--font-bold);
      color: var(--text-primary);
      text-decoration: none;
      font-size: var(--font-sm);
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .author-username,
    .post-time {
      color: var(--text-tertiary);
      font-size: var(--font-xs);
    }
    
    .post-time::before {
      content: '·';
      margin-right: var(--space-1);
    }
    
    .post-header__actions {
      position: relative;
      flex-shrink: 0;
    }
    
    .menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-full);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all var(--duration-150) var(--ease-out);
      
      &:hover {
        background: var(--background-hover);
        color: var(--text-primary);
      }
      
      &.active {
        background: var(--background-hover);
        color: var(--text-primary);
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }
    
    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: var(--space-1);
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      min-width: 140px;
      overflow: hidden;
      animation: scaleIn var(--duration-150) var(--ease-spring);
      transform-origin: top right;
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      background: transparent;
      border: none;
      font-size: var(--font-sm);
      color: var(--text-primary);
      cursor: pointer;
      transition: background var(--duration-150) var(--ease-out);
      text-align: left;
      
      &:hover {
        background: var(--background-hover);
      }
      
      &:focus-visible {
        outline: none;
        background: var(--background-hover);
      }
      
      &--danger {
        color: var(--error);
        
        &:hover {
          background: var(--error-light);
        }
      }
    }
  `]
})
export class PostCardHeaderComponent {
  post = input.required<Post>();
  authorLinkEnabled = input<boolean>(true);
  isOwnPost = input<boolean>(false);
  
  menuOpen = input<boolean>(false);
  menuToggle = output<MouseEvent>();
  editClick = output<void>();
  deleteClick = output<void>();
  
  formatDate = formatDate;
  
  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuToggle.emit(event);
  }
  
  onEditClick() {
    this.editClick.emit();
  }

  onDeleteClick() {
    this.deleteClick.emit();
  }
}
