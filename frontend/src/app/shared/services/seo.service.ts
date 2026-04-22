import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

export interface SEOMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SEOService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  private readonly SITE_NAME = 'JVerso';
  private readonly DEFAULT_IMAGE = '/assets/og-image.png';
  private readonly BASE_URL = 'https://jverso.com';

  updateMetadata(data: SEOMetadata): void {
    const fullTitle = data.title ? `${data.title} | ${this.SITE_NAME}` : this.SITE_NAME;
    const description = data.description || 'Junte-se à comunidade JVerso - Compartilhe suas ideias';
    const image = data.image || this.DEFAULT_IMAGE;
    const url = data.url ? `${this.BASE_URL}${data.url}` : this.BASE_URL;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.SITE_NAME });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    if (data.author) {
      this.meta.updateTag({ property: 'article:author', content: data.author });
    }
    if (data.publishedAt) {
      this.meta.updateTag({ property: 'article:published_time', content: data.publishedAt });
    }
  }

  resetMetadata(): void {
    this.updateMetadata({});
  }

  updateForProfile(username: string, name?: string, avatar?: string): void {
    const displayName = name || username;
    this.updateMetadata({
      title: `Perfil de ${displayName}`,
      description: `Veja o perfil de ${displayName} no JVerso`,
      image: avatar,
      type: 'profile',
    });
  }

  updateForPost(content: string, authorName?: string, mediaUrl?: string): void {
    const preview = content.substring(0, 160);
    this.updateMetadata({
      title: authorName ? `Post de ${authorName}` : 'Post no JVerso',
      description: preview,
      image: mediaUrl,
      type: 'article',
    });
  }

  updateForHome(): void {
    this.updateMetadata({
      title: 'Home',
      description: 'Feed - Junte-se à comunidade JVerso',
    });
  }
}