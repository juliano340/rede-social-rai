import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { CommentsStateService } from './comments-state.service';
import { Reply } from '../shared/models';
import { HTTP_STATUS } from '../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class ReplyMutationService {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private commentsState = inject(CommentsStateService);

  readonly editingReply = signal<string | null>(null);
  readonly editReplyContent = signal('');
  readonly editingNestedReply = signal<string | null>(null);
  readonly editNestedReplyContent = signal('');
  readonly showDeleteReplyModal = signal(false);
  readonly deletingReplyId = signal<string | null>(null);
  readonly deletingReplyPostId = signal<string | null>(null);
  readonly replyingToComment = signal<string | null>(null);
  readonly replyingToCommentContent = signal('');
  readonly isSubmittingReply = signal(false);
  readonly savingReply = signal(false);

  submitReply(postId: string, content: string): void {
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content).subscribe({
      next: (newReply: Reply) => {
        this.commentsState.updateComments(postId, replies => [...replies, newReply]);
        const post = this.commentsState.findPost(postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: [...(post.replies || []), newReply],
            _count: { ...post._count, replies: post._count.replies + 1 },
          });
        }
        this.isSubmittingReply.set(false);
      },
      error: () => { this.isSubmittingReply.set(false); },
    });
  }

  submitReplyToComment(parentReplyId: string, postId: string, content: string): void {
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content, parentReplyId).subscribe({
      next: (newChild: Reply) => {
        this.commentsState.updateComments(postId, replies =>
          replies.map(r => r.id === parentReplyId ? {
            ...r,
            children: [...(r.children || []), newChild],
            _count: { children: (r._count?.children ?? r.children?.length ?? 0) + 1 },
          } : r)
        );
        const post = this.commentsState.findPost(postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: (post.replies || []).map(r =>
              r.id === parentReplyId ? { ...r, children: [...(r.children || []), newChild] } : r
            ),
            _count: { ...post._count, replies: post._count.replies + 1 },
          });
        }
        this.replyingToComment.set(null);
        this.replyingToCommentContent.set('');
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        this.isSubmittingReply.set(false);
        if (err.status === HTTP_STATUS.UNAUTHORIZED) { this.authService.logout(); }
      },
    });
  }

  startEditReply(reply: Reply): void {
    this.editingReply.set(reply.id);
    this.editReplyContent.set(reply.content);
  }

  cancelEditReply(): void {
    this.editingReply.set(null);
    this.editReplyContent.set('');
  }

  saveEditReply(replyId: string, postId: string, replyContent?: string): void {
    const content = replyContent ?? this.editReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: (updated) => {
        this.commentsState.updateComments(postId, replies =>
          replies.map(r => r.id === replyId ? { ...updated, children: r.children, _count: r._count } : r)
        );
        const post = this.commentsState.findPost(postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: (post.replies || []).map(r =>
              r.id === replyId ? { ...updated, children: r.children } : r
            ),
          });
        }
      },
      error: () => {},
    });
    this.cancelEditReply();
  }

  startEditNestedReply(reply: Reply): void {
    this.editingNestedReply.set(reply.id);
    this.editNestedReplyContent.set(reply.content);
  }

  cancelEditNestedReply(): void {
    this.editingNestedReply.set(null);
    this.editNestedReplyContent.set('');
  }

  saveEditNestedReply(replyId: string, postId: string, _parentReplyId: string, replyContent?: string): void {
    const content = replyContent ?? this.editNestedReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: () => {
        this.commentsState.updateComments(postId, replies =>
          replies.map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              return { ...r, children: r.children.map(c => c.id === replyId ? { ...c, content } : c) };
            }
            return r;
          })
        );
        const post = this.commentsState.findPost(postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: (post.replies || []).map(r => {
              if (r.children?.some(c => c.id === replyId)) {
                return { ...r, children: r.children.map(c => c.id === replyId ? { ...c, content } : c) };
              }
              return r;
            }),
          });
        }
        this.cancelEditNestedReply();
      },
      error: () => {},
    });
  }

  deleteReply(replyId: string, postId: string): void {
    this.showDeleteReplyModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  confirmDeleteReply(): void {
    const replyId = this.deletingReplyId();
    const postId = this.deletingReplyPostId();
    if (!replyId || !postId) return;

    this.postsService.deleteReply(postId, replyId).subscribe({
      next: () => {
        let deletedCount = 0;
        this.commentsState.updateComments(postId, replies =>
          replies.filter(r => {
            if (r.id === replyId) {
              deletedCount += 1 + (r.children?.length ?? 0);
              return false;
            }
            return true;
          }).map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              const child = r.children.find(c => c.id === replyId);
              deletedCount += 1 + (child?.children?.length ?? 0);
              const children = r.children.filter(c => c.id !== replyId);
              return {
                ...r,
                children,
                _count: r._count ? { ...r._count, children: Math.max(0, r._count.children - 1) } : r._count,
              };
            }
            return r;
          })
        );
        const post = this.commentsState.findPost(postId);
        if (post) {
          const updatedReplies = (post.replies || [])
            .filter(r => r.id !== replyId)
            .map(r => ({ ...r, children: (r.children || []).filter(c => c.id !== replyId) }));
          this.postsService.updatePostInSignals(postId, {
            replies: updatedReplies,
            _count: { ...post._count, replies: Math.max(0, post._count.replies - (deletedCount || 1)) },
          });
        }
        this.closeDeleteReplyModal();
      },
      error: (err) => {
        this.closeDeleteReplyModal();
        if (err.status === HTTP_STATUS.NOT_FOUND) {
          const post = this.commentsState.findPost(postId!);
          if (post) {
            const updatedReplies = (post.replies || [])
              .filter(r => r.id !== replyId)
              .map(r => ({ ...r, children: (r.children || []).filter(c => c.id !== replyId) }));
            this.postsService.updatePostInSignals(postId!, { replies: updatedReplies });
          }
        }
      },
    });
  }

  closeDeleteReplyModal(): void {
    this.showDeleteReplyModal.set(false);
    this.deletingReplyId.set(null);
    this.deletingReplyPostId.set(null);
  }

  deleteNestedReply(replyId: string, postId: string, _parentReplyId: string): void {
    this.deleteReply(replyId, postId);
  }

  toggleReplyToComment(replyId: string): void {
    if (this.replyingToComment() === replyId) {
      this.replyingToComment.set(null);
      this.replyingToCommentContent.set('');
    } else {
      this.replyingToComment.set(replyId);
      this.replyingToCommentContent.set('');
    }
  }

  cancelReplyToComment(): void {
    this.replyingToComment.set(null);
    this.replyingToCommentContent.set('');
  }
}
