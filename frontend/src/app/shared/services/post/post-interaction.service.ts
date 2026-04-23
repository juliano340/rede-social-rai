import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostInteractionService {
  private postsService = inject(PostsService);

  readonly postLikingId = signal<string | null>(null);

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
        this.postsService.updatePostInSignals(post.id, {
          isLiked: currentStatus,
          _count: { ...post._count, likes: post._count.likes }
        });
      }
    });
  }

  isLiking(postId: string): boolean {
    return this.postLikingId() === postId;
  }

  setPostLikes(posts: Post[]): void {
    posts.forEach(p => {
      this.postsService.updatePostInSignals(p.id, { isLiked: p.isLiked ?? false });
    });
  }

  updatePostLike(postId: string, isLiked: boolean): void {
    this.postsService.updatePostInSignals(postId, { isLiked });
  }
}