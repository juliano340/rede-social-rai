import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { getAvatarUrl } from '../../../utils/avatar.utils';
import { formatDate } from '../../../utils/date.utils';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'app-post-card-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="post-header">
      <div class="post-avatar">
        @if (post().author.avatar) {
          <img [src]="getAvatarUrl(post().author.avatar)" alt="Avatar" class="avatar-image">
        } @else {
          <div class="avatar-placeholder" aria-hidden="true">
            {{ getAvatarInitial(post().author.name) }}
          </div>
        }
      </div>
      <div class="post-meta">
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
    </div>
  `,
  styles: [`
    .post-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 4px; }
    .post-avatar { flex-shrink: 0; }
    .avatar-image { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #0d8ecf); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 20px; }
    .post-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .author-name { font-weight: 700; color: var(--text-primary); text-decoration: none; }
    .author-name:hover { text-decoration: underline; }
    .author-username, .post-time { color: var(--text-secondary); font-size: 14px; }
  `]
})
export class PostCardHeaderComponent {
  post = input.required<Post>();
  authorLinkEnabled = input<boolean>(true);

  getAvatarUrl = getAvatarUrl;
  formatDate = formatDate;

  getAvatarInitial(name: string): string {
    return ((name && name[0]) || '?').toUpperCase();
  }
}
