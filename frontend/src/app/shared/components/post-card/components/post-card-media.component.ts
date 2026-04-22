import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Post } from '../../../models/post.model';
import { getYouTubeEmbedUrl } from '../../../utils/media.utils';

@Component({
  selector: 'app-post-card-media',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (post().mediaUrl && post().mediaType === 'image') {
      <img [src]="post().mediaUrl" alt="Mídia do post" class="post-media" />
    }
    @if (post().mediaUrl && post().mediaType === 'youtube') {
      <iframe [src]="getYouTubeEmbed(post().mediaUrl!)" frameborder="0" allowfullscreen class="post-media-video" loading="lazy"></iframe>
    }
    @if (post().linkUrl) {
      <a [href]="post().linkUrl" target="_blank" rel="noopener noreferrer" class="post-link-preview">
        {{ post().linkUrl }}
      </a>
    }
  `,
  styles: [`
    .post-media { max-width: 100%; max-height: 400px; border-radius: 12px; margin-top: 12px; object-fit: contain; }
    .post-media-video { width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; margin-top: 12px; border: none; }
    .post-link-preview { display: block; margin-top: 8px; color: var(--primary); font-size: 14px; word-break: break-all; text-decoration: none; }
    .post-link-preview:hover { text-decoration: underline; }
  `]
})
export class PostCardMediaComponent {
  post = input.required<Post>();

  constructor(private sanitizer: DomSanitizer) {}

  getYouTubeEmbed(url: string): SafeResourceUrl | null {
    return getYouTubeEmbedUrl(url, this.sanitizer);
  }
}
