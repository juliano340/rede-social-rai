import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { getAvatarUrl } from '../../utils/avatar.utils';

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="notification-container">
      <button class="notification-btn" (click)="toggleDropdown($event)">
        <lucide-icon name="bell" [size]="20"></lucide-icon>
        @if (unreadCount() > 0) {
          <span class="badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div class="notification-dropdown" (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <h3>Notificações</h3>
            @if (unreadCount() > 0) {
              <button class="mark-all-btn" (click)="markAllAsRead()">
                Marcar todas como lidas
              </button>
            }
          </div>

          <div class="dropdown-content">
            @if (loading()) {
              <div class="loading-state">
                <div class="spinner-sm"></div>
              </div>
            } @else if (notifications().length === 0) {
              <div class="empty-state">
                <p>Nenhuma notificação</p>
              </div>
            } @else {
              @for (notification of notifications(); track notification.id) {
                <div
                  class="notification-item"
                  [class.unread]="!notification.read"
                  (click)="handleNotificationClick(notification)"
                >
                  <div class="notification-avatar">
                    @if (notification.actor.avatar) {
                      <img [src]="getAvatarUrl(notification.actor.avatar)" alt="Avatar">
                    } @else {
                      <div class="avatar-placeholder">
                        {{ ((notification.actor.name && notification.actor.name[0]) || notification.actor.username[0]).toUpperCase() }}
                      </div>
                    }
                  </div>
                  <div class="notification-content">
                    <p class="notification-text">
                      <strong>{{ notification.actor.name || notification.actor.username }}</strong>
                      {{ getNotificationText(notification) }}
                    </p>
                    <span class="notification-time">{{ getTimeAgo(notification.createdAt) }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
    }
    
    .notification-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background var(--duration-150) var(--ease-out);
      color: var(--text-secondary);
      
      &:hover {
        background: var(--background-hover);
        color: var(--text-primary);
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
      
      .badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: var(--error);
        color: var(--text-inverse);
        font-size: var(--font-xs);
        font-weight: var(--font-semibold);
        min-width: 18px;
        height: 18px;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 var(--space-1);
        border: 2px solid var(--background-secondary);
      }
    }
    
    .notification-dropdown {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      width: 380px;
      max-height: 480px;
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      z-index: 100;
      animation: scaleIn var(--duration-200) var(--ease-spring);
      transform-origin: top right;
    }
    
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--border);
      background: var(--background-tertiary);
      
      h3 {
        font-size: var(--font-base);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin: 0;
      }
      
      .mark-all-btn {
        background: transparent;
        border: none;
        color: var(--primary);
        font-size: var(--font-sm);
        font-weight: var(--font-medium);
        cursor: pointer;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        transition: background var(--duration-150) var(--ease-out);
        
        &:hover {
          background: var(--primary-light);
        }
        
        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
      }
    }
    
    .dropdown-content {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
      transition: background var(--duration-150) var(--ease-out);
      position: relative;
      
      &:hover {
        background: var(--background-hover);
      }
      
      &.unread {
        background: var(--primary-light);
        
        &::after {
          content: '';
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: var(--radius-full);
        }
      }
    }
    
    .notification-avatar {
      flex-shrink: 0;
      
      img {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        object-fit: cover;
      }
      
      .avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        background: var(--primary);
        color: var(--text-inverse);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-semibold);
        font-size: var(--font-base);
      }
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
      
      .notification-text {
        margin: 0;
        font-size: var(--font-sm);
        color: var(--text-primary);
        line-height: var(--leading-snug);
        
        strong {
          font-weight: var(--font-semibold);
        }
      }
      
      .notification-time {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        margin-top: var(--space-1);
        display: block;
      }
    }
    
    .loading-state, .empty-state {
      padding: var(--space-10) var(--space-4);
      text-align: center;
      color: var(--text-tertiary);
      font-size: var(--font-sm);
    }
    
    .spinner-sm {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: var(--radius-full);
      animation: spin 0.8s linear infinite;
      margin: 0 auto var(--space-3);
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (max-width: 480px) {
      .notification-dropdown {
        right: -80px;
        width: 320px;
      }
    }
  `]
})
export class NotificationMenuComponent implements OnInit, OnDestroy {
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isOpen = signal(false);
  loading = signal(false);

  private pollingSubscription?: Subscription;
  private boundCloseOnOutsideClick: (event: Event) => void;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.boundCloseOnOutsideClick = this.closeOnOutsideClick.bind(this);
  }

  ngOnInit() {
    this.loadUnreadCount();
    this.startPolling();
    document.addEventListener('click', this.boundCloseOnOutsideClick);
  }

  ngOnDestroy() {
    this.stopPolling();
    document.removeEventListener('click', this.boundCloseOnOutsideClick);
  }

  private startPolling() {
    this.pollingSubscription = interval(30000).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.loadUnreadCount();
      }
    });
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private closeOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    const container = document.querySelector('.notification-container');
    
    if (this.isOpen() && container && !container.contains(target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.count);
      },
      error: () => {
        // Handled by global interceptor
      }
    });
  }

  loadNotifications() {
    this.loading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications.set(response.notifications);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, read: true }))
        );
      },
      error: () => {
        // Handled by global interceptor
      }
    });
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.unreadCount.update(c => Math.max(0, c - 1));
          this.notifications.update(notifications =>
            notifications.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
        }
      });
    }

    this.isOpen.set(false);

    if (notification.type === 'LIKE' && notification.post?.author?.username) {
      this.router.navigate(['/profile', notification.post.author.username]);
    } else if (notification.type === 'FOLLOW') {
      this.router.navigate(['/profile', notification.actor.username]);
    } else if (notification.type === 'REPLY') {
      this.router.navigate(['/home'], {
        queryParams: {
          postId: notification.postId,
          ...(notification.replyId ? { replyId: notification.replyId } : {}),
        },
      });
    }
  }

  getAvatarUrl = getAvatarUrl;

  getNotificationText(notification: Notification): string {
    switch (notification.type) {
      case 'LIKE':
        return ' curtiu seu post';
      case 'FOLLOW':
        return ' começou a seguir você';
      case 'REPLY':
        return ' respondeu seu post';
      case 'MENTION':
        return ' te mencionou em um post';
      default:
        return '';
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }
}
