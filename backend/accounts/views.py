from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.tiers import config_for

from .models import Artist, ArtistFollow, User, UserFollow, UserSettings, Verification
from .serializers import (
    ArtistSerializer,
    ArtistUpdateSerializer,
    LoginSerializer,
    RegisterArtistSerializer,
    RegisterListenerSerializer,
    UserSerializer,
    UserSettingsSerializer,
    UserUpdateSerializer,
    VerificationSerializer,
    make_handle,
    make_pro_id,
)


def _notify(*args, **kwargs):
    # Lazy import avoids an accounts→engagement import cycle at module load.
    from engagement.services import notify

    return notify(*args, **kwargs)


# ---- Auth ------------------------------------------------------------------


@method_decorator(ensure_csrf_cookie, name="dispatch")
class MeView(APIView):
    """GET /me — the session source of truth; plants the csrf_token cookie."""

    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        logout(request)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = LoginSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=data.validated_data["email"],
            password=data.validated_data["password"],
        )
        if user is None:
            raise ValidationError({"detail": "ایمیل یا رمز عبور نادرست است."})
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterListenerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterListenerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterArtistView(APIView):
    """
    Registers an artist: creates the (pending) Artist, its owning User, and a
    Verification request, then notifies staff. No login — the account waits for
    approval (matches phase-1 behaviour).
    """

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = RegisterArtistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        artist = Artist.objects.create(
            name=data["artist_name"],
            pro_id=make_pro_id(),
            sample_works=data["sample_works"],
            email=data["email"],
            status="pending",
            verified=False,
        )
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            handle=make_handle(),
            display_name=data["artist_name"],
            role="artist",
            tier="gold",
            artist=artist,
        )
        Verification.objects.create(artist=artist, status="pending")

        for staff in User.objects.filter(role__in=("support", "admin")):
            _notify(
                staff,
                "verification_request",
                "درخواست احراز هویت جدید",
                f"{artist.name} درخواست تأیید حساب هنرمندی ثبت کرد.",
                href="/dashboard/verifications",
            )
        return Response(ArtistSerializer(artist).data, status=status.HTTP_201_CREATED)


# ---- Users -----------------------------------------------------------------


