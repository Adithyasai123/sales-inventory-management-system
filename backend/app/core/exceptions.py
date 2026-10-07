from typing import Any, Dict, Optional


class AppException(Exception):
    """Base application domain exception."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class EntityNotFoundException(AppException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{identifier}' not found",
            code="ENTITY_NOT_FOUND",
            status_code=404,
            details={"entity": entity_name, "identifier": identifier},
        )


class InsufficientStockException(AppException):
    def __init__(self, product_id: int, sku: str, requested: int, available: int):
        super().__init__(
            message=f"Insufficient stock for product '{sku}'. Requested: {requested}, Available: {available}",
            code="INSUFFICIENT_STOCK",
            status_code=409,
            details={
                "product_id": product_id,
                "sku": sku,
                "requested_quantity": requested,
                "available_quantity": available,
            },
        )


class InvalidStateTransitionException(AppException):
    def __init__(self, current_state: str, target_state: str, reason: str = ""):
        msg = f"Cannot transition order from '{current_state}' to '{target_state}'."
        if reason:
            msg += f" {reason}"
        super().__init__(
            message=msg,
            code="INVALID_STATE_TRANSITION",
            status_code=400,
            details={"current_state": current_state, "target_state": target_state},
        )


class SelfApprovalException(AppException):
    def __init__(self):
        super().__init__(
            message="Conflict of interest: Order creators are prohibited from approving their own orders.",
            code="SELF_APPROVAL_FORBIDDEN",
            status_code=400,
        )


class PermissionDeniedException(AppException):
    def __init__(self, required_role: str = ""):
        msg = "You do not have permission to perform this action."
        if required_role:
            msg = f"Operation requires role: {required_role}."
        super().__init__(
            message=msg,
            code="PERMISSION_DENIED",
            status_code=403,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication credentials are missing or invalid"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
        )


class DuplicateResourceException(AppException):
    def __init__(self, resource: str, field: str, value: Any):
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists.",
            code="DUPLICATE_RESOURCE",
            status_code=400,
            details={"resource": resource, "field": field, "value": value},
        )


class ValidationException(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details or {},
        )


class BadRequestException(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="BAD_REQUEST",
            status_code=400,
            details=details or {},
        )

