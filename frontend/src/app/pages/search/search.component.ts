import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UsersService, User } from '../../services/users.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="search-page">
      <div class="search-header">
        <h1>Buscar usuários</h1>
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
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
            <div class="empty-icon">🔍</div>
            <p>Nenhum usuário encontrado</p>
            <span>Tente buscar por outro termo</span>
          </div>
        } @else if (results().length > 0) {
          <div class="users-list">
            <h2>Resultados</h2>
            @for (user of results(); track user.id) {
              <a [routerLink]="['/profile', user.username]" class="user-card">
                <div class="user-avatar">
                  {{ (user.name[0] || '?').toUpperCase() }}
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
                      {{ (user.name[0] || '?').toUpperCase() }}
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
      margin-bottom: 24px;
      
      h1 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      
      .search-input-wrapper {
        position: relative;
        
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
        }
        
        input {
          width: 100%;
          padding: 14px 14px 14px 42px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 16px;
          background: var(--background-secondary);
          transition: all var(--transition-fast);
          
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
      gap: 8px;
    }
    
    .user-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: background 0.15s;
      
      &:hover {
        background: var(--background-secondary);
      }
    }
    
    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #0d8ecf);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      
      .user-name {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .user-username {
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .user-bio {
        margin-top: 4px;
        font-size: 14px;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      
      p {
        color: var(--text-secondary);
        margin-top: 12px;
      }
      
      .spinner-lg {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      p {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
      
      span {
        color: var(--text-secondary);
      }
    }
    
    .suggested-section {
      .suggested-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 16px;
        padding: 0 4px;
        
        h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        span {
          font-size: 14px;
          color: var(--text-secondary);
        }
      }
      
      .loading-suggested, .empty-suggested {
        text-align: center;
        padding: 40px 20px;
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        p {
          color: var(--text-secondary);
          margin-top: 12px;
        }
      }
    }
    
    .users-list h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 12px;
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