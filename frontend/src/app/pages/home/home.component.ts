import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PostsService, Post } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SkeletonComponent, LucideIconsModule],
  template: `
    <div class="home-page">
      <h1>Feed</h1>
      
      <!-- Feed Tabs -->
      @if (authService.isLoggedIn()) {
        <div class="feed-tabs">
          <button 
            class="feed-tab" 
            [class.active]="feedType() === 'all'"
            (click)="switchFeed('all')"
          >
            Para você
          </button>
          <button 
            class="feed-tab" 
            [class.active]="feedType() === 'following'"
            (click)="switchFeed('following')"
          >
            Seguindo
          </button>
        </div>
      }
      
      @if (authService.isLoggedIn()) {
        <div class="new-post">
          <textarea 
            [(ngModel)]="newPostContent" 
            placeholder="O que está acontecendo?"
            maxlength="280"
            [disabled]="isSubmitting()"
            aria-label="O que está acontecendo?"
          ></textarea>
          
          @if (showMediaInput()) {
            <div class="media-input">
              <div class="media-type-selector">
                <button 
                  [class.active]="newMediaType() === 'image'"
                  (click)="setNewMediaType('image')"
                >
                  <lucide-icon name="image" [size]="16"></lucide-icon> Imagem
                </button>
                <button 
                  [class.active]="newMediaType() === 'youtube'"
                  (click)="setNewMediaType('youtube')"
                >
                  <lucide-icon name="youtube" [size]="16"></lucide-icon> YouTube
                </button>
                <button 
                  [class.active]="newMediaType() === 'link'"
                  (click)="setNewMediaType('link')"
                >
                  <lucide-icon name="link" [size]="16"></lucide-icon> Link
                </button>
              </div>
              @if (newMediaType()) {
                <input 
                  type="text" 
                  [(ngModel)]="newMediaUrl" 
                  [placeholder]="newMediaType() === 'link' ? 'URL do site externo' : (newMediaType() === 'image' ? 'URL da imagem (jpg, png, gif, webp)' : 'URL do vídeo do YouTube')"
                  class="media-url-input"
                />
                @if (newMediaUrl) {
                  <div class="media-preview-container">
                    @if (newMediaType() === 'image' && isValidImageUrl(newMediaUrl)) {
                      <img [src]="newMediaUrl" alt="Preview" class="media-preview" />
                    }
                    @if (newMediaType() === 'youtube') {
                      <iframe [src]="getYouTubeEmbedUrl(newMediaUrl)" frameborder="0" allowfullscreen class="media-preview-video" loading="lazy"></iframe>
                    }
                    <button class="remove-media" (click)="removeNewMedia()">Remover mídia</button>
                  </div>
                }
                @if (!newMediaUrl) {
                  <button class="remove-media" (click)="removeNewMedia()">Cancelar</button>
                }
              }
            </div>
          } @else {
            <button class="add-media-btn" (click)="showMediaInput.set(true)">
              <lucide-icon name="image" [size]="16"></lucide-icon> Adicionar mídia
            </button>
          }
          
          <div class="new-post-footer">
            <span 
              class="char-count" 
              [class.warning]="newPostContent.length > 260"
              [class.danger]="newPostContent.length >= 280"
            >
              {{ newPostContent.length }}/280
            </span>
            <button 
              (click)="createPost()" 
              [disabled]="!canSubmit()"
              [class.loading]="isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="spinner"></span>
                Publicando...
              } @else {
                Publicar
              }
            </button>
          </div>
          @if (submitError()) {
            <div class="submit-error" role="alert">
              {{ submitError() }}
            </div>
          }
          @if (submitSuccess()) {
            <div class="submit-success" role="status">
              Post publicado com sucesso!
            </div>
          }
        </div>
      }
      
      <div class="posts-container">
        @if (isLoading()) {
          <div class="skeleton-feed">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-post">
                <div class="skeleton-post-header">
                  <app-skeleton type="avatar" />
                  <div class="skeleton-post-header-text">
                    <app-skeleton type="text" width="120px" />
                    <app-skeleton type="text" width="80px" height="12px" />
                  </div>
                </div>
                <app-skeleton type="text" />
                <app-skeleton type="text" width="60%" />
              </div>
            }
          </div>
        } @else if (loadError()) {
          <div class="error-state" role="alert">
            <p>Algo deu errado ao carregar o feed.</p>
            <button (click)="loadPosts()">Tentar novamente</button>
          </div>
        } @else if (posts().length === 0) {
          <div class="empty-state">
            <lucide-icon name="file-text" [size]="48" class="empty-icon"></lucide-icon>
            <p>Nenhuma publicação ainda.</p>
            <span>Seja o primeiro a compartilhar algo!</span>
          </div>
        } @else {
          <div class="posts">
            @for (post of posts(); track post.id) {
              <article class="post" [class.deleting]="deletingPostId() === post.id" [class.highlight-post]="highlightPostId() === post.id" [attr.id]="'post-' + post.id">
                <div class="post-avatar">
                  @if (post.author.avatar) {
                    <img [src]="getAvatarUrl(post.author.avatar)" alt="Avatar" class="avatar-image">
                  } @else {
                    <div class="avatar-placeholder" aria-hidden="true">
                      {{ ((post.author.name && post.author.name[0]) || '?').toUpperCase() }}
                    </div>
                  }
                </div>
                <div class="post-content">
                  <div class="post-header">
                    <a [routerLink]="['/profile', post.author.username]" class="author-name">
                      {{ post.author.name }}
                    </a>
                    <span class="author-username">&#64;{{ post.author.username }}</span>
                    <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                  </div>
                  <p class="post-text">{{ post.content }}</p>
                  @if (post.mediaUrl && post.mediaType === 'image') {
                    <img [src]="post.mediaUrl" alt="Mídia do post" class="post-media" />
                  }
                  @if (post.mediaUrl && post.mediaType === 'youtube') {
                    <iframe [src]="getYouTubeEmbedUrl(post.mediaUrl)" frameborder="0" allowfullscreen class="post-media-video" loading="lazy"></iframe>
                  }
                  @if (post.linkUrl) {
                    <a [href]="post.linkUrl" target="_blank" rel="noopener noreferrer" class="external-link-btn">
                      <lucide-icon name="external-link" [size]="14"></lucide-icon>
                      Abrir link
                    </a>
                  }
@if (editingPost() === post.id) {
<div class="edit-post-form">
  <textarea
    [(ngModel)]="editPostContent"
    maxlength="280"
    class="edit-post-textarea"
  ></textarea>
  <div class="media-type-selector">
    <button
      [class.active]="editMediaType() === 'image'"
      (click)="setEditMediaType('image')"
    >
      <lucide-icon name="image" [size]="14"></lucide-icon> Imagem
    </button>
    <button
      [class.active]="editMediaType() === 'youtube'"
      (click)="setEditMediaType('youtube')"
    >
      <lucide-icon name="youtube" [size]="14"></lucide-icon> YouTube
    </button>
    <button
      [class.active]="editLinkUrl() !== null"
      (click)="editLinkUrl() !== null ? clearEditLinkPreview() : editLinkUrl.set('')"
    >
      <lucide-icon name="link" [size]="14"></lucide-icon> Link
    </button>
  </div>
  @if (editMediaType()) {
      <div class="media-edit-row">
        <input
          type="text"
          [(ngModel)]="editMediaUrl"
          [placeholder]="editMediaType() === 'image' ? 'URL da imagem' : 'URL do YouTube'"
          class="media-url-input"
        />
      </div>
    }
    @if (editLinkUrl() !== null) {
      <div class="media-edit-row">
        <input
          type="text"
          [ngModel]="editLinkUrl()"
          (ngModelChange)="editLinkUrl.set($event)"
          placeholder="URL do link"
          class="media-url-input"
        />
      </div>
    }
    <div class="edit-post-actions">
    <span class="char-count">{{ editPostContent.length }}/280</span>
    <button class="cancel-btn" (click)="cancelEditPost()">Cancelar</button>
    <button
      class="save-btn"
      (click)="saveEditPost(post.id)"
      [disabled]="!editPostContent.trim() || editPostContent.length > 280"
    >
      Salvar
    </button>
  </div>
</div>
}
                  <div class="post-actions">
                    <button 
                      class="action-btn like" 
                      (click)="toggleLike(post)"
                      [class.liked]="postLikes()[post.id]"
                      [disabled]="postLikingId() === post.id"
                    >
                      <lucide-icon name="heart" [size]="18" [class.filled]="postLikes()[post.id]"></lucide-icon>
                      <span>{{ post._count.likes }}</span>
                    </button>
                    <button 
                      class="action-btn reply" 
                      (click)="toggleReply(post.id)"
                      [class.active]="replyingToPost() === post.id || viewingRepliesPost() === post.id"
                    >
                      <lucide-icon name="message-circle" [size]="18"></lucide-icon>
                      <span>{{ post._count.replies }}</span>
                    </button>
                    @if (authService.currentUser()?.id === post.author.id) {
                      <button
                        class="action-btn edit"
                        (click)="startEditPost(post)"
                        [disabled]="editingPost() === post.id"
                      >
                        <lucide-icon name="pencil" [size]="18"></lucide-icon>
                      </button>
                      <button
                        class="action-btn delete"
                        (click)="deletePost(post.id)"
                        [disabled]="deletingPostId() === post.id"
                      >
                        <lucide-icon name="trash-2" [size]="18"></lucide-icon>
                      </button>
                    }
                  </div>
                  
                  @if (viewingRepliesPost() === post.id || replyingToPost() === post.id) {
                    <div class="replies-list">
                      <button class="close-replies" (click)="toggleReply(post.id)">
                        <lucide-icon name="x" [size]="18"></lucide-icon>
                      </button>
                      
                      <!-- Show comment link -->
                      @if (replyingToPost() !== post.id) {
                        <button class="add-reply-link" (click)="openReplyForm(post.id)">
                          <lucide-icon name="message-circle" [size]="16"></lucide-icon> Comentar
                        </button>
                      }
                      
                      <!-- Reply form -->
                      @if (replyingToPost() === post.id) {
                        <div class="reply-form">
                          <textarea 
                            [(ngModel)]="replyContent" 
                            placeholder="Escreva um comentário..."
                            maxlength="280"
                          ></textarea>
                          <div class="reply-actions">
                            <span class="char-count">{{ replyContent.length }}/280</span>
                            <div class="reply-buttons">
                              <button class="cancel-btn" (click)="cancelReply()">Cancelar</button>
                              <button 
                                class="submit-reply-btn" 
                                (click)="submitReply(post.id)"
                                [disabled]="!replyContent.trim() || isSubmittingReply()"
                              >
                                Comentar
                              </button>
                            </div>
                          </div>
                        </div>
                      }
                      
                      @if (loadingReplies()) {
                        <div class="loading-replies">
                          <div class="spinner-sm"></div>
                        </div>
                      } @else if (postReplies().length === 0 && replyingToPost() !== post.id) {
                        <p class="no-replies">Nenhuma resposta ainda.</p>
                      } @else {
                        @for (reply of postReplies(); track reply.id) {
                          <div class="reply-item" [class.highlight-reply]="highlightReplyId() === reply.id" [attr.id]="'reply-' + reply.id">
                            <div class="reply-avatar">
                              @if (reply.author.avatar) {
                                <img [src]="getAvatarUrl(reply.author.avatar)" alt="Avatar" class="avatar-image">
                              } @else {
                                {{ ((reply.author.name && reply.author.name[0]) || '?').toUpperCase() }}
                              }
                            </div>
                            <div class="reply-content">
                              <div class="reply-header">
                                <span class="reply-name">{{ reply.author.name }}</span>
                                <span class="reply-username">&#64;{{ reply.author.username }}</span>
                              </div>
                              @if (editingReply() === reply.id) {
                                <div class="edit-reply-form">
                                  <textarea 
                                    [(ngModel)]="editReplyContent" 
                                    maxlength="280"
                                  ></textarea>
                                  <div class="edit-actions">
                                    <button class="cancel-edit" (click)="cancelEditReply()">Cancelar</button>
                                    <button 
                                      class="save-edit" 
                                      (click)="saveEditReply(reply.id, post.id)"
                                      [disabled]="!editReplyContent.trim() || savingReply()"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              } @else {
                                <p class="reply-text">{{ reply.content }}</p>
                              }
                              @if (authService.currentUser()?.id === reply.author.id && editingReply() !== reply.id) {
                                <div class="reply-actions">
                                  <button class="reply-edit-btn" (click)="startEditReply(reply)">Editar</button>
                                  <button class="reply-delete-btn" (click)="deleteReply(reply.id, post.id)">Excluir</button>
                                </div>
                              }
                              @if (authService.currentUser() && editingReply() !== reply.id) {
                                <button class="reply-to-reply-btn" (click)="toggleReplyToComment(reply.id)">
                                  Responder
                                </button>
                              }
                              @if (replyingToComment() === reply.id) {
                                <div class="reply-to-reply-form">
                                  <textarea 
                                    [(ngModel)]="replyingToCommentContent" 
                                    placeholder="Escreva uma resposta..."
                                    maxlength="280"
                                  ></textarea>
                                  <div class="reply-actions">
                                    <button class="cancel-btn" (click)="cancelReplyToComment()">Cancelar</button>
                                    <button 
                                      class="submit-reply-btn" 
                                      (click)="submitReplyToComment(reply.id, post.id)"
                                      [disabled]="!replyingToCommentContent.trim()"
                                    >
                                      Responder
                                    </button>
                                  </div>
                                </div>
                              }
                              
                              <!-- Nested replies (children) -->
                              @if (reply.children && reply.children.length > 0) {
                                <div class="nested-replies">
                                  @for (child of reply.children; track child.id) {
                                    <div class="reply-item nested">
                                      <div class="reply-avatar small">
                                        @if (child.author.avatar) {
                                          <img [src]="getAvatarUrl(child.author.avatar)" alt="Avatar" class="avatar-image">
                                        } @else {
                                          {{ ((child.author.name && child.author.name[0]) || '?').toUpperCase() }}
                                        }
                                      </div>
                                      <div class="reply-content">
                                        <div class="reply-header">
                                          <span class="reply-name">{{ child.author.name }}</span>
                                          <span class="reply-username">&#64;{{ child.author.username }}</span>
                                        </div>
                                        @if (editingNestedReply() === child.id) {
                                          <div class="edit-reply-form">
                                            <textarea 
                                              [(ngModel)]="editNestedReplyContent" 
                                              maxlength="280"
                                            ></textarea>
                                            <div class="edit-actions">
                                              <button class="cancel-edit" (click)="cancelEditNestedReply()">Cancelar</button>
                                              <button 
                                                class="save-edit" 
                                                (click)="saveEditNestedReply(child.id, post.id)"
                                                [disabled]="!editNestedReplyContent.trim() || savingReply()"
                                              >
                                                Salvar
                                              </button>
                                            </div>
                                          </div>
                                        } @else {
                                          <p class="reply-text">{{ child.content }}</p>
                                        }
                                        @if (authService.currentUser()?.id === child.author.id && editingNestedReply() !== child.id) {
                                          <div class="reply-actions">
                                            <button class="reply-edit-btn" (click)="startEditNestedReply(child)">Editar</button>
                                            <button class="reply-delete-btn" (click)="deleteNestedReply(child.id, post.id)">Excluir</button>
                                          </div>
                                        }
                                      </div>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                        }
                      }
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="closeDeleteModal()">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">⚠️</div>
          <h2>Excluir Resposta</h2>
          <p>Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="modal-cancel" (click)="closeDeleteModal()">Cancelar</button>
            <button class="modal-confirm" (click)="confirmDeleteReply()">Excluir</button>
          </div>
        </div>
      </div>
    }
    
    @if (showDeletePostModal()) {
      <div class="modal-overlay" (click)="closeDeletePostModal()">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <lucide-icon name="trash-2" [size]="48" class="modal-icon"></lucide-icon>
          <h2>Excluir Postagem</h2>
          <p>Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="modal-cancel" (click)="closeDeletePostModal()">Cancelar</button>
            <button class="modal-confirm" (click)="confirmDeletePost()">Excluir</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
.home-page h1 {
      font-size: 20px;
      font-weight: 700;
    }
    
    .highlight-post {
      animation: highlight-fade 3s ease-out;
    }
    
    .highlight-reply {
      animation: highlight-fade 3s ease-out;
      border-radius: 8px;
    }
    
    @keyframes highlight-fade {
      0% { background: rgba(99, 102, 241, 0.2); }
      100% { background: transparent; }
    }
    
    .feed-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      
      .feed-tab {
        flex: 1;
        padding: 12px;
        background: none;
        border: none;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
        
        &:hover {
          color: var(--text-primary);
          background: var(--background-secondary);
        }
        
        &.active {
          color: var(--text-primary);
          border-bottom-color: var(--primary);
        }
      }
    }
     
    .add-media-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      cursor: pointer;
      padding: 8px 0;
      
      &:hover {
        color: var(--primary);
      }
    }
     
.media-input {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-tertiary);
      border-radius: 8px;
    }
     
     .link-detected-banner {
       display: flex;
       align-items: center;
       gap: 8px;
       padding: 10px 12px;
       background: var(--primary-light);
       border: 1px solid var(--primary);
       border-radius: 8px;
       margin-top: 12px;
       font-size: 14px;
       
       .link-icon {
         font-size: 16px;
       }
       
       .link-url {
         color: var(--text-primary);
         font-weight: 500;
         flex: 1;
       }
       
       .btn-add-preview {
         padding: 6px 12px;
         background: var(--primary);
         color: white;
         border: none;
         border-radius: 6px;
         font-size: 13px;
         cursor: pointer;
         
         &:hover {
           background: var(--primary-hover);
         }
       }
       
       .btn-ignore-link {
         padding: 6px 12px;
         background: none;
         color: var(--text-secondary);
         border: 1px solid var(--border);
         border-radius: 6px;
         font-size: 13px;
         cursor: pointer;
         
         &:hover {
           background: var(--background-secondary);
         }
       }
     }
     
     .link-preview-form {
       margin-top: 12px;
       padding: 12px;
       background: var(--background-tertiary);
       border-radius: 8px;
       
       .link-preview-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 12px;
         font-weight: 600;
         font-size: 14px;
         color: var(--text-primary);
         
         .link-preview-close {
           background: none;
           border: none;
           color: var(--text-secondary);
           cursor: pointer;
           padding: 4px;
           
           &:hover {
             color: var(--error);
           }
         }
       }
       
       .link-field {
         margin-bottom: 8px;
         
         .link-input {
           width: 100%;
           padding: 8px 12px;
           border: 1px solid var(--border);
           border-radius: 6px;
           font-size: 14px;
           color: var(--text-primary);
           background: var(--background);
           
           &:focus {
             outline: none;
             border-color: var(--primary);
           }
         }
         
         .link-textarea {
           width: 100%;
           padding: 8px 12px;
           border: 1px solid var(--border);
           border-radius: 6px;
           font-size: 14px;
           color: var(--text-primary);
           background: var(--background);
           resize: none;
           min-height: 60px;
           
           &:focus {
             outline: none;
             border-color: var(--primary);
           }
         }
       }
       
       .link-preview-card {
         display: flex;
         flex-direction: column;
         border: 1px solid var(--border);
         border-radius: 12px;
         overflow: hidden;
         margin-top: 12px;
         
         .preview-image {
           width: 100%;
           height: 120px;
           object-fit: cover;
           background: var(--background-tertiary);
         }
         
         .preview-placeholder {
           width: 100%;
           height: 120px;
           display: flex;
           align-items: center;
           justify-content: center;
           background: var(--background-tertiary);
           color: var(--text-tertiary);
         }
         
         .preview-content {
           padding: 10px 12px;
           
           .preview-title {
             font-weight: 600;
             font-size: 14px;
             color: var(--text-primary);
             margin-bottom: 4px;
           }
           
           .preview-desc {
             font-size: 13px;
             color: var(--text-secondary);
             line-height: 1.4;
             margin-bottom: 6px;
           }
           
           .preview-domain {
             display: flex;
             align-items: center;
             gap: 4px;
             font-size: 12px;
             color: var(--text-tertiary);
           }
         }
       }
     }
     
     .media-type-selector {
       display: flex;
       gap: 8px;
       margin-bottom: 8px;
       
       button {
         display: flex;
         align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid var(--border);
        border-radius: 20px;
        background: var(--background);
        color: var(--text-secondary);
        font-size: 13px;
        cursor: pointer;
        
&.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

&:hover:not(.active) {
  background: var(--background-secondary);
}

.clear-type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: 1px solid var(--error);
  border-radius: 20px;
  background: transparent;
  color: var(--error);
  cursor: pointer;

  &:hover {
    background: var(--error);
    color: white;
  }
}
}
}
     
     .media-edit-row {
       display: flex;
       gap: 8px;
       align-items: center;
       
       .media-url-input {
         flex: 1;
       }
       
       .remove-media-sm {
         flex-shrink: 0;
         padding: 8px;
         background: var(--background-secondary);
         border: 1px solid var(--border);
         border-radius: 8px;
         color: var(--text-secondary);
         cursor: pointer;
         
         &:hover {
           background: var(--border);
           color: var(--error);
         }
       }
     }
     
     .media-url-input {
       width: 100%;
       padding: 8px 12px;
       border: 1px solid var(--border);
       border-radius: 8px;
       font-size: 14px;
       color: var(--text-primary);
       background: var(--background);
       
       &:focus {
         outline: none;
         border-color: var(--primary);
      }
    }
     
    .media-preview-container {
      margin-top: 8px;
      
      .media-preview {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        object-fit: contain;
      }
      
      .media-preview-video {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        border: none;
      }
    }
     
    .remove-media {
      margin-top: 8px;
      background: none;
      border: none;
      color: var(--error);
      font-size: 13px;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline;
      }
    }
     
    .remove-media-sm {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 4px 8px;
      background: none;
      border: none;
      color: var(--error);
      font-size: 12px;
      cursor: pointer;
    }
     
    .post-media {
      max-width: 100%;
      max-height: 400px;
      border-radius: 12px;
      margin-top: 12px;
      object-fit: contain;
    }
     
    .post-media-video {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      margin-top: 12px;
      border: none;
    }
    
    .external-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--background-tertiary);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text-primary);
      font-size: 14px;
      text-decoration: none;
      margin-top: 12px;
      transition: all 0.2s;
      
      &:hover {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary);
      }
    }
    
    .new-post {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      transition: box-shadow 0.2s, border-color 0.2s;
      
      &:focus-within {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.2);
      }
      
      textarea {
        width: 100%;
        border: none;
        resize: none;
        font-size: 18px;
        min-height: 80px;
        outline: none;
        color: var(--text-primary);
        background: var(--background);
        transition: opacity 0.2s;
        
        &::placeholder {
          color: var(--text-tertiary);
        }
        
        &:disabled {
          opacity: 0.6;
        }
      }
    }
    
    .new-post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      
      .char-count {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
        
        &.warning {
          color: #f59e0b;
        }
        
        &.danger {
          color: var(--error);
        }
      }
      
      button {
        background: var(--primary);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s, transform 0.1s, opacity 0.2s;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        
        &:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        &.loading {
          background: var(--primary-hover);
        }
      }
    }
    
    .submit-error {
      margin-top: 12px;
      padding: 10px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: var(--error);
      font-size: 14px;
    }
    
    .submit-success {
      margin-top: 12px;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      color: var(--success);
      font-size: 14px;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
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
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .skeleton-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .skeleton-post {
      background: var(--background-secondary);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-post-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .skeleton-post-header-text {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 60px 20px;
      
      p {
        color: var(--text-secondary);
        margin-top: 12px;
      }
      
      button {
        margin-top: 16px;
        padding: 10px 20px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 20px;
        font-weight: 600;
        
        &:hover {
          background: var(--primary-hover);
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      
      .empty-icon {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        color: var(--text-tertiary);
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
    
    .posts {
      display: flex;
      flex-direction: column;
    }
    
    .post {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--background-secondary);
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
      
      &:hover {
        background: var(--background-tertiary);
      }
      
      &.deleting {
        opacity: 0.5;
      }
    }
    
    .post-avatar {
      flex-shrink: 0;
      
      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
    }
    
    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #0d8ecf);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 20px;
    }
    
    .post-content {
      flex: 1;
      min-width: 0;
    }
    
    .post-header {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    
    .author-name {
      font-weight: 700;
      color: var(--text-primary);
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .author-username, .post-time {
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .post-text {
      margin: 8px 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
    }
    
    .post-actions {
      display: flex;
      gap: 16px;
    }
    
    .action-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      font-size: 14px;
      padding: 6px 8px;
      border-radius: 20px;
      transition: background 0.2s, color 0.2s;
      
      &:hover {
        background: rgba(224, 36, 94, 0.1);
        color: var(--error);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.like.liked {
        color: #e0245e;
        
        lucide-icon {
          fill: currentColor;
        }
      }
      
      &.reply:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      &.edit:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      lucide-icon {
        color: currentColor;
      }
    }
    
    .reply-form {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-secondary);
      border-radius: var(--radius-md);
      
      textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 10px;
        font-size: 14px;
        resize: none;
        min-height: 60px;
        color: var(--text-primary);
        background: var(--background);
        
        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }
      
      .reply-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        
        .char-count {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        
        .reply-buttons {
          display: flex;
          gap: 8px;
          
          .cancel-btn {
            background: none;
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: var(--radius-full);
            font-size: 14px;
            color: var(--text-primary);
            
            &:hover {
              background: var(--background-secondary);
            }
          }
          
          .submit-reply-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: var(--radius-full);
            font-size: 14px;
            font-weight: 500;
            
            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }
            
            &:disabled {
              opacity: 0.5;
            }
          }
        }
      }
    }

    .edit-post-form {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-secondary);
      border-radius: var(--radius-md);

      textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 10px;
        font-size: 14px;
        resize: none;
        min-height: 60px;
        color: var(--text-primary);
        background: var(--background);
      }

      .edit-post-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        margin-top: 8px;

        .char-count {
          margin-right: auto;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .cancel-btn {
          background: none;
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 14px;
          cursor: pointer;
          color: var(--text-primary);

          &:hover {
            background: var(--background-secondary);
          }
        }

        .save-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;

          &:hover:not(:disabled) {
            background: var(--primary-hover);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    .replies-list {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-secondary);
      border-radius: var(--radius-md);
      position: relative;
      
      .close-replies {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 16px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        
        &:hover {
          background: var(--border);
        }
      }
      
      .add-reply-link {
        display: block;
        width: 100%;
        padding: 10px;
        background: none;
        border: none;
        color: var(--primary);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid var(--border);
        
        &:hover {
          background: var(--background-secondary);
        }
      }
      
      .loading-replies {
        text-align: center;
        padding: 20px;
      }
      
      .no-replies {
        text-align: center;
        color: var(--text-secondary);
        padding: 20px;
      }
      
      .reply-item {
        display: flex;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
        
        &:last-child {
          border-bottom: none;
        }
      }
      
      .reply-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), #0d8ecf);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        flex-shrink: 0;
        overflow: hidden;
        
        .avatar-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
      }
      
      .reply-content {
        flex: 1;
        min-width: 0;
        
        .reply-header {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }
        
        .reply-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 14px;
        }
        
        .reply-username {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .reply-text {
          color: var(--text-primary);
          font-size: 14px;
        }
        
        .edit-reply-form {
          margin-top: 8px;
          
          textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 8px;
            font-size: 14px;
            resize: none;
            min-height: 50px;
            color: var(--text-primary);
            background: var(--background);
            
            &:focus {
              outline: none;
              border-color: var(--primary);
            }
          }
          
          .edit-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            justify-content: flex-end;
          }
          
          .cancel-edit, .save-edit {
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            cursor: pointer;
          }
          
          .cancel-edit {
            background: var(--background-secondary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            
            &:hover {
              background: var(--border);
            }
          }
          
          .save-edit {
            background: var(--primary);
            color: white;
            border: none;
            
            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }
            
            &:disabled {
              opacity: 0.5;
            }
          }
        }
        
        .reply-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          
          .reply-edit-btn, .reply-delete-btn {
            background: none;
            border: none;
            font-size: 12px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            
            &:hover {
              background: var(--background-secondary);
            }
          }
          
          .reply-delete-btn {
            color: var(--error);
          }
        }
        
        .reply-to-reply-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 12px;
          cursor: pointer;
          padding: 2px 6px;
          margin-top: 4px;
          
          &:hover {
            text-decoration: underline;
          }
        }
        
        .reply-to-reply-form {
          margin-top: 8px;
          
          textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 8px;
            font-size: 13px;
            resize: none;
            min-height: 40px;
            color: var(--text-primary);
            background: var(--background);
            
            &:focus {
              outline: none;
              border-color: var(--primary);
            }
          }
          
          .reply-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 6px;
          }
          
          .cancel-btn, .submit-reply-btn {
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            cursor: pointer;
          }
          
          .cancel-btn {
            background: var(--background-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
            
            &:hover {
              background: var(--border);
            }
          }
          
          .submit-reply-btn {
            background: var(--primary);
            color: white;
            border: none;
            
            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }
            
            &:disabled {
              opacity: 0.5;
            }
          }
        }
        
        .nested-replies {
          margin-top: 8px;
          padding-left: 12px;
          border-left: 2px solid var(--border);
          
          .reply-item.nested {
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
            
            &:last-child {
              border-bottom: none;
            }
            
            .reply-avatar.small {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--primary), #0d8ecf);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 10px;
              flex-shrink: 0;
              overflow: hidden;
              
              .avatar-image {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                object-fit: cover;
              }
            }
            
            .reply-text {
              color: var(--text-primary);
              font-size: 14px;
            }
            
            .edit-reply-form {
              margin-top: 8px;
              
              textarea {
                width: 100%;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 8px;
                font-size: 14px;
                resize: none;
                min-height: 50px;
                color: var(--text-primary);
                background: var(--background);
                
                &:focus {
                  outline: none;
                  border-color: var(--primary);
                }
              }
              
              .edit-actions {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 4px;
                justify-content: flex-end;
              }
              
              .cancel-edit, .save-edit {
                padding: 4px 10px;
                border-radius: var(--radius-sm);
                font-size: 13px;
                cursor: pointer;
              }
              
.cancel-edit {
              background: var(--background-secondary);
              border: 1px solid var(--border);
              color: var(--text-primary);
              
              &:hover {
                background: var(--border);
              }
            }
              
              .save-edit {
                background: var(--primary);
                color: white;
                border: none;
                
                &:hover:not(:disabled) {
                  background: var(--primary-hover);
                }
                
                &:disabled {
                  opacity: 0.5;
                }
              }
            }
            
            .reply-actions {
              display: flex;
              gap: 8px;
              margin-top: 4px;
              
              .reply-edit-btn, .reply-delete-btn {
                background: none;
                border: none;
                font-size: 12px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                
                &:hover {
                  background: var(--background-secondary);
                }
              }
              
              .reply-delete-btn {
                color: var(--error);
              }
            }
          }
        }
      }
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    .confirm-modal {
      background: var(--background);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.2s ease;
      
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
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class HomeComponent implements OnInit {
  posts = signal<Post[]>([]);
  feedType = signal<'all' | 'following'>('all');
  newPostContent = '';
  newMediaUrl = '';
  newMediaType = signal<'image' | 'youtube' | 'link' | null>(null);
  showMediaInput = signal(false);
  
  linkDetected = signal<string | null>(null);
  showLinkPreview = signal(false);
  
  isSubmitting = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  deletingPostId = signal<string | null>(null);
  postLikingId = signal<string | null>(null);
  postLikes = signal<Record<string, boolean>>({});
  replyingToPost = signal<string | null>(null);
  viewingRepliesPost = signal<string | null>(null);
  postReplies = signal<any[]>([]);
  loadingReplies = signal(false);
  editingReply = signal<string | null>(null);
  editReplyContent = '';
  savingReply = signal(false);
  showDeleteModal = signal(false);
  showDeletePostModal = signal(false);
  deletingReplyId = signal<string | null>(null);
  deletingReplyPostId = signal<string | null>(null);
  replyContent = '';
  isSubmittingReply = signal(false);
  replyingToComment = signal<string | null>(null);
  replyingToCommentContent = '';
  
  highlightPostId = signal<string | null>(null);
  highlightReplyId = signal<string | null>(null);

  editingPost = signal<string | null>(null);
  editPostContent = '';
  editMediaUrl = '';
  editMediaType = signal<'image' | 'youtube' | null>(null);
  
  editLinkUrl = signal<string | null>(null);

  // Nested reply editing/deletion
  editingNestedReply = signal<string | null>(null);
  editNestedReplyContent = '';

  constructor(
    public authService: AuthService,
    private postsService: PostsService,
    private route: ActivatedRoute,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadPosts();
    this.route.queryParams.subscribe(params => {
      const postId = params['postId'];
      const replyId = params['replyId'];
      if (postId) {
        this.highlightPostId.set(postId);
        if (replyId) {
          this.highlightReplyId.set(replyId);
          this.viewingRepliesPost.set(postId);
          this.postsService.getReplies(postId).subscribe({
            next: (data) => {
              this.postReplies.set(data.replies || []);
              setTimeout(() => this.scrollToReply(replyId), 300);
            }
          });
        }
        setTimeout(() => this.scrollToPost(postId), 100);
      }
    });
  }

  private scrollToPost(postId: string) {
    const el = document.getElementById('post-' + postId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.highlightPostId.set(null), 3000);
    }
  }

  private scrollToReply(replyId: string) {
    const el = document.getElementById('reply-' + replyId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.highlightReplyId.set(null), 3000);
    }
  }

  canSubmit(): boolean {
    return this.newPostContent.trim().length > 0 && 
           this.newPostContent.length <= 280 &&
           !this.isSubmitting();
  }

loadPosts() {
    this.isLoading.set(true);
    this.loadError.set(null);
    
    const feed = this.feedType(); 
    const request = feed === 'following' 
      ? this.postsService.getFollowingPosts()
      : this.postsService.getPosts();
    
    request.subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.isLoading.set(false);

        if (this.authService.isLoggedIn()) {
          response.posts.forEach((post: any) => {
            this.postsService.isLiked(post.id).subscribe({
              next: (liked: any) => {
                this.postLikes.update(likes => ({ ...likes, [post.id]: liked }));
              },
            });
          });
        }
      },
      error: (err) => {
        this.loadError.set('Não foi possível carregar as publicações.');
        this.isLoading.set(false);
      }
    });
  }

  switchFeed(type: 'all' | 'following') {
    this.feedType.set(type);
    this.loadPosts();
  }

createPost() {
  if (!this.canSubmit()) return;
    
  this.submitError.set(null);
  this.submitSuccess.set(false);
  this.isSubmitting.set(true);
  
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  let linkUrl: string | null = null;
  
  if (this.newMediaType() === 'link') {
    linkUrl = this.normalizeUrl(this.newMediaUrl) || null;
  } else if (this.newMediaType()) {
    mediaUrl = this.newMediaUrl || null;
    mediaType = this.newMediaType();
  }
  
  this.postsService.createPost(this.newPostContent, mediaUrl, mediaType, linkUrl).subscribe({
    next: (post) => {
      this.posts.update(posts => [post, ...posts]);
      this.newPostContent = '';
      this.newMediaUrl = '';
      this.newMediaType.set(null);
      this.showMediaInput.set(false);
      this.isSubmitting.set(false);
      this.submitSuccess.set(true);
      
      setTimeout(() => this.submitSuccess.set(false), 3000);
    },
    error: (err) => {
      if (err.status === 429) {
        this.submitError.set('Você está publicando muito rápido. Aguarde um momento.');
      } else {
        this.submitError.set(err.error?.message || 'Erro ao publicar. Tente novamente.');
      }
      this.isSubmitting.set(false);
    }
  });
}

  deletePost(id: string) {
    this.showDeletePostModal.set(true);
    this.deletingPostId.set(id);
  }

  confirmDeletePost() {
    const id = this.deletingPostId();
    if (!id) return;
    
    this.postsService.deletePost(id).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p.id !== id));
        this.closeDeletePostModal();
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.closeDeletePostModal();
      }
    });
  }

  closeDeletePostModal() {
    this.showDeletePostModal.set(false);
    this.deletingPostId.set(null);
  }

startEditPost(post: Post) {
  this.editingPost.set(post.id);
  this.editPostContent = post.content;
  this.editMediaUrl = post.mediaUrl || '';
  this.editMediaType.set(post.mediaType as 'image' | 'youtube' | null);
  
  this.editLinkUrl.set(post.linkUrl ? post.linkUrl : null);
}

cancelEditPost() {
  this.editingPost.set(null);
  this.editPostContent = '';
  this.editMediaUrl = '';
  this.editMediaType.set(null);
  this.clearEditLinkPreview();
}

saveEditPost(postId: string) {
  if (!this.editPostContent.trim()) return;

  let mediaUrl: string | null;
  let mediaType: string | null;

  if (this.editMediaType() && this.editMediaUrl) {
    mediaUrl = this.editMediaUrl;
    mediaType = this.editMediaType()!;
  } else {
    mediaUrl = null;
    mediaType = null;
  }

  let linkUrl: string | null = this.normalizeUrl(this.editLinkUrl() || '');

  this.postsService.updatePost(postId, this.editPostContent, mediaUrl, mediaType, linkUrl).subscribe({
    next: (updated) => {
      this.posts.update(posts =>
        posts.map(p => p.id === postId ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl } : p)
      );
      this.cancelEditPost();
    },
    error: (err) => {
      console.error('Error editing post:', err);
      this.cancelEditPost();
    }
  });
}

  toggleLike(post: Post) {
    this.postLikingId.set(post.id);
    const isLiked = this.postLikes()[post.id];
    
    this.postsService.likePost(post.id).subscribe({
      next: () => {
        this.postLikes.update(likes => ({ ...likes, [post.id]: !isLiked }));
        post._count.likes += isLiked ? -1 : 1;
        this.postLikingId.set(null);
      },
error: (err) => {
        console.error('Error creating reply:', err);
        this.isSubmittingReply.set(false);
        if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao publicar comentário. Tente novamente.');
        }
      }
    });
  }

  submitReplyToComment(commentId: string, postId: string) {
    if (!this.replyingToCommentContent.trim()) return;
    
    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, this.replyingToCommentContent, commentId).subscribe({
      next: () => {
        this.postsService.getReplies(postId).subscribe({
          next: (data) => {
            this.postReplies.set(data.replies || []);
          }
        });
        this.cancelReplyToComment();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error('Error replying to comment:', err);
        this.isSubmittingReply.set(false);
        if (err.status === 401) {
          this.authService.logout();
        } else if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao responder comentário. Tente novamente.');
        }
      }
    });
  }

  submitReply(postId: string) {
    if (!this.replyContent.trim()) return;
    
    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, this.replyContent).subscribe({
      next: () => {
        // Atualizar contagem de replies
        const post = this.posts().find(p => p.id === postId);
        if (post) {
          post._count.replies += 1;
          this.posts.update(posts => [...posts]);
        }
        
        // Recarregar lista de comentários
        this.postsService.getReplies(postId).subscribe({
          next: (data) => {
            this.postReplies.set(data.replies || []);
          }
        });
        
        this.cancelReply();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error('Error creating reply:', err);
        this.isSubmittingReply.set(false);
        if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao publicar comentário. Tente novamente.');
        }
      }
    });
  }

  startEditReply(reply: any) {
    this.editingReply.set(reply.id);
    this.editReplyContent = reply.content;
  }

  cancelEditReply() {
    this.editingReply.set(null);
    this.editReplyContent = '';
  }

  saveEditReply(replyId: string, postId: string) {
    if (!this.editReplyContent.trim()) return;
    
    this.savingReply.set(true);
    this.postsService.updateReply(postId, replyId, this.editReplyContent).subscribe({
      next: (updated) => {
        this.postReplies.update(replies => 
          replies.map(r => r.id === replyId ? updated : r)
        );
        this.cancelEditReply();
        this.savingReply.set(false);
      },
      error: (err) => {
        console.error('Error editing reply:', err);
        this.savingReply.set(false);
      }
    });
  }

  deleteReply(replyId: string, postId: string) {
    this.showDeleteModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  confirmDeleteReply() {
    const replyId = this.deletingReplyId();
    const postId = this.deletingReplyPostId();
    
    if (!replyId || !postId) return;
    
    this.postsService.deleteReply(postId, replyId).subscribe({
      next: () => {
        this.postReplies.update(replies => 
          replies.map(r => {
            // Check if it's a nested reply (child of a reply)
            if (r.children && r.children.some((c: any) => c.id === replyId)) {
              r.children = r.children.filter((c: any) => c.id !== replyId);
            }
            return r;
          }).filter(r => r.id !== replyId) // Also filter top-level replies
        );
        // Atualizar contagem
        const post = this.posts().find(p => p.id === postId);
        if (post) {
          post._count.replies = Math.max(0, post._count.replies - 1);
          this.posts.update(posts => [...posts]);
        }
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting reply:', err);
        this.closeDeleteModal();
      }
    });
  }

closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingReplyId.set(null);
    this.deletingReplyPostId.set(null);
  }
  
  // Nested reply editing
  startEditNestedReply(reply: any) {
    this.editingNestedReply.set(reply.id);
    this.editNestedReplyContent = reply.content;
  }
  
  cancelEditNestedReply() {
    this.editingNestedReply.set(null);
    this.editNestedReplyContent = '';
  }
  
  saveEditNestedReply(replyId: string, postId: string) {
    if (!this.editNestedReplyContent.trim()) return;
    
    this.savingReply.set(true);
    this.postsService.updateReply(postId, replyId, this.editNestedReplyContent).subscribe({
      next: (updated) => {
        // Find the parent reply and update the child
        this.postReplies.update(replies => 
          replies.map(r => {
            if (r.children) {
              r.children = r.children.map((c: any) => 
                c.id === replyId ? { ...c, content: this.editNestedReplyContent } : c
              );
            }
            return r;
          })
        );
        this.cancelEditNestedReply();
        this.savingReply.set(false);
      },
      error: (err) => {
        console.error('Error editing nested reply:', err);
        this.savingReply.set(false);
      }
    });
  }
  
  deleteNestedReply(replyId: string, postId: string) {
    this.showDeleteModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  toggleReply(postId: string) {
    if (this.replyingToPost() === postId) {
      this.replyingToPost.set(null);
    } else {
      this.replyingToPost.set(postId);
      this.loadReplies(postId);
    }
  }

  loadReplies(postId: string) {
    this.loadingReplies.set(true);
    this.postsService.getReplies(postId).subscribe({
      next: (data) => {
        this.postReplies.set(data.replies || []);
        this.loadingReplies.set(false);
      },
      error: () => {
        this.loadingReplies.set(false);
      }
    });
  }

  openReplyForm(postId: string) {
    this.replyingToPost.set(postId);
    this.replyContent = '';
  }

  cancelReply() {
    this.replyingToPost.set(null);
    this.replyContent = '';
  }

  toggleReplyToComment(commentId: string) {
    if (this.replyingToComment() === commentId) {
      this.replyingToComment.set(null);
    } else {
      this.replyingToComment.set(commentId);
      this.replyingToCommentContent = '';
    }
  }

  cancelReplyToComment() {
    this.replyingToComment.set(null);
    this.replyingToCommentContent = '';
  }

  getAvatarUrl(avatar: string | null): string {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return 'http://localhost:3000' + avatar;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl | null {
    if (!url) return null;
    const match = url.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (!match) return null;
    const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  normalizeUrl(url: string): string | null {
    if (!url) return null;
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  setNewMediaType(type: 'image' | 'youtube' | 'link' | null) {
  this.newMediaType.set(type);
  if (type === null) {
    this.newMediaUrl = '';
  }
}

onContentChange() {
  const url = this.detectUrlInContent(this.newPostContent);
  if (url && url !== this.linkDetected() && !this.showLinkPreview()) {
    this.linkDetected.set(url);
  }
}

onAddLinkPreview() {
  this.linkDetected.set(this.detectUrlInContent(this.newPostContent));
  this.showLinkPreview.set(true);
}

ignoreLink() {
  this.linkDetected.set('ignored');
}

removeNewMedia() {
  this.newMediaUrl = '';
  this.newMediaType.set(null);
  this.showMediaInput.set(false);
}

setEditMediaType(type: 'image' | 'youtube') {
  if (this.editMediaType() === type) {
    this.editMediaType.set(null);
    this.editMediaUrl = '';
  } else {
    this.editMediaType.set(type);
    this.editMediaUrl = '';
  }
}

removeEditMedia() {
  this.editMediaUrl = '';
}

clearEditMediaType() {
  this.editMediaType.set(null);
  this.editMediaUrl = '';
}

detectUrlInContent(content: string): string | null {
  const match = content.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/);
  return match ? match[1] : null;
}

getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

clearLinkPreview() {
  this.linkDetected.set(null);
  this.showLinkPreview.set(false);
}

clearEditLinkPreview() {
  this.editLinkUrl.set(null);
}
}