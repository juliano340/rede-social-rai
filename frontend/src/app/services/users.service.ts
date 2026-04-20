import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UsersResponse } from '../shared/models';

export { User, UsersResponse };

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUser(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${username}`);
  }

  follow(userId: string): Observable<{ following: boolean; message?: string }> {
    return this.http.post<{ following: boolean; message?: string }>(`${this.apiUrl}/users/${userId}/follow`, {});
  }

  getFollowers(userId: string, page = 1, limit = 20): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/${userId}/followers?page=${page}&limit=${limit}`);
  }

  getFollowing(userId: string, page = 1, limit = 20): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/${userId}/following?page=${page}&limit=${limit}`);
  }

  search(query: string, page = 1, limit = 20): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/search?q=${query}&page=${page}&limit=${limit}`);
  }

  getSuggested(limit = 10): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/suggested?limit=${limit}`);
  }

  updateProfile(data: { name?: string; bio?: string; bioLink?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/me`, data);
  }

  uploadAvatar(file: File): Observable<{ avatar: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ avatar: string }>(`${this.apiUrl}/users/me/avatar`, formData);
  }

  updateAvatarUrl(url: string): Observable<{ avatar: string }> {
    return this.http.patch<{ avatar: string }>(`${this.apiUrl}/users/me/avatar-url`, { url });
  }
}
