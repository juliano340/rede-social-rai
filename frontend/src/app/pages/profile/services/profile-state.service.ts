import { Injectable, signal, computed, inject } from '@angular/core';
import { UserProfile, User } from '../../../shared/models/user.model';
import { Post, Reply } from '../../../shared/models/post.model';
import { PostsService } from '../../../services/posts.service';

export type ModalType = 'followers' | 'following' | null;

@Injectable()
export class ProfileStateService {
  private postsService = inject(PostsService);

  readonly profile = signal<UserProfile | null>(null);
  get posts() { return this.postsService.profilePosts; }
  readonly postReplies = signal<Reply[]>([]);

  readonly loading = signal(true);
  readonly postsLoading = signal(true);
  readonly isFollowingLoading = signal(false);

  readonly modalType = signal<ModalType>(null);
  readonly modalTitle = signal('');
  readonly modalUsers = signal<User[]>([]);
  readonly modalLoading = signal(false);

  readonly isUploadingAvatar = signal(false);
  readonly showAvatarModal = signal(false);
  readonly avatarUrlInput = signal('');

  readonly showEditModal = signal(false);
  readonly savingProfile = signal(false);

  readonly followersCount = computed(() => this.profile()?._count?.followers ?? 0);
  readonly followingCount = computed(() => this.profile()?._count?.following ?? 0);
  readonly postsCount = computed(() => this.profile()?._count?.posts ?? 0);
  readonly isOwnProfile = signal(false);

  setProfile(profile: UserProfile | null, isOwn: boolean): void {
    this.profile.set(profile);
    this.isOwnProfile.set(isOwn);
    this.loading.set(false);
  }

  setPosts(posts: Post[]): void {
    this.postsService.setProfilePosts(posts);
    this.postsLoading.set(false);
  }

  updateProfile(updates: Partial<UserProfile>): void {
    this.profile.update(p => p ? { ...p, ...updates } : p);
  }

  toggleFollow(isFollowing: boolean): void {
    this.profile.update(p => {
      if (!p) return p;
      const delta = isFollowing ? 1 : -1;
      return {
        ...p,
        isFollowing,
        _count: { ...p._count, followers: Math.max(0, p._count.followers + delta) },
      };
    });
  }

  updateAvatar(avatar: string): void {
    this.profile.update(p => p ? { ...p, avatar } : p);
    const username = this.profile()?.username;
    if (!username) return;

    this.postsService.profilePosts.update(posts =>
      posts.map(post =>
        post.author.username === username
          ? { ...post, author: { ...post.author, avatar } }
          : post
      )
    );

    this.postReplies.update(replies =>
      replies.map(reply =>
        reply.author.username === username
          ? { ...reply, author: { ...reply.author, avatar } }
          : reply
      )
    );
  }

  openModal(type: ModalType, title: string): void {
    this.modalType.set(type);
    this.modalTitle.set(title);
    this.modalLoading.set(true);
    this.modalUsers.set([]);
  }

  closeModal(): void {
    this.modalType.set(null);
    this.modalUsers.set([]);
  }

  setModalUsers(users: User[]): void {
    this.modalUsers.set(users);
    this.modalLoading.set(false);
  }

  openAvatarModal(): void {
    this.showAvatarModal.set(true);
    this.avatarUrlInput.set('');
  }

  closeAvatarModal(): void {
    this.showAvatarModal.set(false);
    this.avatarUrlInput.set('');
  }

  openEditModal(): void {
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setPostsLoading(value: boolean): void {
    this.postsLoading.set(value);
  }

  setFollowingLoading(value: boolean): void {
    this.isFollowingLoading.set(value);
  }

  setUploadingAvatar(value: boolean): void {
    this.isUploadingAvatar.set(value);
  }

  setSavingProfile(value: boolean): void {
    this.savingProfile.set(value);
  }

  reset(): void {
    this.profile.set(null);
    this.postsService.setProfilePosts([]);
    this.postReplies.set([]);
    this.loading.set(true);
    this.postsLoading.set(true);
    this.isFollowingLoading.set(false);
    this.modalType.set(null);
    this.modalTitle.set('');
    this.modalUsers.set([]);
    this.modalLoading.set(false);
    this.showAvatarModal.set(false);
    this.avatarUrlInput.set('');
    this.showEditModal.set(false);
    this.savingProfile.set(false);
  }
}