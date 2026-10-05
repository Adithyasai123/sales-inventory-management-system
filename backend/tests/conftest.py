import os
import sys
from decimal import Decimal
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.setting import SystemSetting
from app.models.inventory import InventoryMovement, MovementType
from app.services.email_service import EmailService

# SQLite in-memory test database with StaticPool to keep schema across connections
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def mock_smtp(monkeypatch):
    """Disable actual network calls for SMTP during automated tests."""
    def fake_send(to_email, subject, html_body, log_id=None):
        return True
    monkeypatch.setattr(EmailService, "_send_smtp_email", staticmethod(fake_send))


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_data(db_session: Session):
    """Seed test fixtures: Admin, Manager, Sales users, products, customer, and settings."""
    # Settings
    db_session.add(SystemSetting(key="approval_threshold", value="1000.00", description="Threshold"))

    # Users
    admin_user = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("Password123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    manager_user = User(
        email="manager@test.com",
        full_name="Test Manager",
        hashed_password=get_password_hash("Password123!"),
        role=UserRole.MANAGER,
        is_active=True,
    )
    sales_user = User(
        email="sales@test.com",
        full_name="Test Sales",
        hashed_password=get_password_hash("Password123!"),
        role=UserRole.SALES,
        is_active=True,
    )
    db_session.add_all([admin_user, manager_user, sales_user])
    db_session.flush()

    # Customer
    customer = Customer(
        name="Global Tech Enterprises",
        email="orders@globaltech.com",
        phone="+1234567890",
        company="Global Tech",
        is_active=True,
    )
    db_session.add(customer)
    db_session.flush()

    # Products: Product 1 (in-stock, low price), Product 2 (high price above threshold), Product 3 (low stock)
    prod1 = Product(
        sku="SKU-KEYBOARD",
        name="Mechanical Keyboard",
        price=Decimal("100.00"),
        stock_quantity=50,
        reorder_level=10,
        is_active=True,
    )
    prod2 = Product(
        sku="SKU-SERVER",
        name="Enterprise Server",
        price=Decimal("1500.00"),
        stock_quantity=10,
        reorder_level=2,
        is_active=True,
    )
    prod3 = Product(
        sku="SKU-LIMITED",
        name="Limited Component",
        price=Decimal("50.00"),
        stock_quantity=2,
        reorder_level=5,
        is_active=True,
    )
    db_session.add_all([prod1, prod2, prod3])
    db_session.flush()

    return {
        "admin": admin_user,
        "manager": manager_user,
        "sales": sales_user,
        "customer": customer,
        "prod1": prod1,
        "prod2": prod2,
        "prod3": prod3,
    }


@pytest.fixture
def admin_headers(seed_data) -> dict:
    token = create_access_token(subject=seed_data["admin"].id, role=UserRole.ADMIN.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers(seed_data) -> dict:
    token = create_access_token(subject=seed_data["manager"].id, role=UserRole.MANAGER.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sales_headers(seed_data) -> dict:
    token = create_access_token(subject=seed_data["sales"].id, role=UserRole.SALES.value)
    return {"Authorization": f"Bearer {token}"}
