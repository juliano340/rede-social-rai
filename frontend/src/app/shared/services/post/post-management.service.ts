import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../models/post.model';
import { UrlUtilsService } from '../../services/url-utils.service';

@Injectable({ providedIn: 'root' })
export class PostManagementService {
  private postsService = inject(PostsService);
  private urlUtils = inject(UrlUtilsService);

  readonly editingPost = signal<string | null>(null);
  readonly editPostContent = signal('');
  readonly editMediaUrl = signal('');
  readonly editMediaType = signal<'image' | 'youtube' | null>(null);
  readonly editLinkUrl = signal<string | null>(null);

  readonly showDeletePostModal = signal(false);
  readonly deletingPostId = signal<string | null>(null);

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
      error: () => {
        this.cancelEditPost();
      }
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
      error: () => {
        this.closeDeletePostModal();
      }
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