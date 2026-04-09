import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status


RATE_LIMITS = {
    "auth-login": (5, 60),
    "auth-register": (3, 60),
    "auth-change-password": (5, 300),
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
