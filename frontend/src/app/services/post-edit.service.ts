import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { PostsService } from './posts.service';
import { Post, Reply } from '../shared/models';
import { ToastService } from '../shared/services/toast.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  private postsService = inject(PostsService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  editingPost = signal<string | null>(null);
  editPostContent = '';
  editMediaUrl = '';
  editMediaType = signal<'image' | 'youtube' | null>(null);
  editLinkUrl = signal<string | null>(null);

  editingReply = signal<string | null>(null);
  editReplyContent = '';
  editingNestedReply = signal<string | null>(null);
  editNestedReplyContent = '';

  showDeletePostModal = signal(false);
  deletingPostId = signal<string | null>(null);
  showDeleteReplyModal = signal(false);
  deletingReplyId = signal<string | null>(null);
  deletingReplyPostId = signal<string | null>(null);

  replyingToPost = signal<string | null>(null);
  replyContent = '';
  replyingToComment = signal<string | null>(null);
  replyingToCommentContent = '';
  isSubmittingReply = signal(false);
  postReplies = signal<Reply[]>([]);
  loadingReplies = signal(false);
  savingReply = signal(false);

  postLikingId = signal<string | null>(null);
  postLikes = signal<Record<string, boolean>>({});

  startEditPost(post: Post): void {
    this.editingPost.set(post.id);
    this.editPostContent = post.content;
    this.editMediaUrl = post.mediaUrl || '';
    this.editMediaType.set(post.mediaType as 'image' | 'youtube' | null);
    this.editLinkUrl.set(post.linkUrl ?? null);
  }

  cancelEditPost(): void {
    this.editingPost.set(null);
    this.editPostContent = '';
    this.editMediaUrl = '';
    this.editMediaType.set(null);
    this.editLinkUrl.set(null);
  }

  saveEditPost(postId: string, postsSignal: WritableSignal<Post[]>): void {
    if (!this.editPostContent.trim()) return;

    const mediaUrl = this.editMediaType() && this.editMediaUrl ? this.editMediaUrl : null;
    const mediaType = this.editMediaType() && this.editMediaUrl ? this.editMediaType() : null;
    const linkUrl = this.normalizeUrl(this.editLinkUrl() || '');

    this.postsService.updatePost(postId, this.editPostContent, mediaUrl, mediaType, linkUrl).subscribe({
      next: (updated) => {
        postsSignal.update(posts =>
          posts.map(p => p.id === postId
            ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl }
            : p
          )
        );
        this.cancelEditPost();
      },
      error: (err) => {
        console.error('Error editing post:', err);
        this.cancelEditPost();
        this.toast.error('Erro ao editar post. Tente novamente.');
      }
    });
  }

  startEditReply(reply: Reply): void {
    this.editingReply.set(reply.id);
    this.editReplyContent = reply.content;
  }

  cancelEditReply(): void {
    this.editingReply.set(null);
    this.editReplyContent = '';
  }

  saveEditReply(replyId: string, postId: string, postRepliesSignal: WritableSignal<Reply[]>): void {
    if (!this.editReplyContent.trim()) return;

    this.postsService.updateReply(postId, replyId, this.editReplyContent).subscribe({
      next: (updated) => {
        postRepliesSignal.update(replies =>
          replies.map(r => r.id === replyId ? { ...updated, children: r.children } : r)
        );
      },
      error: (err) => {
        console.error('Error editing reply:', err);
        this.toast.error('Erro ao editar comentário. Tente novamente.');
      }
    });
    this.cancelEditReply();
  }

  startEditNestedReply(reply: Reply): void {
    this.editingNestedReply.set(reply.id);
    this.editNestedReplyContent = reply.content;
  }

  cancelEditNestedReply(): void {
    this.editingNestedReply.set(null);
    this.editNestedReplyContent = '';
  }

  saveEditNestedReply(replyId: string, postId: string, parentReplyId: string, postRepliesSignal: WritableSignal<Reply[]>): void {
    if (!this.editNestedReplyContent.trim()) return;

    this.postsService.updateReply(postId, replyId, this.editNestedReplyContent).subscribe({
      next: () => {
        postRepliesSignal.update(replies =>
          replies.map(r => {
            if (r.id === parentReplyId && r.children) {
              r.children = r.children.map((c: Reply) =>
                c.id === replyId ? { ...c, content: this.editNestedReplyContent } : c
              );
            }
            return r;
          })
        );
        this.cancelEditNestedReply();
      },
      error: (err) => {
        console.error('Error editing nested reply:', err);
        this.toast.error('Erro ao editar resposta. Tente novamente.');
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
      error: (err) => {
        console.error('Error deleting post:', err);
        this.closeDeletePostModal();
        this.toast.error('Erro ao deletar post. Tente novamente.');
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
        postRepliesSignal.update(replies =>
          replies.map(r => {
            if (r.children && r.children.some((c: Reply) => c.id === replyId)) {
              r.children = r.children.filter((c: Reply) => c.id !== replyId);
            }
            return r;
          }).filter(r => r.id !== replyId)
        );

        if (postsSignal) {
          const post = postsSignal().find(p => p.id === postId);
          if (post) {
            post._count.replies = Math.max(0, post._count.replies - 1);
            postsSignal.update(posts => [...posts]);
          }
        }

        this.closeDeleteReplyModal();
      },
      error: (err) => {
        console.error('Error deleting reply:', err);
        this.closeDeleteReplyModal();
        this.toast.error('Erro ao deletar comentário. Tente novamente.');
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
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingToPost.set(null);
    this.replyContent = '';
  }

  submitReply(postId: string, postsSignal: WritableSignal<Post[]>, postRepliesSignal: WritableSignal<Reply[]>, replyContent?: string): void {
    const content = replyContent ?? this.replyContent;
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content).subscribe({
      next: () => {
        const post = postsSignal().find(p => p.id === postId);
        if (post) {
          post._count.replies += 1;
          postsSignal.update(posts => [...posts]);
        }

        this.postsService.getReplies(postId).subscribe({
          next: (data) => {
            postRepliesSignal.set(data.replies || []);
          }
        });

        this.cancelReply();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error('Error creating reply:', err);
        this.isSubmittingReply.set(false);
        if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao publicar comentário. Tente novamente.');
        }
      }
    });
  }

  toggleReplyToComment(replyId: string): void {
    if (this.replyingToComment() === replyId) {
      this.cancelReplyToComment();
    } else {
      this.replyingToComment.set(replyId);
      this.replyingToCommentContent = '';
    }
  }

  cancelReplyToComment(): void {
    this.replyingToComment.set(null);
    this.replyingToCommentContent = '';
  }

  submitReplyToComment(replyId: string, postId: string, postRepliesSignal: WritableSignal<Reply[]>, replyContent?: string): void {
    const content = replyContent ?? this.replyingToCommentContent;
    if (!content.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, content, replyId).subscribe({
      next: () => {
        this.postsService.getReplies(postId).subscribe({
          next: (data) => {
            postRepliesSignal.set(data.replies || []);
          }
        });
        this.cancelReplyToComment();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error('Error creating nested reply:', err);
        this.isSubmittingReply.set(false);
        if (err.status === 401) {
          this.authService.logout();
        } else if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao responder comentário. Tente novamente.');
        }
      }
    });
  }

  toggleLike(post: Post): void {
    this.postLikingId.set(post.id);
    const isLiked = this.postLikes()[post.id];

    this.postsService.likePost(post.id).subscribe({
      next: () => {
        this.postLikes.update(likes => ({ ...likes, [post.id]: !isLiked }));
        post._count.likes += isLiked ? -1 : 1;
        this.postLikingId.set(null);
      },
      error: (err) => {
        console.error('Error toggling like:', err);
        this.postLikingId.set(null);
        if (err.status === 429) {
          this.toast.error('Você está curtindo muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao curtir. Tente novamente.');
        }
      }
    });
  }

  setEditMediaType(type: 'image' | 'youtube'): void {
    if (this.editMediaType() === type) {
      this.editMediaType.set(null);
      this.editMediaUrl = '';
    } else {
      this.editMediaType.set(type);
      this.editMediaUrl = '';
    }
  }

  removeEditMedia(): void {
    this.editMediaUrl = '';
  }

  clearEditMediaType(): void {
    this.editMediaType.set(null);
    this.editMediaUrl = '';
  }

  clearEditLinkPreview(): void {
    this.editLinkUrl.set(null);
  }

  normalizeUrl(url: string): string | null {
    if (!url) return null;
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  detectUrlInContent(content: string): string | null {
    const match = content.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/);
    return match ? match[1] : null;
  }

  getDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
