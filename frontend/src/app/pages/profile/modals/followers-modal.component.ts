import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconsModule } from '../../../shared/icons/lucide-icons.module';
import { getAvatarUrl } from '../../../shared/utils/avatar.utils';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-followers-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsModule],
  template: `
    @if (show()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ title() }}</h2>
            <button class="modal-close" (click)="close.emit()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-content">
            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
              </div>
            } @else if (users().length === 0) {
              <div class="empty-state">
                <p>Nenhum usuário encontrado</p>
              </div>
            } @else {
              @for (user of users(); track user.id) {
                <a [routerLink]="['/', user.username]" class="modal-user" (click)="close.emit()">
                  @if (user.avatar) {
                    <img [src]="getAvatarUrl(user.avatar)" alt="" class="avatar-img" />
                  } @else {
                    <div class="avatar-placeholder small">{{ (user.name[0] || '?').toUpperCase() }}</div>
                  }
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-username">&#64;{{ user.username }}</span>
                  </div>
                </a>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 500; animation: fadeIn 0.15s ease; }
    .modal { background: var(--background); border-radius: 16px; width: 90%; max-width: 440px; max-height: 80vh; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); animation: slideDown 0.15s ease; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
    h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .modal-close { background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; border-radius: var(--radius-md); }
    .modal-close:hover { background: var(--background-secondary); }
    .modal-content { padding: 8px 0; overflow-y: auto; max-height: 400px; }
    .loading-state { text-align: center; padding: 40px 20px; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    .empty-state { text-align: center; padding: 40px 20px; color: var(--text-secondary); }
    .modal-user { display: flex; gap: 12px; padding: 12px 16px; text-decoration: none; transition: background 0.15s; align-items: center; }
    .modal-user:hover { background: var(--background-secondary); }
    .avatar-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #0d8ecf); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 36px; }
    .avatar-placeholder.small { width: 44px; height: 44px; font-size: 16px; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: var(--text-primary); }
    .user-username { color: var(--text-secondary); font-size: 14px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FollowersModalComponent {
  show = input.required<boolean>();
  title = input.required<string>();
  users = input.required<User[]>();
  loading = input.required<boolean>();

  close = output<void>();

  getAvatarUrl = getAvatarUrl;
}