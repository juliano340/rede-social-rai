import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, AuthResponse } from '../shared/models';
import { API_ENDPOINTS, ROUTES } from '../shared/constants/api.constants';
import { AuthStateService } from '../shared/services/state/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authState: AuthStateService
  ) {}

  register(username: string, email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`, {
      username,
      email,
      password,
      name
    }, { withCredentials: true }).pipe(tap(response => this.handleAuth(response)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
      email,
      password
    }, { withCredentials: true }).pipe(tap(response => this.handleAuth(response)));
  }

  logout(): void {
    this.http.post(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}, { withCredentials: true }).subscribe();
    this.authState.clear();
    this.router.navigate([ROUTES.LOGIN]);
  }

  refresh(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {}, { withCredentials: true }).pipe(
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
    this.authState.clear();
    this.router.navigate([ROUTES.LOGIN]);
  }

  deleteAccount(password: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}${API_ENDPOINTS.AUTH.DELETE_ACCOUNT}`, {
      body: { password },
      withCredentials: true
    });
  }

  isLoggedIn(): boolean {
    return this.authState.isAuthenticated();
  }

  currentUser(): User | null {
    return this.authState.currentUser();
  }

  updateCurrentUser(updates: Partial<User>): void {
    this.authState.updateUser(updates);
  }

  refreshCurrentUser(): void {
    this.http.get<User>(`${this.apiUrl}${API_ENDPOINTS.USERS.ME}`, { withCredentials: true }).subscribe({
      next: (user) => {
        this.authState.setUser(user);
      },
      error: () => {
        this.forceLogout();
      }
    });
  }

  private handleAuth(response: AuthResponse): void {
    this.authState.setUser(response);
    this.refreshCurrentUser();
  }
}
