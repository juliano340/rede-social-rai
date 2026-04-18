import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
      username,
      email,
      password,
      name
    }, { withCredentials: true }).pipe(tap(response => this.handleAuth(response)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }, { withCredentials: true }).pipe(tap(response => this.handleAuth(response)));
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  refresh(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.refreshCurrentUser();
      }),
      catchError(err => {
        this.forceLogout();
        return throwError(() => err);
      })
    );
  }

  forceLogout(): void {
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  deleteAccount(password: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auth/account`, {
      body: { password },
      withCredentials: true
    });
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSignal();
  }

  currentUser() {
    return this.currentUserSignal();
  }

  refreshCurrentUser(): void {
    this.http.get<User>(`${this.apiUrl}/users/me`, { withCredentials: true }).subscribe({
      next: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      },
      error: () => {
        this.forceLogout();
      }
    });
  }

  private handleAuth(response: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(response));
    this.currentUserSignal.set(response);
    this.refreshCurrentUser();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}