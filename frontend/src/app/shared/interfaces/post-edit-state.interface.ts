export interface PostEditState {
  editingPostId: string | null;
  editPostContent: string;
  editMediaUrl: string;
  editMediaType: 'image' | 'youtube' | null;
  editLinkUrl: string | null;
}

export interface ReplyEditState {
  editingReplyId: string | null;
  editReplyContent: string;
}

export interface NestedReplyEditState {
  editingNestedReplyId: string | null;
  editNestedReplyContent: string;
}

export interface DeleteState {
  showDeletePostModal: boolean;
  deletingPostId: string | null;
  showDeleteReplyModal: boolean;
  deletingReplyId: string | null;
  deletingReplyPostId: string | null;
}

export interface ReplyFormState {
  replyingToPostId: string | null;
  replyContent: string;
  replyingToCommentId: string | null;
  replyingToCommentContent: string;
  isSubmittingReply: boolean;
  postReplies: import('../models/post.model').Reply[];
  loadingReplies: boolean;
  savingReply: boolean;
}

export interface LikeState {
  postLikingId: string | null;
  postLikes: Record<string, boolean>;
}
