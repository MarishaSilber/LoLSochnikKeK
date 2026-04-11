import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status


RATE_LIMITS = {
    "auth-login-fail": (20, 900),
    "auth-register-fail": (20, 900),
    "auth-resend-verification": (5, 300),
    "auth-change-password": (5, 300),
    "auth-password-reset": (5, 300),
    "swagger": (10, 60),
    "onboarding-start": (10, 300),
    "onboarding-chat": (60, 300),
}

_bucket_lock = threading.Lock()
_request_buckets: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)


def enforce_rate_limit(request: Request, bucket_name: str) -> None:
    limit, period = RATE_LIMITS[bucket_name]
    bucket_key = (bucket_name, request.client.host if request.client else "unknown")
    now = time.time()

    with _bucket_lock:
        bucket = _request_buckets[bucket_key]
        while bucket and bucket[0] <= now - period:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later",
            )

        bucket.append(now)


def enforce_failed_attempt_limit(request: Request, bucket_name: str) -> None:
    limit, period = RATE_LIMITS[bucket_name]
    bucket_key = (bucket_name, request.client.host if request.client else "unknown")
    now = time.time()

    with _bucket_lock:
        bucket = _request_buckets[bucket_key]
        while bucket and bucket[0] <= now - period:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts, please try again later",
            )


def register_failed_attempt(request: Request, bucket_name: str) -> None:
    limit, period = RATE_LIMITS[bucket_name]
    bucket_key = (bucket_name, request.client.host if request.client else "unknown")
    now = time.time()

    with _bucket_lock:
        bucket = _request_buckets[bucket_key]
        while bucket and bucket[0] <= now - period:
            bucket.popleft()

        if len(bucket) < limit:
            bucket.append(now)


def clear_rate_limit_bucket(request: Request, bucket_name: str) -> None:
    bucket_key = (bucket_name, request.client.host if request.client else "unknown")

    with _bucket_lock:
        _request_buckets.pop(bucket_key, None)
