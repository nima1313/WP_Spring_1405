"""
Custom exceptions + DRF exception handler.

The frontend distinguishes specific business errors by a machine-readable
``code`` in the JSON body (e.g. StreamLimitError maps to a 429 with
``{"code": "stream_limit"}``). The default DRF handler is wrapped so any
APIException carrying a ``default_code`` surfaces that code to the client.
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler as drf_exception_handler


class StreamLimitExceeded(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "به سقف استریم روزانه رسیده‌اید."
    default_code = "stream_limit"


class PlaylistLimitExceeded(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "به سقف تعداد پلی‌لیست اشتراک خود رسیده‌اید."
    default_code = "playlist_limit"


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(exc, APIException):
        code = getattr(exc, "default_code", None)
        if code and isinstance(response.data, dict) and "code" not in response.data:
            response.data["code"] = code
    return response
