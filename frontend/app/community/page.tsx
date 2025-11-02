'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiMessageCircle,
  FiSend,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";
import {
  CommunityComment,
  CommunityPost,
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityComments,
  fetchCommunityPosts,
  toggleCommunityPostLike,
  updateCommunityPost,
} from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

type CommentState = {
  visible: boolean;
  loading: boolean;
  error: string | null;
  comments: CommunityComment[] | null;
  newComment: string;
  replyDrafts: Record<number, string>;
};

const createDefaultCommentState = (): CommentState => ({
  visible: false,
  loading: false,
  error: null,
  comments: null,
  newComment: "",
  replyDrafts: {},
});

const splitTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const buildCommentTree = (comments: CommunityComment[]): CommunityComment[] => {
  const nodes = comments.map((comment) => ({ ...comment, replies: [] as CommunityComment[] }));
  const byId = new Map<number, CommunityComment>();

  nodes.forEach((node) => byId.set(node.id, node));

  const roots: CommunityComment[] = [];
  nodes.forEach((node) => {
    const parentId = node.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!;
      parent.replies = parent.replies ?? [];
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const mergeReplies = (
  comments: CommunityComment[],
  parentId: number,
  newComment: CommunityComment
): CommunityComment[] =>
  comments.map((comment) => {
    const replies = comment.replies ?? [];
    if (comment.id === parentId) {
      return { ...comment, replies: [...replies, newComment] };
    }
    if (replies.length) {
      return { ...comment, replies: mergeReplies(replies, parentId, newComment) };
    }
    return comment;
  });

const countCommentNodes = (comments: CommunityComment[]): number =>
  comments.reduce((total, comment) => total + 1 + countCommentNodes(comment.replies ?? []), 0);

const removeCommentFromTree = (
  comments: CommunityComment[],
  commentId: number
): { updated: CommunityComment[]; removed: number } => {
  let removed = 0;
  const updated = comments.reduce<CommunityComment[]>((acc, comment) => {
    const replies = comment.replies ?? [];
    if (comment.id === commentId) {
      removed += 1 + countCommentNodes(replies);
      return acc;
    }
    if (replies.length) {
      const result = removeCommentFromTree(replies, commentId);
      if (result.removed > 0) {
        removed += result.removed;
        acc.push({ ...comment, replies: result.updated });
        return acc;
      }
    }
    acc.push(comment);
    return acc;
  }, []);
  return { updated, removed };
};

export default function CommunityPage() {
  const [createForm, setCreateForm] = useState({ title: "", body: "", tags: "" });
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostForm, setEditPostForm] = useState({ title: "", body: "", tags: "" });
  const [commentsState, setCommentsState] = useState<Record<number, CommentState>>({});
  const [postError, setPostError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: postsData,
    loading,
    error,
    execute: loadPosts,
    setData: setPostsData,
  } = useApiRequest(fetchCommunityPosts);
  const {
    execute: publishPost,
    loading: publishing,
    error: publishError,
  } = useApiRequest(createCommunityPost);
  const { execute: patchPost, loading: updatingPost, error: patchError } = useApiRequest(updateCommunityPost);
  const { execute: removePost, loading: deletingPost, error: deletePostError } = useApiRequest(deleteCommunityPost);
  const { execute: toggleLike } = useApiRequest(toggleCommunityPostLike);
  const { execute: loadComments } = useApiRequest(fetchCommunityComments);
  const { execute: sendComment } = useApiRequest(createCommunityComment);
  const { execute: removeComment, error: deleteCommentError } = useApiRequest(deleteCommunityComment);

  useEffect(() => {
    loadPosts()
      .then((data) => {
        if (data) {
          setPostsData(data);
        }
      })
      .catch((err) => console.error("Community posts gagal dimuat", err));
  }, [loadPosts, setPostsData]);

  const ensureCommentState = (postId: number) => {
    setCommentsState((prev) => {
      if (prev[postId]) return prev;
      return { ...prev, [postId]: createDefaultCommentState() };
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPostError(null);
    const payload = {
      title: createForm.title.trim(),
      body: createForm.body.trim(),
      tags: splitTags(createForm.tags),
    };
    if (!payload.title || !payload.body) {
      setPostError("Judul dan isi postingan wajib diisi.");
      return;
    }

    try {
      const created = await publishPost(payload);
      if (created) {
        setPostsData((prev) => (prev ? [created, ...prev] : [created]));
        setCreateForm({ title: "", body: "", tags: "" });
      }
    } catch (err) {
      console.error("Gagal mempublikasikan postingan", err);
    }
  };

  const handleStartEditPost = (post: CommunityPost) => {
    setEditError(null);
    setEditingPostId(post.id);
    setEditPostForm({
      title: post.title,
      body: post.body,
      tags: post.tags.join(", "),
    });
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditError(null);
  };

  const handleUpdatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);
    if (editingPostId === null) return;
    const payload = {
      title: editPostForm.title.trim(),
      body: editPostForm.body.trim(),
      tags: splitTags(editPostForm.tags),
    };
    if (!payload.title || !payload.body) {
      setEditError("Judul dan isi postingan wajib diisi.");
      return;
    }
    try {
      const updated = await patchPost(editingPostId, payload);
      if (updated) {
        setPostsData((prev) => (prev ? prev.map((post) => (post.id === updated.id ? updated : post)) : prev));
        setEditingPostId(null);
        setEditError(null);
      }
    } catch (err) {
      console.error("Gagal memperbarui postingan", err);
      setEditError("Gagal memperbarui postingan.");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Hapus postingan ini?")) return;
    setDeleteError(null);
    try {
      await removePost(postId);
      setPostsData((prev) => (prev ? prev.filter((post) => post.id !== postId) : prev));
    } catch (err) {
      console.error("Gagal menghapus postingan", err);
      setDeleteError("Gagal menghapus postingan.");
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    setPostsData((prev) =>
      prev
        ? prev.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  isLiked: !item.isLiked,
                  likes: item.isLiked ? Math.max(0, item.likes - 1) : item.likes + 1,
                }
              : item
          )
        : prev
    );

    try {
      const result = await toggleLike(post.id);
      setPostsData((prev) =>
        prev
          ? prev.map((item) =>
              item.id === post.id ? { ...item, isLiked: result.liked, likes: result.likes } : item
            )
          : prev
      );
    } catch (err) {
      console.error("Gagal memperbarui like", err);
      setPostsData((prev) =>
        prev
          ? prev.map((item) =>
              item.id === post.id ? { ...item, isLiked: post.isLiked, likes: post.likes } : item
            )
          : prev
      );
    }
  };

  const handleToggleComments = async (postId: number) => {
    ensureCommentState(postId);
    setCommentsState((prev) => {
      const current = prev[postId] ?? createDefaultCommentState();
      return {
        ...prev,
        [postId]: { ...current, visible: !current.visible },
      };
    });

    const state = commentsState[postId];
    if (!state || (!state.comments && !state.loading)) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] ?? createDefaultCommentState()), loading: true, error: null },
      }));
        try {
          const comments = await loadComments(postId);
          const tree = buildCommentTree(comments);
          setCommentsState((prev) => ({
            ...prev,
            [postId]: {
              ...(prev[postId] ?? createDefaultCommentState()),
              loading: false,
              comments: tree,
              visible: true,
            },
          }));
      } catch (err) {
        console.error("Gagal memuat komentar", err);
        setCommentsState((prev) => ({
          ...prev,
          [postId]: {
            ...(prev[postId] ?? createDefaultCommentState()),
            loading: false,
            error: "Komentar tidak dapat dimuat.",
          },
        }));
      }
    }
  };

  const handleCommentDraftChange = (postId: number, value: string) => {
    ensureCommentState(postId);
    setCommentsState((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? createDefaultCommentState()), newComment: value },
    }));
  };

  const handleReplyDraftChange = (postId: number, commentId: number, value: string) => {
    ensureCommentState(postId);
    setCommentsState((prev) => {
      const current = prev[postId] ?? createDefaultCommentState();
      return {
        ...prev,
        [postId]: {
          ...current,
          replyDrafts: {
            ...current.replyDrafts,
            [commentId]: value,
          },
        },
      };
    });
  };

  const handleSubmitComment = async (postId: number) => {
    const state = commentsState[postId] ?? createDefaultCommentState();
    const body = state.newComment.trim();
    if (!body) return;
    try {
      const comment = await sendComment(postId, { body });
      const node: CommunityComment = { ...comment, replies: [] };
      setCommentsState((prev) => {
        const current = prev[postId] ?? createDefaultCommentState();
        const existing = current.comments ?? [];
        return {
          ...prev,
          [postId]: { ...current, comments: [node, ...existing], newComment: "" },
        };
      });
      setPostsData((prev) =>
        prev
          ? prev.map((post) =>
              post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post
            )
          : prev
      );
    } catch (err) {
      console.error("Gagal menambah komentar", err);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] ?? createDefaultCommentState()), error: "Gagal menambah komentar." },
      }));
    }
  };

  const handleSubmitReply = async (postId: number, parentId: number) => {
    const state = commentsState[postId] ?? createDefaultCommentState();
    const draft = state.replyDrafts[parentId]?.trim();
    if (!draft) return;
    try {
      const comment = await sendComment(postId, { body: draft, parentId });
      const node: CommunityComment = { ...comment, replies: [] };
      setCommentsState((prev) => {
        const current = prev[postId] ?? createDefaultCommentState();
        const existing = current.comments ?? [];
        if (!existing.length && current.comments === null) {
          return prev;
        }
        return {
          ...prev,
          [postId]: {
            ...current,
            comments: mergeReplies(existing, parentId, node),
            replyDrafts: { ...current.replyDrafts, [parentId]: "" },
          },
        };
      });
      setPostsData((prev) =>
        prev
          ? prev.map((post) =>
              post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post
            )
          : prev
      );
    } catch (err) {
      console.error("Gagal menambah balasan", err);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] ?? createDefaultCommentState()), error: "Gagal menambah balasan." },
      }));
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      await removeComment(postId, commentId);
      let removedCount = 0;
      setCommentsState((prev) => {
        const current = prev[postId] ?? createDefaultCommentState();
        if (!current.comments) return prev;
        const { updated, removed } = removeCommentFromTree(current.comments, commentId);
        if (removed === 0) {
          return prev;
        }
        removedCount = removed;
        return {
          ...prev,
          [postId]: { ...current, comments: updated },
        };
      });
      if (removedCount > 0) {
        setPostsData((prev) =>
          prev
            ? prev.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      commentsCount: Math.max(0, post.commentsCount - removedCount),
                    }
                  : post
              )
            : prev
        );
      }
    } catch (err) {
      console.error("Gagal menghapus komentar", err);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] ?? createDefaultCommentState()), error: "Gagal menghapus komentar." },
      }));
    }
  };

  const posts = postsData ?? [];

  const renderComments = (postId: number, comments: CommunityComment[], depth = 0) =>
    comments.map((comment) => {
      const replyDraft = commentsState[postId]?.replyDrafts[comment.id] ?? "";
      return (
        <div
          key={comment.id}
          className={`space-y-3 rounded-2xl border border-emerald-100 bg-white/70 p-4 ${depth ? "ml-6" : ""}`}
        >
          <div className="flex justify-between text-xs text-emerald-900/60">
            <span>{comment.author}</span>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-emerald-900/80">{comment.body}</p>
          <div className="flex items-center gap-2 text-xs">
            {comment.isOwner ? (
              <button
                type="button"
                onClick={() => handleDeleteComment(postId, comment.id)}
                className="flex items-center gap-1 text-red-600"
              >
                <FiTrash2 />
                Hapus
              </button>
            ) : null}
          </div>
          <div className="pl-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyDraft}
                onChange={(event) => handleReplyDraftChange(postId, comment.id, event.target.value)}
                placeholder="Balas komentar ini..."
                className="flex-1 rounded-full border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <button
                type="button"
                onClick={() => handleSubmitReply(postId, comment.id)}
                className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <FiSend />
                Kirim
              </button>
            </div>
            {comment.replies.length ? (
              <div className="mt-3 space-y-3 border-l border-emerald-100 pl-3">
                {renderComments(postId, comment.replies ?? [], depth + 1)}
              </div>
            ) : null}
          </div>
        </div>
      );
    });

  const globalError = useMemo(() => publishError || patchError || deletePostError || deleteCommentError, [
    publishError,
    patchError,
    deletePostError,
    deleteCommentError,
  ]);

  return (
    <AppShell
      title="Forum Komunitas"
      subtitle="Berbagi pengalaman lapangan, temuan penyakit terbaru, dan teknik perawatan yang terbukti."
    >
      <SectionCard
        title="Bagikan kasus Anda"
        description="Pelajaran lapangan Anda bisa membantu petani lain. Gunakan tag sederhana agar mudah ditemukan."
      >
        <form className="grid gap-4" onSubmit={handleCreate}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Judul</span>
            <input
              required
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Contoh: Mengendalikan antraknosa pada cabai"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Tag (pisahkan dengan koma)</span>
            <input
              value={createForm.tags}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Contoh: cabai, jamur"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Cerita lengkap</span>
            <textarea
              required
              rows={5}
              value={createForm.body}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, body: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Tuliskan konteks lahan, gejala, analisis, langkah perawatan, dan hasil yang didapat."
            />
          </label>

          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-900/70">
              Postingan akan tampil ke publik. Jangan cantumkan informasi pribadi sensitif.
            </p>
            <button
              type="submit"
              disabled={publishing}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {publishing ? "Menerbitkan..." : "Publikasikan"}
            </button>
          </div>
        </form>
        {postError ? <p className="text-sm text-red-600">{postError}</p> : null}
        {publishError ? (
          <p className="text-sm text-red-600">
            Postingan gagal diterbitkan. Pastikan backend di http://localhost:8000/api tersedia.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Diskusi terbaru">
        {loading ? (
          <p className="text-sm text-emerald-900/70">Memuat diskusi komunitas...</p>
        ) : error ? (
          <DataState title="Tidak dapat memuat komunitas" description="Coba lagi saat server siap." />
        ) : posts.length ? (
          <div className="grid gap-4">
            {posts.map((post) => {
              const commentState = commentsState[post.id] ?? createDefaultCommentState();
              return (
                <article
                  key={post.id}
                  className="space-y-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4"
                >
                  {editingPostId === post.id ? (
                    <form className="space-y-3" onSubmit={handleUpdatePost}>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-emerald-900">Judul</span>
                        <input
                          value={editPostForm.title}
                          onChange={(event) => setEditPostForm((prev) => ({ ...prev, title: event.target.value }))}
                          required
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-emerald-900">Tag (pisahkan dengan koma)</span>
                        <input
                          value={editPostForm.tags}
                          onChange={(event) => setEditPostForm((prev) => ({ ...prev, tags: event.target.value }))}
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-emerald-900">Cerita lengkap</span>
                        <textarea
                          value={editPostForm.body}
                          onChange={(event) => setEditPostForm((prev) => ({ ...prev, body: event.target.value }))}
                          rows={5}
                          required
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                        <button
                          type="button"
                          onClick={handleCancelEditPost}
                          className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={updatingPost}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                        >
                          {updatingPost ? "Menyimpan..." : "Simpan perubahan"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-emerald-900/60">
                        <span>{post.author}</span>
                        <span>{new Date(post.createdAt).toLocaleString()}</span>
                      </div>
                      <h3 className="text-base font-semibold text-emerald-900">{post.title}</h3>
                      <p className="text-sm text-emerald-900/70">{post.body}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700">
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 font-semibold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                        post.isLiked
                          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                          : "border-emerald-200 text-emerald-600 hover:border-emerald-400"
                      }`}
                    >
                      <FiThumbsUp />
                      {post.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-2 text-emerald-600 hover:text-emerald-500"
                    >
                      <FiMessageCircle />
                      {post.commentsCount} komentar
                    </button>
                    {post.isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEditPost(post)}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-500"
                        >
                          <FiEdit2 />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-500"
                          disabled={deletingPost}
                        >
                          <FiTrash2 />
                          Hapus
                        </button>
                      </>
                    ) : null}
                  </div>

                  {commentState.visible ? (
                    <div className="space-y-3 border-t border-emerald-100 pt-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentState.newComment}
                          onChange={(event) => handleCommentDraftChange(post.id, event.target.value)}
                          placeholder="Tulis komentar..."
                          className="flex-1 rounded-full border border-emerald-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitComment(post.id)}
                          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          <FiSend />
                          Kirim
                        </button>
                      </div>
                      {commentState.loading ? (
                        <p className="text-xs text-emerald-900/70">Memuat komentar...</p>
                      ) : commentState.error ? (
                        <p className="text-xs text-red-600">{commentState.error}</p>
                      ) : commentState.comments && commentState.comments.length ? (
                        <div className="space-y-3">{renderComments(post.id, commentState.comments)}</div>
                      ) : (
                        <p className="text-xs text-emerald-900/60">Belum ada komentar.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <DataState title="Belum ada diskusi" description="Jadilah yang pertama berbagi pengalaman Anda." />
        )}
        {deleteError || deletePostError ? (
          <p className="mt-3 text-sm text-red-600">{deleteError ?? deletePostError}</p>
        ) : null}
        {editError || patchError ? (
          <p className="mt-3 text-sm text-red-600">{editError ?? patchError}</p>
        ) : null}
        {globalError && !deleteError && !editError ? (
          <p className="mt-3 text-sm text-red-600">{globalError}</p>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}

