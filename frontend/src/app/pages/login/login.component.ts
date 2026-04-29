import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideIconsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
<div class="logo-mini">J</div>
      <h1>Entrar no JVerso</h1>
          <p>Bem-vindo de volta!</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <lucide-icon name="mail" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                placeholder="seu@email.com"
                autocomplete="email"
              >
            </div>
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
              <span class="field-error">
                @if (loginForm.get('email')?.hasError('required')) {
                  Email é obrigatório
                } @else if (loginForm.get('email')?.hasError('email')) {
                  Email inválido
                }
              </span>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Senha</label>
            <div class="input-wrapper">
              <lucide-icon name="lock" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="password" 
                id="password" 
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              >
            </div>
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <span class="field-error">
                @if (loginForm.get('password')?.hasError('required')) {
                  Senha é obrigatória
                }
              </span>
            }
          </div>
          
          @if (error()) {
            <div class="alert alert-error" role="alert">
              <span class="alert-icon">⚠️</span>
              {{ error() }}
            </div>
          }
          
          <button 
            type="submit" 
            [disabled]="isLoading() || loginForm.invalid"
            [class.loading]="isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Não tem uma conta? <a routerLink="/register">Cadastre-se</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../../shared/styles/auth-forms.scss'
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  isLoading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  login() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    
    const { email, password } = this.loginForm.getRawValue();
    
    this.isLoading.set(true);
    this.error.set('');

    this.authService.login(email, password).subscribe({
      next: () => {
        this.toast.success('Login realizado com sucesso!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao fazer login. Tente novamente.';
        this.error.set(msg);
        this.toast.error(msg);
        this.isLoading.set(false);
      }
    });
  }
}