from typing import Optional

from asgiref.sync import sync_to_async
from pydantic import Field
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route, status
from ninja_extra.exceptions import APIException, NotFound
from ninja_extra.permissions import IsAuthenticated
from ninja_jwt.authentication import AsyncJWTAuth

from .models import CommunityComment, CommunityPost, CommunityPostLike


class CommunityPostCreate(Schema):
    title: str
    body: str
    tags: list[str] = Field(default_factory=list)


class CommunityPostUpdate(Schema):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[list[str]] = None


class CommunityPostSchema(Schema):
    id: int
    author: str
    authorId: int
    title: str
    body: str
    createdAt: str
    updatedAt: str
    likes: int
    isLiked: bool
    commentsCount: int
    tags: list[str]
    isOwner: bool


class CommentCreate(Schema):
    body: str
    parentId: Optional[int] = None


class CommunityCommentSchema(Schema):
    id: int
    postId: int
    parentId: Optional[int]
    author: str
    authorId: int
    body: str
    createdAt: str
    isOwner: bool


class PostLikeResponse(Schema):
    liked: bool
    likes: int


class MessageOut(Schema):
    message: str
    status: int




def _serialize_post(post: CommunityPost, user) -> CommunityPostSchema:
    likes = list(post.likes.all())
    comments = list(post.comments.all())
    is_liked = any(like.user_id == user.id for like in likes)
    comments_count = len(comments)
    likes_count = len(likes)
    tags = post.tags if isinstance(post.tags, list) else []
    return CommunityPostSchema(
        id=post.id,
        author=post.user.first_name or post.user.email,
        authorId=post.user_id,
        title=post.title,
        body=post.body,
        createdAt=post.created_at.isoformat(),
        updatedAt=post.updated_at.isoformat(),
        likes=likes_count,
        isLiked=is_liked,
        commentsCount=comments_count,
        tags=tags,
        isOwner=post.user_id == user.id,
    )


def _serialize_comment(comment: CommunityComment, user) -> CommunityCommentSchema:
    return CommunityCommentSchema(
        id=comment.id,
        postId=comment.post_id,
        parentId=comment.parent_id,
        author=comment.user.first_name or comment.user.email,
        authorId=comment.user_id,
        body=comment.body,
        createdAt=comment.created_at.isoformat(),
        isOwner=comment.user_id == user.id,
    )


