import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserProfile, UsersResponse } from '../shared/models';

export { User, UsersResponse };

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUser(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/${username}`);
  }

  follow(userId: string): Observable<{ following: boolean; message?: string }> {
    return this.http.post<{ following: boolean; message?: string }>(`${this.apiUrl}/users/${userId}/follow`, {});
  }

  getFollowers(userId: string, cursor?: string, limit = 20): Observable<UsersResponse> {
    let url = `${this.apiUrl}/users/${userId}/followers?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.http.get<UsersResponse>(url);
  }

  getFollowing(userId: string, cursor?: string, limit = 20): Observable<UsersResponse> {
    let url = `${this.apiUrl}/users/${userId}/following?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.http.get<UsersResponse>(url);
  }

  search(query: string, cursor?: string, limit = 20): Observable<UsersResponse> {
    let url = `${this.apiUrl}/users/search?q=${query}&limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.http.get<UsersResponse>(url);
  }

  getSuggested(limit = 10): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/suggested?limit=${limit}`);
  }

  updateProfile(data: { name?: string; bio?: string; bioLink?: string }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/users/me`, data);
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
