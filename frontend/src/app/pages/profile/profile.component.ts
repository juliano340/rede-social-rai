import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { PostsService } from '../../services/posts.service';
import { PostEditService } from '../../services/post-edit.service';
import { ToastService } from '../../shared/services/toast.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { DeleteConfirmModalComponent } from '../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { UserProfile } from '../../shared/models/user.model';
import { Post, Reply, SubmitReplyEvent, ReplyActionEvent, NestedReplyEvent } from '../../shared/models/post.model';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';

import { ProfileStateService } from './services/profile-state.service';
import { ProfileHeaderComponent } from './components/profile-header.component';
import { ProfilePostsComponent } from './components/profile-posts.component';
import { FollowersModalComponent } from './modals/followers-modal.component';
import { EditProfileModalComponent } from './modals/edit-profile-modal.component';
import { AvatarUploadModalComponent } from './modals/avatar-upload-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, RouterLink, LucideIconsModule,
    PostCardComponent, DeleteConfirmModalComponent,
    ProfileHeaderComponent, ProfilePostsComponent,
    FollowersModalComponent, EditProfileModalComponent, AvatarUploadModalComponent,
  ],
  providers: [ProfileStateService],
  template: `
    <div class="profile-page">
      @if (state.loading()) {
        <div class="loading-state">
          <div class="spinner-lg"></div>
          <p>Carregando perfil...</p>
        </div>
      } @else if (state.profile()) {
        <div class="profile-card">
          <app-profile-header
            [profile]="state.profile()"
            [isOwnProfile]="state.isOwnProfile()"
            [isLoggedIn]="authService.isLoggedIn()"
            [isFollowingLoading]="state.isFollowingLoading()"
            [postsCount]="state.postsCount()"
            [followersCount]="state.followersCount()"
            [followingCount]="state.followingCount()"
            (avatarClick)="state.openAvatarModal()"
            (fileSelected)="onFileSelected($event)"
            (editClick)="state.openEditModal()"
            (followersClick)="openFollowers()"
            (followingClick)="openFollowing()"
            (followClick)="toggleFollow()"
          />
        </div>

        <app-profile-posts
          [posts]="state.posts()"
          [loading]="state.postsLoading()"
          [currentUserId]="authService.currentUser()?.id || null"
          [postLikingId]="postEdit.postLikingId()"
          [deletingPostId]="postEdit.deletingPostId()"
          [showReplies]="postEdit.openedPostId()"
          [replies]="postEdit.getCommentsMap()"
          [isSubmittingReply]="postEdit.isSubmittingReply()"
          [savingReply]="postEdit.savingReply()"
          (likeClick)="postEdit.toggleLike($event)"
          (replyToggle)="postEdit.toggleReply($event)"
          (deleteClick)="postEdit.deletePost($event)"
          (editStart)="postEdit.startEditPost($event)"
          (editSave)="onEditSave($event)"
          (editCancel)="postEdit.cancelEditPost()"
          (openReplyForm)="postEdit.openReplyForm($event)"
          (submitReply)="onSubmitReply($event)" 
          (startEditReply)="postEdit.startEditReply($event)"
          (cancelEditReply)="postEdit.cancelEditReply()"
          (saveEditReply)="onSaveEditReply($event)"
          (deleteReply)="postEdit.deleteReply($event.replyId, $event.postId)"
          (toggleReplyToComment)="postEdit.toggleReplyToComment($event)"
          (cancelReplyToComment)="postEdit.cancelReplyToComment()"
          (submitReplyToComment)="onSubmitReplyToComment($event)"
          (startEditNestedReply)="postEdit.startEditNestedReply($event)"
          (cancelEditNested)="postEdit.cancelEditNestedReply()"
          (saveEditNestedReply)="onSaveEditNestedReply($event)"
          (deleteNestedReply)="postEdit.deleteNestedReply($event.replyId, $event.postId, '')"
          (loadMoreReplies)="postEdit.loadMoreComments($event)"
        />
      } @else {
        <div class="error-state">
          <div class="error-icon">😕</div>
          <p>Usuário não encontrado</p>
          <a routerLink="/home" class="btn-secondary">Voltar ao início</a>
        </div>
      }

      <app-followers-modal
        [show]="!!state.modalType()"
        [title]="state.modalTitle()"
        [users]="state.modalUsers()"
        [loading]="state.modalLoading()"
        (close)="state.closeModal()"
      />

      <app-edit-profile-modal
        [show]="state.showEditModal()"
        [profile]="state.profile()"
        [saving]="state.savingProfile()"
        [bioLinkError]="bioLinkError()"
        (save)="saveProfile($event)"
        (close)="state.closeEditModal()"
      />

      <app-avatar-upload-modal
        [show]="state.showAvatarModal()"
        [uploading]="state.isUploadingAvatar()"
        (fileClick)="triggerFileInput()"
        (saveUrl)="saveAvatarUrl($event)"
        (close)="state.closeAvatarModal()"
      />

      <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" style="display: none" />

      <app-delete-confirm-modal
        [show]="postEdit.showDeletePostModal()"
        title="Excluir Postagem"
        itemType="esta postagem"
        (close)="postEdit.closeDeletePostModal()"
        (confirm)="postEdit.confirmDeletePost()"
      />

      <app-delete-confirm-modal
        [show]="postEdit.showDeleteReplyModal()"
        title="Excluir Resposta"
        itemType="esta resposta"
        (close)="postEdit.closeDeleteReplyModal()"
        (confirm)="postEdit.confirmDeleteReply()"
      />
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: var(--space-4);
      max-width: 800px;
      margin: 0 auto;
    }
    
    .profile-card {
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--duration-150) var(--ease-out);
      
      &:hover {
        box-shadow: var(--shadow-md);
      }
    }
    
    .loading-state {
      text-align: center;
      padding: var(--space-20) var(--space-6);
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      
      p {
        color: var(--text-secondary);
        margin-top: var(--space-4);
        font-size: var(--font-sm);
      }
      
      .spinner-lg {
        width: 48px;
        height: 48px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: var(--radius-full);
        animation: spin 0.8s linear infinite;
        margin: 0 auto var(--space-4);
      }
    }
    
    .error-state {
      text-align: center;
      padding: var(--space-20) var(--space-6);
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      
      .error-icon {
        font-size: 48px;
        margin-bottom: var(--space-3);
      }
      
      p {
        color: var(--text-secondary);
        font-size: var(--font-sm);
      }
      
      .btn-secondary {
        display: inline-block;
        margin-top: var(--space-4);
        padding: var(--space-3) var(--space-6);
        background: var(--primary);
        color: var(--text-inverse);
        border: none;
        border-radius: var(--radius-full);
        text-decoration: none;
        font-weight: var(--font-medium);
        font-size: var(--font-sm);
        transition: background var(--duration-150) var(--ease-out),
                    transform var(--duration-150) var(--ease-out);
        
        &:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }
        
        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .profile-card:hover {
        box-shadow: var(--shadow-sm);
      }
      
      .btn-secondary:hover {
        transform: none;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);
  private usersService = inject(UsersService);
  private postsService = inject(PostsService);
  private toast = inject(ToastService);
  readonly postEdit = inject(PostEditService);
  readonly state = inject(ProfileStateService);

  bioLinkError = signal('');

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.state.reset();
        this.loadProfile(username);
      }
    });
  }

  private loadProfile(username: string) {
    this.state.setLoading(true);
    this.usersService.getUser(username).subscribe({
      next: (data) => {
        const isOwn = this.authService.currentUser()?.id === data.id;
        this.state.setProfile(data, isOwn);
        this.loadPosts(data.id);
      },
      error: () => this.state.setLoading(false),
    });
  }

  private loadPosts(userId: string) {
    this.state.setPostsLoading(true);
    this.postsService.getUserPosts(userId).subscribe({
      next: (res) => {
        this.state.setPosts(res.posts || []);
        if (this.authService.isLoggedIn()) {
          this.postEdit.setPostLikes(res.posts || []);
        }
      },
      error: () => this.state.setPostsLoading(false),
    });
  }

  toggleFollow() {
    const userId = this.state.profile()?.id;
    if (!userId || this.state.isOwnProfile()) return;

    this.state.setFollowingLoading(true);
    this.usersService.follow(userId).subscribe({
      next: (response) => {
        this.state.toggleFollow(response.following);
        this.state.setFollowingLoading(false);
      },
      error: () => this.state.setFollowingLoading(false),
    });
  }

  openFollowers() {
    const userId = this.state.profile()?.id;
    if (!userId) return;
    this.state.openModal('followers', 'Seguidores');
    this.usersService.getFollowers(userId).subscribe({
      next: (data) => this.state.setModalUsers(data.users || []),
      error: () => this.state.setModalUsers([]),
    });
  }

  openFollowing() {
    const userId = this.state.profile()?.id;
    if (!userId) return;
    this.state.openModal('following', 'Seguindo');
    this.usersService.getFollowing(userId).subscribe({
      next: (data) => this.state.setModalUsers(data.users || []),
      error: () => this.state.setModalUsers([]),
    });
  }

  triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.toast.error('Por favor, selecione uma imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('A imagem deve ter no máximo 5MB.');
        return;
      }
      this.uploadAvatar(file);
    }
  }

  uploadAvatar(file: File) {
    this.state.setUploadingAvatar(true);
    this.usersService.uploadAvatar(file).subscribe({
      next: (response) => {
        this.state.updateAvatar(response.avatar);
        this.state.setUploadingAvatar(false);
        this.state.closeAvatarModal();
        this.toast.success('Foto atualizada!');
      },
      error: () => {
        this.state.setUploadingAvatar(false);
        this.toast.error('Erro ao atualizar foto.');
      },
    });
  }

  saveAvatarUrl(url: string) {
    if (!url.trim()) return;
    this.state.setUploadingAvatar(true);
    this.usersService.updateAvatarUrl(url.trim()).subscribe({
      next: (response) => {
        this.state.updateAvatar(response.avatar);
        this.state.setUploadingAvatar(false);
        this.state.closeAvatarModal();
        this.toast.success('Foto atualizada!');
      },
      error: () => {
        this.state.setUploadingAvatar(false);
        this.toast.error('Erro ao atualizar foto.');
      },
    });
  }

  saveProfile(data: { name: string; bio: string; bioLink: string }) {
    const normalized = this.normalizeBioLink(data.bioLink);
    if (data.bioLink.trim() && !normalized) {
      this.bioLinkError.set('Use um link público válido (ex: https://seusite.com).');
      return;
    }
    this.bioLinkError.set('');
    this.state.setSavingProfile(true);

    this.usersService.updateProfile({
      name: data.name.trim(),
      bio: data.bio,
      bioLink: data.bioLink.trim() || '',
    }).subscribe({
      next: (updated) => {
        this.state.updateProfile({
          name: updated.name,
          bio: updated.bio,
          bioLink: updated.bioLink,
        });
        this.state.closeEditModal();
        this.state.setSavingProfile(false);
        this.toast.success('Perfil atualizado!');
      },
      error: () => {
        this.state.setSavingProfile(false);
        this.toast.error('Erro ao atualizar perfil.');
      },
    });
  }

  normalizeBioLink(value: string): string | null {
    const raw = value.trim();
    if (!raw) return null;
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();
      const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
      const isPrivateIp = /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
      if (!/^https?:$/.test(url.protocol) || isLocalhost || isPrivateIp) return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  onSubmitReply(event: SubmitReplyEvent) {
    this.postEdit.submitReply(event.postId, event.content);
  }

  onSaveEditReply(event: ReplyActionEvent) {
    this.postEdit.saveEditReply(event.replyId, event.postId, event.content);
  }

  onSubmitReplyToComment(event: NestedReplyEvent) {
    this.postEdit.submitReplyToComment(event.replyId, event.postId, event.content);
  }

  onSaveEditNestedReply(event: ReplyActionEvent) {
    this.postEdit.saveEditNestedReply(event.replyId, event.postId, '', event.content);
  }

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.postsService.updatePostInSignals(data.postId, {
          content: updated.content,
          mediaUrl: updated.mediaUrl,
          mediaType: updated.mediaType,
          linkUrl: updated.linkUrl,
        });
        this.postEdit.cancelEditPost();
      },
      error: () => this.postEdit.cancelEditPost(),
    });
  }
}
