import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsModule],
  template: `
    <div class="landing-page">
      <div class="hero">
        <div class="hero-content">
          <div class="logo-large">
            <span class="logo-icon">J</span>
          </div>
          <h1>Bem-vindo ao <span class="brand">JVerso</span></h1>
          <p class="tagline">Conecte-se, compartilhe e descubra</p>
        </div>
        
        <div class="features">
          <div class="feature">
            <lucide-icon name="sparkles" [size]="32"></lucide-icon>
            <h3>Compartilhe suas ideias</h3>
            <p>Publique pensamentos, fotos e muito mais com sua comunidade.</p>
          </div>
          <div class="feature">
            <lucide-icon name="search" [size]="32"></lucide-icon>
            <h3>Descubra conteúdo</h3>
            <p>Explore publicações de pessoas que você segue e além.</p>
          </div>
          <div class="feature">
            <lucide-icon name="message-circle" [size]="32"></lucide-icon>
            <h3>Interaja</h3>
            <p>Comente, responda e construa conversas significativas.</p>
          </div>
        </div>
        
        <div class="cta-section">
          <h2>Pronto para participar?</h2>
          <p>Junte-se a milhares de pessoas já conectadas no JVerso.</p>
          <div class="cta-buttons">
            <a routerLink="/register" class="btn btn-primary">Criar conta</a>
            <a routerLink="/login" class="btn btn-secondary">Entrar</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: calc(100vh - 200px);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    
    .hero {
      text-align: center;
      max-width: 600px;
    }
    
    .hero-content {
      margin-bottom: 48px;
    }
    
    .logo-large {
      margin-bottom: 24px;
      
      .logo-icon {
        width: 80px;
        height: 80px;
        background: var(--primary);
        border-radius: var(--radius-xl);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--text-inverse);
        font-weight: var(--font-bold);
        font-size: var(--font-4xl);
      }
    }
    
    h1 {
      font-size: var(--font-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-3);
      
      .brand {
        color: var(--primary);
      }
    }
    
    .tagline {
      font-size: 18px;
      color: var(--text-secondary);
      margin-bottom: 0;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }
    
    .feature {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      
      .feature-icon {
        font-size: 32px;
        margin-bottom: 12px;
        display: block;
      }
      
      h3 {
        font-size: var(--font-base);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }
      
      p {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        line-height: var(--leading-normal);
        margin: 0;
      }
    }
    
    .cta-section {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-2xl);
      padding: var(--space-10) var(--space-8);
      
      h2 {
        font-size: var(--font-2xl);
        font-weight: var(--font-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }
      
      p {
        font-size: var(--font-base);
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
      }
    }
    
    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: var(--space-4) var(--space-8);
      border-radius: var(--radius-full);
      font-size: var(--font-base);
      font-weight: var(--font-semibold);
      text-decoration: none;
      transition: all var(--duration-200) var(--ease-out);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }
    
    .btn-primary {
      background: var(--primary);
      color: var(--text-inverse);
      
      &:hover {
        background: var(--primary-hover);
        transform: translateY(-2px);
      }
    }
    
    .btn-secondary {
      background: var(--background);
      color: var(--text-primary);
      border: 1px solid var(--border);
      
      &:hover {
        background: var(--background-secondary);
        text-decoration: none;
      }
    }
    
    @media (max-width: 480px) {
      .features {
        grid-template-columns: 1fr;
      }
      
      .cta-buttons {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class LandingComponent {}