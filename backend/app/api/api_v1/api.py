from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, algorithms, health, requests, relief_centers, resources

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health & Status"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(relief_centers.router, prefix="/relief-centers", tags=["Relief Center Operations"])
api_router.include_router(resources.router, prefix="/resources", tags=["Relief Resource Inventory"])
api_router.include_router(requests.router, prefix="/requests", tags=["Relief Requests & Triage"])
api_router.include_router(algorithms.router, prefix="/algorithms", tags=["Core Optimization Algorithms"])
