import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  };
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(
      `${this.apiUrl}/notifications?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
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
