import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <button class="notification-btn" (click)="toggleDropdown($event)">
        <span class="bell-icon">🔔</span>
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
                        {{ (notification.actor.name?.[0] || notification.actor.username[0]).toUpperCase() }}
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
                  @if (!notification.read) {
                    <span class="unread-dot"></span>
                  }
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
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background 0.15s;

      &:hover {
        background: var(--background-secondary);
      }

      .bell-icon {
        font-size: 22px;
      }

      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }
    }

    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      width: 360px;
      max-height: 480px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 100;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .mark-all-btn {
        background: none;
        border: none;
        color: var(--primary);
        font-size: 13px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-sm);

        &:hover {
          background: var(--background-secondary);
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
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;

      &:hover {
        background: var(--background-secondary);
      }

      &.unread {
        background: rgba(99, 102, 241, 0.05);
      }
    }

    .notification-avatar {
      flex-shrink: 0;

      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
      }
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-text {
        margin: 0;
        font-size: 14px;
        color: var(--text-primary);
        line-height: 1.4;

        strong {
          font-weight: 600;
        }
      }

      .notification-time {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 4px;
        display: block;
      }
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .loading-state, .empty-state {
      padding: 40px 16px;
      text-align: center;
      color: var(--text-tertiary);
    }

    .spinner-sm {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      error: (err) => {
        console.error('Error loading unread count:', err);
      }
    });
  }

  loadNotifications() {
    this.loading.set(true);
    this.notificationService.getNotifications(1, 20).subscribe({
      next: (response) => {
        this.notifications.set(response.notifications);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
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
      error: (err) => {
        console.error('Error marking all as read:', err);
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

    if (notification.type === 'FOLLOW') {
      this.router.navigate(['/profile', notification.actor.username]);
    } else if (notification.post?.author?.username) {
      this.router.navigate(['/profile', notification.post.author.username]);
    }
  }

  getAvatarUrl(avatar: string | null): string {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return 'http://localhost:3000' + avatar;
  }

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
