from fastapi import APIRouter

from app.routers import (
    auth,
    users,
    roles,
    customers,
    products,
    orders,
    approvals,
    inventory,
    dashboard,
    settings,
    audit,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(customers.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(approvals.router)
api_router.include_router(inventory.router)
api_router.include_router(dashboard.router)
api_router.include_router(settings.router)
api_router.include_router(audit.router)
