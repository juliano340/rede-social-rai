import { Component, input } from '@angular/core';
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
  `,
  styles: [`
    .post-header {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex-wrap: wrap;
      margin-bottom: var(--space-1);
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
      font-size: var(--font-sm);
    }
    
    .post-time::before {
      content: '·';
      margin-right: var(--space-1);
    }
  `]
})
export class PostCardHeaderComponent {
  post = input.required<Post>();
  authorLinkEnabled = input<boolean>(true);

  formatDate = formatDate;
}
