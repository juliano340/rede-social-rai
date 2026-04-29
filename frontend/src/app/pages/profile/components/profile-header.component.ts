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
    .profile-header { display: flex; gap: 24px; min-width: 0; }
    .avatar-wrapper { position: relative; flex-shrink: 0; }
    .avatar-wrapper.can-upload { cursor: pointer; }
    .avatar-wrapper.can-upload:hover .avatar-overlay { opacity: 1; }
    .avatar-image { width: 96px; height: 96px; border-radius: var(--radius-full); object-fit: cover; }
    .avatar-placeholder { width: 96px; height: 96px; border-radius: var(--radius-full); background: var(--primary); color: var(--text-inverse); display: flex; align-items: center; justify-content: center; font-weight: var(--font-bold); font-size: var(--font-3xl); overflow: hidden; }
    .avatar-overlay { position: absolute; top: 0; left: 0; width: 96px; height: 96px; border-radius: var(--radius-full); background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--duration-150) var(--ease-out); }
    .camera-icon { color: var(--text-inverse); }
    .profile-info { flex: 1; min-width: 0; }
    .profile-info-header { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); }
    .profile-name-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-width: 0; }
    .edit-profile-btn { flex-shrink: 0; background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--font-xs); font-weight: var(--font-medium); cursor: pointer; transition: all var(--duration-150) var(--ease-out); }
    .edit-profile-btn:hover { background: var(--background-hover); }
    h1 { font-size: var(--font-2xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
    .username { color: var(--text-secondary); font-size: var(--font-base); display: block; margin: 0; }
    .bio { margin: 0; color: var(--text-primary); line-height: var(--leading-normal); }
    .bio-link { display: block; margin: 0; text-align: left; align-self: flex-start; color: var(--primary); font-size: var(--font-sm); text-decoration: none; word-break: break-all; }
    .bio-link:hover { text-decoration: underline; }
    .stats { display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-5); margin-bottom: var(--space-4); max-width: 100%; }
    .stat-item { display: flex; gap: var(--space-1); align-items: baseline; white-space: nowrap; }
    .stat-item.clickable { cursor: pointer; padding: var(--space-1) var(--space-2); margin: calc(var(--space-1) * -1) calc(var(--space-2) * -1); border-radius: var(--radius-sm); transition: background var(--duration-150) var(--ease-out); }
    .stat-item.clickable:hover { background: var(--background-hover); }
    .stat-value { font-weight: var(--font-bold); color: var(--text-primary); }
    .stat-label { color: var(--text-secondary); font-size: var(--font-sm); }
    .profile-actions { display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-1); }
    .follow-btn { padding: var(--space-2) var(--space-6); border-radius: var(--radius-full); font-size: var(--font-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--duration-150) var(--ease-out); border: none; background: var(--primary); color: var(--text-inverse); min-width: 100px; display: inline-flex; align-items: center; justify-content: center; }
    .follow-btn:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
    .follow-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .follow-btn.following { background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border); box-shadow: none; transform: none; }
    .follow-btn.following:hover:not(:disabled) { background: var(--error-light); color: var(--error); border-color: var(--error); }
    .joined { font-size: var(--font-xs); color: var(--text-tertiary); }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: var(--radius-full); animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 520px) {
      .profile-header { gap: var(--space-4); }
      .avatar-image, .avatar-placeholder, .avatar-overlay { width: 88px; height: 88px; }
      h1 { font-size: var(--font-xl); }
      .stats { gap: var(--space-2) var(--space-4); }
      .stat-label { font-size: var(--font-xs); }
      .joined { display: inline-flex; align-items: center; gap: var(--space-1); flex-wrap: wrap; }
    }
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
