import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { Post, Reply } from '../../models/post.model';
import { getAvatarUrl } from '../../utils/avatar.utils';
import { ReplySectionComponent } from '../reply-section/reply-section.component';
import {
  PostCardHeaderComponent,
  PostCardMediaComponent,
  PostCardActionsComponent,
  PostCardEditFormComponent,
} from './components';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule, RouterLink, LucideIconsModule,
    PostCardHeaderComponent, PostCardMediaComponent,
    PostCardActionsComponent, PostCardEditFormComponent,
    ReplySectionComponent,
  ],
  template: `
    <article class="post" [class.deleting]="deleting" [class.highlight-post]="highlighted">
      <div class="post-avatar">
        @if (post.author.avatar) {
          <img [src]="getAvatarUrl(post.author.avatar)" alt="Avatar" class="avatar-image">
        } @else {
          <div class="avatar-placeholder" aria-hidden="true">
            {{ getAvatarInitial(post.author.name) }}
          </div>
        }
      </div>

      <div class="post-content">
        <app-post-card-header
          [post]="post"
          [authorLinkEnabled]="authorLinkEnabled"
          [isOwnPost]="isOwnPost"
          [menuOpen]="menuOpen()"
          (menuToggle)="toggleMenu()"
          (editClick)="startEdit()"
          (deleteClick)="onDeleteClick()"
        />

        <p class="post-text">{{ post.content }}</p>

        @if (!isEditing) {
          <app-post-card-media [post]="post" />
        }

        @if (isEditing) {
          <app-post-card-edit-form
            [post]="post"
            (save)="onEditSave($event)"
            (cancel)="cancelEdit()"
          />
        }

        <app-post-card-actions
          [post]="post"
          [isLiked]="isLiked"
          [isLiking]="isLiking"
          [showReplies]="showReplies"
          (likeClick)="onLikeClick()"
          (replyToggle)="onReplyToggle()"
        />

        <div class="reply-section-wrapper" [style.display]="showReplies ? 'block' : 'none'">
          <app-reply-section
            [replies]="replies"
            [loading]="showReplies && loadingReplies"
            [showForm]="true"
            [showReplyToReply]="true"
            [currentUserId]="currentUserId"
            [highlightReplyId]="highlightReplyId"
            [isSubmitting]="isSubmittingReply"
            [savingReply]="savingReply"
            [hasMore]="hasMoreReplies"
            [isLoadingMore]="isLoadingMoreReplies"
            (close)="onCloseReplies()"
            (openForm)="onOpenReplyForm()"
            (submitReplyEvent)="onSubmitReply($event)"
            (startEdit)="onStartEditReply($event)"
            (cancelEdit)="onCancelEditReply()"
            (saveEdit)="onSaveEditReply($event)"
            (deleteReplyEvent)="onDeleteReply($event)"
            (toggleReplyToCommentEvent)="onToggleReplyToComment($event)"
            (cancelReplyToCommentEvent)="onCancelReplyToComment()"
            (submitReplyToCommentEvent)="onSubmitReplyToComment($event)"
            (startEditNested)="onStartEditNestedReply($event)"
            (cancelEditNested)="onCancelEditNestedReply()"
            (saveEditNested)="onSaveEditNestedReply($event)"
            (deleteNestedReplyEvent)="onDeleteNestedReply($event)"
            (loadMore)="onLoadMoreReplies()"
          ></app-reply-section>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .post {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      transition: background var(--duration-150) var(--ease-out),
                  border-color var(--duration-150) var(--ease-out),
                  box-shadow var(--duration-150) var(--ease-out);
      
      &:hover {
        background: var(--surface-card-hover);
        border-color: var(--border-strong);
        box-shadow: var(--shadow-sm);
      }
      
      &.deleting {
        opacity: 0.5;
        pointer-events: none;
      }
      
      &.highlight-post {
        animation: highlight-fade 3s var(--ease-out);
        background: var(--primary-light);
        border-color: var(--primary);
      }
    }
    
    @keyframes highlight-fade {
      0% { background: var(--primary-light); }
      100% { background: transparent; }
    }
    
    .post-avatar {
      flex-shrink: 0;
      
      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-full);
        object-fit: cover;
      }
      
      .avatar-placeholder {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-full);
        background: var(--primary);
        color: var(--text-inverse);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-semibold);
        font-size: var(--font-lg);
      }
    }
    
    .post-content {
      flex: 1;
      min-width: 0;
    }

    .post-text {
      margin: var(--space-2) 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: var(--leading-relaxed);
      font-size: var(--font-base);
      color: var(--text-primary);
    }
    
    @media (prefers-reduced-motion: reduce) {
      .post.highlight-post {
        animation: none;
      }
      
      .post:hover {
        background: transparent;
      }
    }
  `]
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input() isLiked = false;
  @Input() isLiking = false;
  @Input() isOwnPost = false;
  @Input() authorLinkEnabled = true;
  @Input() highlighted = false;
  @Input() deleting = false;

  @Input() showReplies = false;
  @Input() replies: Reply[] = [];
  @Input() loadingReplies = false;
  @Input() currentUserId: string | null = null;
  @Input() highlightReplyId: string | null = null;
  @Input() isSubmittingReply = false;
  @Input() savingReply = false;
  @Input() hasMoreReplies = false;
  @Input() isLoadingMoreReplies = false;

  @Output() likeClick = new EventEmitter<Post>();
  @Output() replyToggle = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() loadMoreReplies = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<Post>();
  @Output() deleteClick = new EventEmitter<string>();
  @Output() editSave = new EventEmitter<{
    postId: string;
    content: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'youtube' | null;
    linkUrl: string | null;
  }>();
  @Output() editCancel = new EventEmitter<void>();

  @Output() openReplyForm = new EventEmitter<void>();
  @Output() submitReplyEvent = new EventEmitter<string>();
  @Output() startEditReply = new EventEmitter<Reply>();
  @Output() cancelEditReply = new EventEmitter<void>();
  @Output() saveEditReply = new EventEmitter<{ replyId: string; content: string }>();
  @Output() deleteReplyEvent = new EventEmitter<string>();
  @Output() toggleReplyToCommentEvent = new EventEmitter<string>();
  @Output() cancelReplyToCommentEvent = new EventEmitter<void>();
  @Output() submitReplyToCommentEvent = new EventEmitter<{ replyId: string; content: string }>();
  @Output() startEditNestedReply = new EventEmitter<Reply>();
  @Output() cancelEditNested = new EventEmitter<void>();
  @Output() saveEditNestedReply = new EventEmitter<{ replyId: string; content: string }>();
  @Output() deleteNestedReplyEvent = new EventEmitter<string>();

  isEditing = false;
  menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.post-content')) {
      this.closeMenu();
    }
  }

  getAvatarUrl = getAvatarUrl;

  getAvatarInitial(name: string): string {
    return ((name && name[0]) || '?').toUpperCase();
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  onLikeClick() { this.likeClick.emit(this.post); }

  onReplyToggle() {
    this.replyToggle.emit(this.post.id);
  }

  startEdit() {
    this.closeMenu();
    this.isEditing = true;
    this.editStart.emit(this.post);
  }

  cancelEdit() {
    this.isEditing = false;
    this.editCancel.emit();
  }

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.editSave.emit(data);
    this.isEditing = false;
  }

  onDeleteClick() {
    this.closeMenu();
    this.deleteClick.emit(this.post.id);
  }

  onCloseReplies() { this.close.emit(); }

  onOpenReplyForm() { this.openReplyForm.emit(); }

  onSubmitReply(content: string) { this.submitReplyEvent.emit(content); }

  onStartEditReply(reply: Reply) { this.startEditReply.emit(reply); }

  onCancelEditReply() { this.cancelEditReply.emit(); }

  onSaveEditReply(data: { replyId: string; content: string }) { this.saveEditReply.emit(data); }

  onDeleteReply(replyId: string) { this.deleteReplyEvent.emit(replyId); }

  onToggleReplyToComment(replyId: string) { this.toggleReplyToCommentEvent.emit(replyId); }

  onCancelReplyToComment() { this.cancelReplyToCommentEvent.emit(); }

  onSubmitReplyToComment(data: { replyId: string; content: string }) { this.submitReplyToCommentEvent.emit(data); }

  onStartEditNestedReply(reply: Reply) { this.startEditNestedReply.emit(reply); }

  onCancelEditNestedReply() { this.cancelEditNested.emit(); }

  onSaveEditNestedReply(data: { replyId: string; content: string }) { this.saveEditNestedReply.emit(data); }

  onDeleteNestedReply(replyId: string) { this.deleteNestedReplyEvent.emit(replyId); }

  onLoadMoreReplies() { this.loadMoreReplies.emit(this.post.id); }
}
