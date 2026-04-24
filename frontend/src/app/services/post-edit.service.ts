import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { UrlUtilsService } from '../shared/services/url-utils.service';
import { Post, Reply } from '../shared/models';
import { HTTP_STATUS } from '../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private urlUtils = inject(UrlUtilsService);

  readonly editingPost = signal<string | null>(null);
  readonly editPostContent = signal('');
  readonly editMediaUrl = signal('');
  readonly editMediaType = signal<'image' | 'youtube' | null>(null);
  readonly editLinkUrl = signal<string | null>(null);
  readonly showDeletePostModal = signal(false);
  readonly deletingPostId = signal<string | null>(null);

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

  readonly postLikingId = signal<string | null>(null);

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

  saveEditPost(postId: string): void {
    const content = this.editPostContent();
    if (!content.trim()) return;

    const mediaUrl = this.editMediaType() && this.editMediaUrl() ? this.editMediaUrl() : null;
    const mediaType = this.editMediaType() && this.editMediaUrl() ? this.editMediaType() : null;
    const linkUrl = this.urlUtils.normalizeUrl(this.editLinkUrl() || '');

    this.postsService.updatePost(postId, content, mediaUrl, mediaType, linkUrl).subscribe({
      next: (updated) => {
        this.postsService.updatePostInSignals(postId, {
          content: updated.content,
          mediaUrl: updated.mediaUrl,
          mediaType: updated.mediaType,
          linkUrl: updated.linkUrl,
        });
        this.cancelEditPost();
      },
      error: () => { this.cancelEditPost(); }
    });
  }

  deletePost(id: string): void {
    this.showDeletePostModal.set(true);
    this.deletingPostId.set(id);
  }

  confirmDeletePost(): void {
    const id = this.deletingPostId();
    if (!id) return;

    this.postsService.deletePost(id).subscribe({
      next: () => {
        this.postsService.removePostFromSignals(id);
        this.closeDeletePostModal();
      },
      error: () => { this.closeDeletePostModal(); }
    });
  }

  closeDeletePostModal(): void {
    this.showDeletePostModal.set(false);
    this.deletingPostId.set(null);
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

  removeEditMedia(): void { this.editMediaUrl.set(''); }
  clearEditMediaType(): void { this.editMediaType.set(null); this.editMediaUrl.set(''); }
  clearEditLinkPreview(): void { this.editLinkUrl.set(null); }
  normalizeUrl(url: string): string | null { return this.urlUtils.normalizeUrl(url); }
  isValidImageUrl(url: string): boolean { return this.urlUtils.isValidImageUrl(url); }
  detectUrlInContent(content: string): string | null { return this.urlUtils.detectUrlInContent(content); }
  getDomain(url: string): string { return this.urlUtils.getDomain(url); }

  startEditReply(reply: Reply): void {
    this.editingReply.set(reply.id);
    this.editReplyContent.set(reply.content);
  }

  cancelEditReply(): void {
    this.editingReply.set(null);
    this.editReplyContent.set('');
  }

  saveEditReply(replyId: string, postId: string): void {
    const content = this.editReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: (updated) => {
        this.postReplies.update(replies =>
          replies.map(r => r.id === replyId ? { ...updated, children: r.children } : r)
        );

        const post = this.postsService.feedPosts().find(p => p.id === postId)
          || this.postsService.profilePosts().find(p => p.id === postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: (post.replies || []).map(r =>
              r.id === replyId ? { ...updated, children: r.children } : r
            ),
          });
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

  saveEditNestedReply(replyId: string, postId: string, parentReplyId: string): void {
    const content = this.editNestedReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: () => {
        this.postReplies.update(replies =>
          replies.map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              return { ...r, children: r.children.map(c => c.id === replyId ? { ...c, content } : c) };
            }
            return r;
          })
        );

        const post = this.postsService.feedPosts().find(p => p.id === postId)
          || this.postsService.profilePosts().find(p => p.id === postId);
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
      error: () => {}
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
        this.postReplies.update(replies => {
          return replies.filter(r => {
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
        });

        const post = this.postsService.feedPosts().find(p => p.id === postId)
          || this.postsService.profilePosts().find(p => p.id === postId);
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
          const post = this.postsService.feedPosts().find(p => p.id === postId)
            || this.postsService.profilePosts().find(p => p.id === postId);
          if (post) {
            const updatedReplies = (post.replies || [])
              .filter(r => r.id !== replyId)
              .map(r => ({ ...r, children: (r.children || []).filter(c => c.id !== replyId) }));
            this.postsService.updatePostInSignals(postId, { replies: updatedReplies });
          }
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
    if (this.replyingToPost() === postId) { this.cancelReply(); }
    else { this.openReplyForm(postId); }
  }

  openReplyForm(postId: string): void {
    this.replyingToPost.set(postId);
    this.replyContent.set('');
  }

  cancelReply(): void {
    this.replyingToPost.set(null);
    this.replyContent.set('');
  }

  submitReply(postId: string, replyContent?: string): void {
    const content = replyContent ?? this.replyContent();
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content).subscribe({
      next: (newReply: Reply) => {
        this.postReplies.update(replies => [...replies, newReply]);

        const post = this.postsService.feedPosts().find(p => p.id === postId)
          || this.postsService.profilePosts().find(p => p.id === postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: [...(post.replies || []), newReply],
            _count: { ...post._count, replies: post._count.replies + 1 }
          });
        }
        this.replyContent.set('');
        this.isSubmittingReply.set(false);
      },
      error: () => { this.isSubmittingReply.set(false); }
    });
  }

  toggleReplyToComment(replyId: string): void {
    if (this.replyingToComment() === replyId) { this.cancelReplyToComment(); }
    else { this.replyingToComment.set(replyId); this.replyingToCommentContent.set(''); }
  }

  cancelReplyToComment(): void {
    this.replyingToComment.set(null);
    this.replyingToCommentContent.set('');
  }

  submitReplyToComment(replyId: string, postId: string, replyContent?: string): void {
    const content = replyContent ?? this.replyingToCommentContent();
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content, replyId).subscribe({
      next: (newChild: Reply) => {
        this.postReplies.update(replies =>
          replies.map(r => r.id === replyId ? { ...r, children: [...(r.children || []), newChild] } : r)
        );

        const post = this.postsService.feedPosts().find(p => p.id === postId)
          || this.postsService.profilePosts().find(p => p.id === postId);
        if (post) {
          this.postsService.updatePostInSignals(postId, {
            replies: (post.replies || []).map(r =>
              r.id === replyId ? { ...r, children: [...(r.children || []), newChild] } : r
            ),
            _count: { ...post._count, replies: post._count.replies + 1 }
          });
        }
        this.replyingToCommentContent.set('');
        this.replyingToComment.set(null);
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        this.isSubmittingReply.set(false);
        if (err.status === HTTP_STATUS.UNAUTHORIZED) { this.authService.logout(); }
      }
    });
  }

  toggleLike(post: Post): void {
    if (this.postLikingId() === post.id) return;

    const currentStatus = post.isLiked ?? false;
    const newStatus = !currentStatus;
    const likeDelta = currentStatus ? -1 : 1;

    this.postLikingId.set(post.id);
    this.postsService.updatePostInSignals(post.id, {
      isLiked: newStatus,
      _count: { ...post._count, likes: post._count.likes + likeDelta }
    });

    this.postsService.likePost(post.id).subscribe({
      next: (res) => {
        this.postLikingId.set(null);
        this.postsService.updatePostInSignals(post.id, {
          isLiked: res.liked,
          _count: { ...post._count, likes: post._count.likes + (res.liked ? 1 : 0) - (currentStatus ? 1 : 0) }
        });
      },
      error: () => {
        this.postLikingId.set(null);
        this.postsService.updatePostInSignals(post.id, { isLiked: currentStatus, _count: { ...post._count, likes: post._count.likes } });
      }
    });
  }

  setPostLikes(posts: Post[]): void {
    posts.forEach(p => this.postsService.updatePostInSignals(p.id, { isLiked: p.isLiked ?? false }));
  }
}
