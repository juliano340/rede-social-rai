import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UsersService, User } from '../../services/users.service';
import { PostsService } from '../../services/posts.service';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    replies: number;
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="profile-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-lg"></div>
          <p>Carregando perfil...</p>
        </div>
      } @else if (profile()) {
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-wrapper" [class.can-upload]="isOwnProfile()">
              @if (profile()?.avatar) {
                <img [src]="'http://localhost:3000' + profile()!.avatar" alt="Avatar" class="avatar-image">
              } @else {
                <div class="avatar-placeholder">
                  {{ (profile()!.name[0] || '?').toUpperCase() }}
                </div>
              }
              @if (isOwnProfile()) {
                <div class="avatar-overlay" (click)="triggerFileInput()">
                  <span class="camera-icon">📷</span>
                </div>
                <input 
                  type="file" 
                  #fileInput 
                  (change)="onFileSelected($event)" 
                  accept="image/*" 
                  style="display: none"
                >
              }
            </div>
            <div class="profile-info">
              <h1>{{ profile()?.name }}</h1>
              <span class="username">&#64;{{ profile()?.username }}</span>
              @if (profile()?.bio) {
                <p class="bio">{{ profile()?.bio }}</p>
              }
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-value">{{ profile()?._count?.posts }}</span>
                  <span class="stat-label">posts</span>
                </div>
                <div class="stat-item clickable" (click)="openFollowers()">
                  <span class="stat-value">{{ profile()?._count?.followers }}</span>
                  <span class="stat-label">seguidores</span>
                </div>
                <div class="stat-item clickable" (click)="openFollowing()">
                  <span class="stat-value">{{ profile()?._count?.following }}</span>
                  <span class="stat-label">seguindo</span>
                </div>
              </div>
              
              @if (!isOwnProfile() && authService.isLoggedIn()) {
                <button 
                  class="follow-btn" 
                  [class.following]="profile()?.isFollowing"
                  [disabled]="isFollowingLoading()"
                  (click)="toggleFollow()"
                >
                  @if (isFollowingLoading()) {
                    <span class="spinner-sm"></span>
                  } @else if (profile()?.isFollowing) {
                    Seguindo
                  } @else {
                    Seguir
                  }
                </button>
              }
              
              <span class="joined">
                <span class="join-icon">📅</span>
                Entrou em {{ formatDate(profile()?.createdAt) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="profile-posts">
          <h2>Publicações</h2>
          @if (postsLoading()) {
            <div class="loading-state small">
              <div class="spinner"></div>
            </div>
          } @else if (posts().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">📝</div>
              <p>Nenhuma publicação ainda.</p>
            </div>
          } @else {
            @for (post of posts(); track post.id) {
              <article class="post">
                <div class="post-avatar">
                  @if (post.author.avatar) {
                    <img [src]="'http://localhost:3000' + post.author.avatar" alt="Avatar" class="avatar-image">
                  } @else {
                    <div class="avatar-placeholder small">
                      {{ (post.author.name[0] || '?').toUpperCase() }}
                    </div>
                  }
                </div>
                <div class="post-content">
                  <div class="post-header">
                    <span class="author-name">{{ post.author.name }}</span>
                    <span class="author-username">&#64;{{ post.author.username }}</span>
<span class="post-time">{{ formatDate(post.createdAt) }}</span>
                  </div>
                  <p class="post-text">{{ post.content }}</p>
                  <div class="post-actions">
                    <button 
                      class="action-btn like" 
                      [class.liked]="postLikes()[post.id]"
                      [disabled]="postLikingId() === post.id"
                      (click)="toggleLike(post)"
                    >
                      <span class="icon">{{ postLikes()[post.id] ? '❤️' : '🤍' }}</span>
                      {{ post._count.likes }}
                    </button>
                    <button 
                      class="action-btn reply" 
                      (click)="toggleReply(post.id)"
                      [class.active]="replyingToPost() === post.id || viewingRepliesPost() === post.id"
                    >
                      <span class="icon">💬</span>
                      {{ post._count.replies }}
                    </button>
                  </div>
                  
                  @if (viewingRepliesPost() === post.id || replyingToPost() === post.id) {
                    <div class="replies-list">
                      <button class="close-replies" (click)="toggleReply(post.id)">
                        ✕
                      </button>
                      
                      <!-- Show comment link -->
                      @if (replyingToPost() !== post.id) {
                        <button class="add-reply-link" (click)="toggleReply(post.id)">
                          💬 Comentar
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
                          <div class="reply-item">
                            <div class="reply-avatar">
                              @if (reply.author.avatar) {
                                <img [src]="'http://localhost:3000' + reply.author.avatar" alt="Avatar" class="avatar-image">
                              } @else {
                                {{ (reply.author.name[0] || '?').toUpperCase() }}
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
                              
                              <!-- Nested replies (children) -->
                              @if (reply.children && reply.children.length > 0) {
                                <div class="nested-replies">
                                  @for (child of reply.children; track child.id) {
                                    <div class="reply-item nested">
                                      <div class="reply-avatar small">
                                        @if (child.author.avatar) {
                                          <img [src]="'http://localhost:3000' + child.author.avatar" alt="Avatar" class="avatar-image">
                                        } @else {
                                          {{ (child.author.name[0] || '?').toUpperCase() }}
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
                                                [disabled]="!editNestedReplyContent.trim() || savingNestedReply()"
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
          }
        </div>
      } @else {
        <div class="error-state">
          <div class="error-icon">😕</div>
          <p>Usuário não encontrado</p>
          <a routerLink="/home" class="btn-secondary">Voltar ao início</a>
        </div>
      }
      
      <!-- Modal de seguidores/seguindo -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ modalTitle() }}</h2>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
<div class="modal-content">
              @if (modalLoading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                </div>
              } @else if (modalUsers().length === 0) {
                <div class="empty-state">
                  <p>Nenhum usuário encontrado</p>
                </div>
              } @else {
                @for (user of modalUsers(); track user.id) {
                  <a [routerLink]="['/profile', user.username]" class="modal-user">
                    <div class="avatar-placeholder small">
                      {{ (user.name[0] || '?').toUpperCase() }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-username">&#64;{{ user.username }}</span>
                    </div>
                  </a>
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: 8px;
    }
    
    .profile-card {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    
    .profile-header {
      display: flex;
      gap: 24px;
    }
    
    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
      
      &.can-upload {
        cursor: pointer;
        
        &:hover .avatar-overlay {
          opacity: 1;
        }
      }
      
      .avatar-image {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
      }
      
      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        
        .camera-icon {
          font-size: 24px;
        }
      }
    }
    
    .avatar-placeholder {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #0d8ecf);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 36px;
      box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
      overflow: hidden;
      
      &.small {
        width: 44px;
        height: 44px;
        font-size: 16px;
      }
      
      .avatar-image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
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
    }
    
    .post-avatar {
      flex-shrink: 0;
      
      .avatar-image {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
      }
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
      }
      
      &.reply:hover {
        background: var(--primary-light);
        color: var(--primary);
      }
      
      .icon {
        font-size: 18px;
      }
    }
    
    .profile-info {
      flex: 1;
      
      h1 {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 2px;
      }
      
      .username {
        color: var(--text-secondary);
        font-size: 15px;
        display: block;
        margin-bottom: 12px;
      }
      
      .bio {
        margin: 0 0 16px;
        color: var(--text-primary);
        line-height: 1.5;
      }
      
.stats {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
        
        .stat-item {
          display: flex;
          gap: 4px;
          align-items: baseline;
          
          &.clickable {
            cursor: pointer;
            padding: 4px 8px;
            margin: -4px -8px;
            border-radius: 8px;
            transition: background 0.15s;
            
            &:hover {
              background: var(--background-secondary);
            }
          }
        }
      }
    }
    
    .loading-replies {
      text-align: center;
      padding: 20px;
      
      .spinner-sm {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      }
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
    
    .spinner-sm {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
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
          gap: 8px;
          margin-top: 8px;
          
          .cancel-edit, .save-edit {
            padding: 4px 12px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            cursor: pointer;
          }
          
          .cancel-edit {
            background: var(--background-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
            
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
          color: var(--text-tertiary);
          font-size: 12px;
        }
        
        .reply-buttons {
          display: flex;
          gap: 8px;
        }
        
        .cancel-btn {
          background: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 14px;
          cursor: pointer;
          
          &:hover {
            background: var(--border);
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
    
    @media (max-width: 480px) {
      .profile-card {
        padding: 16px;
      }
      
      .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
      .avatar-placeholder {
        width: 80px;
        height: 80px;
        font-size: 28px;
      }
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal {
      background: var(--background);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 400px;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border);
      
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 20px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-md);
        
        &:hover {
          background: var(--background-secondary);
        }
      }
    }
    
    .modal-content {
      padding: 8px 0;
      overflow-y: auto;
      max-height: 400px;
    }
    
    .modal-user {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      text-decoration: none;
      transition: background 0.15s;
      
      &:hover {
        background: var(--background-secondary);
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
        
        .user-name {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .user-username {
          color: var(--text-secondary);
          font-size: 14px;
        }
      }
    }
    
    .confirm-modal {
      background: var(--background);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      
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
  `]
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  posts = signal<Post[]>([]);
  postLikes = signal<Record<string, boolean>>({});
  postLikingId = signal<string | null>(null);
  viewingRepliesPost = signal<string | null>(null);
  postReplies = signal<any[]>([]);
  loadingReplies = signal(false);
  editingReply = signal<string | null>(null);
  editReplyContent = '';
  // Nested reply editing
  editingNestedReply = signal<string | null>(null);
  editNestedReplyContent = '';
  savingNestedReply = signal(false);
  savingReply = signal(false);
  showDeleteModal = signal(false);
  deletingReplyId = signal<string | null>(null);
  deletingReplyPostId = signal<string | null>(null);
  replyingToPost = signal<string | null>(null);
  replyContent = '';
  isSubmittingReply = signal(false);
  
  // Nested reply (replying to a comment)
  replyingToComment = signal<string | null>(null);
  replyingToCommentContent = '';
  loading = signal(true);
  postsLoading = signal(true);
  isFollowingLoading = signal(false);
  showFollowers = false;
  showFollowing = false;
  
  // Modal signals
  showModal = signal(false);
  modalTitle = signal('');
  modalUsers = signal<UserProfile[]>([]);
  modalLoading = signal(false);
  
  // Avatar upload
  isUploadingAvatar = signal(false);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private usersService: UsersService,
    private postsService: PostsService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.loading.set(true);
        this.postsLoading.set(true);
        this.profile.set(null);
        this.posts.set([]);
        this.loadProfile(username);
        this.loadPosts(username);
      }
    });
  }

  isOwnProfile(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profile()?.id;
  }

  toggleFollow() {
    const userId = this.profile()?.id;
    if (!userId || this.isOwnProfile()) return;

    this.isFollowingLoading.set(true);
    this.usersService.follow(userId).subscribe({
      next: (response) => {
        this.profile.update(p => p ? { ...p, isFollowing: response.following } : p);
        
        // Atualizar contagem
        this.profile.update(p => {
          if (!p) return p;
          const count = p._count;
          return {
            ...p,
            _count: {
              ...count,
              followers: response.following ? count.followers + 1 : count.followers - 1
            }
          };
        });
        
        this.isFollowingLoading.set(false);
      },
      error: () => this.isFollowingLoading.set(false)
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
      error: () => {
        this.postLikingId.set(null);
      }
    });
  }

  toggleRepliesView(post: Post) {
    if (this.viewingRepliesPost() === post.id) {
      this.viewingRepliesPost.set(null);
      this.postReplies.set([]);
    } else {
      this.viewingRepliesPost.set(post.id);
      this.loadingReplies.set(true);
      this.postsService.getReplies(post.id).subscribe({
        next: (data) => {
          this.postReplies.set(data.replies || []);
          this.loadingReplies.set(false);
        },
        error: () => this.loadingReplies.set(false)
      });
    }
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
          replies.map(r => r.id === replyId ? { ...updated, children: r.children } : r)
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
          replies.filter(r => r.id !== replyId)
        );
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

  // Nested reply editing methods
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
    
    this.savingNestedReply.set(true);
    this.postsService.updateReply(postId, replyId, this.editNestedReplyContent).subscribe({
      next: (updated) => {
        this.postReplies.update(replies => 
          replies.map(r => ({
            ...r,
            children: r.children?.map((c: any) => c.id === replyId ? { ...updated, author: c.author } : c)
          }))
        );
        this.cancelEditNestedReply();
        this.savingNestedReply.set(false);
      },
      error: (err) => {
        console.error('Error editing nested reply:', err);
        this.savingNestedReply.set(false);
      }
    });
  }

  deleteNestedReply(replyId: string, postId: string) {
    this.showDeleteModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  toggleReply(postId: string) {
    // Se já está aberto com replyingToPost (formulário aberto), fecha
    if (this.replyingToPost() === postId) {
      this.cancelReply();
      this.viewingRepliesPost.set(null);
    } 
    // Se estava só visualizando replies (sem form), abre o form de comentário
    else if (this.viewingRepliesPost() === postId) {
      this.replyingToPost.set(postId);
      this.replyContent = '';
    }
    // Primeira vez que clica - mostra replies + link para comentar
    else {
      this.loadingReplies.set(true);
      this.viewingRepliesPost.set(postId);
      this.postsService.getReplies(postId).subscribe({
        next: (data) => {
          this.postReplies.set(data.replies || []);
          this.loadingReplies.set(false);
        },
        error: () => this.loadingReplies.set(false)
      });
    }
  }

  cancelReply() {
    this.replyingToPost.set(null);
    this.replyContent = '';
  }

  submitReply(postId: string) {
    if (!this.replyContent.trim()) return;
    
    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, this.replyContent).subscribe({
      next: () => {
        // Recarregar replies
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
      }
    });
  }

  toggleReplyToComment(reply: any) {
    if (this.replyingToComment() === reply.id) {
      this.cancelReplyToComment();
    } else {
      this.replyingToComment.set(reply.id);
      this.replyingToCommentContent = '';
    }
  }

  cancelReplyToComment() {
    this.replyingToComment.set(null);
    this.replyingToCommentContent = '';
  }

  submitReplyToComment(replyId: string, postId: string) {
    if (!this.replyingToCommentContent.trim()) return;
    
    this.isSubmittingReply.set(true);
    this.postsService.createReply(postId, this.replyingToCommentContent, replyId).subscribe({
      next: () => {
        // Recarregar replies
        this.postsService.getReplies(postId).subscribe({
          next: (data) => {
            this.postReplies.set(data.replies || []);
          }
        });
        this.cancelReplyToComment();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error('Error creating nested reply:', err);
        this.isSubmittingReply.set(false);
      }
    });
  }

  openFollowers() {
    const userId = this.profile()?.id;
    if (!userId) return;
    
    this.modalTitle.set('Seguidores');
    this.showModal.set(true);
    this.modalLoading.set(true);
    
    this.http.get<any>(`http://localhost:3000/users/${userId}/followers`).subscribe({
      next: (data) => {
        this.modalUsers.set(data.users || []);
        this.modalLoading.set(false);
      },
      error: () => this.modalLoading.set(false)
    });
  }

  openFollowing() {
    const userId = this.profile()?.id;
    if (!userId) return;
    
    this.modalTitle.set('Seguindo');
    this.showModal.set(true);
    this.modalLoading.set(true);
    
    this.http.get<any>(`http://localhost:3000/users/${userId}/following`).subscribe({
      next: (data) => {
        this.modalUsers.set(data.users || []);
        this.modalLoading.set(false);
      },
      error: () => this.modalLoading.set(false)
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.modalUsers.set([]);
  }

  loadProfile(username: string) {
    this.loading.set(true);
    
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    this.http.get<any>(`http://localhost:3000/users/${username}`, { headers }).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPosts(username: string) {
    this.postsLoading.set(true);
    this.http.get<any>(`http://localhost:3000/users/${username}`).subscribe({
      next: (data) => {
        if (data.id) {
          this.http.get<any>(`http://localhost:3000/posts/user/${data.id}`).subscribe({
            next: (res) => {
              this.posts.set(res.posts || []);
              // Carregar estados de like
              res.posts?.forEach((post: Post) => {
                this.http.get<boolean>(`http://localhost:3000/posts/${post.id}/liked`).subscribe({
                  next: (liked) => {
                    this.postLikes.update(likes => ({ ...likes, [post.id]: liked }));
                  }
                });
              });
            },
            error: () => {},
            complete: () => this.postsLoading.set(false)
          });
        } else {
          this.postsLoading.set(false);
        }
      },
      error: () => this.postsLoading.set(false)
});
  }
  
  triggerFileInput() {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      this.uploadAvatar(file);
    }
  }
  
  uploadAvatar(file: File) {
    this.isUploadingAvatar.set(true);
    
    this.usersService.uploadAvatar(file).subscribe({
      next: (response) => {
        // Update profile with new avatar
        this.profile.update(p => p ? { ...p, avatar: response.avatar } : p);
        this.isUploadingAvatar.set(false);
      },
      error: (err) => {
        console.error('Error uploading avatar:', err);
        this.isUploadingAvatar.set(false);
        alert('Erro ao fazer upload da imagem. Tente novamente.');
      }
    });
  }
  
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}