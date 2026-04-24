import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Post, PostsResponse, RepliesResponse, Reply } from '../shared/models';

export { Post, PostsResponse };

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = environment.apiUrl;
  private cache = new Map<string, { data: PostsResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  feedPosts = signal<Post[]>([]);
  profilePosts = signal<Post[]>([]);

  constructor(private http: HttpClient) {}

  private getCacheKey(cursor?: string, limit = 20, endpoint = 'posts'): string {
    return `${endpoint}:${cursor || 'initial'}:${limit}`;
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: PostsResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    Array.from(this.cache.keys())
      .filter(key => key.includes(pattern))
      .forEach(key => this.cache.delete(key));
  }

  setFeedPosts(posts: Post[]): void {
    this.feedPosts.set(posts);
  }

  appendFeedPosts(posts: Post[]): void {
    this.feedPosts.update(current => [...current, ...posts]);
  }

  setProfilePosts(posts: Post[]): void {
    this.profilePosts.set(posts);
  }

  appendProfilePosts(posts: Post[]): void {
    this.profilePosts.update(current => [...current, ...posts]);
  }

  updatePostInSignals(id: string, updates: Partial<Post>): void {
    this.feedPosts.update(posts =>
      posts.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    this.profilePosts.update(posts =>
      posts.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }

  removePostFromSignals(id: string): void {
    this.feedPosts.update(posts => posts.filter(p => p.id !== id));
    this.profilePosts.update(posts => posts.filter(p => p.id !== id));
  }

  addPostToSignals(post: Post): void {
    this.feedPosts.update(posts => [post, ...posts]);
    this.profilePosts.update(posts => [post, ...posts]);
  }

  getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    const cacheKey = this.getCacheKey(cursor, limit, 'posts');
    const cached = this.getCached<PostsResponse>(cacheKey);
    if (cached) {
      return of(cached);
    }

    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true }).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        if (cursor) {
          this.appendFeedPosts(data.posts);
        } else {
          this.setFeedPosts(data.posts);
        }
      })
    );
  }

  getFollowingPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    const cacheKey = this.getCacheKey(cursor, limit, 'following');
    const cached = this.getCached<PostsResponse>(cacheKey);
    if (cached) {
      return of(cached);
    }

    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/following`, { params, withCredentials: true }).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        if (cursor) {
          this.appendFeedPosts(data.posts);
        } else {
          this.setFeedPosts(data.posts);
        }
      })
    );
  }

  getUserPosts(userId: string, cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/user/${userId}`, { params, withCredentials: true }).pipe(
      tap(data => {
        if (cursor) {
          this.appendProfilePosts(data.posts);
        } else {
          this.setProfilePosts(data.posts);
        }
      })
    );
  }

  createPost(content: string, mediaUrl?: string | null, mediaType?: string | null, linkUrl?: string | null): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, { content, mediaUrl, mediaType, linkUrl }, { withCredentials: true }).pipe(
      tap(post => {
        this.invalidateCache();
        this.addPostToSignals(post);
      })
    );
  }

  deletePost(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        this.invalidateCache();
        this.removePostFromSignals(id);
      })
    );
  }

  updatePost(id: string, content: string, mediaUrl?: string | null, mediaType?: string | null, linkUrl?: string | null): Observable<Post> {
    const body: { content: string; mediaUrl?: string | null; mediaType?: string | null; linkUrl?: string | null } = { content };

    if (mediaUrl === null || mediaUrl === undefined) {
      body.mediaUrl = null;
      body.mediaType = null;
    } else {
      body.mediaUrl = mediaUrl;
      body.mediaType = mediaType;
    }

    if (linkUrl === null || linkUrl === undefined) {
      body.linkUrl = null;
    } else {
      body.linkUrl = linkUrl;
    }

    return this.http.put<Post>(`${this.apiUrl}/posts/${id}`, body, { withCredentials: true });
  }

  likePost(id: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.apiUrl}/posts/${id}/like`, {}, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  createReply(postId: string, content: string, parentId?: string): Observable<Reply> {
    const body: { content: string; parentId?: string } = { content };
    if (parentId) {
      body.parentId = parentId;
    }
    return this.http.post<Reply>(`${this.apiUrl}/posts/${postId}/reply`, body, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  getReplies(postId: string, cursor?: string, limit = 20): Observable<RepliesResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<RepliesResponse>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
  }

  updateReply(postId: string, replyId: string, content: string): Observable<Reply> {
    return this.http.put<Reply>(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { content }, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteReply(postId: string, replyId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }
}
