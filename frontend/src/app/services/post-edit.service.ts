import { Injectable, inject } from '@angular/core';
import { PostManagementService } from '../shared/services/post/post-management.service';
import { ReplyManagementService } from '../shared/services/reply/reply-management.service';
import { PostInteractionService } from '../shared/services/post/post-interaction.service';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  private postManagement = inject(PostManagementService);
  private replyManagement = inject(ReplyManagementService);
  private postInteraction = inject(PostInteractionService);

  get editingPost() { return this.postManagement.editingPost; }
  get editPostContent() { return this.postManagement.editPostContent; }
  get editMediaUrl() { return this.postManagement.editMediaUrl; }
  get editMediaType() { return this.postManagement.editMediaType; }
  get editLinkUrl() { return this.postManagement.editLinkUrl; }
  get showDeletePostModal() { return this.postManagement.showDeletePostModal; }
  get deletingPostId() { return this.postManagement.deletingPostId; }

  get editingReply() { return this.replyManagement.editingReply; }
  get editReplyContent() { return this.replyManagement.editReplyContent; }
  get editingNestedReply() { return this.replyManagement.editingNestedReply; }
  get editNestedReplyContent() { return this.replyManagement.editNestedReplyContent; }
  get showDeleteReplyModal() { return this.replyManagement.showDeleteReplyModal; }
  get deletingReplyId() { return this.replyManagement.deletingReplyId; }
  get deletingReplyPostId() { return this.replyManagement.deletingReplyPostId; }

  get replyingToPost() { return this.replyManagement.replyingToPost; }
  get replyContent() { return this.replyManagement.replyContent; }
  get replyingToComment() { return this.replyManagement.replyingToComment; }
  get replyingToCommentContent() { return this.replyManagement.replyingToCommentContent; }
  get isSubmittingReply() { return this.replyManagement.isSubmittingReply; }
  get postReplies() { return this.replyManagement.postReplies; }
  get savingReply() { return this.replyManagement.savingReply; }
  get loadingReplies() { return this.replyManagement.loadingReplies; }
  get replyCursor() { return this.replyManagement.replyCursor; }
  get replyHasMore() { return this.replyManagement.replyHasMore; }
  get isLoadingMoreReplies() { return this.replyManagement.isLoadingMoreReplies; }

  get postLikingId() { return this.postInteraction.postLikingId; }
  get postLikes() { return this.postInteraction.postLikes; }

  startEditPost(post: any) { this.postManagement.startEditPost(post); }
  cancelEditPost() { this.postManagement.cancelEditPost(); }
  saveEditPost(postId: string, postsSignal: any) { this.postManagement.saveEditPost(postId, postsSignal); }
  setEditMediaType(type: 'image' | 'youtube') { this.postManagement.setEditMediaType(type); }
  removeEditMedia() { this.postManagement.removeEditMedia(); }
  clearEditMediaType() { this.postManagement.clearEditMediaType(); }
  clearEditLinkPreview() { this.postManagement.clearEditLinkPreview(); }
  normalizeUrl(url: string) { return this.postManagement.normalizeUrl(url); }
  isValidImageUrl(url: string) { return this.postManagement.isValidImageUrl(url); }
  detectUrlInContent(content: string) { return this.postManagement.detectUrlInContent(content); }
  getDomain(url: string) { return this.postManagement.getDomain(url); }

  deletePost(id: string) { this.postManagement.deletePost(id); }
  confirmDeletePost(postsSignal: any) { this.postManagement.confirmDeletePost(postsSignal); }
  closeDeletePostModal() { this.postManagement.closeDeletePostModal(); }

  startEditReply(reply: any) { this.replyManagement.startEditReply(reply); }
  cancelEditReply() { this.replyManagement.cancelEditReply(); }
  saveEditReply(replyId: string, postId: string, postRepliesSignal: any, postsSignal?: any) { this.replyManagement.saveEditReply(replyId, postId, postRepliesSignal, postsSignal); }
  startEditNestedReply(reply: any) { this.replyManagement.startEditNestedReply(reply); }
  cancelEditNestedReply() { this.replyManagement.cancelEditNestedReply(); }
  saveEditNestedReply(replyId: string, postId: string, parentReplyId: string, postRepliesSignal: any, postsSignal?: any) { this.replyManagement.saveEditNestedReply(replyId, postId, parentReplyId, postRepliesSignal, postsSignal); }

  deleteReply(replyId: string, postId: string) { this.replyManagement.deleteReply(replyId, postId); }
  confirmDeleteReply(postRepliesSignal: any, postsSignal?: any) { this.replyManagement.confirmDeleteReply(postRepliesSignal, postsSignal); }
  closeDeleteReplyModal() { this.replyManagement.closeDeleteReplyModal(); }
  deleteNestedReply(replyId: string, postId: string, parentReplyId: string) { this.replyManagement.deleteNestedReply(replyId, postId, parentReplyId); }

  toggleReply(postId: string) { this.replyManagement.toggleReply(postId); }
  openReplyForm(postId: string) { this.replyManagement.openReplyForm(postId); }
  cancelReply() { this.replyManagement.cancelReply(); }
  submitReply(postId: string, postsSignal: any, postRepliesSignal: any, replyContent?: string) { this.replyManagement.submitReply(postId, postsSignal, postRepliesSignal, replyContent); }
  toggleReplyToComment(replyId: string) { this.replyManagement.toggleReplyToComment(replyId); }
  cancelReplyToComment() { this.replyManagement.cancelReplyToComment(); }
  submitReplyToComment(replyId: string, postId: string, postRepliesSignal: any, replyContent?: string, postsSignal?: any) { this.replyManagement.submitReplyToComment(replyId, postId, postRepliesSignal, replyContent, postsSignal); }

  toggleLike(post: any) { this.postInteraction.toggleLike(post); }
  setPostLikes(posts: any[]) { this.postInteraction.setPostLikes(posts); }
}