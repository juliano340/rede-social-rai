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
    .post-actions { display: flex; gap: 16px; margin-top: 12px; }
    .action-btn { background: none; border: none; display: flex; align-items: center; gap: 4px; color: var(--text-secondary); font-size: 14px; padding: 6px 8px; border-radius: 20px; transition: background 0.2s, color 0.2s; cursor: pointer; }
    .action-btn:hover { background: rgba(224, 36, 94, 0.1); color: var(--error); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn.like.liked { color: #e0245e; }
    .action-btn.like.liked lucide-icon { fill: currentColor; }
    .action-btn.reply:hover { background: var(--primary-light); color: var(--primary); }
    .action-btn.edit:hover { background: var(--primary-light); color: var(--primary); }
    .action-btn.link { text-decoration: none; }
    .action-btn.link:hover { background: var(--primary-light); color: var(--primary); }
    .action-btn lucide-icon { color: currentColor; }
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
