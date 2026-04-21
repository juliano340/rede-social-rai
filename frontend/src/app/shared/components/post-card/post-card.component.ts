import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { Post, Reply } from '../../models/post.model';
import { getAvatarUrl } from '../../utils/avatar.utils';
import { formatDate } from '../../utils/date.utils';
import { getYouTubeEmbedUrl, isValidImageUrl, normalizeUrl } from '../../utils/media.utils';
import { ReplySectionComponent } from '../reply-section/reply-section.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideIconsModule, ReplySectionComponent],
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
        <div class="post-header">
          @if (authorLinkEnabled) {
            <a [routerLink]="['/profile', post.author.username]" class="author-name">
              {{ post.author.name }}
            </a>
          } @else {
            <span class="author-name">{{ post.author.name }}</span>
          }
          <span class="author-username">&#64;{{ post.author.username }}</span>
          <span class="post-time">{{ formatDate(post.createdAt) }}</span>
        </div>

        <p class="post-text">{{ post.content }}</p>

        @if (post.mediaUrl && post.mediaType === 'image') {
          <img [src]="post.mediaUrl" alt="Mídia do post" class="post-media" />
        }
        @if (post.mediaUrl && post.mediaType === 'youtube') {
          <iframe [src]="getYouTubeEmbed(post.mediaUrl)" frameborder="0" allowfullscreen class="post-media-video" loading="lazy"></iframe>
        }

        @if (isEditing) {
          <div class="edit-post-form">
            <textarea
              [(ngModel)]="editContent"
              maxlength="280"
              class="edit-post-textarea"
            ></textarea>
            <div class="media-type-selector">
              <button
                [class.active]="editMediaType() === 'image'"
                (click)="setEditMediaType('image')"
              >
                <lucide-icon name="image" [size]="14"></lucide-icon> Imagem
              </button>
              <button
                [class.active]="editMediaType() === 'youtube'"
                (click)="setEditMediaType('youtube')"
              >
                <lucide-icon name="youtube" [size]="14"></lucide-icon> YouTube
              </button>
              <button
                [class.active]="editLinkUrl() !== null"
                (click)="toggleEditLink()"
              >
                <lucide-icon name="link" [size]="14"></lucide-icon> Link
              </button>
            </div>
            @if (editMediaType()) {
              <div class="media-edit-row">
                <input
                  type="text"
                  [(ngModel)]="editMediaUrl"
                  [placeholder]="editMediaType() === 'image' ? 'URL da imagem' : 'URL do YouTube'"
                  class="media-url-input"
                />
                <button type="button" class="clear-link-btn" (click)="clearEditMedia()" title="Remover mídia">
                  <lucide-icon name="x" [size]="14"></lucide-icon>
                </button>
              </div>
            }
            @if (editLinkUrl() !== null) {
              <div class="media-edit-row">
                <input
                  type="text"
                  [ngModel]="editLinkUrl()"
                  (ngModelChange)="editLinkUrl.set($event)"
                  placeholder="URL do link"
                  class="media-url-input"
                />
                <button type="button" class="clear-link-btn" (click)="editLinkUrl.set(null)" title="Remover link">
                  <lucide-icon name="x" [size]="14"></lucide-icon>
                </button>
              </div>
            }
            <div class="edit-post-actions">
              <span class="char-count">{{ editContent.length }}/280</span>
              <button class="cancel-btn" (click)="cancelEdit()">Cancelar</button>
              <button
                class="save-btn"
                (click)="saveEdit()"
                [disabled]="!editContent.trim() || editContent.length > 280"
              >
                Salvar
              </button>
            </div>
          </div>
        }

        <div class="post-actions">
          <button
            class="action-btn like"
            (click)="onLikeClick()"
            [class.liked]="isLiked"
            [disabled]="isLiking"
          >
            <lucide-icon name="heart" [size]="18" [class.filled]="isLiked"></lucide-icon>
            <span>{{ post._count.likes }}</span>
          </button>
          <button
            class="action-btn reply"
            (click)="onReplyToggle()"
            [class.active]="showReplies"
          >
            <lucide-icon name="message-circle" [size]="18"></lucide-icon>
            <span>{{ post._count.replies }}</span>
          </button>
          @if (post.linkUrl) {
            <a [href]="post.linkUrl" target="_blank" rel="noopener noreferrer" class="action-btn link">
              <lucide-icon name="link" [size]="18"></lucide-icon>
            </a>
          }
          @if (isOwnPost) {
            <button
              class="action-btn edit"
              (click)="startEdit()"
              [disabled]="isEditing"
            >
              <lucide-icon name="pencil" [size]="18"></lucide-icon>
            </button>
            <button
              class="action-btn delete"
              (click)="onDeleteClick()"
              [disabled]="deleting"
            >
              <lucide-icon name="trash-2" [size]="18"></lucide-icon>
            </button>
          }
        </div>

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
          ></app-reply-section>
        }
      </div>
    </article>
  `,
  styles: [`
    .post {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--background-secondary);
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;

      &:hover {
        background: var(--background-tertiary);
      }

      &.deleting {
        opacity: 0.5;
      }
    }

    .highlight-post {
      animation: highlight-fade 3s ease-out;
    }

    @keyframes highlight-fade {
      0% { background: rgba(99, 102, 241, 0.2); }
      100% { background: transparent; }
    }

    .post-avatar {
      flex-shrink: 0;

      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #0d8ecf);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 20px;
    }

    .post-content {
      flex: 1;
      min-width: 0;
    }

    .post-header {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .author-name {
      font-weight: 700;
      color: var(--text-primary);

      &:hover {
        text-decoration: underline;
      }
    }

    .author-username, .post-time {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .post-text {
      margin: 8px 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
    }

    .post-media {
      max-width: 100%;
      max-height: 400px;
      border-radius: 12px;
      margin-top: 12px;
      object-fit: contain;
    }

    .post-media-video {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      margin-top: 12px;
      border: none;
    }

    .post-actions {
      display: flex;
      gap: 16px;
      margin-top: 12px;
    }

    .action-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      font-size: 14px;
      padding: 6px 8px;
      border-radius: 20px;
      transition: background 0.2s, color 0.2s;
      cursor: pointer;

      &:hover {
        background: rgba(224, 36, 94, 0.1);
        color: var(--error);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.like.liked {
        color: #e0245e;

        lucide-icon {
          fill: currentColor;
        }
      }

      &.reply:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      &.edit:hover {
        background: var(--primary-light);
        color: var(--primary);
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

    .edit-post-form {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-secondary);
      border-radius: var(--radius-md);

      textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 10px;
        font-size: 14px;
        resize: none;
        min-height: 60px;
        color: var(--text-primary);
        background: var(--background);
      }
    }

    .media-type-selector {
      display: flex;
      gap: 8px;
      margin: 8px 0;

      button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid var(--border);
        border-radius: 20px;
        background: var(--background);
        color: var(--text-secondary);
        font-size: 13px;
        cursor: pointer;

        &.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        &:hover:not(.active) {
          background: var(--background-secondary);
        }
      }
    }

    .media-edit-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;

      .media-url-input {
        flex: 1;
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 14px;
        color: var(--text-primary);
        background: var(--background);

        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }

      .clear-link-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: var(--background-secondary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--error);
          color: white;
        }
      }
    }

    .edit-post-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      margin-top: 8px;

      .char-count {
        margin-right: auto;
        font-size: 12px;
        color: var(--text-tertiary);
      }

      .cancel-btn {
        background: none;
        border: 1px solid var(--border);
        padding: 6px 12px;
        border-radius: var(--radius-full);
        font-size: 14px;
        cursor: pointer;
        color: var(--text-primary);

        &:hover {
          background: var(--background-secondary);
        }
      }

      .save-btn {
        background: var(--primary);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: var(--radius-full);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
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

  @Input() replies: Reply[] = [];
  @Input() loadingReplies = false;
  @Input() currentUserId: string | null = null;
  @Input() highlightReplyId: string | null = null;
  @Input() isSubmittingReply = false;
  @Input() savingReply = false;

  @Output() likeClick = new EventEmitter<Post>();
  @Output() replyToggle = new EventEmitter<string>();
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
  editContent = '';
  editMediaUrl = '';
  editMediaType = signal<'image' | 'youtube' | null>(null);
  editLinkUrl = signal<string | null>(null);
  showReplies = false;

  constructor(private sanitizer: DomSanitizer) {}

  getAvatarUrl = getAvatarUrl;
  formatDate = formatDate;

  getAvatarInitial(name: string): string {
    return ((name && name[0]) || '?').toUpperCase();
  }

  getYouTubeEmbed(url: string): SafeResourceUrl | null {
    return getYouTubeEmbedUrl(url, this.sanitizer);
  }

  onLikeClick() {
    this.likeClick.emit(this.post);
  }

  onReplyToggle() {
    this.showReplies = !this.showReplies;
    this.replyToggle.emit(this.post.id);
  }

  startEdit() {
    this.isEditing = true;
    this.editContent = this.post.content;
    this.editMediaUrl = this.post.mediaUrl || '';
    this.editMediaType.set(this.post.mediaType as 'image' | 'youtube' | null);
    this.editLinkUrl.set(this.post.linkUrl ? this.post.linkUrl : null);
    this.editStart.emit(this.post);
  }

  cancelEdit() {
    this.isEditing = false;
    this.editContent = '';
    this.editMediaUrl = '';
    this.editMediaType.set(null);
    this.editLinkUrl.set(null);
    this.editCancel.emit();
  }

  saveEdit() {
    if (!this.editContent.trim()) return;

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'youtube' | null = null;

    if (this.editMediaType() && this.editMediaUrl) {
      mediaUrl = this.editMediaUrl;
      mediaType = this.editMediaType();
    }

    let linkUrl: string | null = normalizeUrl(this.editLinkUrl() || '');

    this.editSave.emit({
      postId: this.post.id,
      content: this.editContent,
      mediaUrl,
      mediaType,
      linkUrl
    });

    this.isEditing = false;
  }

  setEditMediaType(type: 'image' | 'youtube') {
    if (this.editMediaType() === type) {
      this.editMediaType.set(null);
      this.editMediaUrl = '';
    } else {
      this.editMediaType.set(type);
      this.editMediaUrl = '';
    }
  }

  clearEditMedia() {
    this.editMediaType.set(null);
    this.editMediaUrl = '';
  }

  toggleEditLink() {
    if (this.editLinkUrl() !== null) {
      this.editLinkUrl.set(null);
    } else {
      this.editLinkUrl.set('');
    }
  }

  onDeleteClick() {
    this.deleteClick.emit(this.post.id);
  }

  onCloseReplies() {
    this.showReplies = false;
  }

  onOpenReplyForm() {
    this.openReplyForm.emit();
  }

  onSubmitReply(content: string) {
    this.submitReplyEvent.emit(content);
  }

  onStartEditReply(reply: Reply) {
    this.startEditReply.emit(reply);
  }

  onCancelEditReply() {
    this.cancelEditReply.emit();
  }

  onSaveEditReply(data: { replyId: string; content: string }) {
    this.saveEditReply.emit(data);
  }

  onDeleteReply(replyId: string) {
    this.deleteReplyEvent.emit(replyId);
  }

  onToggleReplyToComment(replyId: string) {
    this.toggleReplyToCommentEvent.emit(replyId);
  }

  onCancelReplyToComment() {
    this.cancelReplyToCommentEvent.emit();
  }

  onSubmitReplyToComment(data: { replyId: string; content: string }) {
    this.submitReplyToCommentEvent.emit(data);
  }

  onStartEditNestedReply(reply: Reply) {
    this.startEditNestedReply.emit(reply);
  }

  onCancelEditNestedReply() {
    this.cancelEditNested.emit();
  }

  onSaveEditNestedReply(data: { replyId: string; content: string }) {
    this.saveEditNestedReply.emit(data);
  }

  onDeleteNestedReply(replyId: string) {
    this.deleteNestedReplyEvent.emit(replyId);
  }
}
