import secrets

from django.db import models
from django.utils.deconstruct import deconstructible


@deconstructible
class short_id:
    """
    Callable default for string primary keys shaped like the phase-1 ids
    (`tr_ab12cd`). Implemented as a @deconstructible class (not a closure) so
    Django can serialize it into migrations.

    The frontend types every id as `string` and builds deep links from them, so
    keeping human-ish prefixed ids (rather than integer or UUID pks) means the
    seed can reuse the exact phase-1 ids and nothing on the client has to change.
    """

    def __init__(self, prefix: str):
        self.prefix = prefix

    def __call__(self) -> str:
        return f"{self.prefix}_{secrets.token_hex(4)}"

    def __eq__(self, other):
        return isinstance(other, short_id) and other.prefix == self.prefix


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
