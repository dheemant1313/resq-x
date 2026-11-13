import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class SimpleRateLimiter:
    """
    Sliding-window in-memory rate limiter to protect authentication endpoints
    from brute-force and credential stuffing attacks.
    """
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        now = time.time()
        # Clean expired timestamps
        self.requests[key] = [t for t in self.requests[key] if now - t < self.window_seconds]
        
        if len(self.requests[key]) >= self.max_requests:
            oldest = self.requests[key][0]
            retry_after = int(self.window_seconds - (now - oldest)) + 1
            return False, max(1, retry_after)
        
        self.requests[key].append(now)
        return True, 0

    def reset(self):
        """Reset rate limiter state (useful for tests)."""
        self.requests.clear()

auth_rate_limiter = SimpleRateLimiter(max_requests=25, window_seconds=60)

def check_auth_rate_limit(request: Request):
    """
    FastAPI dependency to rate-limit authentication endpoints.
    Identifies client by client host IP address.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, retry_after = auth_rate_limiter.is_allowed(client_ip)
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many authentication attempts. Please wait {retry_after} seconds before retrying.",
            headers={"Retry-After": str(retry_after)}
        )
