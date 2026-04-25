import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UsersService, User } from '../../services/users.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { getAvatarUrl } from '../../shared/utils/avatar.utils';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideIconsModule],
  template: `
    <div class="search-page">
      <div class="search-header">
        <h1>Buscar usuários</h1>
        <div class="search-input-wrapper">
          <lucide-icon name="search" [size]="20" class="search-icon"></lucide-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange($event)"
            (keyup.enter)="onEnter()"
            placeholder="Buscar por nome ou username..."
            autofocus
          >
        </div>
      </div>
      
      <div class="results">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner-lg"></div>
            <p>Buscando...</p>
          </div>
        } @else if (searchPerformed() && results().length === 0) {
          <div class="empty-state">
            <lucide-icon name="search" [size]="48"></lucide-icon>
            <p>Nenhum usuário encontrado</p>
            <span>Tente buscar por outro termo</span>
          </div>
        } @else if (results().length > 0) {
          <div class="users-list">
            <h2>Resultados</h2>
            @for (user of results(); track user.id) {
              <a [routerLink]="['/profile', user.username]" class="user-card">
                <div class="user-avatar">
                  @if (user.avatar) {
                    <img [src]="getAvatarUrl(user.avatar)" alt="Avatar" class="avatar-image">
                  } @else {
                    {{ (user.name[0] || '?').toUpperCase() }}
                  }
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-username">&#64;{{ user.username }}</span>
                  @if (user.bio) {
                    <p class="user-bio">{{ user.bio }}</p>
                  }
                </div>
              </a>
            }
          </div>
        } @else {
          <!-- Suggested users (when no search) -->
          <div class="suggested-section">
            <div class="suggested-header">
              <h2>Quem seguir</h2>
              <span>Usuários sugeridos para você</span>
            </div>
            @if (suggestedLoading()) {
              <div class="loading-suggested">
                <div class="spinner"></div>
              </div>
            } @else if (suggestedUsers().length > 0) {
              <div class="users-list">
                @for (user of suggestedUsers(); track user.id) {
                  <a [routerLink]="['/profile', user.username]" class="user-card">
                    <div class="user-avatar">
                      @if (user.avatar) {
                        <img [src]="getAvatarUrl(user.avatar)" alt="Avatar" class="avatar-image">
                      } @else {
                        {{ (user.name[0] || '?').toUpperCase() }}
                      }
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-username">&#64;{{ user.username }}</span>
                      @if (user.bio) {
                        <p class="user-bio">{{ user.bio }}</p>
                      }
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div class="empty-suggested">
                <p>Nenhum usuário para sugerir ainda</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-page {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .search-header {
      margin-bottom: var(--space-6);
      
      h1 {
        font-size: var(--font-2xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
        color: var(--text-primary);
      }
      
      .search-input-wrapper {
        position: relative;
        
        .search-icon {
          position: absolute;
          left: var(--space-4);
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }
        
        input {
          width: 100%;
          padding: var(--space-4) var(--space-4) var(--space-4) calc(var(--space-4) * 2 + 20px);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: var(--font-base);
          background: var(--background-secondary);
          color: var(--text-primary);
          transition: border-color var(--duration-150) var(--ease-out),
                      box-shadow var(--duration-150) var(--ease-out);
          
          &::placeholder {
            color: var(--text-tertiary);
          }
          
          &:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
        }
      }
    }
    
    .users-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      
      h2 {
        font-size: var(--font-sm);
        font-weight: var(--font-semibold);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }
    }
    
    .user-card {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: background var(--duration-150) var(--ease-out);
      
      &:hover {
        background: var(--background-hover);
      }
    }
    
    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary), #0d8ecf);
      color: var(--text-inverse);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-semibold);
      font-size: var(--font-base);
      flex-shrink: 0;
      overflow: hidden;
      
      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-full);
        object-fit: cover;
      }
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      
      .user-name {
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        font-size: var(--font-base);
      }
      
      .user-username {
        color: var(--text-tertiary);
        font-size: var(--font-sm);
      }
      
      .user-bio {
        margin-top: var(--space-1);
        font-size: var(--font-sm);
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .loading-state {
      text-align: center;
      padding: var(--space-16) var(--space-6);
      
      p {
        color: var(--text-secondary);
        margin-top: var(--space-3);
        font-size: var(--font-sm);
      }
      
      .spinner-lg {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: var(--radius-full);
        animation: spin 0.8s linear infinite;
        margin: 0 auto var(--space-4);
      }
    }
    
    .empty-state {
      text-align: center;
      padding: var(--space-16) var(--space-6);
      
      lucide-icon {
        color: var(--text-tertiary);
        margin-bottom: var(--space-4);
      }
      
      p {
        font-size: var(--font-lg);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }
      
      span {
        color: var(--text-secondary);
        font-size: var(--font-sm);
      }
    }
    
    .suggested-section {
      .suggested-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: var(--space-4);
        padding: 0 var(--space-1);
        
        h2 {
          font-size: var(--font-lg);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }
        
        span {
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }
      }
      
      .loading-suggested,
      .empty-suggested {
        text-align: center;
        padding: var(--space-10) var(--space-6);
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: var(--radius-full);
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        p {
          color: var(--text-secondary);
          margin-top: var(--space-3);
          font-size: var(--font-sm);
        }
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  results = signal<User[]>([]);
  isLoading = signal(false);
  searchPerformed = signal(false);
  suggestedUsers = signal<User[]>([]);
  suggestedLoading = signal(true);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Carregar sugestão de usuários
    this.loadSuggested();
    
    // Configurar debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.search(query);
    });

    // Verificar query param na URL
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.search(this.searchQuery);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  getAvatarUrl = getAvatarUrl;

  onSearchChange(value: string) {
    this.searchQuery = value;
    if (value.trim().length >= 2) {
      this.searchSubject.next(value);
    } else if (value.trim() === '') {
      this.results.set([]);
      this.searchPerformed.set(false);
    }
  }

  onEnter() {
    this.searchSubject.complete();
    if (this.searchQuery.trim()) {
      this.search(this.searchQuery);
    }
  }

  search(query: string) {
    if (!query.trim()) return;
    
    this.isLoading.set(true);
    this.searchPerformed.set(true);
    
    this.usersService.search(query).subscribe({
      next: (response) => {
        this.results.set(response.users);
        this.isLoading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.isLoading.set(false);
      }
    });
  }
  
  loadSuggested() {
    this.suggestedLoading.set(true);
    this.usersService.getSuggested(10).subscribe({
      next: (response) => {
        this.suggestedUsers.set(response.users || []);
        this.suggestedLoading.set(false);
      },
      error: () => {
        this.suggestedUsers.set([]);
        this.suggestedLoading.set(false);
      }
    });
  }
}