@api_controller("/community", tags=["Community"], auth=AsyncJWTAuth(), permissions=[IsAuthenticated])
class CommunityController(ControllerBase):
    @route.get("/posts", response=list[CommunityPostSchema])
    async def list_posts(self):
        user = self.context.request.user

        def _fetch_posts():
            return list(
                CommunityPost.objects.select_related("user")
                .prefetch_related("likes", "comments")
                .order_by("-created_at")
            )

        posts = await sync_to_async(_fetch_posts, thread_sensitive=True)()
        serialized = [_serialize_post(post, user) for post in posts]
        return serialized

    @route.post("/posts", response=CommunityPostSchema)
    async def create_post(self, payload: CommunityPostCreate):
        user = self.context.request.user
        title = (payload.title or "").strip()
        body_text = (payload.body or "").strip()
        tags = list(payload.tags) if payload.tags else []
        if not title or not body_text:
            raise APIException(code=status.HTTP_400_BAD_REQUEST, detail="Judul dan isi wajib diisi.")

        def _create():
            post = CommunityPost.objects.create(
                user=user,
                title=title,
                body=body_text,
                tags=tags,
            )
            return post

        post = await sync_to_async(_create, thread_sensitive=True)()
        return _serialize_post(post, user)

    @route.patch("/posts/{post_id}", response=CommunityPostSchema)
    async def update_post(self, post_id: int, payload: CommunityPostUpdate):
        user = self.context.request.user

        def _get_post():
            return CommunityPost.objects.select_related("user").get(id=post_id)

        try:
            post = await sync_to_async(_get_post, thread_sensitive=True)()
        except CommunityPost.DoesNotExist as exc:
            raise NotFound(str(exc))

        if post.user_id != user.id:
            raise APIException(
                code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak dapat mengubah postingan pengguna lain.",
            )

        data = payload.model_dump(exclude_unset=True)
        if "title" in data:
            title = (data["title"] or "").strip()
            if not title:
                raise APIException(code=status.HTTP_400_BAD_REQUEST, detail="Judul tidak boleh kosong.")
            data["title"] = title
        if "body" in data:
            body_text = (data["body"] or "").strip()
            if not body_text:
                raise APIException(code=status.HTTP_400_BAD_REQUEST, detail="Isi tidak boleh kosong.")
            data["body"] = body_text
        if "tags" in data:
            data["tags"] = list(data["tags"]) if data["tags"] else []

        def _apply_update():
            update_fields: list[str] = []
            post_obj = CommunityPost.objects.select_related("user").get(id=post_id)
            for field, value in data.items():
                setattr(post_obj, field, value)
                update_fields.append(field)
            if update_fields:
                post_obj.save(update_fields=[*update_fields, "updated_at"])
            post_with_relations = (
                CommunityPost.objects.select_related("user")
                .prefetch_related("likes", "comments")
                .get(id=post_id)
            )
            return _serialize_post(post_with_relations, user)

        return await sync_to_async(_apply_update, thread_sensitive=True)()

    @route.delete("/posts/{post_id}", response=MessageOut)
    async def delete_post(self, post_id: int):
        user = self.context.request.user
        try:
            post = await sync_to_async(CommunityPost.objects.get)(id=post_id)
        except CommunityPost.DoesNotExist as exc:
            raise NotFound(str(exc))

        if post.user_id != user.id:
            raise APIException(
                code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak dapat menghapus postingan pengguna lain.",
            )

        await sync_to_async(post.delete)()
        return MessageOut(message="Berhasil menghapus postingan.", status=status.HTTP_204_NO_CONTENT)

    @route.post("/posts/{post_id}/like", response=PostLikeResponse)
    async def toggle_like(self, post_id: int):
        user = self.context.request.user
        try:
            post = await sync_to_async(CommunityPost.objects.get)(id=post_id)
        except CommunityPost.DoesNotExist as exc:
            raise NotFound(str(exc))

        def _toggle():
            like, created = CommunityPostLike.objects.get_or_create(post=post, user=user)
            if created:
                liked = True
            else:
                like.delete()
                liked = False
            likes_count = CommunityPostLike.objects.filter(post=post).count()
            CommunityPost.objects.filter(id=post.id).update(upvotes=likes_count)
            return liked, likes_count

        liked, likes = await sync_to_async(_toggle, thread_sensitive=True)()
        return PostLikeResponse(liked=liked, likes=likes)

    @route.get("/posts/{post_id}/comments", response=list[CommunityCommentSchema])
    async def list_comments(self, post_id: int):
        user = self.context.request.user
        try:
            await sync_to_async(CommunityPost.objects.get)(id=post_id)
        except CommunityPost.DoesNotExist as exc:
            raise NotFound(str(exc))

        def _fetch():
            queryset = (
                CommunityComment.objects.filter(post_id=post_id)
                .select_related("user")
                .order_by("created_at")
            )
            return [
                _serialize_comment(comment, user)
                for comment in queryset
            ]

        return await sync_to_async(_fetch, thread_sensitive=True)()

    @route.post("/posts/{post_id}/comments", response=CommunityCommentSchema)
    async def create_comment(self, post_id: int, payload: CommentCreate):
        user = self.context.request.user
        try:
            post = await sync_to_async(CommunityPost.objects.get)(id=post_id)
        except CommunityPost.DoesNotExist as exc:
            raise NotFound(str(exc))

        parent = None
        parent_id = payload.parentId
        if parent_id is not None:
            try:
                parent = await sync_to_async(CommunityComment.objects.get)(
                    id=parent_id, post_id=post_id
                )
            except CommunityComment.DoesNotExist as exc:
                raise NotFound(str(exc))

        body_text = (payload.body or "").strip()
        if not body_text:
            raise APIException(code=status.HTTP_400_BAD_REQUEST, detail="Komentar tidak boleh kosong.")

        def _create():
            comment = CommunityComment.objects.create(
                post=post,
                user=user,
                parent=parent,
                body=body_text,
            )
            return comment

        comment = await sync_to_async(_create, thread_sensitive=True)()
        return _serialize_comment(comment, user)

    @route.delete("/posts/{post_id}/comments/{comment_id}", response=MessageOut)
    async def delete_comment(self, post_id: int, comment_id: int):
        user = self.context.request.user
        try:
            comment = await sync_to_async(CommunityComment.objects.get)(
                id=comment_id, post_id=post_id
            )
        except CommunityComment.DoesNotExist as exc:
            raise NotFound(str(exc))

        if comment.user_id != user.id:
            raise APIException(
                code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak dapat menghapus komentar pengguna lain.",
            )

        await sync_to_async(comment.delete)()
        return MessageOut(message="Komentar berhasil dihapus.", status=status.HTTP_204_NO_CONTENT)
