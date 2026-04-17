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
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params });
  }

  getFollowingPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/following`, { params });
  }

  getUserPosts(userId: string, cursor?: string, limit = 20): Observable<PostsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts/user/${userId}`, { params });
  }

  createPost(content: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, { content });
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  likePost(id: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.apiUrl}/posts/${id}/like`, {});
  }

  createReply(postId: string, content: string, parentId?: string): Observable<any> {
    const body: any = { content };
    if (parentId) {
      body.parentId = parentId;
    }
    return this.http.post<any>(`${this.apiUrl}/posts/${postId}/reply`, body);
  }

  getReplies(postId: string, page = 1, limit = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<any>(`${this.apiUrl}/posts/${postId}/replies`, { params });
  }

  updateReply(postId: string, replyId: string, content: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/posts/${postId}/reply/${replyId}`, { content });
  }

  deleteReply(postId: string, replyId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}/reply/${replyId}`);
  }
}