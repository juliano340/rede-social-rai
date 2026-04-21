import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { AuthService } from "../../services/auth.service";
import { UsersService } from "../../services/users.service";
import { PostsService } from "../../services/posts.service";
import { PostEditService } from "../../services/post-edit.service";
import { PostCardComponent } from "../../shared/components/post-card/post-card.component";
import { DeleteConfirmModalComponent } from "../../shared/components/delete-confirm-modal/delete-confirm-modal.component";
import { LucideIconsModule } from "../../shared/icons/lucide-icons.module";
import { ToastService } from "../../shared/services/toast.service";
import { getAvatarUrl } from "../../shared/utils/avatar.utils";
import { UserProfile, User } from "../../shared/models/user.model";
import { Post, Reply } from "../../shared/models/post.model";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideIconsModule, PostCardComponent, DeleteConfirmModalComponent],
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
              <app-post-card
                [post]="post"
                [isLiked]="postEdit.postLikes()[post.id] === true"
                [isLiking]="postEdit.postLikingId() === post.id"
                [isOwnPost]="authService.currentUser()?.id === post.author.id"
                [authorLinkEnabled]="true"
                [highlighted]="false"
                [deleting]="postEdit.deletingPostId() === post.id"
                [replies]="postEdit.replyingToPost() === post.id ? postReplies() : []"
                [loadingReplies]="postEdit.replyingToPost() === post.id ? postEdit.loadingReplies() : false"
                [currentUserId]="authService.currentUser()?.id || null"
                [highlightReplyId]="null"
                [isSubmittingReply]="postEdit.isSubmittingReply()"
                [savingReply]="postEdit.savingReply()"
                (likeClick)="postEdit.toggleLike($event)"
                (replyToggle)="postEdit.toggleReply($event)"
                (deleteClick)="postEdit.deletePost($event)"
                (editStart)="postEdit.startEditPost($event)"
                (editSave)="onEditSave($event)"
                (editCancel)="onEditCancel()"
                (openReplyForm)="postEdit.openReplyForm(post.id)"
                (submitReplyEvent)="onSubmitReply(post.id, $event)"
                (startEditReply)="postEdit.startEditReply($event)"
                (cancelEditReply)="postEdit.cancelEditReply()"
                (saveEditReply)="onSaveEditReply(post.id, $event)"
                (deleteReplyEvent)="postEdit.deleteReply($event, post.id)"
                (toggleReplyToCommentEvent)="postEdit.toggleReplyToComment($event)"
                (cancelReplyToCommentEvent)="postEdit.cancelReplyToComment()"
                (submitReplyToCommentEvent)="onSubmitReplyToComment(post.id, $event)"
                (startEditNestedReply)="postEdit.startEditNestedReply($event)"
                (cancelEditNested)="postEdit.cancelEditNestedReply()"
                (saveEditNestedReply)="onSaveEditNestedReply(post.id, $event)"
                (deleteNestedReplyEvent)="postEdit.deleteNestedReply($event, post.id, '')"
              ></app-post-card>
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

<app-delete-confirm-modal
  [show]="postEdit.showDeletePostModal()"
  title="Excluir Postagem"
  itemType="esta postagem"
  (close)="postEdit.closeDeletePostModal()"
  (confirm)="postEdit.confirmDeletePost(posts)"
></app-delete-confirm-modal>

<app-delete-confirm-modal
  [show]="postEdit.showDeleteReplyModal()"
  title="Excluir Resposta"
  itemType="esta resposta"
  (close)="postEdit.closeDeleteReplyModal()"
  (confirm)="postEdit.confirmDeleteReply(postReplies, posts)"
></app-delete-confirm-modal>
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
  postEdit = inject(PostEditService);
  postReplies = signal<Reply[]>([]);

  loading = signal(true);
  postsLoading = signal(true);
  isFollowingLoading = signal(false);

  // Modal signals
  showModal = signal(false);
  modalTitle = signal("");
  modalUsers = signal<User[]>([]);
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
    private toast: ToastService,
    private sanitizer: DomSanitizer
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

  onSubmitReply(postId: string, content: string) {
    this.postEdit.submitReply(postId, this.posts, this.postReplies, content);
  }

  onSaveEditReply(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.saveEditReply(data.replyId, postId, this.postReplies);
  }

  onDeleteReply(postId: string, replyId: string) {
    this.postEdit.deleteReply(replyId, postId);
  }

  onSubmitReplyToComment(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.submitReplyToComment(data.replyId, postId, this.postReplies, data.content);
  }

  onSaveEditNestedReply(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.saveEditNestedReply(data.replyId, postId, '', this.postReplies);
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
                          this.postEdit.postLikes.update((likes) => ({
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

  openAvatarModal() {
    this.showAvatarModal.set(true);
    this.avatarUrlInput = '';
  }

  getAvatarUrl = getAvatarUrl;

  getYouTubeEmbedUrl(url: string): SafeResourceUrl | null {
    if (!url) return null;
    const match = url.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (!match) return null;
    const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
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

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.posts.update(posts =>
          posts.map(p => p.id === data.postId ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl } : p)
        );
        this.postEdit.editingPost.set(null);
      },
      error: (err) => {
        console.error('Error editing post:', err);
        this.postEdit.editingPost.set(null);
      }
    });
  }

  onEditCancel() {
    this.postEdit.editingPost.set(null);
  }

  onCloseReplies() {
    this.postEdit.replyingToPost.set(null);
  }
}
