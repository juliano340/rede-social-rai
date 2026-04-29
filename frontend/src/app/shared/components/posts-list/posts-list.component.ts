import { Component, Input, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, Reply } from '../../models';
import { PostCardComponent } from '../post-card/post-card.component';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';
import { PostEditService } from '../../../services/post-edit.service';
import { PostsService } from '../../../services/posts.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent, DeleteConfirmModalComponent],
  template: `
    <div class="posts">
      @for (post of posts(); track post.id) {
        <app-post-card
          [post]="post"
          [isLiked]="post.isLiked ?? false"
          [isLiking]="postEdit.postLikingId() === post.id"
          [isOwnPost]="authService.currentUser()?.id === post.author.id"
          [authorLinkEnabled]="true"
          [highlighted]="highlightPostId === post.id"
          [deleting]="postEdit.deletingPostId() === post.id"
          [replies]="post.replies || []"
          [loadingReplies]="false"
          [currentUserId]="authService.currentUser()?.id || null"
          [currentUserAvatar]="authService.currentUser()?.avatar"
          [highlightReplyId]="highlightReplyId"
          [isSubmittingReply]="postEdit.isSubmittingReply()"
          [savingReply]="postEdit.savingReply()"
          (likeClick)="postEdit.toggleLike($event)"
          (replyToggle)="postEdit.toggleReply(post.id)"
          (deleteClick)="postEdit.deletePost(post.id)"
          (editStart)="postEdit.startEditPost($event)"
          (editSave)="onEditSave($event)"
          (editCancel)="postEdit.cancelEditPost()"
          (openReplyForm)="postEdit.openReplyForm(post.id)"
          (submitReplyEvent)="postEdit.submitReply(post.id, $event)"
          (startEditReply)="postEdit.startEditReply($event)"
          (cancelEditReply)="postEdit.cancelEditReply()"
          (saveEditReply)="postEdit.saveEditReply($event.replyId, post.id, $event.content)"
          (deleteReplyEvent)="postEdit.deleteReply($event, post.id)"
          (toggleReplyToCommentEvent)="postEdit.toggleReplyToComment($event)"
          (cancelReplyToCommentEvent)="postEdit.cancelReplyToComment()"
          (submitReplyToCommentEvent)="postEdit.submitReplyToComment($event.replyId, post.id, $event.content)"
          (startEditNestedReply)="postEdit.startEditNestedReply($event)"
          (cancelEditNested)="postEdit.cancelEditNestedReply()"
          (saveEditNestedReply)="postEdit.saveEditNestedReply($event.replyId, post.id, '', $event.content)"
          (deleteNestedReplyEvent)="postEdit.deleteNestedReply($event, post.id, '')"
        ></app-post-card>
      }
    </div>

    <app-delete-confirm-modal
      [show]="postEdit.showDeletePostModal()"
      title="Excluir Postagem"
      itemType="esta postagem"
      (close)="postEdit.closeDeletePostModal()"
      (confirm)="postEdit.confirmDeletePost()"
    ></app-delete-confirm-modal>

    <app-delete-confirm-modal
      [show]="postEdit.showDeleteReplyModal()"
      title="Excluir Resposta"
      itemType="esta resposta"
      (close)="postEdit.closeDeleteReplyModal()"
      (confirm)="postEdit.confirmDeleteReply()"
    ></app-delete-confirm-modal>
  `,
  styles: [`
    .posts {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class PostsListComponent {
  @Input({ required: true }) posts!: WritableSignal<Post[]>;
  @Input() highlightPostId: string | null = null;
  @Input() highlightReplyId: string | null = null;

  postEdit = inject(PostEditService);
  authService = inject(AuthService);
  private postsService = inject(PostsService);

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.postsService.updatePostInSignals(data.postId, {
          content: updated.content,
          mediaUrl: updated.mediaUrl,
          mediaType: updated.mediaType,
          linkUrl: updated.linkUrl,
        });
        this.postEdit.editingPost.set(null);
      },
      error: () => {
        this.postEdit.editingPost.set(null);
      }
    });
  }
}
