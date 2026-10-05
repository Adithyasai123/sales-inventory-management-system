from typing import Generic, List, Optional, TypeVar, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int = Field(..., description="Total number of items matching query")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total pages available")


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
