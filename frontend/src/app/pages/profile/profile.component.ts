import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../../services/auth.service";
import { UsersService, User } from "../../services/users.service";
import { PostsService } from "../../services/posts.service";
import { LucideIconsModule } from "../../shared/icons/lucide-icons.module";
import { ToastService } from "../../shared/services/toast.service";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  bioLink: string | null;
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
  mediaUrl?: string | null;
  mediaType?: 'image' | 'youtube' | null;
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
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideIconsModule],
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
                <img
                  [src]="getAvatarUrl(profile()?.avatar)"
                  alt="Avatar"
                  class="avatar-image"
                />
              } @else {
                <div class="avatar-placeholder">
                  {{ (profile()!.name[0] || "?").toUpperCase() }}
                </div>
              }
              @if (isOwnProfile()) {
                <div class="avatar-overlay" (click)="openAvatarModal()">
                  <lucide-icon name="camera" [size]="24" class="camera-icon"></lucide-icon>
                </div>
                <input
                  type="file"
                  #fileInput
                  (change)="onFileSelected($event)"
                  accept="image/*"
                  style="display: none"
                />
              }
            </div>
            <div class="profile-info">
              <div class="profile-info-header">
                <div class="profile-name-row">
                  <h1>{{ profile()?.name }}</h1>
                  @if (isOwnProfile()) {
                    <button class="edit-profile-btn" (click)="openEditModal()">
                      <lucide-icon name="settings" [size]="16"></lucide-icon>
                    </button>
                  }
                </div>
                <span class="username">&#64;{{ profile()?.username }}</span>
                @if (profile()?.bio) {
                  <p class="bio">{{ profile()?.bio }}</p>
                }
                @if (profile()?.bioLink) {
                  <a
                    class="bio-link"
                    [href]="profile()?.bioLink"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ displayBioLink(profile()?.bioLink) }}
                  </a>
                }
              </div>
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-value">{{ profile()?._count?.posts }}</span>
                  <span class="stat-label">posts</span>
                </div>
                <div class="stat-item clickable" (click)="openFollowers()">
                  <span class="stat-value">{{
                    profile()?._count?.followers
                  }}</span>
                  <span class="stat-label">seguidores</span>
                </div>
                <div class="stat-item clickable" (click)="openFollowing()">
                  <span class="stat-value">{{
                    profile()?._count?.following
                  }}</span>
                  <span class="stat-label">seguindo</span>
                </div>
              </div>

              <div class="profile-actions">
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
                  <lucide-icon name="calendar" [size]="14"></lucide-icon>
                  Entrou em {{ formatDate(profile()?.createdAt) }}
                </span>
              </div>
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
              <lucide-icon name="file-text" [size]="48" class="empty-icon"></lucide-icon>
              <p>Nenhuma publicação ainda.</p>
            </div>
          } @else {
            @for (post of posts(); track post.id) {
              <article class="post">
                <div class="post-avatar">
                  @if (post.author.avatar) {
                    <img
                      [src]="getAvatarUrl(post.author.avatar)"
                      alt="Avatar"
                      class="avatar-image"
                    />
                  } @else {
                    <div class="avatar-placeholder small">
                      {{ ((post.author.name && post.author.name[0]) || "?").toUpperCase() }}
                    </div>
                  }
                </div>
                <div class="post-content">
                  <div class="post-header">
                    <span class="author-name">{{ post.author.name }}</span>
                    <span class="author-username"
                      >&#64;{{ post.author.username }}</span
                    >
                    <span class="post-time">{{
                      formatDate(post.createdAt)
                    }}</span>
                  </div>
                  <p class="post-text">{{ post.content }}</p>
                  @if (post.mediaUrl && post.mediaType === 'image') {
                    <img [src]="post.mediaUrl" alt="Mídia do post" class="post-media" />
                  }
                  @if (post.mediaUrl && post.mediaType === 'youtube') {
                    <iframe [src]="getYouTubeEmbedUrl(post.mediaUrl)" frameborder="0" allowfullscreen class="post-media-video"></iframe>
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
                      </div>
                      @if (editMediaType()) {
                        <input 
                          type="text" 
                          [(ngModel)]="editMediaUrl" 
                          [placeholder]="editMediaType() === 'image' ? 'URL da imagem' : 'URL do YouTube'"
                          class="media-url-input"
                        />
                      }
                      @if (editMediaUrl || post.mediaUrl) {
                        <button class="remove-media-sm" (click)="removeEditMedia()">
                          <lucide-icon name="x" [size]="14"></lucide-icon> Remover mídia
                        </button>
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
                      [class.liked]="postLikes()[post.id]"
                      [disabled]="postLikingId() === post.id"
                      (click)="toggleLike(post)"
                    >
                      <lucide-icon name="heart" [size]="18" [class.filled]="postLikes()[post.id]"></lucide-icon>
                      {{ post._count.likes }}
                    </button>
                    <button
                      class="action-btn reply"
                      (click)="toggleReply(post.id)"
                      [class.active]="
                        replyingToPost() === post.id ||
                        viewingRepliesPost() === post.id
                      "
                    >
                      <lucide-icon name="message-circle" [size]="18"></lucide-icon>
                      {{ post._count.replies }}
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
                      >
                        <lucide-icon name="trash-2" [size]="18"></lucide-icon>
                      </button>
                    }
                  </div>

                  @if (
                    viewingRepliesPost() === post.id ||
                    replyingToPost() === post.id
                  ) {
                    <div class="replies-list">
                      <button
                        class="close-replies"
                        (click)="toggleReply(post.id)"
                      >
                        <lucide-icon name="x" [size]="18"></lucide-icon>
                      </button>

                      <!-- Show comment link -->
                      @if (replyingToPost() !== post.id) {
                        <button
                          class="add-reply-link"
                          (click)="openReplyForm(post.id)"
                        >
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
                            <span class="char-count"
                              >{{ replyContent.length }}/280</span
                            >
                            <div class="reply-buttons">
                              <button
                                class="cancel-btn"
                                (click)="cancelReply()"
                              >
                                Cancelar
                              </button>
                              <button
                                class="submit-reply-btn"
                                (click)="submitReply(post.id)"
                                [disabled]="
                                  !replyContent.trim() || isSubmittingReply()
                                "
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
                      } @else if (
                        postReplies().length === 0 &&
                        replyingToPost() !== post.id
                      ) {
                        <p class="no-replies">Nenhuma resposta ainda.</p>
                      } @else {
                        @for (reply of postReplies(); track reply.id) {
                          <div class="reply-item">
                            <div class="reply-avatar">
                              @if (reply.author.avatar) {
<img [src]="getAvatarUrl(reply.author.avatar)" alt="Avatar" class="avatar-image" />
                              } @else {
                                {{
                                  (reply.author.name[0] || "?").toUpperCase()
                                }}
                              }
                            </div>
                            <div class="reply-content">
                              <div class="reply-header">
                                <span class="reply-name">{{
                                  reply.author.name
                                }}</span>
                                <span class="reply-username"
                                  >&#64;{{ reply.author.username }}</span
                                >
                              </div>
                              @if (editingReply() === reply.id) {
                                <div class="edit-reply-form">
                                  <textarea
                                    [(ngModel)]="editReplyContent"
                                    maxlength="280"
                                  ></textarea>
                                  <div class="edit-actions">
                                    <button
                                      class="cancel-edit"
                                      (click)="cancelEditReply()"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      class="save-edit"
                                      (click)="saveEditReply(reply.id, post.id)"
                                      [disabled]="
                                        !editReplyContent.trim() ||
                                        savingReply()
                                      "
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              } @else {
                                <p class="reply-text">{{ reply.content }}</p>
                              }
                              @if (
                                authService.currentUser()?.id ===
                                  reply.author.id && editingReply() !== reply.id
                              ) {
                                <div class="reply-actions">
                                  <button
                                    class="reply-edit-btn"
                                    (click)="startEditReply(reply)"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    class="reply-delete-btn"
                                    (click)="deleteReply(reply.id, post.id)"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              }

                              <!-- Nested replies (children) -->
                              @if (
                                reply.children && reply.children.length > 0
                              ) {
                                <div class="nested-replies">
                                  @for (
                                    child of reply.children;
                                    track child.id
                                  ) {
                                    <div class="reply-item nested">
                                      <div class="reply-avatar small">
                                        @if (child.author.avatar) {
<img [src]="getAvatarUrl(child.author.avatar)" alt="Avatar" class="avatar-image" />
                                        } @else {
                                          {{
                                            (
                                              child.author.name[0] || "?"
                                            ).toUpperCase()
                                          }}
                                        }
                                      </div>
                                      <div class="reply-content">
                                        <div class="reply-header">
                                          <span class="reply-name">{{
                                            child.author.name
                                          }}</span>
                                          <span class="reply-username"
                                            >&#64;{{
                                              child.author.username
                                            }}</span
                                          >
                                        </div>
                                        @if (
                                          editingNestedReply() === child.id
                                        ) {
                                          <div class="edit-reply-form">
                                            <textarea
                                              [(ngModel)]="
                                                editNestedReplyContent
                                              "
                                              maxlength="280"
                                            ></textarea>
                                            <div class="edit-actions">
                                              <button
                                                class="cancel-edit"
                                                (click)="
                                                  cancelEditNestedReply()
                                                "
                                              >
                                                Cancelar
                                              </button>
                                              <button
                                                class="save-edit"
                                                (click)="
                                                  saveEditNestedReply(
                                                    child.id,
                                                    post.id
                                                  )
                                                "
                                                [disabled]="
                                                  !editNestedReplyContent.trim() ||
                                                  savingNestedReply()
                                                "
                                              >
                                                Salvar
                                              </button>
                                            </div>
                                          </div>
                                        } @else {
                                          <p class="reply-text">
                                            {{ child.content }}
                                          </p>
                                        }
                                        @if (
                                          authService.currentUser()?.id ===
                                            child.author.id &&
                                          editingNestedReply() !== child.id
                                        ) {
                                          <div class="reply-actions">
                                            <button
                                              class="reply-edit-btn"
                                              (click)="
                                                startEditNestedReply(child)
                                              "
                                            >
                                              Editar
                                            </button>
                                            <button
                                              class="reply-delete-btn"
                                              (click)="
                                                deleteNestedReply(
                                                  child.id,
                                                  post.id
                                                )
                                              "
                                            >
                                              Excluir
                                            </button>
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
        <div class="modal-overlay" (click)="$event.stopPropagation()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ modalTitle() }}</h2>
              <button class="modal-close" (click)="closeModal()">
                <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
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
                  <a
                    [routerLink]="['/profile', user.username]"
                    class="modal-user"
                  >
                    <div class="avatar-placeholder small">
                      {{ (user.name[0] || "?").toUpperCase() }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-username"
                        >&#64;{{ user.username }}</span
                      >
                    </div>
                  </a>
                }
              }
            </div>
          </div>
        </div>
      }

      <!-- Modal de edição de perfil -->
      @if (showEditModal()) {
        <div class="modal-overlay" (click)="$event.stopPropagation()">
          <div class="edit-profile-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Editar perfil</h2>
              <button class="modal-close" (click)="closeEditModal()">
                <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="edit-name">Nome</label>
                <input
                  id="edit-name"
                  type="text"
                  [(ngModel)]="editName"
                  placeholder="Seu nome"
                  maxlength="50"
                />
                <span class="char-hint">{{ editName.length }}/50</span>
              </div>
              <div class="form-group">
                <label for="edit-bio">Bio</label>
                <textarea
                  id="edit-bio"
                  [(ngModel)]="editBio"
                  placeholder="Conte sobre você..."
                  maxlength="160"
                  rows="3"
                ></textarea>
                <span class="char-hint">{{ editBio.length }}/160</span>
              </div>
              <div class="form-group">
                <label for="edit-bio-link">Link da bio</label>
                <input
                  id="edit-bio-link"
                  type="text"
                  [(ngModel)]="editBioLink"
                  placeholder="seusite.com ou https://seusite.com"
                  maxlength="200"
                />
                <span class="char-hint">{{ editBioLink.length }}/200</span>
                @if (bioLinkError) {
                  <span class="field-error">{{ bioLinkError }}</span>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeEditModal()">
                Cancelar
              </button>
              <button
                class="btn-save"
                (click)="saveProfile()"
                [disabled]="savingProfile()"
              >
                @if (savingProfile()) {
                  Salvando...
                } @else {
                  Salvar
                }
</button>
        </div>
      </div>
    </div>
  }

  <!-- Avatar modal -->
  @if (showAvatarModal()) {
    <div class="modal-overlay" (click)="$event.stopPropagation()">
      <div class="edit-profile-modal avatar-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Alterar foto de perfil</h2>
          <button class="modal-close" (click)="closeAvatarModal()">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="avatar-option" (click)="triggerFileInput()">
            <span class="option-icon">📁</span>
            <span class="option-label">Enviar arquivo</span>
          </div>
          <div class="avatar-option-divider">
            <span>ou</span>
          </div>
          <div class="avatar-url-option">
            <label>Link da imagem</label>
            <input
              type="url"
              [(ngModel)]="avatarUrlInput"
              placeholder="https://exemplo.com/foto.jpg"
            />
            <button
              class="btn-save"
              (click)="saveAvatarUrl()"
              [disabled]="!avatarUrlInput.trim() || isUploadingAvatar()"
            >
              @if (isUploadingAvatar()) {
                <span class="spinner-sm"></span>
                Salvando...
              } @else {
                Salvar
              }
            </button>
          </div>
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

@if (showDeleteReplyModal()) {
  <div class="modal-overlay" (click)="closeDeleteReplyModal()">
    <div class="modal confirm-modal" (click)="$event.stopPropagation()">
      <lucide-icon name="trash-2" [size]="48" class="modal-icon"></lucide-icon>
      <h2>Excluir Resposta</h2>
      <p>Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita.</p>
      <div class="modal-actions">
        <button class="modal-cancel" (click)="closeDeleteReplyModal()">Cancelar</button>
        <button class="modal-confirm" (click)="confirmDeleteReply()">Excluir</button>
      </div>
    </div>
  </div>
}
</div>
`,
  styles: [
    `
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
            color: white;
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

      .author-username,
      .post-time {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .post-text {
        margin: 8px 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.6;
      }

      .media-type-selector {
        display: flex;
        gap: 8px;
        margin: 8px 0;
        
        button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--background);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          
          &.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }
          
          &:hover:not(.active) {
            background: var(--background-secondary);
          }
        }
      }
      
      .media-url-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 13px;
        color: var(--text-primary);
        background: var(--background);
        margin-bottom: 8px;
        
        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }
      
      .remove-media-sm {
        display: flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        color: var(--error);
        font-size: 12px;
        cursor: pointer;
        margin-bottom: 8px;
      }
      
      .post-media {
        max-width: 100%;
        max-height: 300px;
        border-radius: 10px;
        margin-top: 8px;
        object-fit: contain;
      }
      
      .post-media-video {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 10px;
        margin-top: 8px;
        border: none;
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
        transition:
          background 0.2s,
          color 0.2s;

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

        &.edit:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .icon {
          font-size: 18px;
        }
      }

      .profile-info {
        flex: 1;

        .profile-info-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }

        .edit-profile-btn {
          background: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: var(--border);
          }
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .username {
          color: var(--text-secondary);
          font-size: 15px;
          display: block;
          margin: 0;
        }

        .bio {
          margin: 0;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .bio-link {
          display: block;
          margin: 0;
          text-align: left;
          align-self: flex-start;
          color: var(--primary);
          font-size: 14px;
          text-decoration: none;
          word-break: break-all;

          &:hover {
            text-decoration: underline;
          }
        }

        .field-error {
          display: block;
          margin-top: 6px;
          color: var(--error);
          font-size: 12px;
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

  .follow-btn {
    padding: 10px 24px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    min-width: 100px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.following {
      background: var(--background-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border);
      box-shadow: none;

      &:hover:not(:disabled) {
        background: var(--error-light);
        color: var(--error);
        border-color: var(--error);
      }

      .spinner-sm {
        border-color: rgba(0, 0, 0, 0.2);
        border-top-color: var(--text-primary);
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .profile-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
  }

  .joined {
    font-size: 13px;
    color: var(--text-tertiary);

    .join-icon {
      margin-right: 4px;
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
        to {
          transform: rotate(360deg);
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

        .reply-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;

          .reply-edit-btn,
          .reply-delete-btn {
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

            .cancel-btn,
            .submit-reply-btn {
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
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            justify-content: flex-end;

            .cancel-edit,
            .save-edit {
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

          &:focus {
            outline: none;
            border-color: var(--primary);
          }
        }

        .edit-post-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-top: 8px;

          .char-count {
            margin-right: auto;
            color: var(--text-tertiary);
            font-size: 12px;
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
              background: var(--border);
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

        .modal-cancel,
        .modal-confirm {
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

      .edit-profile-modal {
        background: var(--background);
        border-radius: var(--radius-lg);
        width: 90%;
        max-width: 440px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
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

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 6px;
          }

          input,
          textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 10px 12px;
            font-size: 15px;
            color: var(--text-primary);
            background: var(--background);
            transition: border-color 0.15s;

            &:focus {
              outline: none;
              border-color: var(--primary);
            }

            &::placeholder {
              color: var(--text-tertiary);
            }
          }

          textarea {
            resize: vertical;
            min-height: 80px;
          }

          .char-hint {
            display: block;
            text-align: right;
            font-size: 12px;
            color: var(--text-tertiary);
            margin-top: 4px;
          }
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--border);

          .btn-cancel {
            background: var(--background-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;

            &:hover {
              background: var(--border);
            }
          }

          .btn-save {
            background: var(--primary);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;

            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
        }

        .danger-zone {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--error);

          .btn-delete-account {
            width: 100%;
            padding: 10px 16px;
            background: var(--error-light);
            color: var(--error);
            border: 1px solid var(--error);
            border-radius: var(--radius-md);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
              background: var(--error);
              color: white;
            }
          }
        }
      }

      .delete-account-modal {
        background: var(--background);
        border-radius: var(--radius-lg);
        width: 90%;
        max-width: 440px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
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

        .modal-body {
          padding: 20px;

          .warning-banner {
            display: flex;
            gap: 12px;
            padding: 14px;
            background: var(--error-light);
            border: 1px solid rgba(224, 36, 94, 0.2);
            border-radius: var(--radius-md);
            margin-bottom: 20px;

            .warning-icon {
              color: var(--error);
              flex-shrink: 0;
              margin-top: 2px;
            }

            p {
              font-size: 14px;
              color: var(--error);
              line-height: 1.5;
              margin: 0;
            }
          }

          .form-group {
            label {
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: var(--text-primary);
              margin-bottom: 6px;
            }

            input {
              width: 100%;
              border: 1px solid var(--border);
              border-radius: var(--radius-sm);
              padding: 10px 12px;
              font-size: 15px;
              color: var(--text-primary);
              background: var(--background);
              transition: border-color 0.15s;

              &:focus {
                outline: none;
                border-color: var(--error);
              }

              &::placeholder {
                color: var(--text-tertiary);
              }
            }

            .field-error {
              display: block;
              font-size: 13px;
              color: var(--error);
              margin-top: 6px;
            }
          }
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--border);

          .btn-cancel {
            background: var(--background-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;

            &:hover {
              background: var(--border);
            }
          }

          .btn-delete {
            background: var(--error);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;

            &:hover:not(:disabled) {
              background: #c71d2f;
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            .spinner-sm {
              width: 14px;
              height: 14px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
          }
        }
      }

      .avatar-modal {
        max-width: 360px;

        .avatar-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s;

          &:hover {
            background: var(--background-secondary);
          }

          .option-icon {
            font-size: 20px;
          }

          .option-label {
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
          }
        }

        .avatar-option-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
          color: var(--text-tertiary);
          font-size: 13px;

          &::before,
          &::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
          }
        }

      .avatar-url-option {
        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 14px;
          color: var(--text-primary);
          background: var(--background);
          margin-bottom: 12px;

          &:focus {
            outline: none;
            border-color: var(--primary);
          }

          &::placeholder {
            color: var(--text-tertiary);
          }
        }

        .btn-save {
          width: 100%;
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;

          &:hover:not(:disabled) {
            background: var(--primary-hover);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

        .spinner-sm {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
          vertical-align: middle;
        }
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
    }
  `
  ]
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
  editReplyContent = "";
  // Nested reply editing
  editingNestedReply = signal<string | null>(null);
  editNestedReplyContent = "";
  savingNestedReply = signal(false);
  savingReply = signal(false);
  showDeleteReplyModal = signal(false);
  deletingReplyId = signal<string | null>(null);
  deletingReplyPostId = signal<string | null>(null);
  replyingToPost = signal<string | null>(null);
  replyContent = "";
  isSubmittingReply = signal(false);

  // Nested reply (replying to a comment)
  replyingToComment = signal<string | null>(null);
  replyingToCommentContent = "";

  editingPost = signal<string | null>(null);
  editPostContent = '';
  editMediaUrl = '';
  editMediaType = signal<'image' | 'youtube' | null>(null);

  showDeletePostModal = signal(false);
  deletingPostId = signal<string | null>(null);

  loading = signal(true);
  postsLoading = signal(true);
  isFollowingLoading = signal(false);
  showFollowers = false;
  showFollowing = false;

  // Modal signals
  showModal = signal(false);
  modalTitle = signal("");
  modalUsers = signal<UserProfile[]>([]);
  modalLoading = signal(false);

  // Avatar upload
  isUploadingAvatar = signal(false);
  showAvatarModal = signal(false);
  avatarUrlInput = '';

  // Edit profile modal
  showEditModal = signal(false);
  editName = "";
  editBio = "";
  editBioLink = "";
  bioLinkError = "";
  savingProfile = signal(false);

  // Delete account
  showDeleteAccountModal = signal(false);
  deletePassword = '';
  deleteLoading = signal(false);
  deleteError = signal('');

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private usersService: UsersService,
    private postsService: PostsService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const username = params.get("username");
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
        this.profile.update((p) =>
          p ? { ...p, isFollowing: response.following } : p,
        );

        // Atualizar contagem
        this.profile.update((p) => {
          if (!p) return p;
          const count = p._count;
          return {
            ...p,
            _count: {
              ...count,
              followers: response.following
                ? count.followers + 1
                : count.followers - 1,
            },
          };
        });

        this.isFollowingLoading.set(false);
      },
      error: () => this.isFollowingLoading.set(false),
    });
  }

  toggleLike(post: Post) {
    this.postLikingId.set(post.id);
    const isLiked = this.postLikes()[post.id];

    this.postsService.likePost(post.id).subscribe({
      next: () => {
        this.postLikes.update((likes) => ({ ...likes, [post.id]: !isLiked }));
        post._count.likes += isLiked ? -1 : 1;
        this.postLikingId.set(null);
      },
      error: () => {
        this.postLikingId.set(null);
      },
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
        error: () => this.loadingReplies.set(false),
      });
    }
  }

  startEditReply(reply: any) {
    this.editingReply.set(reply.id);
    this.editReplyContent = reply.content;
  }

  cancelEditReply() {
    this.editingReply.set(null);
    this.editReplyContent = "";
  }

  saveEditReply(replyId: string, postId: string) {
    if (!this.editReplyContent.trim()) return;

    this.savingReply.set(true);
    this.postsService
      .updateReply(postId, replyId, this.editReplyContent)
      .subscribe({
        next: (updated) => {
          this.postReplies.update((replies) =>
            replies.map((r) =>
              r.id === replyId ? { ...updated, children: r.children } : r,
            ),
          );
          this.cancelEditReply();
          this.savingReply.set(false);
        },
        error: (err) => {
          console.error("Error editing reply:", err);
          this.savingReply.set(false);
        },
      });
  }

  deleteReply(replyId: string, postId: string) {
    this.showDeleteReplyModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  confirmDeleteReply() {
    const replyId = this.deletingReplyId();
    const postId = this.deletingReplyPostId();

    if (!replyId || !postId) return;

    this.postsService.deleteReply(postId, replyId).subscribe({
      next: () => {
        this.postReplies.update((replies) =>
          replies.filter((r) => r.id !== replyId),
        );
        this.closeDeleteReplyModal();
      },
      error: (err) => {
        console.error("Error deleting reply:", err);
        this.closeDeleteReplyModal();
      },
    });
  }

  closeDeleteReplyModal() {
    this.showDeleteReplyModal.set(false);
    this.deletingReplyId.set(null);
    this.deletingReplyPostId.set(null);
  }

  deletePost(postId: string) {
    this.deletingPostId.set(postId);
    this.showDeletePostModal.set(true);
  }

  closeDeletePostModal() {
    this.showDeletePostModal.set(false);
    this.deletingPostId.set(null);
  }

  confirmDeletePost() {
    const postId = this.deletingPostId();
    if (!postId) return;

    this.postsService.deletePost(postId).subscribe({
      next: () => {
        this.posts.update((posts) => posts.filter((p) => p.id !== postId));
        this.closeDeletePostModal();
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.closeDeletePostModal();
      },
    });
  }

  startEditPost(post: any) {
    this.editingPost.set(post.id);
    this.editPostContent = post.content;
    this.editMediaUrl = post.mediaUrl || '';
    this.editMediaType.set(post.mediaType as 'image' | 'youtube' | null);
  }

  cancelEditPost() {
    this.editingPost.set(null);
    this.editPostContent = '';
    this.editMediaUrl = '';
    this.editMediaType.set(null);
  }

  saveEditPost(postId: string) {
    if (!this.editPostContent.trim()) return;

    const mediaUrl = this.editMediaType() ? this.editMediaUrl : undefined;
    const mediaType = this.editMediaType() || undefined;

    this.postsService.updatePost(postId, this.editPostContent, mediaUrl, mediaType).subscribe({
      next: (updated) => {
        this.posts.update((posts) =>
          posts.map((p) => (p.id === postId ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType } : p))
        );
        this.cancelEditPost();
      },
      error: (err) => {
        console.error('Error editing post:', err);
        this.cancelEditPost();
      },
    });
  }

  // Nested reply editing methods
  startEditNestedReply(reply: any) {
    this.editingNestedReply.set(reply.id);
    this.editNestedReplyContent = reply.content;
  }

  cancelEditNestedReply() {
    this.editingNestedReply.set(null);
    this.editNestedReplyContent = "";
  }

  saveEditNestedReply(replyId: string, postId: string) {
    if (!this.editNestedReplyContent.trim()) return;

    this.savingNestedReply.set(true);
    this.postsService
      .updateReply(postId, replyId, this.editNestedReplyContent)
      .subscribe({
        next: (updated) => {
          this.postReplies.update((replies) =>
            replies.map((r) => ({
              ...r,
              children: r.children?.map((c: any) =>
                c.id === replyId ? { ...updated, author: c.author } : c,
              ),
            })),
          );
          this.cancelEditNestedReply();
          this.savingNestedReply.set(false);
        },
        error: (err) => {
          console.error("Error editing nested reply:", err);
          this.savingNestedReply.set(false);
        },
      });
  }

  deleteNestedReply(replyId: string, postId: string) {
    this.showDeleteReplyModal.set(true);
    this.deletingReplyId.set(replyId);
    this.deletingReplyPostId.set(postId);
  }

  toggleReply(postId: string) {
    // Toggle: se já está visualizando, fecha; senão, abre a lista
    if (this.viewingRepliesPost() === postId) {
      this.viewingRepliesPost.set(null);
      this.postReplies.set([]);
      this.cancelReply(); // Fecha o formulário se estiver aberto
    } else {
      this.loadingReplies.set(true);
      this.viewingRepliesPost.set(postId);
      this.cancelReply(); // Garante que o formulário está fechado
      this.postsService.getReplies(postId).subscribe({
        next: (data) => {
          this.postReplies.set(data.replies || []);
          this.loadingReplies.set(false);
        },
        error: () => this.loadingReplies.set(false),
      });
    }
  }

  openReplyForm(postId: string) {
    // Abre o formulário de comentário
    this.viewingRepliesPost.set(postId);
    this.replyingToPost.set(postId);
    this.replyContent = "";
  }

  cancelReply() {
    this.replyingToPost.set(null);
    this.replyContent = "";
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
          },
        });
        this.cancelReply();
        this.isSubmittingReply.set(false);
      },
      error: (err) => {
        console.error("Error creating reply:", err);
        this.isSubmittingReply.set(false);
        if (err.status === 429) {
          this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
        } else {
          this.toast.error('Erro ao publicar comentário. Tente novamente.');
        }
      },
    });
  }

  toggleReplyToComment(reply: any) {
    if (this.replyingToComment() === reply.id) {
      this.cancelReplyToComment();
    } else {
      this.replyingToComment.set(reply.id);
      this.replyingToCommentContent = "";
    }
  }

  cancelReplyToComment() {
    this.replyingToComment.set(null);
    this.replyingToCommentContent = "";
  }

  submitReplyToComment(replyId: string, postId: string) {
    if (!this.replyingToCommentContent.trim()) return;

    this.isSubmittingReply.set(true);
    this.postsService
      .createReply(postId, this.replyingToCommentContent, replyId)
      .subscribe({
        next: () => {
          // Recarregar replies
          this.postsService.getReplies(postId).subscribe({
            next: (data) => {
              this.postReplies.set(data.replies || []);
            },
          });
          this.cancelReplyToComment();
          this.isSubmittingReply.set(false);
        },
        error: (err) => {
          console.error("Error creating nested reply:", err);
          this.isSubmittingReply.set(false);
          if (err.status === 429) {
            this.toast.error('Você está comentando muito rápido. Aguarde um momento.');
          } else {
            this.toast.error('Erro ao responder comentário. Tente novamente.');
          }
        },
      });
  }

  openFollowers() {
    const userId = this.profile()?.id;
    if (!userId) return;

    this.modalTitle.set("Seguidores");
    this.showModal.set(true);
    this.modalLoading.set(true);

    this.http
      .get<any>(`http://localhost:3000/users/${userId}/followers`)
      .subscribe({
        next: (data) => {
          this.modalUsers.set(data.users || []);
          this.modalLoading.set(false);
        },
        error: () => this.modalLoading.set(false),
      });
  }

  openFollowing() {
    const userId = this.profile()?.id;
    if (!userId) return;

    this.modalTitle.set("Seguindo");
    this.showModal.set(true);
    this.modalLoading.set(true);

    this.http
      .get<any>(`http://localhost:3000/users/${userId}/following`)
      .subscribe({
        next: (data) => {
          this.modalUsers.set(data.users || []);
          this.modalLoading.set(false);
        },
        error: () => this.modalLoading.set(false),
      });
  }

  closeModal() {
    this.showModal.set(false);
    this.modalUsers.set([]);
  }

  loadProfile(username: string) {
    this.loading.set(true);

    this.http
      .get<any>(`http://localhost:3000/users/${username}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.profile.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadPosts(username: string) {
    this.postsLoading.set(true);
    this.http.get<any>(`http://localhost:3000/users/${username}`, { withCredentials: true }).subscribe({
      next: (data) => {
        if (data.id) {
          this.http
            .get<any>(`http://localhost:3000/posts/user/${data.id}`, { withCredentials: true })
            .subscribe({
              next: (res) => {
                this.posts.set(res.posts || []);
                if (this.authService.isLoggedIn()) {
                  res.posts?.forEach((post: Post) => {
                    this.http
                      .get<boolean>(
                        `http://localhost:3000/posts/${post.id}/liked`,
                        { withCredentials: true },
                      )
                      .subscribe({
                        next: (liked) => {
                          this.postLikes.update((likes) => ({
                            ...likes,
                            [post.id]: liked,
                          }));
                        },
                      });
                  });
                }
              },
              error: () => {},
              complete: () => this.postsLoading.set(false),
            });
        } else {
          this.postsLoading.set(false);
        }
      },
      error: () => this.postsLoading.set(false),
    });
  }

  triggerFileInput() {
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione uma imagem.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB.");
        return;
      }

      this.uploadAvatar(file);
    }
  }

  uploadAvatar(file: File) {
    this.isUploadingAvatar.set(true);

    this.usersService.uploadAvatar(file).subscribe({
      next: (response) => {
        this.profile.update((p) => (p ? { ...p, avatar: response.avatar } : p));
        this.updateAvatarInPosts(response.avatar);
        this.isUploadingAvatar.set(false);
        this.closeAvatarModal();
      },
      error: (err) => {
        console.error("Error uploading avatar:", err);
        this.isUploadingAvatar.set(false);
        alert("Erro ao fazer upload da imagem. Tente novamente.");
      },
    });
  }

  updateAvatarInPosts(newAvatar: string) {
    const currentUsername = this.profile()?.username;
    if (!currentUsername) return;

    this.posts.update((posts) =>
      posts.map((post) => {
        if (post.author.username === currentUsername) {
          return { ...post, author: { ...post.author, avatar: newAvatar } };
        }
        return post;
      })
    );

    this.postReplies.update((replies) =>
      replies.map((reply) => {
        if (reply.author.username === currentUsername) {
          return { ...reply, author: { ...reply.author, avatar: newAvatar } };
        }
        return reply;
      })
    );
  }

  getAvatarUrl(avatar: string | null | undefined): string {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return 'http://localhost:3000' + avatar;
  }

  openAvatarModal() {
    this.showAvatarModal.set(true);
    this.avatarUrlInput = '';
  }

  closeAvatarModal() {
    this.showAvatarModal.set(false);
    this.avatarUrlInput = '';
  }

  saveAvatarUrl() {
    if (!this.avatarUrlInput.trim()) return;

    this.isUploadingAvatar.set(true);
    this.usersService.updateAvatarUrl(this.avatarUrlInput.trim()).subscribe({
      next: (response) => {
        this.profile.update((p) => (p ? { ...p, avatar: response.avatar } : p));
        this.updateAvatarInPosts(response.avatar);
        this.isUploadingAvatar.set(false);
        this.closeAvatarModal();
      },
      error: (err) => {
        console.error("Error updating avatar:", err);
        this.isUploadingAvatar.set(false);
        const message = err.error?.message || 'Erro ao salvar URL da imagem. Verifique se é uma URL válida de imagem.';
        alert(message);
      },
    });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  displayBioLink(url: string | null | undefined): string {
    if (!url) return "";
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }

  openEditModal() {
    this.editName = this.profile()?.name || "";
    this.editBio = this.profile()?.bio || "";
    this.editBioLink = this.profile()?.bioLink || "";
    this.bioLinkError = "";
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editName = "";
    this.editBio = "";
    this.editBioLink = "";
    this.bioLinkError = "";
  }

  normalizeBioLink(value: string): string | null {
    const raw = value.trim();
    if (!raw) return null;

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    try {
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();
      const isLocalhost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host.endsWith(".local");
      const isPrivateIp =
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

      if (!/^https?:$/.test(url.protocol) || isLocalhost || isPrivateIp) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  saveProfile() {
    if (this.savingProfile()) return;

    if (!this.editName.trim()) {
      this.savingProfile.set(false);
      return;
    }

    const normalizedBioLink = this.normalizeBioLink(this.editBioLink);
    if (this.editBioLink.trim() && !normalizedBioLink) {
      this.bioLinkError = "Use um link público válido (ex: https://seusite.com).";
      return;
    }

    this.bioLinkError = "";

    this.savingProfile.set(true);

    this.usersService
      .updateProfile({
        name: this.editName.trim(),
        bio: this.editBio,
        bioLink: this.editBioLink.trim() || '',
      })
      .subscribe({
        next: (updated) => {
          // Atualizar o perfil local
          this.profile.update((p) =>
            p
              ? {
                  ...p,
                  name: updated.name || p.name,
                  bio: updated.bio,
                  bioLink: updated.bioLink,
                }
              : p,
          );
          this.closeEditModal();
          this.savingProfile.set(false);
        },
error: (err) => {
          console.error("Error updating profile:", err);
          this.savingProfile.set(false);
          alert("Erro ao salvar perfil. Tente novamente.");
        },
      });
  }

  openDeleteAccountModal() {
    this.deletePassword = '';
    this.deleteError.set('');
    this.showDeleteAccountModal.set(true);
  }

  closeDeleteAccountModal() {
    this.showDeleteAccountModal.set(false);
    this.deletePassword = '';
    this.deleteError.set('');
  }

  confirmDeleteAccount() {
    if (!this.deletePassword.trim()) return;
    
    this.deleteLoading.set(true);
    this.deleteError.set('');
    
    this.authService.deleteAccount(this.deletePassword).subscribe({
      next: () => {
        this.closeDeleteAccountModal();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        const msg = err.error?.message || 'Erro ao excluir conta. Tente novamente.';
        this.deleteError.set(msg);
      }
    });
  }

  getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[2]}` : null;
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  setEditMediaType(type: 'image' | 'youtube' | null) {
    this.editMediaType.set(type);
    if (type === null) {
      this.editMediaUrl = '';
    }
  }

  removeEditMedia() {
    this.editMediaUrl = '';
    this.editMediaType.set(null);
  }
}
