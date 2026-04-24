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
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
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