class UserViewSet(ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # listUsers (the plain list) is staff-only: §3.7 forbids the frontend
        # deriving counts from a raw user dump.
        if self.action == "list":
            from core.permissions import IsStaff

            return [IsStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = User.objects.all()
        ids = self.request.query_params.get("ids")
        if ids:
            qs = qs.filter(id__in=[i for i in ids.split(",") if i])
        return qs

    @action(detail=False, url_path="by-handle/(?P<handle>[^/]+)")
    def by_handle(self, request, handle=None):
        from urllib.parse import unquote

        user = User.objects.filter(handle=unquote(handle)).first()
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def partial_update(self, request, pk=None):
        user = self.get_object()
        if request.user.id != user.id and request.user.role != "admin":
            raise PermissionDenied()
        serializer = UserUpdateSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post", "delete"], url_path="followers")
    def followers(self, request, pk=None):
        target = self.get_object()
        me = request.user
        if target.id == me.id:
            raise ValidationError({"detail": "نمی‌توانید خودتان را دنبال کنید."})
        if request.method == "POST":
            _, created = UserFollow.objects.get_or_create(follower=me, target=target)
            if created:
                User.objects.filter(pk=target.pk).update(
                    follower_count=target.follower_count + 1
                )
                _notify(
                    target, "new_follower", "دنبال‌کننده جدید",
                    f"{me.display_name} شما را دنبال کرد.", href=f"/u/{me.handle}",
                )
        else:
            deleted, _ = UserFollow.objects.filter(follower=me, target=target).delete()
            if deleted:
                User.objects.filter(pk=target.pk).update(
                    follower_count=max(0, target.follower_count - 1)
                )
        return Response(UserSerializer(me).data)


class MeAvatarView(APIView):
    """POST /me/avatar — tier-gated image upload (§3.4)."""

    def post(self, request):
        if not config_for(request.user.effective_tier).can_upload_avatar:
            raise PermissionDenied("آپلود عکس نمایه مخصوص اشتراک نقره‌ای و طلایی است.")
        file = request.FILES.get("avatar")
        if not file:
            raise ValidationError({"detail": "فایلی ارسال نشد."})
        request.user.avatar = file
        request.user.save(update_fields=["avatar"])
        return Response(UserSerializer(request.user).data)


class MeSettingsView(APIView):
    """GET/PUT /me/settings — cross-device preferences (§3.5)."""

    def get(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response(_settings_payload(settings_obj))

    def put(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(settings_obj, field, value)
        settings_obj.save()
        return Response(_settings_payload(settings_obj))


def _settings_payload(obj):
    return {"locale": obj.locale, "theme": obj.theme, "extra": obj.extra}


# ---- Artists ---------------------------------------------------------------


class ArtistViewSet(ReadOnlyModelViewSet):
    serializer_class = ArtistSerializer

    def get_queryset(self):
        qs = Artist.objects.all()
        if self.request.user.role not in ("support", "admin"):
            qs = qs.filter(status="approved")
        ids = self.request.query_params.get("ids")
        if ids:
            qs = qs.filter(id__in=[i for i in ids.split(",") if i])
        return qs

    def partial_update(self, request, pk=None):
        artist = self.get_object()
        owns = getattr(artist, "user", None) and artist.user.id == request.user.id
        if not owns and request.user.role not in ("support", "admin"):
            raise PermissionDenied()
        serializer = ArtistUpdateSerializer(artist, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ArtistSerializer(artist).data)

    @action(detail=True, methods=["post", "delete"], url_path="followers")
    def followers(self, request, pk=None):
        artist = self.get_object()
        me = request.user
        if request.method == "POST":
            _, created = ArtistFollow.objects.get_or_create(user=me, artist=artist)
            if created:
                Artist.objects.filter(pk=artist.pk).update(
                    follower_count=artist.follower_count + 1
                )
        else:
            deleted, _ = ArtistFollow.objects.filter(user=me, artist=artist).delete()
            if deleted:
                Artist.objects.filter(pk=artist.pk).update(
                    follower_count=max(0, artist.follower_count - 1)
                )
        return Response(UserSerializer(me).data)


# ---- Verifications (staff review, §2.11.2) ---------------------------------


class VerificationViewSet(ReadOnlyModelViewSet):
    queryset = Verification.objects.select_related("artist").all()
    serializer_class = VerificationSerializer

    def get_permissions(self):
        from core.permissions import IsStaff

        return [IsStaff()]

    def partial_update(self, request, pk=None):
        """
        One right-sized endpoint for both decisions: PATCH {status, reason?}.
        Approving/rejecting syncs the Artist and notifies its owning user.
        """
        verification = self.get_object()
        new_status = request.data.get("status")
        if new_status not in ("approved", "rejected"):
            raise ValidationError({"detail": "وضعیت نامعتبر است."})

        artist = verification.artist
        if new_status == "approved":
            verification.status = "approved"
            verification.reason = ""
            artist.verified = True
            artist.status = "approved"
            title, body = (
                "حساب هنرمندی شما تأیید شد",
                "اکنون می‌توانید آثار خود را در استودیو منتشر کنید.",
            )
        else:
            reason = request.data.get("reason", "")
            verification.status = "rejected"
            verification.reason = reason
            artist.verified = False
            artist.status = "rejected"
            artist.rejection_reason = reason
            title, body = ("درخواست احراز هویت رد شد", f"علت: {reason}")

        artist.save()
        verification.save()
        owner = getattr(artist, "user", None)
        if owner:
            _notify(owner, "verification_result", title, body)
        return Response(VerificationSerializer(verification).data)
