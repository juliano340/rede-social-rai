import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from './posts.service';
import { CommentsState, CommentsStateService } from './comments-state.service';
import { ReplyMutationService } from './reply-mutation.service';
import { UrlUtilsService } from '../shared/services/url-utils.service';
import { Post, Reply } from '../shared/models';
export type { CommentsState } from './comments-state.service';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  private postsService = inject(PostsService);
  private commentsState = inject(CommentsStateService);
  private replyMutation = inject(ReplyMutationService);
  private urlUtils = inject(UrlUtilsService);

  readonly editingPost = signal<string | null>(null);
  readonly editPostContent = signal('');
  readonly editMediaUrl = signal('');
  readonly editMediaType = signal<'image' | 'youtube' | null>(null);
  readonly editLinkUrl = signal<string | null>(null);
  readonly showDeletePostModal = signal(false);
  readonly deletingPostId = signal<string | null>(null);

  readonly postLikingId = signal<string | null>(null);

  get editingReply() { return this.replyMutation.editingReply; }
  get editReplyContent() { return this.replyMutation.editReplyContent; }
  get editingNestedReply() { return this.replyMutation.editingNestedReply; }
  get editNestedReplyContent() { return this.replyMutation.editNestedReplyContent; }
  get showDeleteReplyModal() { return this.replyMutation.showDeleteReplyModal; }
  get deletingReplyId() { return this.replyMutation.deletingReplyId; }
  get deletingReplyPostId() { return this.replyMutation.deletingReplyPostId; }
  get replyingToComment() { return this.replyMutation.replyingToComment; }
  get replyingToCommentContent() { return this.replyMutation.replyingToCommentContent; }
  get isSubmittingReply() { return this.replyMutation.isSubmittingReply; }
  get savingReply() { return this.replyMutation.savingReply; }
  get replyLoading() { return this.commentsState.replyLoading; }
  get commentsByPostId() { return this.commentsState.commentsByPostId; }
  get openedPostId() { return this.commentsState.openedPostId; }
  get replyingToPost() { return this.commentsState.replyingToPost; }
  get loadingReplies() { return this.commentsState.loadingReplies; }

  toggleReply(postId: string): void { this.commentsState.toggleComments(postId); }
  openReplyForm(postId: string): void { this.commentsState.openComments(postId); }

  getComments(postId: string): CommentsState {
    return this.commentsState.getComments(postId);
  }

  getCommentsMap(): Map<string, CommentsState> {
    return this.commentsState.getCommentsMap();
  }

  isOpen(postId: string): boolean {
    return this.commentsState.isOpen(postId);
  }

  openComments(postId: string): void {
    this.commentsState.openComments(postId);
  }

  closeComments(): void {
    this.commentsState.closeComments();
    this.replyMutation.cancelReplyToComment();
  }

  toggleComments(postId: string): void {
    this.commentsState.toggleComments(postId);
  }

  loadMoreComments(postId: string): void {
    this.commentsState.loadMoreComments(postId);
  }

  submitReply(postId: string, content: string): void {
    this.replyMutation.submitReply(postId, content);
  }

  submitReplyToComment(parentReplyId: string, postId: string, content: string): void {
    this.replyMutation.submitReplyToComment(parentReplyId, postId, content);
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
    this.replyMutation.startEditReply(reply);
  }

  cancelEditReply(): void {
    this.replyMutation.cancelEditReply();
  }

  saveEditReply(replyId: string, postId: string, replyContent?: string): void {
    this.replyMutation.saveEditReply(replyId, postId, replyContent);
  }

  startEditNestedReply(reply: Reply): void {
    this.replyMutation.startEditNestedReply(reply);
  }

  cancelEditNestedReply(): void {
    this.replyMutation.cancelEditNestedReply();
  }

  saveEditNestedReply(replyId: string, postId: string, _parentReplyId: string, replyContent?: string): void {
    this.replyMutation.saveEditNestedReply(replyId, postId, _parentReplyId, replyContent);
  }

  deleteReply(replyId: string, postId: string): void {
    this.replyMutation.deleteReply(replyId, postId);
  }

  confirmDeleteReply(): void {
    this.replyMutation.confirmDeleteReply();
  }

  closeDeleteReplyModal(): void {
    this.replyMutation.closeDeleteReplyModal();
  }

  deleteNestedReply(replyId: string, postId: string, _parentReplyId: string): void {
    this.replyMutation.deleteNestedReply(replyId, postId, _parentReplyId);
  }

  toggleReplyToComment(replyId: string): void {
    this.replyMutation.toggleReplyToComment(replyId);
  }

  cancelReplyToComment(): void {
    this.replyMutation.cancelReplyToComment();
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
