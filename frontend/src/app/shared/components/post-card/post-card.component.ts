import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
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
          [isOwnPost]="isOwnPost"
          [deleting]="deleting"
          [showReplies]="showReplies"
          [isEditing]="isEditing"
          (likeClick)="onLikeClick()"
          (replyToggle)="onReplyToggle()"
          (editStart)="startEdit()"
          (deleteClick)="onDeleteClick()"
        />

        @if (showReplies) {
          <app-reply-section
            [replies]="replies"
            [loading]="loadingReplies"
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
        }
      </div>
    </article>
  `,
  styles: [`
    .post { display: flex; gap: 12px; padding: 16px; background: var(--background-secondary); border-bottom: 1px solid var(--border); transition: background 0.15s; }
    .post:hover { background: var(--background-tertiary); }
    .post.deleting { opacity: 0.5; }
    .highlight-post { animation: highlight-fade 3s ease-out; }
    @keyframes highlight-fade { 0% { background: rgba(99, 102, 241, 0.2); } 100% { background: transparent; } }
    .post-avatar { flex-shrink: 0; }
    .avatar-image { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #0d8ecf); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 20px; }
    .post-content { flex: 1; min-width: 0; }
    .post-text { margin: 8px 0; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
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
  showReplies = false;

  getAvatarUrl = getAvatarUrl;

  getAvatarInitial(name: string): string {
    return ((name && name[0]) || '?').toUpperCase();
  }

  onLikeClick() { this.likeClick.emit(this.post); }

  onReplyToggle() {
    this.showReplies = !this.showReplies;
    this.replyToggle.emit(this.post.id);
  }

  startEdit() {
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

  onDeleteClick() { this.deleteClick.emit(this.post.id); }

  onCloseReplies() { this.showReplies = false; }

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
