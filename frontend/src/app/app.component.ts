import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NotificationMenuComponent } from './shared/components/notification-menu/notification-menu.component';
import { LucideIconsModule } from './shared/icons/lucide-icons.module';
import { getAvatarUrl } from './shared/utils/avatar.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ToastComponent, NotificationMenuComponent, LucideIconsModule],
  template: `
    <div class="app-container">
      <nav class="navbar" role="navigation" aria-label="Navegação principal">
        <div class="nav-content">
          @if (authService.isLoggedIn()) {
            <a routerLink="/home" class="logo" aria-label="JVerso Home">
              <span class="logo-icon">J</span>
            </a>

            <div class="nav-actions">
              <a routerLink="/search" class="nav-icon-btn" routerLinkActive="active" aria-label="Buscar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </a>
              <app-notification-menu />
              <a [routerLink]="['/profile', authService.currentUser()?.username]" class="nav-avatar-link" aria-label="Ver meu perfil">
                @if (authService.currentUser()?.avatar) {
                  <img [src]="getAvatarUrl(authService.currentUser()!.avatar)" alt="Avatar" class="nav-avatar">
                } @else {
                  <span class="avatar-placeholder">{{ (authService.currentUser()?.name && authService.currentUser()!.name[0]) || '?' }}</span>
                }
              </a>
              <button class="chevron-btn" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen()" aria-label="Abrir menu do usuário">
                <span class="chevron" [class.open]="menuOpen()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
            </div>
          } @else {
            <a [routerLink]="['/landing']" class="logo" aria-label="JVerso">
              <span class="logo-icon">J</span>
              <span class="logo-text">JVerso</span>
            </a>
            <div class="nav-actions">
              <button
                class="theme-toggle"
                (click)="themeService.toggle()"
                [attr.aria-label]="themeService.isDark() ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
              >
                @if (themeService.isDark()) {
                  <lucide-icon name="sun" [size]="20"></lucide-icon>
                } @else {
                  <lucide-icon name="moon" [size]="20"></lucide-icon>
                }
              </button>
              <a routerLink="/login" class="nav-link-sm">Entrar</a>
              <a routerLink="/register" class="btn-primary">Cadastrar</a>
            </div>
          }
        </div>
      </nav>

      @if (menuOpen()) {
        <div class="menu-overlay" (click)="closeMenu()"></div>
        <div class="user-menu" [class.menu-mobile]="isMobile()">
          <button class="menu-close" (click)="closeMenu()" aria-label="Fechar menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          @if (isMobile()) {
            <div class="menu-header">
              @if (authService.currentUser()?.avatar) {
                <img [src]="getAvatarUrl(authService.currentUser()!.avatar)" alt="Avatar" class="menu-avatar">
              } @else {
                <div class="menu-avatar-placeholder">{{ (authService.currentUser()?.name && authService.currentUser()!.name[0]) || '?' }}</div>
              }
              <div class="menu-user-info">
                <span class="menu-user-name">{{ authService.currentUser()?.name }}</span>
                <span class="menu-user-handle">&#64;{{ authService.currentUser()?.username }}</span>
              </div>
            </div>
          }

          <div class="menu-items">
            <a routerLink="/home" class="menu-item" (click)="closeMenu()">
              <lucide-icon name="home" [size]="18"></lucide-icon>
              <span>Home</span>
            </a>
            <a [routerLink]="['/profile', authService.currentUser()?.username]" class="menu-item" (click)="closeMenu()">
              <lucide-icon name="user" [size]="18"></lucide-icon>
              <span>Meu Perfil</span>
            </a>
            <a routerLink="/settings" class="menu-item" (click)="closeMenu()">
              <lucide-icon name="settings" [size]="18"></lucide-icon>
              <span>Configurações</span>
            </a>
            <div class="menu-divider"></div>
            <button class="menu-item" (click)="themeService.toggle()">
              <lucide-icon [name]="themeService.isDark() ? 'sun' : 'moon'" [size]="18"></lucide-icon>
              <span>{{ themeService.isDark() ? 'Modo claro' : 'Modo escuro' }}</span>
            </button>
            <div class="menu-divider"></div>
            <button class="menu-item menu-item-danger" (click)="confirmLogout()">
              <lucide-icon name="log-out" [size]="18"></lucide-icon>
              <span>Sair</span>
            </button>
          </div>
        </div>
      }

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-toast />

      @if (showLogoutModal()) {
        <div class="modal-overlay" (click)="cancelLogout()">
          <div class="modal confirm-modal" (click)="$event.stopPropagation()">
            <lucide-icon name="log-out" [size]="48" class="modal-icon"></lucide-icon>
            <h2>Sair da conta?</h2>
            <p>Você precisará fazer login novamente para acessar seu perfil e feed.</p>
            <div class="modal-actions">
              <button class="modal-cancel" (click)="cancelLogout()">Cancelar</button>
              <button class="modal-confirm" (click)="logout()">Sair</button>
            </div>
          </div>
        </div>
      }
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
      padding: 12px 16px;
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
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        transition: transform 0.15s;
      }
      
      &:hover .logo-icon {
        transform: scale(1.05);
      }
      
      .logo-text {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.5px;
      }
    }
    
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nav-icon-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: var(--text-primary);
      transition: all 0.15s;
      text-decoration: none;
      
      &:hover {
        background: var(--background-secondary);
        color: var(--text-primary);
      }
      
      &.active {
        color: var(--primary);
      }
    }
    
    .nav-avatar-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      padding: 2px 4px 2px 2px;
      border-radius: 50%;
      transition: all 0.15s;

      &:hover {
        opacity: 0.9;
        transform: scale(1.05);
      }
    }

    .chevron-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 50%;
      transition: background 0.15s;

      &:hover {
        background: var(--background-secondary);
      }
    }

    .nav-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .avatar-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .chevron {
      display: flex;
      align-items: center;
      color: var(--text-tertiary);
      transition: transform 0.2s;
      
      &.open {
        transform: rotate(180deg);
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
      color: var(--text-primary);
      
      &:hover {
        background: var(--background-secondary);
      }
    }
    
    .nav-link-sm {
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 15px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.15s;
      
      &:hover {
        color: var(--text-primary);
        background: var(--background-secondary);
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 8px 20px;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      transition: all 0.15s;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        text-decoration: none;
      }
    }
    
    .main-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    /* Menu overlay */
    .menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 200;
      animation: fadeIn 0.15s ease;
    }

    /* User menu - desktop */
    /* User menu - desktop */
    .user-menu {
      position: fixed;
      top: 56px;
      right: calc(50% - 300px + 16px);
      width: 240px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 300;
      animation: slideDown 0.15s ease;
      overflow: hidden;
    }

    /* User menu - mobile fullscreen */
    .menu-mobile {
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      max-width: 100%;
      border-radius: 0;
      display: flex;
      flex-direction: column;
      animation: slideRight 0.2s ease;
    }

    .menu-close {
      display: none;
      align-self: flex-end;
      background: none;
      border: none;
      padding: 12px;
      cursor: pointer;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      
      &:hover {
        background: var(--background-secondary);
      }
    }

    .menu-mobile .menu-close {
      display: flex;
    }

    .menu-header {
      display: none;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--border);
    }

    .menu-mobile .menu-header {
      display: flex;
    }

    .menu-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .menu-avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 20px;
    }

    .menu-user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .menu-user-name {
      font-weight: 600;
      font-size: 16px;
      color: var(--text-primary);
    }

    .menu-user-handle {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .menu-items {
      padding: 8px;
    }

    .menu-mobile .menu-items {
      padding: 8px 16px;
      flex: 1;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.15s;
      
      &:hover {
        background: var(--background-secondary);
      }
    }
    
    .menu-item-danger {
      color: var(--error);
      
      &:hover {
        background: var(--error-light);
      }
    }
    
    .menu-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 12px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideRight {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 500;
      animation: fadeIn 0.15s ease;
    }

    .confirm-modal {
      background: var(--background);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideDown 0.15s ease;

      .modal-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        font-size: 15px;
        color: var(--text-secondary);
        margin: 0 0 20px 0;
        line-height: 1.4;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .modal-cancel, .modal-confirm {
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }

      .modal-cancel {
        background: var(--background-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);

        &:hover {
          background: var(--border);
        }
      }

      .modal-confirm {
        background: var(--error);
        color: white;
        border: none;

        &:hover {
          background: #c71d2f;
        }
      }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
      .nav-content {
        padding: 10px 12px;
      }
      
      .main-content {
        padding: 16px;
      }
      
      .logo .logo-text {
        display: none;
      }

      .user-menu {
        right: 8px;
      }
    }
  `]
})
export class AppComponent {
  menuOpen = signal(false);
  showLogoutModal = signal(false);
  isMobile = signal(window.innerWidth <= 480);

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth <= 480);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showLogoutModal()) {
      this.cancelLogout();
    } else {
      this.closeMenu();
    }
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  confirmLogout() {
    this.closeMenu();
    this.showLogoutModal.set(true);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }

  getAvatarUrl = getAvatarUrl;

  logout() {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }
}