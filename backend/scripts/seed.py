import os
import sys
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType
from app.models.setting import SystemSetting
from app.core.logging import logger, setup_logging


def seed_database() -> None:
    setup_logging()
    logger.info("Starting idempotent database seeding...")
    db = SessionLocal()

    try:
        # 1. System Settings
        threshold_setting = db.query(SystemSetting).filter_by(key="approval_threshold").first()
        if not threshold_setting:
            threshold_setting = SystemSetting(
                key="approval_threshold",
                value="1000.00",
                description="Orders with total_amount exceeding this threshold require manager approval.",
            )
            db.add(threshold_setting)
            logger.info("Created system setting: approval_threshold = 1000.00")

        company_setting = db.query(SystemSetting).filter_by(key="company_name").first()
        if not company_setting:
            company_setting = SystemSetting(
                key="company_name",
                value="Acme Corp Sales & Inventory",
                description="Display company name for invoices and notifications.",
            )
            db.add(company_setting)

        db.flush()

        # 2. Users (Admin, Manager, Sales)
        users_data = [
            {
                "email": "admin@sims.local",
                "full_name": "Eleanor Vance",
                "password": "Admin@123456",
                "role": UserRole.ADMIN,
            },
            {
                "email": "admin@sims.com",
                "full_name": "Eleanor Vance",
                "password": "Admin@123456",
                "role": UserRole.ADMIN,
            },
            {
                "email": "manager@sims.local",
                "full_name": "Marcus Sterling",
                "password": "Manager@123456",
                "role": UserRole.MANAGER,
            },
            {
                "email": "manager@sims.com",
                "full_name": "Marcus Sterling",
                "password": "Manager@123456",
                "role": UserRole.MANAGER,
            },
            {
                "email": "sales@sims.local",
                "full_name": "Sarah Connor",
                "password": "Sales@123456",
                "role": UserRole.SALES,
            },
            {
                "email": "sales@sims.com",
                "full_name": "Sarah Connor",
                "password": "Sales@123456",
                "role": UserRole.SALES,
            },
        ]

        for u_data in users_data:
            existing_user = db.query(User).filter_by(email=u_data["email"]).first()
            if not existing_user:
                new_user = User(
                    email=u_data["email"],
                    hashed_password=get_password_hash(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    is_active=True,
                )
                db.add(new_user)
                logger.info(f"Seeded user: {u_data['email']} ({u_data['role'].value})")

        db.flush()

        # 3. Customers
        customers_data = [
            {
                "name": "Apex Global Logistics",
                "email": "procurement@apexlogistics.com",
                "phone": "+1-555-0101",
                "company": "Apex Global LLC",
                "address": "742 Evergreen Terrace",
                "city": "Springfield",
                "country": "USA",
            },
            {
                "name": "Blue Horizon Retailers",
                "email": "orders@bluehorizon.io",
                "phone": "+1-555-0102",
                "company": "Blue Horizon Retail Inc",
                "address": "100 Industrial Parkway",
                "city": "Austin",
                "country": "USA",
            },
            {
                "name": "Cascade Digital Media",
                "email": "billing@cascademedia.com",
                "phone": "+1-555-0103",
                "company": "Cascade Media Corp",
                "address": "452 Silicon Ave",
                "city": "Seattle",
                "country": "USA",
            },
            {
                "name": "Delta Manufacturing Ltd",
                "email": "supply@deltamfg.co.uk",
                "phone": "+44-20-7946-0991",
                "company": "Delta Manufacturing",
                "address": "12 Canary Wharf",
                "city": "London",
                "country": "UK",
            },
            {
                "name": "Echo Dynamics Tech",
                "email": "accounts@echodynamics.de",
                "phone": "+49-30-123456",
                "company": "Echo Dynamics GmbH",
                "address": "Friedrichstraße 50",
                "city": "Berlin",
                "country": "Germany",
            },
        ]

        for c_data in customers_data:
            existing_c = db.query(Customer).filter_by(email=c_data["email"]).first()
            if not existing_c:
                new_c = Customer(**c_data, is_active=True)
                db.add(new_c)
                logger.info(f"Seeded customer: {c_data['name']}")

        db.flush()

        # 4. Products & Initial Inventory Movements
        products_data = [
            {
                "sku": "PROD-LAPTOP-01",
                "name": "Zenith UltraBook 15 Pro",
                "description": "15.6-inch OLED, 32GB RAM, 1TB NVMe, Intel Core i7",
                "category": "Electronics",
                "price": Decimal("1299.99"),
                "cost_price": Decimal("950.00"),
                "stock_quantity": 45,
                "reorder_level": 10,
            },
            {
                "sku": "PROD-MONITOR-02",
                "name": "ViewSonic 4K Ergo 27-inch",
                "description": "UHD IPS 144Hz Monitor with USB-C 90W Power Delivery",
                "category": "Peripherals",
                "price": Decimal("449.50"),
                "cost_price": Decimal("310.00"),
                "stock_quantity": 80,
                "reorder_level": 15,
            },
            {
                "sku": "PROD-KEYBOARD-03",
                "name": "Tactile Mechanical Keyboard RGB",
                "description": "Hot-swappable mechanical switches with PBT keycaps",
                "category": "Peripherals",
                "price": Decimal("129.00"),
                "cost_price": Decimal("65.00"),
                "stock_quantity": 120,
                "reorder_level": 25,
            },
            {
                "sku": "PROD-MOUSE-04",
                "name": "Ergonomic Precision Wireless Mouse",
                "description": "Ergonomic sculpted vertical mouse with 4000 DPI sensor",
                "category": "Peripherals",
                "price": Decimal("79.99"),
                "cost_price": Decimal("38.00"),
                "stock_quantity": 95,
                "reorder_level": 20,
            },
            {
                "sku": "PROD-SERVER-05",
                "name": "Rackmount Server Enterprise 1U",
                "description": "Dual Xeon Silver, 64GB ECC DDR4, Redundant PSU",
                "category": "Enterprise Hardware",
                "price": Decimal("2850.00"),
                "cost_price": Decimal("2100.00"),
                "stock_quantity": 12,
                "reorder_level": 5,
            },
            {
                "sku": "PROD-SWITCH-06",
                "name": "Gigabit Managed Switch 48-Port PoE+",
                "description": "Layer 3 Managed Gigabit Switch with 4x 10G SFP+ Uplinks",
                "category": "Networking",
                "price": Decimal("749.00"),
                "cost_price": Decimal("520.00"),
                "stock_quantity": 25,
                "reorder_level": 8,
            },
            {
                "sku": "PROD-HEADSET-07",
                "name": "Active Noise Cancelling Headset ANC",
                "description": "Bluetooth 5.3 conference headset with noise-canceling mic",
                "category": "Audio",
                "price": Decimal("189.95"),
                "cost_price": Decimal("95.00"),
                "stock_quantity": 60,
                "reorder_level": 15,
            },
            {
                "sku": "PROD-DOCK-08",
                "name": "Thunderbolt 4 Quad-Display Dock",
                "description": "Single-cable workstation dock supporting dual 4K @ 60Hz",
                "category": "Accessories",
                "price": Decimal("229.00"),
                "cost_price": Decimal("130.00"),
                "stock_quantity": 4,  # LOW STOCK item intentionally
                "reorder_level": 10,
            },
            {
                "sku": "PROD-WEBCAM-09",
                "name": "4K Ultra HD AI Conference Webcam",
                "description": "Wide-angle webcam with auto-framing and stereo beamforming mics",
                "category": "Peripherals",
                "price": Decimal("149.00"),
                "cost_price": Decimal("75.00"),
                "stock_quantity": 3,  # LOW STOCK item intentionally
                "reorder_level": 12,
            },
            {
                "sku": "PROD-UPS-10",
                "name": "Smart UPS Backup 1500VA LCD",
                "description": "Line-interactive battery backup with AVR and 8 battery outlets",
                "category": "Power",
                "price": Decimal("399.00"),
                "cost_price": Decimal("270.00"),
                "stock_quantity": 18,
                "reorder_level": 6,
            },
        ]

        for p_data in products_data:
            existing_p = db.query(Product).filter_by(sku=p_data["sku"]).first()
            if not existing_p:
                stock_qty = p_data["stock_quantity"]
                new_p = Product(**p_data, is_active=True)
                db.add(new_p)
                db.flush()

                # Add initial ledger movement
                movement = InventoryMovement(
                    product_id=new_p.id,
                    movement_type=MovementType.IN,
                    quantity=stock_qty,
                    balance_after=stock_qty,
                    reason="Initial Warehouse Stock Ingestion",
                )
                db.add(movement)
                logger.info(f"Seeded product: {p_data['sku']} (Initial Stock: {stock_qty})")

        db.commit()
        logger.info("Database seeding successfully completed!")

    except Exception as exc:
        db.rollback()
        logger.error(f"Error seeding database: {exc}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
