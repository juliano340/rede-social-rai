import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
            <span class="feature-icon">✨</span>
            <h3>Compartilhe suas ideias</h3>
            <p>Publique pensamentos, fotos e muito mais com sua comunidade.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🔍</span>
            <h3>Descubra conteúdo</h3>
            <p>Explore publicações de pessoas que você segue e além.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">💬</span>
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
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 40px;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
      }
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
      
      .brand {
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
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
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
      }
    }
    
    .cta-section {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px 32px;
      
      h2 {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
      
      p {
        font-size: 16px;
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }
    
    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 14px 32px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      color: white;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
        text-decoration: none;
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