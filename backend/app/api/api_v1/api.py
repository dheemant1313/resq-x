from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, algorithms, health, requests

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health & Status"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(requests.router, prefix="/requests", tags=["Relief Requests & Triage"])
api_router.include_router(algorithms.router, prefix="/algorithms", tags=["Core Optimization Algorithms"])
