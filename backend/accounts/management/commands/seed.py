"""
Idempotent demo seed — the backend port of lib/db/seed.ts.

Reuses the exact phase-1 ids (u_admin, ar_navid, tr_al_navid_neon_0, …) and the
demo password `nava1234`, so every demo login, deep link and screenshot from
phase 1 keeps working against the real API. Safe to run repeatedly.
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import (
    Artist,
    ArtistFollow,
    User,
    UserFollow,
    Verification,
)
from analytics.models import ArtistMonthlyAccount
from analytics.services import compute_reward, current_month
from billing.models import SubscriptionPlan
from catalog.models import Album, Track
from engagement.models import Notification, Playlist, PlaylistTrack, RecentItem, StreamEvent
from support.models import Ticket, TicketMessage

DEMO_PASSWORD = "nava1234"

LYRICS = (
    "زیر نور چراغ‌های شهر\nقدم می‌زنم تا صبح\nصدای تو در گوشم می‌پیچد\n"
    "مثل آهنگی که تمام نمی‌شود\n\nکجا رفتی؟ کجا ماندم؟\nمیان این همه هیاهو\n"
    "تنها صدای توست\nکه مرا به خانه می‌رساند"
)


def iso(days_ago, hour=12):
    return (timezone.now() - timedelta(days=days_ago)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )


def audio(n):
    return f"/audio/song-{((n - 1) % 8) + 1}.mp3"


ARTISTS = [
    dict(id="ar_navid", name="نوید زند", pro_id="NAV-0012",
         bio="آهنگساز و خواننده پاپ الکترونیک، ساکن تهران.", verified=True,
         status="approved", sample_works="https://example.com/navid/demo",
         email="navid@nava.app", follower_count=18420, monthly_listeners=90240,
         days=320),
    dict(id="ar_mahtab", name="مهتاب", pro_id="MAH-0048",
         bio="صدای آرام شب‌های شهر. سبک: پاپ ملو و آکوستیک.", verified=True,
         status="approved", sample_works="https://example.com/mahtab",
         email="mahtab@nava.app", follower_count=24310, monthly_listeners=132900,
         days=410),
    dict(id="ar_kian", name="کیان", pro_id="KIA-0103",
         bio="تهیه‌کننده هیپ‌هاپ و بیت‌میکر.", verified=True, status="approved",
         sample_works="https://example.com/kian", email="kian@nava.app",
         follower_count=9870, monthly_listeners=51200, days=220),
    dict(id="ar_raha", name="گروه رها", pro_id="RAH-0211",
         bio="گروه راک آلترناتیو با سه عضو.", verified=True, status="approved",
         sample_works="https://example.com/raha", email="raha@nava.app",
         follower_count=15600, monthly_listeners=73400, days=180),
    dict(id="ar_golnoosh", name="گلنوش", pro_id="GOL-0307",
         bio="نوازنده و آهنگساز موسیقی سنتی-تلفیقی.", verified=False,
         status="pending", sample_works="https://example.com/golnoosh/portfolio",
         email="golnoosh@nava.app", follower_count=0, monthly_listeners=0, days=4),
    dict(id="ar_artin", name="آرتین", pro_id="ART-0319",
         bio="تولیدکننده موسیقی الکترونیک و امبینت.", verified=False,
         status="pending", sample_works="https://example.com/artin/soundcloud",
         email="artin@nava.app", follower_count=0, monthly_listeners=0, days=2),
]

ALBUM_SPECS = [
    dict(id="al_navid_neon", title="نئون", artist="ar_navid", genre="الکترونیک",
         days=30, tracks=["شب‌تاب", "مدار", "بی‌وزن", "هزارتو", "طلوع سرد"]),
    dict(id="al_navid_echo", title="پژواک", artist="ar_navid", genre="پاپ",
         days=3, tracks=["انعکاس", "نیمه شب", "دور"]),
    dict(id="al_mahtab_calm", title="آرام", artist="ar_mahtab", genre="آکوستیک",
         days=70, tracks=["باران", "خاطره", "ساحل", "چتر"]),
    dict(id="al_mahtab_night", title="شب‌های شهر", artist="ar_mahtab", genre="پاپ",
         days=1, tracks=["چراغ‌ها", "خیابان خالی", "صبح"]),
    dict(id="al_kian_bars", title="بیت‌ها", artist="ar_kian", genre="هیپ‌هاپ",
         days=50, tracks=["شروع", "جریان", "بالا", "آخر خط"]),
    dict(id="al_raha_loud", title="بلند", artist="ar_raha", genre="راک",
         days=90, tracks=["فریاد", "دیوار", "آتش", "سکوت"]),
]

SINGLE_SPECS = [
    dict(title="تنها", artist="ar_kian", genre="هیپ‌هاپ", days=6),
    dict(title="پرواز", artist="ar_raha", genre="راک", days=2),
    dict(title="نسیم", artist="ar_mahtab", genre="آکوستیک", days=12),
    dict(title="ستاره", artist="ar_navid", genre="الکترونیک", days=1),
]

USERS = [
    dict(id="u_listener", handle="@nava_a3f1", display_name="آرش رضایی",
         email="listener@nava.app", role="listener", tier="gold", days=-20,
         birthday="1998-05-14", gender="male", follower_count=42,
         follow_artists=["ar_navid", "ar_mahtab"], follow_users=[]),
    dict(id="u_silver", handle="@nava_b7c2", display_name="نگار کریمی",
         email="silver@nava.app", role="listener", tier="silver", days=-5,
         birthday="2000-11-02", gender="female", follower_count=8,
         follow_artists=["ar_kian"], follow_users=["u_listener"]),
    dict(id="u_basic", handle="@nava_c9d3", display_name="سینا مرادی",
         email="basic@nava.app", role="listener", tier="basic", days=-2,
         birthday="2003-02-20", gender="male", follower_count=3,
         follow_artists=["ar_raha"], follow_users=[]),
    dict(id="u_artist", handle="@nava_navid", display_name="نوید زند",
         email="artist@nava.app", role="artist", tier="gold", days=-200,
         gender="male", follower_count=18420, artist="ar_navid",
         follow_artists=[], follow_users=[]),
    dict(id="u_support", handle="@nava_sup", display_name="تیم پشتیبانی",
         email="support@nava.app", role="support", tier="gold", days=-365,
         follower_count=0, follow_artists=[], follow_users=[]),
    dict(id="u_admin", handle="@nava_admin", display_name="مدیر سامانه",
         email="admin@nava.app", role="admin", tier="gold", days=-365,
         follower_count=0, follow_artists=[], follow_users=[]),
]


class Command(BaseCommand):
    help = "Seed the database with the phase-1 demo dataset (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true",
                            help="Wipe demo tables and reseed.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["force"]:
            for model in (StreamEvent, RecentItem, PlaylistTrack, Playlist,
                          Notification, TicketMessage, Ticket, Verification,
                          ArtistMonthlyAccount, Track, Album, ArtistFollow,
                          UserFollow):
                model.objects.all().delete()
            User.objects.all().delete()
            Artist.objects.all().delete()
            SubscriptionPlan.objects.all().delete()

        if User.objects.filter(email="admin@nava.app").exists():
            self.stdout.write("Already seeded — use --force to reseed.")
            return

        artists = self._seed_artists()
        tracks = self._seed_catalog(artists)
        users = self._seed_users(artists)
        self._seed_follows(users, artists)
        self._seed_playlists(users, tracks)
        self._seed_notifications(users)
        self._seed_tickets(users)
        self._seed_verifications(artists)
        self._seed_plans()
        self._seed_accounting(artists)
        self._seed_recents_and_streams(users, tracks)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(users)} users, {len(artists)} artists, {len(tracks)} tracks."
        ))

    # -- steps ---------------------------------------------------------------

    def _seed_artists(self):
        artists = {}
        for spec in ARTISTS:
            artists[spec["id"]] = Artist.objects.create(
                id=spec["id"], name=spec["name"], pro_id=spec["pro_id"],
                bio=spec["bio"], verified=spec["verified"], status=spec["status"],
                sample_works=spec["sample_works"], email=spec["email"],
                follower_count=spec["follower_count"],
                monthly_listeners=spec["monthly_listeners"],
                created_at=iso(spec["days"]),
            )
        return artists

    def _seed_catalog(self, artists):
        tracks = []
        n = 0
        for spec in ALBUM_SPECS:
            album = Album.objects.create(
                id=spec["id"], title=spec["title"], artist=artists[spec["artist"]],
                genre=spec["genre"], release_date=iso(spec["days"]),
            )
            for idx, title in enumerate(spec["tracks"]):
                n += 1
                track = Track.objects.create(
                    id=f"tr_{spec['id']}_{idx}", title=title,
                    artist=artists[spec["artist"]], album=album, position=idx,
                    source_url=audio(n), duration=180 + (n * 23) % 110,
                    lyrics=LYRICS if idx % 2 == 0 else "", genre=spec["genre"],
                    release_date=iso(spec["days"]), type="album",
                    listeners=1200 + (n * 877) % 60000,
                    streams=5400 + (n * 3137) % 240000,
                    early_access=spec["days"] <= 4,
                )
                if idx == 1:
                    track.featured_artists.add(artists["ar_kian"])
                tracks.append(track)
        for spec in SINGLE_SPECS:
            n += 1
            tracks.append(Track.objects.create(
                id=f"tr_single_{n}", title=spec["title"],
                artist=artists[spec["artist"]], source_url=audio(n),
                duration=175 + (n * 31) % 90, lyrics=LYRICS if n % 2 == 0 else "",
                genre=spec["genre"], release_date=iso(spec["days"]), type="single",
                listeners=800 + (n * 613) % 40000,
                streams=3200 + (n * 2111) % 120000, early_access=spec["days"] <= 4,
            ))
        return tracks

    def _seed_users(self, artists):
        users = {}
        for spec in USERS:
            user = User.objects.create_user(
                email=spec["email"], password=DEMO_PASSWORD, id=spec["id"],
                handle=spec["handle"], display_name=spec["display_name"],
                role=spec["role"], tier=spec["tier"],
                subscription_expires_at=iso(spec["days"]),
                birthday=spec.get("birthday"), gender=spec.get("gender"),
                follower_count=spec["follower_count"],
                artist=artists.get(spec["artist"]) if spec.get("artist") else None,
                created_at=iso(abs(spec["days"])),
            )
            users[spec["id"]] = user
        return users

    def _seed_follows(self, users, artists):
        for spec in USERS:
            user = users[spec["id"]]
            for artist_id in spec["follow_artists"]:
                ArtistFollow.objects.get_or_create(user=user, artist=artists[artist_id])
            for target_id in spec["follow_users"]:
                UserFollow.objects.get_or_create(follower=user, target=users[target_id])

    def _seed_playlists(self, users, tracks):
        def make(pid, name, owner, indices, created, updated):
            pl = Playlist.objects.create(
                id=pid, name=name, owner=users[owner],
                created_at=iso(created), updated_at=iso(updated),
            )
            for pos, i in enumerate(indices):
                PlaylistTrack.objects.create(playlist=pl, track=tracks[i], position=pos)

        make("pl_chill", "آرامش شبانه", "u_listener", [0, 8, 9], 30, 2)
        make("pl_workout", "انرژی صبحگاهی", "u_listener", [13, 5], 15, 1)

    def _seed_notifications(self, users):
        rows = [
            ("u_listener", "new_release", "اثر جدید از نوید زند",
             "آلبوم «پژواک» منتشر شد.", False, "/album/al_navid_echo"),
            ("u_listener", "new_follower", "دنبال‌کننده جدید",
             "نگار کریمی شما را دنبال کرد.", False, "/u/@nava_b7c2"),
            ("u_basic", "subscription_expiry", "اشتراک شما رو به اتمام است",
             "اعتبار اشتراک پایه شما به‌زودی تمام می‌شود.", False, "/settings"),
            ("u_artist", "verification_result", "حساب هنرمندی شما تأیید شد",
             "اکنون می‌توانید آثار خود را منتشر کنید.", True, ""),
            ("u_artist", "monthly_finance", "محاسبات مالی ماه گذشته",
             "گزارش درآمد و پاداش ماهانه شما آماده است.", False, "/studio"),
            ("u_support", "verification_request", "درخواست احراز هویت جدید",
             "گلنوش درخواست تأیید حساب هنرمندی ثبت کرد.", False, "/dashboard/verifications"),
            ("u_support", "new_ticket", "تیکت جدید",
             "کاربری درباره دانلود آهنگ سؤال پرسیده است.", False, "/dashboard/tickets"),
        ]
        for uid, kind, title, body, read, href in rows:
            Notification.objects.create(user=users[uid], kind=kind, title=title,
                                        body=body, read=read, href=href)

    def _seed_tickets(self, users):
        t1 = Ticket.objects.create(id="tk_1001", user=users["u_silver"],
                                   subject="امکان دانلود آهنگ‌ها", status="open",
                                   created_at=iso(1, 14))
        TicketMessage.objects.create(ticket=t1, author=users["u_silver"],
                                     body="سلام، چطور می‌تونم آهنگ‌ها رو دانلود کنم؟",
                                     created_at=iso(1, 14))
        t2 = Ticket.objects.create(id="tk_1002", user=users["u_basic"],
                                   subject="محدودیت تعداد استریم", status="answered",
                                   created_at=iso(3, 10))
        TicketMessage.objects.create(ticket=t2, author=users["u_basic"],
                                     body="چرا بعد از مدتی نمی‌تونم آهنگ پخش کنم؟",
                                     created_at=iso(3, 10))
        TicketMessage.objects.create(
            ticket=t2, author=users["u_support"],
            body="اشتراک پایه محدودیت ۶۰ استریم در روز دارد. با ارتقا نامحدود می‌شود.",
            created_at=iso(3, 12))
        t3 = Ticket.objects.create(id="tk_1003", user=users["u_listener"],
                                   subject="تغییر ایمیل حساب", status="closed",
                                   created_at=iso(8, 9))
        TicketMessage.objects.create(ticket=t3, author=users["u_listener"],
                                     body="می‌خوام ایمیلم رو عوض کنم.", created_at=iso(8, 9))
        TicketMessage.objects.create(ticket=t3, author=users["u_support"],
                                     body="انجام شد، لطفاً خروج و ورود مجدد کنید.",
                                     created_at=iso(8, 10))

    def _seed_verifications(self, artists):
        Verification.objects.create(id="vf_1", artist=artists["ar_golnoosh"],
                                    status="pending", created_at=iso(4))
        Verification.objects.create(id="vf_2", artist=artists["ar_artin"],
                                    status="pending", created_at=iso(2))

    def _seed_plans(self):
        SubscriptionPlan.objects.update_or_create(
            tier="silver", defaults=dict(monthly_price=79000, currency="تومان"))
        SubscriptionPlan.objects.update_or_create(
            tier="gold", defaults=dict(monthly_price=149000, currency="تومان"))

    def _seed_accounting(self, artists):
        approved = [a for a in ARTISTS if a["status"] == "approved"]
        for i, spec in enumerate(approved):
            listeners = spec["monthly_listeners"]
            streams = listeners * 4 + i * 1200
            ArtistMonthlyAccount.objects.create(
                id=f"ac_{spec['id']}", artist=artists[spec["id"]],
                month=current_month(), unique_listeners=listeners, streams=streams,
                reward=compute_reward(streams, listeners),
                status="pending" if i % 2 == 0 else "settled",
            )

    def _seed_recents_and_streams(self, users, tracks):
        listener = users["u_listener"]
        recents = [("playlist", "pl_chill", 0, 20), ("track", tracks[8].id, 0, 19),
                   ("track", tracks[2].id, 1, 22), ("playlist", "pl_workout", 1, 7)]
        for kind, ref, days, hour in recents:
            RecentItem.objects.create(user=listener, kind=kind, ref_id=ref, at=iso(days, hour))
        # basic user near the daily cap → demonstrates the §9.2 limit gate
        basic = users["u_basic"]
        now = timezone.now()
        for i in range(57):
            at = now.replace(hour=8 + i % 12, minute=i % 60, second=0, microsecond=0)
            StreamEvent.objects.create(user=basic, track=tracks[i % len(tracks)], at=at)
