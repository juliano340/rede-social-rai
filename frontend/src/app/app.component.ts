import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <nav class="navbar" role="navigation" aria-label="Navegação principal">
        <div class="nav-content">
          <a routerLink="/home" class="logo">
            <span class="logo-icon">R</span>
            <span class="logo-text">RAI</span>
          </a>
          
          @if (authService.isLoggedIn()) {
            <div class="nav-links">
              <a routerLink="/home" class="nav-link" routerLinkActive="active">
                <span class="nav-icon">🏠</span>
                <span>Home</span>
              </a>
              <a routerLink="/search" class="nav-link" routerLinkActive="active">
                <span class="nav-icon">🔍</span>
                <span>Buscar</span>
              </a>
              <a [routerLink]="['/profile', authService.currentUser()?.username]" class="nav-link" routerLinkActive="active">
                <span class="nav-icon">👤</span>
                <span>Perfil</span>
              </a>
              <button 
                class="theme-toggle" 
                (click)="themeService.toggle()"
                [attr.aria-label]="themeService.isDark() ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
              >
                {{ themeService.isDark() ? '☀️' : '🌙' }}
              </button>
              <button (click)="logout()" class="nav-link logout">
                <span class="nav-icon">🚪</span>
                <span>Sair</span>
              </button>
            </div>
          } @else {
            <div class="nav-links">
              <button 
                class="theme-toggle" 
                (click)="themeService.toggle()"
                [attr.aria-label]="themeService.isDark() ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
              >
                {{ themeService.isDark() ? '☀️' : '🌙' }}
              </button>
              <a routerLink="/login" class="nav-link">Entrar</a>
              <a routerLink="/register" class="btn-primary">Cadastrar</a>
            </div>
          }
        </div>
      </nav>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: var(--background);
    }
    
    .navbar {
      position: sticky;
      top: 0;
      background: var(--background-secondary);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    
    .nav-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      
      .logo-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, var(--primary), #0d8ecf);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
      }
      
      .logo-text {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.5px;
      }
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 15px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
      
      .nav-icon {
        font-size: 16px;
      }
      
      &:hover {
        background: var(--background-secondary);
        color: var(--text-primary);
        text-decoration: none;
      }
      
      &.active {
        background: var(--primary-light);
        color: var(--primary);
      }
      
      &.logout:hover {
        background: var(--error-light);
        color: var(--error);
      }
    }
    
    .theme-toggle {
      background: none;
      border: none;
      font-size: 20px;
      padding: 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.15s;
      
      &:hover {
        background: var(--background-secondary);
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white;
      padding: 10px 20px;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
      transition: all var(--transition-fast);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
        text-decoration: none;
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .main-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 20px;
    }
    
    @media (max-width: 480px) {
      .nav-content {
        padding: 12px 16px;
      }
      
      .main-content {
        padding: 16px;
      }
      
      .logo .logo-text {
        display: none;
      }
      
      .nav-link span:not(.nav-icon) {
        display: none;
      }
      
      .nav-link {
        padding: 10px;
      }
    }
  `]
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}
  
  logout() {
    this.authService.logout();
  }
}