import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: 'LIKE' | 'FOLLOW' | 'REPLY' | 'MENTION';
  userId: string;
  actorId: string;
  actor: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  postId?: string;
  post?: {
    id: string;
    content: string;
    author?: {
      id: string;
      username: string;
    };
  };
  replyId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotifications(cursor?: string, limit = 20): Observable<NotificationsResponse> {
    let url = `${this.apiUrl}/notifications?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.http.get<NotificationsResponse>(url, { withCredentials: true });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/notifications/unread-count`,
      { withCredentials: true }
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {},
      { withCredentials: true }
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/notifications/read-all`,
      {},
      { withCredentials: true }
    );
  }
}
