import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { PostsService } from './posts.service';
import { Post, Reply } from '../shared/models/post.model';
import { AuthService } from './auth.service';
import { UrlUtilsService } from '../shared/services/url-utils.service';
import { HTTP_STATUS } from '../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private urlUtils = inject(UrlUtilsService);

  // Post Edit State
  editingPost = signal<string | null>(null);
  editPostContent = signal('');
  editMediaUrl = signal('');
  editMediaType = signal<'image' | 'youtube' | null>(null);
  editLinkUrl = signal<string | null>(null);

  // Reply Edit State
  editingReply = signal<string | null>(null);
  editReplyContent = signal('');

  // Nested Reply Edit State
  editingNestedReply = signal<string | null>(null);
  editNestedReplyContent = signal('');

  // Delete State
  showDeletePostModal = signal(false);
  deletingPostId = signal<string | null>(null);
  showDeleteReplyModal = signal(false);
  deletingReplyId = signal<string | null>(null);
  deletingReplyPostId = signal<string | null>(null);

  // Reply Form State
  replyingToPost = signal<string | null>(null);
  replyContent = signal('');
  replyingToComment = signal<string | null>(null);
  replyingToCommentContent = signal('');
  isSubmittingReply = signal(false);
  postReplies = signal<Reply[]>([]);
  loadingReplies = signal(false);
  savingReply = signal(false);

  // Like State
  postLikingId = signal<string | null>(null);
  postLikes = signal<Record<string, boolean>>({});

  startEditPost(post: Post): void {
    this.editingPost.set(post.id);
    this.editPostContent.set(post.content);
    this.editMediaUrl.set(post.mediaUrl || '');
    this.editMediaType.set(post.mediaType as 'image' | 'youtube' | null);
    this.editLinkUrl.set(post.linkUrl ?? null);
  }

  cancelEditPost(): void {
    this.editingPost.set(null);
    this.editPostContent.set('');
    this.editMediaUrl.set('');
    this.editMediaType.set(null);
    this.editLinkUrl.set(null);
  }

  saveEditPost(postId: string, postsSignal: WritableSignal<Post[]>): void {
    const content = this.editPostContent();
    if (!content.trim()) return;

    const mediaUrl = this.editMediaType() && this.editMediaUrl() ? this.editMediaUrl() : null;
    const mediaType = this.editMediaType() && this.editMediaUrl() ? this.editMediaType() : null;
    const linkUrl = this.urlUtils.normalizeUrl(this.editLinkUrl() || '');

    this.postsService.updatePost(postId, content, mediaUrl, mediaType, linkUrl).subscribe({
      next: (updated) => {
        postsSignal.update(posts =>
          posts.map(p => p.id === postId
            ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl }
            : p
          )
        );
        this.cancelEditPost();
      },
      error: () => {
        this.cancelEditPost();
      }
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
      error: () => {
        // Error handled by global interceptor
      }
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
      error: () => {
        // Error handled by global interceptor
      }
    });
  }

  deletePost(id: string): void {
    this.showDeletePostModal.set(true);
    this.deletingPostId.set(id);
  }

  confirmDeletePost(postsSignal: WritableSignal<Post[]>): void {
    const id = this.deletingPostId();
    if (!id) return;

    this.postsService.deletePost(id).subscribe({
      next: () => {
        postsSignal.update(posts => posts.filter(p => p.id !== id));
        this.closeDeletePostModal();
      },
      error: () => {
        this.closeDeletePostModal();
      }
    });
  }

  closeDeletePostModal(): void {
    this.showDeletePostModal.set(false);
    this.deletingPostId.set(null);
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

  toggleLike(post: Post): void {
    if (this.postLikingId() === post.id) return;

    const currentStatus = this.postLikes()[post.id];
    const newStatus = !currentStatus;

    this.postLikes.update(likes => ({ ...likes, [post.id]: newStatus }));
    post._count.likes += currentStatus ? -1 : 1;
    this.postLikingId.set(post.id);

    this.postsService.likePost(post.id).subscribe({
      next: () => {
        this.postLikingId.set(null);
      },
      error: () => {
        this.postLikes.update(likes => ({ ...likes, [post.id]: currentStatus }));
        post._count.likes += currentStatus ? 1 : -1;
        this.postLikingId.set(null);
      }
    });
  }

  setEditMediaType(type: 'image' | 'youtube'): void {
    if (this.editMediaType() === type) {
      this.editMediaType.set(null);
      this.editMediaUrl.set('');
    } else {
      this.editMediaType.set(type);
      this.editMediaUrl.set('');
    }
  }

  removeEditMedia(): void {
    this.editMediaUrl.set('');
  }

  clearEditMediaType(): void {
    this.editMediaType.set(null);
    this.editMediaUrl.set('');
  }

  clearEditLinkPreview(): void {
    this.editLinkUrl.set(null);
  }

  normalizeUrl(url: string): string | null {
    return this.urlUtils.normalizeUrl(url);
  }

  isValidImageUrl(url: string): boolean {
    return this.urlUtils.isValidImageUrl(url);
  }

  detectUrlInContent(content: string): string | null {
    return this.urlUtils.detectUrlInContent(content);
  }

  getDomain(url: string): string {
    return this.urlUtils.getDomain(url);
  }
}
