import { Injectable, signal } from '@angular/core';
import { Post } from '../../models';
import { APP_CONSTANTS } from '../../constants/app.constants';

export type FeedType = 'all' | 'following';

export interface FeedState {
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  feedType: FeedType;
}

@Injectable({
  providedIn: 'root'
})
export class FeedStateService {
  private readonly _posts = signal<Post[]>([]);
  private readonly _cursor = signal<string | null>(null);
  private readonly _hasMore = signal<boolean>(true);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _feedType = signal<FeedType>('all');

  readonly posts = this._posts.asReadonly();
  readonly cursor = this._cursor.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly feedType = this._feedType.asReadonly();

  setPosts(posts: Post[], cursor: string | null = null, hasMore: boolean = true): void {
    this._posts.set(posts);
    this._cursor.set(cursor);
    this._hasMore.set(hasMore);
    this._error.set(null);
  }

  appendPosts(newPosts: Post[], cursor: string | null, hasMore: boolean): void {
    this._posts.update(current => [...current, ...newPosts]);
    this._cursor.set(cursor);
    this._hasMore.set(hasMore);
  }

  prependPost(post: Post): void {
    this._posts.update(current => [post, ...current]);
  }

  updatePost(postId: string, updates: Partial<Post>): void {
    this._posts.update(posts => 
      posts.map(p => p.id === postId ? { ...p, ...updates } : p)
    );
  }

  removePost(postId: string): void {
    this._posts.update(posts => posts.filter(p => p.id !== postId));
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
    this._isLoading.set(false);
  }

  setFeedType(type: FeedType): void {
    this._feedType.set(type);
  }

  clear(): void {
    this._posts.set([]);
    this._cursor.set(null);
    this._hasMore.set(true);
    this._isLoading.set(false);
    this._error.set(null);
  }

  reset(): void {
    this.clear();
    this._feedType.set('all');
  }
}