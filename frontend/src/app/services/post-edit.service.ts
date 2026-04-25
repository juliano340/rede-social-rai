import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { UrlUtilsService } from '../shared/services/url-utils.service';
import { Post, Reply } from '../shared/models';
import { HTTP_STATUS } from '../shared/constants/app.constants';

export interface CommentsState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  replies: Reply[];
  cursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
}

const IDLE_COMMENTS: CommentsState = {
  status: 'idle',
  replies: [],
  cursor: null,
  hasMore: false,
  loadingMore: false,
};

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

  readonly replyingToComment = signal<string | null>(null);
  readonly replyingToCommentContent = signal('');
  readonly isSubmittingReply = signal(false);
  readonly savingReply = signal(false);
  readonly replyLoading = signal(false);

  readonly postLikingId = signal<string | null>(null);

  private _commentsByPostId = signal<Record<string, CommentsState>>({});
  readonly commentsByPostId = this._commentsByPostId.asReadonly();

  private _openedPostId = signal<string | null>(null);
  readonly openedPostId = this._openedPostId.asReadonly();

  get replyingToPost() { return this._openedPostId; }
  get loadingReplies() { return this.replyLoading; }

  toggleReply(postId: string): void { this.toggleComments(postId); }
  openReplyForm(postId: string): void { this.openComments(postId); }

  getComments(postId: string): CommentsState {
    return this._commentsByPostId()[postId] || IDLE_COMMENTS;
  }

  getCommentsMap(): Map<string, CommentsState> {
    return new Map(Object.entries(this._commentsByPostId()));
  }

  isOpen(postId: string): boolean {
    return this._openedPostId() === postId;
  }

  openComments(postId: string): void {
    if (this._openedPostId() === postId) return;
    this._openedPostId.set(postId);
    this.loadCommentsIfNeeded(postId);
  }

  closeComments(): void {
    this._openedPostId.set(null);
    this.replyingToComment.set(null);
    this.replyingToCommentContent.set('');
  }

  toggleComments(postId: string): void {
    if (this._openedPostId() === postId) {
      this.closeComments();
    } else {
      this.openComments(postId);
    }
  }

  private loadCommentsIfNeeded(postId: string): void {
    const current = this.getComments(postId);
    if (current.status === 'loaded' || current.status === 'loading') return;

    this._commentsByPostId.update(map => ({
      ...map,
      [postId]: { ...IDLE_COMMENTS, status: 'loading' },
    }));
    this.replyLoading.set(true);

    this.postsService.getReplies(postId).subscribe({
      next: (data) => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: {
            status: 'loaded',
            replies: data.replies || [],
            cursor: data.nextCursor || null,
            hasMore: !!data.nextCursor,
            loadingMore: false,
          },
        }));
        this.replyLoading.set(false);
      },
      error: () => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: { ...IDLE_COMMENTS, status: 'error' },
        }));
        this.replyLoading.set(false);
      },
    });
  }

  loadMoreComments(postId: string): void {
    const state = this.getComments(postId);
    if (!state.cursor || state.loadingMore || state.status !== 'loaded') return;

    this._commentsByPostId.update(map => ({
      ...map,
      [postId]: { ...map[postId], loadingMore: true },
    }));

    this.postsService.getReplies(postId, state.cursor).subscribe({
      next: (data) => {
        this._commentsByPostId.update(map => {
          const prev = map[postId];
          return {
            ...map,
            [postId]: {
              ...prev,
              replies: [...prev.replies, ...(data.replies || [])],
              cursor: data.nextCursor || null,
              hasMore: !!data.nextCursor,
              loadingMore: false,
            },
          };
        });
      },
      error: () => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: { ...map[postId], loadingMore: false },
        }));
      },
    });
  }

  private updateComments(postId: string, updater: (replies: Reply[]) => Reply[]): void {
    this._commentsByPostId.update(map => {
      const prev = map[postId];
      if (!prev) return map;
      return { ...map, [postId]: { ...prev, replies: updater(prev.replies) } };
    });
  }

  submitReply(postId: string, content: string): void {
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content).subscribe({
      next: (newReply: Reply) => {
        this.updateComments(postId, replies => [...replies, newReply]);
        const post = this.findPost(postId);
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
        this.updateComments(postId, replies =>
          replies.map(r => r.id === parentReplyId ? {
            ...r,
            children: [...(r.children || []), newChild],
            _count: { children: (r._count?.children ?? r.children?.length ?? 0) + 1 },
          } : r)
        );
        const post = this.findPost(postId);
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

  private findPost(postId: string): Post | undefined {
    return this.postsService.feedPosts().find(p => p.id === postId)
      || this.postsService.profilePosts().find(p => p.id === postId);
  }

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
      error: () => { this.cancelEditPost(); },
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
      error: () => { this.closeDeletePostModal(); },
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
        this.updateComments(postId, replies =>
          replies.map(r => r.id === replyId ? { ...updated, children: r.children, _count: r._count } : r)
        );
        const post = this.findPost(postId);
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

  saveEditNestedReply(replyId: string, postId: string, _parentReplyId: string): void {
    const content = this.editNestedReplyContent();
    if (!content.trim()) return;

    this.postsService.updateReply(postId, replyId, content).subscribe({
      next: () => {
        this.updateComments(postId, replies =>
          replies.map(r => {
            if (r.children?.some(c => c.id === replyId)) {
              return { ...r, children: r.children.map(c => c.id === replyId ? { ...c, content } : c) };
            }
            return r;
          })
        );
        const post = this.findPost(postId);
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
        this.updateComments(postId, replies =>
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
        const post = this.findPost(postId);
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
          const post = this.findPost(postId!);
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

  toggleLike(post: Post): void {
    if (this.postLikingId() === post.id) return;

    const currentStatus = post.isLiked ?? false;
    const newStatus = !currentStatus;
    const likeDelta = currentStatus ? -1 : 1;

    this.postLikingId.set(post.id);
    this.postsService.updatePostInSignals(post.id, {
      isLiked: newStatus,
      _count: { ...post._count, likes: post._count.likes + likeDelta },
    });

    this.postsService.likePost(post.id).subscribe({
      next: (res) => {
        this.postLikingId.set(null);
        this.postsService.updatePostInSignals(post.id, {
          isLiked: res.liked,
          _count: { ...post._count, likes: post._count.likes + (res.liked ? 1 : 0) - (currentStatus ? 1 : 0) },
        });
      },
      error: () => {
        this.postLikingId.set(null);
        this.postsService.updatePostInSignals(post.id, {
          isLiked: currentStatus,
          _count: { ...post._count, likes: post._count.likes },
        });
      },
    });
  }

  setPostLikes(posts: Post[]): void {
    posts.forEach(p => this.postsService.updatePostInSignals(p.id, { isLiked: p.isLiked ?? false }));
  }
}
