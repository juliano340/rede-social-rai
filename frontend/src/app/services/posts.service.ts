import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    replies: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true });
  }

  getFollowingPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/following`, { params, withCredentials: true });
  }

  getUserPosts(userId: string, cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/user/${userId}`, { params, withCredentials: true });
  }

  createPost(content: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, { content }, { withCredentials: true });
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`, { withCredentials: true });
  }

  updatePost(id: string, content: string): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/posts/${id}`, { content }, { withCredentials: true });
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

  getReplies(postId: string, page = 1, limit = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<any>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
  }

  updateReply(postId: string, replyId: string, content: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { content }, { withCredentials: true });
  }

  deleteReply(postId: string, replyId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { withCredentials: true });
  }
}