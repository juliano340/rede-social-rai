import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Post, PostsResponse } from '../shared/models';

export { Post, PostsResponse };

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = environment.apiUrl;
  private cache = new Map<string, { data: PostsResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

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
      tap(data => this.setCache(cacheKey, data)),
      catchError(() => of({ posts: [], nextCursor: null, hasMore: false }))
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
      tap(data => this.setCache(cacheKey, data)),
      catchError(() => of({ posts: [], nextCursor: null, hasMore: false }))
    );
  }

  getUserPosts(userId: string, cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/user/${userId}`, { params, withCredentials: true });
  }

  createPost(content: string, mediaUrl?: string | null, mediaType?: string | null, linkUrl?: string | null): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, { content, mediaUrl, mediaType, linkUrl }, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`, { withCredentials: true }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updatePost(id: string, content: string, mediaUrl?: string | null, mediaType?: string | null, linkUrl?: string | null): Observable<Post> {
    const body: any = { content };

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
    return this.http.post<{ liked: boolean }>(`${this.apiUrl}/posts/${id}/like`, {}, { withCredentials: true });
  }

  isLiked(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/posts/${id}/liked`, { withCredentials: true });
  }

  createReply(postId: string, content: string, parentId?: string): Observable<any> {
    const body: any = { content };
    if (parentId) {
      body.parentId = parentId;
    }
    return this.http.post<any>(`${this.apiUrl}/posts/${postId}/reply`, body, { withCredentials: true });
  }

  getReplies(postId: string, cursor?: string, limit = 20): Observable<any> {
    const params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params.set('cursor', cursor);
    }
    return this.http.get<any>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
  }

  updateReply(postId: string, replyId: string, content: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { content }, { withCredentials: true });
  }

  deleteReply(postId: string, replyId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { withCredentials: true });
  }
}
