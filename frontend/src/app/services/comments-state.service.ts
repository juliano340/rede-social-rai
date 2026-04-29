import { Injectable, inject, signal } from '@angular/core';
import { PostsService } from './posts.service';
import { Post, Reply } from '../shared/models';

export interface CommentsState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  replies: Reply[];
  cursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
}

const IDLE_COMMENTS: CommentsState = {
  status: 'idle',
  replies: [],
  cursor: null,
  hasMore: false,
  loadingMore: false,
};

@Injectable({ providedIn: 'root' })
export class CommentsStateService {
  private postsService = inject(PostsService);

  readonly replyLoading = signal(false);

  private _commentsByPostId = signal<Record<string, CommentsState>>({});
  readonly commentsByPostId = this._commentsByPostId.asReadonly();

  private _openedPostId = signal<string | null>(null);
  readonly openedPostId = this._openedPostId.asReadonly();

  get replyingToPost() { return this._openedPostId; }
  get loadingReplies() { return this.replyLoading; }

  getComments(postId: string): CommentsState {
    return this._commentsByPostId()[postId] || IDLE_COMMENTS;
  }

  getCommentsMap(): Map<string, CommentsState> {
    return new Map(Object.entries(this._commentsByPostId()));
  }

  isOpen(postId: string): boolean {
    return this._openedPostId() === postId;
  }

  openComments(postId: string): void {
    if (this._openedPostId() === postId) return;
    this._openedPostId.set(postId);
    this.loadCommentsIfNeeded(postId);
  }

  closeComments(): void {
    this._openedPostId.set(null);
  }

  toggleComments(postId: string): void {
    if (this._openedPostId() === postId) {
      this.closeComments();
    } else {
      this.openComments(postId);
    }
  }

  loadMoreComments(postId: string): void {
    const state = this.getComments(postId);
    if (!state.cursor || state.loadingMore || state.status !== 'loaded') return;

    this._commentsByPostId.update(map => ({
      ...map,
      [postId]: { ...map[postId], loadingMore: true },
    }));

    this.postsService.getReplies(postId, state.cursor).subscribe({
      next: (data) => {
        this._commentsByPostId.update(map => {
          const prev = map[postId];
          return {
            ...map,
            [postId]: {
              ...prev,
              replies: [...prev.replies, ...(data.replies || [])],
              cursor: data.nextCursor || null,
              hasMore: !!data.nextCursor,
              loadingMore: false,
            },
          };
        });
      },
      error: () => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: { ...map[postId], loadingMore: false },
        }));
      },
    });
  }

  updateComments(postId: string, updater: (replies: Reply[]) => Reply[]): void {
    this._commentsByPostId.update(map => {
      const prev = map[postId];
      if (!prev) return map;
      return { ...map, [postId]: { ...prev, replies: updater(prev.replies) } };
    });
  }

  updateAvatarInComments(username: string, avatar: string, userId?: string): void {
    this._commentsByPostId.update(map => {
      const next: Record<string, CommentsState> = {};
      Object.entries(map).forEach(([postId, state]) => {
        next[postId] = {
          ...state,
          replies: state.replies.map(reply => this.updateReplyAvatar(reply, username, avatar, userId)),
        };
      });
      return next;
    });
  }

  findPost(postId: string): Post | undefined {
    return this.postsService.feedPosts().find(p => p.id === postId)
      || this.postsService.profilePosts().find(p => p.id === postId);
  }

  private loadCommentsIfNeeded(postId: string): void {
    const current = this.getComments(postId);
    if (current.status === 'loaded' || current.status === 'loading') return;

    this._commentsByPostId.update(map => ({
      ...map,
      [postId]: { ...IDLE_COMMENTS, status: 'loading' },
    }));
    this.replyLoading.set(true);

    this.postsService.getReplies(postId).subscribe({
      next: (data) => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: {
            status: 'loaded',
            replies: data.replies || [],
            cursor: data.nextCursor || null,
            hasMore: !!data.nextCursor,
            loadingMore: false,
          },
        }));
        this.replyLoading.set(false);
      },
      error: () => {
        this._commentsByPostId.update(map => ({
          ...map,
          [postId]: { ...IDLE_COMMENTS, status: 'error' },
        }));
        this.replyLoading.set(false);
      },
    });
  }

  private updateReplyAvatar(reply: Reply, username: string, avatar: string, userId?: string): Reply {
    return {
      ...reply,
      author: reply.author && this.isSameAuthor(reply.author, username, userId) ? { ...reply.author, avatar } : reply.author,
      children: reply.children?.map(child => this.updateReplyAvatar(child, username, avatar, userId)),
    };
  }

  private isSameAuthor(author: { id?: string; username?: string }, username: string, userId?: string): boolean {
    return (!!userId && author.id === userId) || author.username === username;
  }
}
