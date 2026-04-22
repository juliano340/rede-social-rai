import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostInteractionService {
  private postsService = inject(PostsService);

  readonly postLikingId = signal<string | null>(null);
  readonly postLikes = signal<Record<string, boolean>>({});

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

  isLiked(postId: string): boolean {
    return this.postLikes()[postId] ?? false;
  }

  isLiking(postId: string): boolean {
    return this.postLikingId() === postId;
  }

  setPostLikes(posts: Post[]): void {
    const likes: Record<string, boolean> = {};
    posts.forEach(p => {
      likes[p.id] = p.isLiked ?? false;
    });
    this.postLikes.set(likes);
  }

  updatePostLike(postId: string, isLiked: boolean): void {
    this.postLikes.update(likes => ({ ...likes, [postId]: isLiked }));
  }
}