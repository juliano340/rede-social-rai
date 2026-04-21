import { Component, OnInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PostsService, Post } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { ToastService } from '../../shared/services/toast.service';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { ReplySectionComponent } from '../../shared/components/reply-section/reply-section.component';
import { DeleteConfirmModalComponent } from '../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { PostCreateFormComponent } from '../../shared/components/post-create-form/post-create-form.component';
import { getAvatarUrl } from '../../shared/utils/avatar.utils';
import { formatDate } from '../../shared/utils/date.utils';
import { getYouTubeEmbedUrl } from '../../shared/utils/media.utils';
import { PostEditService } from '../../services/post-edit.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SkeletonComponent, LucideIconsModule, PostCardComponent, ReplySectionComponent, DeleteConfirmModalComponent, PostCreateFormComponent],
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
        <app-post-create-form
          [isSubmitting]="isSubmitting()"
          [error]="submitError()"
          [success]="submitSuccess()"
          (submit)="onCreatePost($event)"
        ></app-post-create-form>
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
              <app-post-card
                [post]="post"
                [isLiked]="postLikes()[post.id] === true"
                [isLiking]="postLikingId() === post.id"
                [isOwnPost]="authService.currentUser()?.id === post.author.id"
                [authorLinkEnabled]="true"
                [highlighted]="highlightPostId() === post.id"
                [deleting]="deletingPostId() === post.id"
                [replies]="post.replies || []"
                [loadingReplies]="replyingToPost() === post.id || viewingRepliesPost() === post.id ? loadingReplies() : false"
                [currentUserId]="authService.currentUser()?.id || null"
                [highlightReplyId]="highlightReplyId()"
                [isSubmittingReply]="isSubmittingReply()"
                [savingReply]="savingReply()"
                (likeClick)="onLikeClick($event)"
                (replyToggle)="onReplyToggle($event)"
                (deleteClick)="onDeleteClick($event)"
                (editStart)="onEditStart($event)"
                (editSave)="onEditSave($event)"
                (editCancel)="onEditCancel()"
                (openReplyForm)="onOpenReplyForm(post.id)"
                (submitReplyEvent)="onSubmitReply(post.id, $event)"
                (startEditReply)="onStartEditReply($event)"
                (cancelEditReply)="onCancelEditReply()"
                (saveEditReply)="onSaveEditReply(post.id, $event)"
                (deleteReplyEvent)="onDeleteReply(post.id, $event)"
                (toggleReplyToCommentEvent)="onToggleReplyToComment($event)"
                (cancelReplyToCommentEvent)="onCancelReplyToComment()"
                (submitReplyToCommentEvent)="onSubmitReplyToComment(post.id, $event)"
                (startEditNestedReply)="onStartEditNestedReply($event)"
                (cancelEditNested)="onCancelEditNestedReply()"
                (saveEditNestedReply)="onSaveEditNestedReply(post.id, $event)"
                (deleteNestedReplyEvent)="onDeleteNestedReply(post.id, $event)"
              ></app-post-card>
            }
          </div>
        }
      </div>
    </div>
    
    <!-- Delete Confirmation Modals -->
    <app-delete-confirm-modal
      [show]="showDeleteModal()"
      title="Excluir Resposta"
      itemType="esta resposta"
      (close)="onCloseDeleteReplyModal()"
      (confirm)="onConfirmDeleteReply()"
    ></app-delete-confirm-modal>

    <app-delete-confirm-modal
      [show]="showDeletePostModal()"
      title="Excluir Postagem"
      itemType="esta postagem"
      (close)="onCloseDeletePostModal()"
      (confirm)="onConfirmDeletePost()"
    ></app-delete-confirm-modal>
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

    .post-actions {
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
  newMediaType = signal<'image' | 'youtube' | null>(null);
  newLinkUrl = signal<string | null>(null);
  showMediaInput = signal(false);
  
  linkDetected = signal<string | null>(null);
  showLinkPreview = signal(false);
  
  isSubmitting = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  loadingReplies = signal(false);
  
  highlightPostId = signal<string | null>(null);
  highlightReplyId = signal<string | null>(null);

  private postEdit = inject(PostEditService);

  get editingPost() { return this.postEdit.editingPost; }
  get editPostContent() { return this.postEdit.editPostContent; }
  set editPostContent(value: string) { this.postEdit.editPostContent = value; }
  get editMediaUrl() { return this.postEdit.editMediaUrl; }
  set editMediaUrl(value: string) { this.postEdit.editMediaUrl = value; }
  get editMediaType() { return this.postEdit.editMediaType; }
  get editLinkUrl() { return this.postEdit.editLinkUrl; }
  get postLikingId() { return this.postEdit.postLikingId; }
  get postLikes() { return this.postEdit.postLikes; }
  get replyingToPost() { return this.postEdit.replyingToPost; }
  readonly viewingRepliesPost = this.postEdit.replyingToPost;
  get replyContent() { return this.postEdit.replyContent; }
  set replyContent(value: string) { this.postEdit.replyContent = value; }
  get postReplies() { return this.postEdit.postReplies; }
  get isSubmittingReply() { return this.postEdit.isSubmittingReply; }
  get replyingToComment() { return this.postEdit.replyingToComment; }
  get replyingToCommentContent() { return this.postEdit.replyingToCommentContent; }
  set replyingToCommentContent(value: string) { this.postEdit.replyingToCommentContent = value; }
  get editingReply() { return this.postEdit.editingReply; }
  get editReplyContent() { return this.postEdit.editReplyContent; }
  set editReplyContent(value: string) { this.postEdit.editReplyContent = value; }
  get savingReply() { return this.postEdit.savingReply; }
  get showDeleteModal() { return this.postEdit.showDeleteReplyModal; }
  get showDeletePostModal() { return this.postEdit.showDeletePostModal; }
  get deletingPostId() { return this.postEdit.deletingPostId; }
  get deletingReplyId() { return this.postEdit.deletingReplyId; }
  get deletingReplyPostId() { return this.postEdit.deletingReplyPostId; }
  get editingNestedReply() { return this.postEdit.editingNestedReply; }
  get editNestedReplyContent() { return this.postEdit.editNestedReplyContent; }
  set editNestedReplyContent(value: string) { this.postEdit.editNestedReplyContent = value; }

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

        if (this.authService.isLoggedIn()) {
          const likes: Record<string, boolean> = {};
          response.posts.forEach((post: any) => {
            likes[post.id] = post.isLiked || false;
          });
          this.postLikes.set(likes);
        }

        this.isLoading.set(false);
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

  onCreatePost(data: { content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.isSubmitting.set(true);

    this.postsService.createPost(data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (post) => {
        this.posts.update(posts => [post, ...posts]);
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

  onLikeClick(post: Post) {
    this.toggleLike(post);
  }

  onReplyToggle(postId: string) {
    if (this.replyingToPost() === postId) {
      this.postEdit.cancelReply();
    } else {
      this.replyingToPost.set(postId);
      this.loadReplies(postId);
    }
  }

  onEditStart(post: Post) {
    this.startEditPost(post);
  }

  onDeleteClick(postId: string) {
    this.deletePost(postId);
  }

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.posts.update(posts =>
          posts.map(p => p.id === data.postId ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl } : p)
        );
        this.editingPost.set(null);
      },
      error: (err) => {
        console.error('Error editing post:', err);
        this.editingPost.set(null);
      }
    });
  }

  onEditCancel() {
    this.editingPost.set(null);
  }

  onCloseReplies() {
    this.viewingRepliesPost.set(null);
    this.replyingToPost.set(null);
  }

  onOpenReplyForm(postId: string) {
    this.openReplyForm(postId);
  }

  onSubmitReply(postId: string, content: string) {
    this.submitReply(postId, content);
  }

  onStartEditReply(reply: any) {
    this.startEditReply(reply);
  }

  onCancelEditReply() {
    this.cancelEditReply();
  }

  onSaveEditReply(postId: string, data: { replyId: string; content: string }) {
    this.saveEditReply(data.replyId, postId);
  }

  onDeleteReply(postId: string, replyId: string) {
    this.deleteReply(replyId, postId);
  }

  onToggleReplyToComment(commentId: string) {
    this.toggleReplyToComment(commentId);
  }

  onCancelReplyToComment() {
    this.cancelReplyToComment();
  }

  onSubmitReplyToComment(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.submitReplyToComment(data.replyId, postId, this.postReplies, data.content, this.posts);
  }

  onStartEditNestedReply(reply: any) {
    this.startEditNestedReply(reply);
  }

  onCancelEditNestedReply() {
    this.cancelEditNestedReply();
  }

  onSaveEditNestedReply(postId: string, data: { replyId: string; content: string }) {
    this.saveEditNestedReply(data.replyId, postId);
  }

  onDeleteNestedReply(postId: string, replyId: string) {
    this.deleteNestedReply(replyId, postId);
  }

  onCloseDeleteReplyModal() {
    this.closeDeleteModal();
  }

  onConfirmDeleteReply() {
    this.confirmDeleteReply();
  }

  onCloseDeletePostModal() {
    this.closeDeletePostModal();
  }

  onConfirmDeletePost() {
    this.confirmDeletePost();
  }

  deletePost(id: string) {
    this.postEdit.deletePost(id);
  }

  confirmDeletePost() {
    this.postEdit.confirmDeletePost(this.posts);
  }

  closeDeletePostModal() {
    this.postEdit.closeDeletePostModal();
  }

  startEditPost(post: Post) {
    this.postEdit.startEditPost(post);
  }

  cancelEditPost() {
    this.postEdit.cancelEditPost();
  }

  saveEditPost(postId: string) {
    this.postEdit.saveEditPost(postId, this.posts);
  }

  toggleLike(post: Post) {
    this.postEdit.toggleLike(post);
  }

  submitReply(postId: string, content: string) {
    this.postEdit.submitReply(postId, this.posts, this.postReplies, content);
  }

  startEditReply(reply: any) {
    this.postEdit.startEditReply(reply);
  }

  cancelEditReply() {
    this.postEdit.cancelEditReply();
  }

  saveEditReply(replyId: string, postId: string) {
    this.postEdit.saveEditReply(replyId, postId, this.postReplies, this.posts);
  }

  deleteReply(replyId: string, postId: string) {
    this.postEdit.deleteReply(replyId, postId);
  }

  confirmDeleteReply() {
    this.postEdit.confirmDeleteReply(this.postReplies, this.posts);
  }

  closeDeleteModal() {
    this.postEdit.closeDeleteReplyModal();
  }
  
  startEditNestedReply(reply: any) {
    this.postEdit.startEditNestedReply(reply);
  }
  
  cancelEditNestedReply() {
    this.postEdit.cancelEditNestedReply();
  }
  
  saveEditNestedReply(replyId: string, postId: string) {
    this.postEdit.saveEditNestedReply(replyId, postId, '', this.postReplies, this.posts);
  }
  
  deleteNestedReply(replyId: string, postId: string) {
    this.postEdit.deleteNestedReply(replyId, postId, '');
  }

  toggleReply(postId: string) {
    if (this.replyingToPost() === postId) {
      this.cancelReply();
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
    this.postEdit.openReplyForm(postId);
  }

  cancelReply() {
    this.postEdit.cancelReply();
  }

  toggleReplyToComment(commentId: string) {
    this.postEdit.toggleReplyToComment(commentId);
  }

  cancelReplyToComment() {
    this.postEdit.cancelReplyToComment();
  }

  setNewMediaType(type: 'image' | 'youtube') {
    if (this.newMediaType() === type) {
      this.newMediaType.set(null);
      this.newMediaUrl = '';
    } else {
      this.newMediaType.set(type);
      this.newMediaUrl = '';
    }
  }

  clearNewLink() {
    this.newLinkUrl.set(null);
  }

  onContentChange() {
    const url = this.postEdit.detectUrlInContent(this.newPostContent);
    if (url && url !== this.linkDetected() && !this.showLinkPreview()) {
      this.linkDetected.set(url);
    }
  }

  onAddLinkPreview() {
    this.linkDetected.set(this.postEdit.detectUrlInContent(this.newPostContent));
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
    this.postEdit.setEditMediaType(type);
  }

  removeEditMedia() {
    this.postEdit.removeEditMedia();
  }

  clearEditMediaType() {
    this.postEdit.clearEditMediaType();
  }

  detectUrlInContent(content: string): string | null {
    return this.postEdit.detectUrlInContent(content);
  }

  getDomain(url: string): string {
    return this.postEdit.getDomain(url);
  }

  clearLinkPreview() {
    this.linkDetected.set(null);
    this.showLinkPreview.set(false);
  }

  clearEditLinkPreview() {
    this.postEdit.clearEditLinkPreview();
  }

  normalizeUrl(url: string): string | null {
    return this.postEdit.normalizeUrl(url);
  }

  isValidImageUrl(url: string): boolean {
    return this.postEdit.isValidImageUrl(url);
  }
}