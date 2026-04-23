import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { AuthService } from '../../../services/auth.service';
import { Post, Reply } from '../../models/post.model';
import { HTTP_STATUS } from '../../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class ReplyManagementService {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);

  readonly editingReply = signal<string | null>(null);
  readonly editReplyContent = signal('');

  readonly editingNestedReply = signal<string | null>(null);
  readonly editNestedReplyContent = signal('');

  readonly showDeleteReplyModal = signal(false);
  readonly deletingReplyId = signal<string | null>(null);
  readonly deletingReplyPostId = signal<string | null>(null);

  readonly replyingToPost = signal<string | null>(null);
  readonly replyContent = signal('');
  readonly replyingToComment = signal<string | null>(null);
  readonly replyingToCommentContent = signal('');
  readonly isSubmittingReply = signal(false);

  readonly postReplies = signal<Reply[]>([]);
  readonly savingReply = signal(false);
  readonly loadingReplies = signal(false);
  readonly replyCursor = signal<string | null>(null);
  readonly replyHasMore = signal(false);
  readonly isLoadingMoreReplies = signal(false);

  startEditReply(reply: Reply): void {
    this.editingReply.set(reply.id);
    this.editReplyContent.set(reply.content);
  }

  cancelEditReply(): void {
    this.editingReply.set(null);
    this.editReplyContent.set('');
  }

  saveEditReply(replyId: string, postId: string, postRepliesSignal: WritableSignal<Reply[]>, postsSignal?: WritableSignal<Post[]>): void {
    const content = this.editReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: (updated) => {
        postRepliesSignal.update(replies =>
          replies.map(r => r.id === replyId ? { ...updated, children: r.children } : r)
        );

        if (postsSignal) {
          postsSignal.update(posts => posts.map(p => {
            if (p.id !== postId) return p;
            return {
              ...p,
              replies: (p.replies || []).map(r =>
                r.id === replyId ? { ...updated, children: r.children } : r
              ),
            };
          }));
        }
      },
      error: () => {}
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

  saveEditNestedReply(replyId: string, postId: string, parentReplyId: string, postRepliesSignal: WritableSignal<Reply[]>, postsSignal?: WritableSignal<Post[]>): void {
    const content = this.editNestedReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: () => {
        postRepliesSignal.update(replies =>
          replies.map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              return {
                ...r,
                children: r.children.map(c =>
                  c.id === replyId ? { ...c, content } : c
                ),
              };
            }
            return r;
          })
        );

        if (postsSignal) {
          postsSignal.update(posts => posts.map(p => {
            if (p.id !== postId) return p;
            return {
              ...p,
              replies: (p.replies || []).map(r => {
                if (r.children?.some(c => c.id === replyId)) {
                  return {
                    ...r,
                    children: r.children.map(c =>
                      c.id === replyId ? { ...c, content } : c
                    ),
                  };
                }
                return r;
              }),
            };
          }));
        }

        this.cancelEditNestedReply();
      },
      error: () => {}
    });
  }

  deleteReply(replyId: string, postId: string): void {
    this.showDeleteReplyModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  confirmDeleteReply(postRepliesSignal: WritableSignal<Reply[]>, postsSignal?: WritableSignal<Post[]>): void {
    const replyId = this.deletingReplyId();
    const postId = this.deletingReplyPostId();

    if (!replyId || !postId) return;

    this.postsService.deleteReply(postId, replyId).subscribe({
      next: () => {
        let deletedCount = 0;

        postRepliesSignal.update(replies => {
          const filtered = replies.filter(r => {
            if (r.id === replyId) {
              deletedCount += 1 + (r.children?.length ?? 0);
              return false;
            }
            return true;
          }).map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              const child = r.children.find(c => c.id === replyId);
              deletedCount += 1 + (child?.children?.length ?? 0);
              return { ...r, children: r.children.filter(c => c.id !== replyId) };
            }
            return r;
          });
          return filtered;
        });

        if (postsSignal) {
          postsSignal.update(posts => posts.map(p => {
            if (p.id !== postId) return p;
            const updatedReplies = (p.replies || [])
              .filter(r => r.id !== replyId)
              .map(r => ({
                ...r,
                children: (r.children || []).filter(c => c.id !== replyId),
              }));
            return {
              ...p,
              replies: updatedReplies,
              _count: {
                ...p._count,
                replies: Math.max(0, p._count.replies - (deletedCount || 1)),
              },
            };
          }));
        }

        this.closeDeleteReplyModal();
      },
      error: (err) => {
        this.closeDeleteReplyModal();
        if (err.status === HTTP_STATUS.NOT_FOUND && postsSignal) {
          postsSignal.update(posts => posts.map(p => {
            if (p.id !== postId) return p;
            return {
              ...p,
              replies: (p.replies || [])
                .filter(r => r.id !== replyId)
                .map(r => ({
                  ...r,
                  children: (r.children || []).filter(c => c.id !== replyId),
                })),
            };
          }));
        }
      }
    });
  }

  closeDeleteReplyModal(): void {
    this.showDeleteReplyModal.set(false);
    this.deletingReplyId.set(null);
    this.deletingReplyPostId.set(null);
  }

  deleteNestedReply(replyId: string, postId: string, parentReplyId: string): void {
    this.showDeleteReplyModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  toggleReply(postId: string): void {
    if (this.replyingToPost() === postId) {
      this.cancelReply();
    } else {
      this.openReplyForm(postId);
    }
  }

  openReplyForm(postId: string): void {
    this.replyingToPost.set(postId);
    this.replyContent.set('');
  }

  cancelReply(): void {
    this.replyingToPost.set(null);
    this.replyContent.set('');
  }

  submitReply(postId: string, postsSignal: WritableSignal<Post[]>, postRepliesSignal: WritableSignal<Reply[]>, replyContent?: string): void {
    const content = replyContent ?? this.replyContent();
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content).subscribe({
      next: (newReply: Reply) => {
        postRepliesSignal.update(replies => [...replies, newReply]);

        postsSignal.update(posts =>
          posts.map(p => p.id === postId
            ? {
                ...p,
                replies: [...(p.replies || []), newReply],
                _count: { ...p._count, replies: p._count.replies + 1 }
              }
            : p
          )
        );

        this.replyContent.set('');
        this.isSubmittingReply.set(false);
      },
      error: () => {
        this.isSubmittingReply.set(false);
      }
    });
  }

  toggleReplyToComment(replyId: string): void {
    if (this.replyingToComment() === replyId) {
      this.cancelReplyToComment();
    } else {
      this.replyingToComment.set(replyId);
      this.replyingToCommentContent.set('');
    }
  }

  cancelReplyToComment(): void {
    this.replyingToComment.set(null);
    this.replyingToCommentContent.set('');
  }

  submitReplyToComment(replyId: string, postId: string, postRepliesSignal: WritableSignal<Reply[]>, replyContent?: string, postsSignal?: WritableSignal<Post[]>): void {
    const content = replyContent ?? this.replyingToCommentContent();
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content, replyId).subscribe({
      next: (newChild: Reply) => {
        postRepliesSignal.update(replies =>
          replies.map(r => {
            if (r.id === replyId) {
              return { ...r, children: [...(r.children || []), newChild] };
            }
            return r;
          })
        );

        if (postsSignal) {
          postsSignal.update(posts =>
            posts.map(p => {
              if (p.id !== postId) return p;
              return {
                ...p,
                replies: (p.replies || []).map(r =>
                  r.id === replyId
                    ? { ...r, children: [...(r.children || []), newChild] }
                    : r
                ),
                _count: { ...p._count, replies: p._count.replies + 1 }
              };
            })
          );
        }

        this.replyingToCommentContent.set('');
        this.replyingToComment.set(null);
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        this.isSubmittingReply.set(false);
        if (err.status === HTTP_STATUS.UNAUTHORIZED) {
          this.authService.logout();
        }
      }
    });
  }
}