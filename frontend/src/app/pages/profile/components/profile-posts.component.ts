import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconsModule } from '../../../shared/icons/lucide-icons.module';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { Post, Reply, SubmitReplyEvent, ReplyActionEvent, NestedReplyEvent } from '../../../shared/models/post.model';

@Component({
  selector: 'app-profile-posts',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsModule, PostCardComponent],
  template: `
    <div class="profile-posts">
      <h2>Publicações</h2>
      @if (loading()) {
        <div class="loading-state small">
          <div class="spinner"></div>
        </div>
      } @else if (posts().length === 0) {
        <div class="empty-state">
          <lucide-icon name="file-text" [size]="48" class="empty-icon"></lucide-icon>
          <p>Nenhuma publicação ainda.</p>
        </div>
      } @else {
        @for (post of posts(); track post.id) {
          <app-post-card
            [post]="post"
            [isLiked]="post.isLiked ?? false"
            [isLiking]="postLikingId() === post.id"
            [isOwnPost]="currentUserId() === post.author.id"
            [authorLinkEnabled]="true"
            [highlighted]="false"
            [deleting]="deletingPostId() === post.id"
            [showReplies]="showReplies() === post.id"
            [replies]="replies()?.get(post.id)?.replies ?? post.replies ?? []"
            [loadingReplies]="replies()?.get(post.id)?.status === 'loading' || false"
            [currentUserId]="currentUserId()"
            [highlightReplyId]="null"
            [isSubmittingReply]="isSubmittingReply()"
            [savingReply]="savingReply()"
            [hasMoreReplies]="replies()?.get(post.id)?.hasMore ?? false"
            [isLoadingMoreReplies]="replies()?.get(post.id)?.loadingMore ?? false"
            (likeClick)="likeClick.emit($event)"
            (replyToggle)="replyToggle.emit($event)"
            (deleteClick)="deleteClick.emit($event)"
            (editStart)="editStart.emit($event)"
            (editSave)="editSave.emit($event)"
            (editCancel)="editCancel.emit()"
            (openReplyForm)="openReplyForm.emit(post.id)"
            (submitReplyEvent)="submitReply.emit({ postId: post.id, content: $event })"
            (startEditReply)="startEditReply.emit($event)"
            (cancelEditReply)="cancelEditReply.emit()"
            (saveEditReply)="saveEditReply.emit({ replyId: $event.replyId, postId: post.id })"
            (deleteReplyEvent)="deleteReply.emit({ replyId: $event, postId: post.id })"
            (toggleReplyToCommentEvent)="toggleReplyToComment.emit($event)"
            (cancelReplyToCommentEvent)="cancelReplyToComment.emit()"
            (submitReplyToCommentEvent)="submitReplyToComment.emit({ replyId: $event.replyId, postId: post.id, content: $event.content })"
            (startEditNestedReply)="startEditNestedReply.emit($event)"
            (cancelEditNested)="cancelEditNested.emit()"
            (saveEditNestedReply)="saveEditNestedReply.emit({ replyId: $event.replyId, postId: post.id })"
            (deleteNestedReplyEvent)="deleteNestedReply.emit({ replyId: $event, postId: post.id })"
            (loadMoreReplies)="loadMoreReplies.emit($event)"
          ></app-post-card>
        }
      }
    </div>
  `,
  styles: [`
    .profile-posts { margin-top: 24px; }
    h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; }
    .loading-state { text-align: center; padding: 40px 20px; }
    .loading-state.small { padding: 20px; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { width: 48px; height: 48px; margin-bottom: 16px; color: var(--text-tertiary); }
    .empty-state p { font-size: 18px; font-weight: 600; color: var(--text-primary); }
  `]
})
export class ProfilePostsComponent {
  posts = input.required<Post[]>();
  loading = input.required<boolean>();
  currentUserId = input.required<string | null>();
  postLikingId = input.required<string | null>();
  deletingPostId = input.required<string | null>();
  showReplies = input<string | null>(null);
  replies = input<Map<string, any>>();
  isSubmittingReply = input.required<boolean>();
  savingReply = input.required<boolean>();

  likeClick = output<Post>();
  replyToggle = output<string>();
  deleteClick = output<string>();
  editStart = output<Post>();
  editSave = output<{ postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }>();
  editCancel = output<void>();
  openReplyForm = output<string>();
  submitReply = output<SubmitReplyEvent>();
  startEditReply = output<Reply>();
  cancelEditReply = output<void>();
  saveEditReply = output<ReplyActionEvent>();
  deleteReply = output<ReplyActionEvent>();
  toggleReplyToComment = output<string>();
  cancelReplyToComment = output<void>();
  submitReplyToComment = output<NestedReplyEvent>();
  startEditNestedReply = output<Reply>();
  cancelEditNested = output<void>();
  saveEditNestedReply = output<ReplyActionEvent>();
  deleteNestedReply = output<ReplyActionEvent>();
  loadMoreReplies = output<string>();
}