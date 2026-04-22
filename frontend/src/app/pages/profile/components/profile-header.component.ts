import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconsModule } from '../../../shared/icons/lucide-icons.module';
import { getAvatarUrl } from '../../../shared/utils/avatar.utils';
import { UserProfile } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsModule],
  template: `
    <div class="profile-header">
      <div class="avatar-wrapper" [class.can-upload]="isOwnProfile()">
        @if (profile()?.avatar) {
          <img [src]="getAvatarUrl(profile()?.avatar)" alt="Avatar" class="avatar-image" />
        } @else {
          <div class="avatar-placeholder">
            {{ (profile()!.name[0] || '?').toUpperCase() }}
          </div>
        }
        @if (isOwnProfile()) {
          <div class="avatar-overlay" (click)="avatarClick.emit()">
            <lucide-icon name="camera" [size]="24" class="camera-icon"></lucide-icon>
          </div>
          <input type="file" #fileInput (change)="fileSelected.emit($event)" accept="image/*" style="display: none" />
        }
      </div>
      <div class="profile-info">
        <div class="profile-info-header">
          <div class="profile-name-row">
            <h1>{{ profile()?.name }}</h1>
            @if (isOwnProfile()) {
              <button class="edit-profile-btn" (click)="editClick.emit()">
                <lucide-icon name="settings" [size]="16"></lucide-icon>
              </button>
            }
          </div>
          <span class="username">&#64;{{ profile()?.username }}</span>
          @if (profile()?.bio) {
            <p class="bio">{{ profile()?.bio }}</p>
          }
          @if (profile()?.bioLink) {
            <a class="bio-link" [href]="profile()?.bioLink" target="_blank" rel="noopener noreferrer">
              {{ displayBioLink(profile()?.bioLink) }}
            </a>
          }
        </div>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ postsCount() }}</span>
            <span class="stat-label">posts</span>
          </div>
          <div class="stat-item clickable" (click)="followersClick.emit()">
            <span class="stat-value">{{ followersCount() }}</span>
            <span class="stat-label">seguidores</span>
          </div>
          <div class="stat-item clickable" (click)="followingClick.emit()">
            <span class="stat-value">{{ followingCount() }}</span>
            <span class="stat-label">seguindo</span>
          </div>
        </div>
        <div class="profile-actions">
          @if (!isOwnProfile() && isLoggedIn()) {
            <button class="follow-btn" [class.following]="profile()?.isFollowing" [disabled]="isFollowingLoading()" (click)="followClick.emit()">
              @if (isFollowingLoading()) {
                <span class="spinner-sm"></span>
              } @else if (profile()?.isFollowing) {
                Seguindo
              } @else {
                Seguir
              }
            </button>
          }
          <span class="joined">
            <lucide-icon name="calendar" [size]="14"></lucide-icon>
            Entrou em {{ formatDate(profile()?.createdAt) }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-header { display: flex; gap: 24px; }
    .avatar-wrapper { position: relative; flex-shrink: 0; }
    .avatar-wrapper.can-upload { cursor: pointer; }
    .avatar-wrapper.can-upload:hover .avatar-overlay { opacity: 1; }
    .avatar-image { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3); }
    .avatar-placeholder { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #0d8ecf); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 36px; box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3); overflow: hidden; }
    .avatar-overlay { position: absolute; top: 0; left: 0; width: 96px; height: 96px; border-radius: 50%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
    .camera-icon { color: white; }
    .profile-info { flex: 1; }
    .profile-info-header { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    .profile-name-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }
    .edit-profile-btn { background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border); padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
    .edit-profile-btn:hover { background: var(--border); }
    h1 { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .username { color: var(--text-secondary); font-size: 15px; display: block; margin: 0; }
    .bio { margin: 0; color: var(--text-primary); line-height: 1.5; }
    .bio-link { display: block; margin: 0; text-align: left; align-self: flex-start; color: var(--primary); font-size: 14px; text-decoration: none; word-break: break-all; }
    .bio-link:hover { text-decoration: underline; }
    .stats { display: flex; gap: 24px; margin-bottom: 16px; }
    .stat-item { display: flex; gap: 4px; align-items: baseline; }
    .stat-item.clickable { cursor: pointer; padding: 4px 8px; margin: -4px -8px; border-radius: 8px; transition: background 0.15s; }
    .stat-item.clickable:hover { background: var(--background-secondary); }
    .stat-value { font-weight: 700; color: var(--text-primary); }
    .stat-label { color: var(--text-secondary); font-size: 14px; }
    .profile-actions { display: flex; align-items: center; gap: 16px; margin-top: 4px; }
    .follow-btn { padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3); min-width: 100px; display: inline-flex; align-items: center; justify-content: center; }
    .follow-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
    .follow-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .follow-btn.following { background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border); box-shadow: none; }
    .follow-btn.following:hover:not(:disabled) { background: var(--error-light); color: var(--error); border-color: var(--error); }
    .joined { font-size: 13px; color: var(--text-tertiary); }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProfileHeaderComponent {
  profile = input.required<UserProfile | null>();
  isOwnProfile = input.required<boolean>();
  isLoggedIn = input.required<boolean>();
  isFollowingLoading = input.required<boolean>();
  postsCount = input.required<number>();
  followersCount = input.required<number>();
  followingCount = input.required<number>();

  avatarClick = output<void>();
  fileSelected = output<Event>();
  editClick = output<void>();
  followersClick = output<void>();
  followingClick = output<void>();
  followClick = output<void>();

  getAvatarUrl = getAvatarUrl;

  displayBioLink(url: string | null | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}