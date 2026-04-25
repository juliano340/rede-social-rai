import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../icons/lucide-icons.module';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'app-post-card-actions',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="post-actions">
      <button
        class="action-btn like"
        (click)="onLikeClick()"
        [class.liked]="isLiked()"
        [disabled]="isLiking()"
      >
        <lucide-icon name="heart" [size]="18" [class.filled]="isLiked()"></lucide-icon>
        <span>{{ post()._count.likes }}</span>
      </button>
      <button
        class="action-btn reply"
        (click)="onReplyToggle()"
        [class.active]="showReplies()"
      >
        <lucide-icon name="message-circle" [size]="18"></lucide-icon>
        <span>{{ post()._count.replies }}</span>
      </button>
      @if (post().linkUrl) {
        <a [href]="post().linkUrl" target="_blank" rel="noopener noreferrer" class="action-btn link">
          <lucide-icon name="link" [size]="18"></lucide-icon>
        </a>
      }
      @if (isOwnPost()) {
        <button
          class="action-btn edit"
          (click)="onEditStart()"
          [disabled]="isEditing()"
        >
          <lucide-icon name="pencil" [size]="18"></lucide-icon>
        </button>
        <button
          class="action-btn delete"
          (click)="onDeleteClick()"
          [disabled]="deleting()"
        >
          <lucide-icon name="trash-2" [size]="18"></lucide-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .post-actions {
      display: flex;
      gap: var(--space-1);
      margin-top: var(--space-3);
      flex-wrap: wrap;
    }
    
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      font-size: var(--font-sm);
      font-weight: var(--font-medium);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-full);
      transition: background var(--duration-150) var(--ease-out),
                  color var(--duration-150) var(--ease-out);
      cursor: pointer;
      white-space: nowrap;
      
      &:hover:not(:disabled) {
        background: var(--background-hover);
        color: var(--text-secondary);
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.liked {
        color: var(--error);
        
        lucide-icon {
          fill: currentColor;
        }
      }
      
      &.reply {
        &:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
      }
      
      &.edit {
        &:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
      }
      
      &.delete {
        &:hover {
          background: var(--error-light);
          color: var(--error);
        }
      }
      
      &.link {
        text-decoration: none;
        
        &:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
      }
      
      lucide-icon {
        color: currentColor;
      }
    }
  `]
})
export class PostCardActionsComponent {
  post = input.required<Post>();
  isLiked = input<boolean>(false);
  isLiking = input<boolean>(false);
  isOwnPost = input<boolean>(false);
  deleting = input<boolean>(false);
  showReplies = input<boolean>(false);
  isEditing = input<boolean>(false);

  likeClick = output<void>();
  replyToggle = output<void>();
  editStart = output<void>();
  deleteClick = output<void>();

  onLikeClick() { this.likeClick.emit(); }
  onReplyToggle() { this.replyToggle.emit(); }
  onEditStart() { this.editStart.emit(); }
  onDeleteClick() { this.deleteClick.emit(); }
}
