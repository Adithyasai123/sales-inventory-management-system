import os
import sys
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.role import Role
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType
from app.models.setting import SystemSetting
from app.models.order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.approval import OrderApproval, ApprovalDecision
from app.core.logging import logger, setup_logging
import random
from datetime import datetime, timedelta, timezone


def seed_database() -> None:
    setup_logging()
    logger.info("Starting idempotent database seeding...")
    db = SessionLocal()

    try:
        from sqlalchemy import text
        # Clear existing data — disable FK checks in a dialect-safe way
        dialect = db.bind.dialect.name
        try:
            if dialect == "sqlite":
                db.execute(text("PRAGMA foreign_keys = OFF;"))
            elif dialect == "mysql":
                db.execute(text("SET FOREIGN_KEY_CHECKS=0;"))

            db.execute(text("DELETE FROM order_approvals;"))
            db.execute(text("DELETE FROM sales_order_items;"))
            db.execute(text("DELETE FROM sales_orders;"))
            db.execute(text("DELETE FROM inventory_movements;"))
            db.execute(text("DELETE FROM products;"))
            db.execute(text("DELETE FROM customers;"))
            db.execute(text("DELETE FROM email_logs;"))
            db.execute(text("DELETE FROM users;"))
            db.execute(text("DELETE FROM roles;"))
            db.execute(text("DELETE FROM system_settings;"))
        finally:
            if dialect == "sqlite":
                db.execute(text("PRAGMA foreign_keys = ON;"))
            elif dialect == "mysql":
                db.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        db.commit()

        # 1. System Settings
        threshold_setting = db.query(SystemSetting).filter_by(key="approval_threshold").first()
        if not threshold_setting:
            threshold_setting = SystemSetting(
                key="approval_threshold",
                value="75000.00",
                description="Orders with total_amount exceeding this threshold require manager approval.",
            )
            db.add(threshold_setting)
            logger.info("Created system setting: approval_threshold = 75000.00")

        company_setting = db.query(SystemSetting).filter_by(key="company_name").first()
        if not company_setting:
            company_setting = SystemSetting(
                key="company_name",
                value="Acme Corp Sales & Inventory",
                description="Display company name for invoices and notifications.",
            )
            db.add(company_setting)

        currency_code_setting = db.query(SystemSetting).filter_by(key="currency_code").first()
        if not currency_code_setting:
            currency_code_setting = SystemSetting(
                key="currency_code",
                value="INR",
                description="ISO 4217 currency code used for formatting monetary values.",
            )
            db.add(currency_code_setting)

        currency_locale_setting = db.query(SystemSetting).filter_by(key="currency_locale").first()
        if not currency_locale_setting:
            currency_locale_setting = SystemSetting(
                key="currency_locale",
                value="en-IN",
                description="BCP 47 locale tag used for Intl.NumberFormat currency formatting.",
            )
            db.add(currency_locale_setting)

        db.flush()

        # 2. Dynamic Roles Table
        roles_data = [
            {
                "name": "ADMIN",
                "display_name": "System Administrator",
                "description": "Full administrative control, user management, and system settings",
                "is_system": True,
                "allowed_screens": "dashboard,orders,products,customers,inventory,approvals,settings,users,audit",
                "can_create_orders": True,
                "can_approve_orders": True,
                "can_adjust_stock": True,
                "can_manage_products": True,
                "can_manage_customers": True,
                "can_manage_users": True,
                "can_manage_settings": True,
                "can_view_audit": True,
            },
            {
                "name": "MANAGER",
                "display_name": "Regional Manager",
                "description": "Review/approve orders, adjust stock, manage catalog, settings",
                "is_system": True,
                "allowed_screens": "dashboard,orders,products,customers,inventory,approvals,settings,users,audit",
                "can_create_orders": True,
                "can_approve_orders": True,
                "can_adjust_stock": True,
                "can_manage_products": True,
                "can_manage_customers": True,
                "can_manage_users": True,
                "can_manage_settings": True,
                "can_view_audit": True,
            },
            {
                "name": "SALES",
                "display_name": "Sales Representative",
                "description": "Create sales orders, view catalog, register customers",
                "is_system": True,
                "allowed_screens": "dashboard,orders,products,customers,inventory",
                "can_create_orders": True,
                "can_manage_customers": True,
            },
            {
                "name": "WAREHOUSE",
                "display_name": "Warehouse Specialist",
                "description": "Physical stock adjustments, inward restock, movement ledger, fulfillment",
                "is_system": True,
                "allowed_screens": "dashboard,orders,products,inventory",
                "can_adjust_stock": True,
            },
            {
                "name": "FINANCE",
                "display_name": "Finance & Auditor",
                "description": "Order audit, tax invoices, email logs, transaction statistics (read-only stock)",
                "is_system": True,
                "allowed_screens": "dashboard,orders,customers,inventory,audit",
                "can_view_audit": True,
            },
        ]

        role_map = {}
        for r_data in roles_data:
            role_obj = db.query(Role).filter_by(name=r_data["name"]).first()
            if not role_obj:
                role_obj = Role(**r_data)
                db.add(role_obj)
                db.flush()
                logger.info(f"Seeded Dynamic Role: {role_obj.name} ({role_obj.display_name})")
            role_map[r_data["name"]] = role_obj

        # 3. Users (Exactly One Super Admin, Multiple Regional Managers, and Scoped Employees)
        # First create the single Super Admin
        super_admin = db.query(User).filter_by(email="manager@sims.in").first()
        if not super_admin:
            super_admin = User(
                email="manager@sims.in",
                hashed_password=get_password_hash("Manager@123456"),
                full_name="Rajesh Sharma",
                role="MANAGER",
                role_id=role_map["MANAGER"].id,
                is_active=True,
                is_super_admin=True,
            )
            db.add(super_admin)
            db.flush()
            logger.info("Seeded Sole Super Admin: manager@sims.in")
        else:
            super_admin.is_super_admin = True
            super_admin.role_id = role_map["MANAGER"].id
            db.flush()

        # Regional Managers created by Super Admin
        managers_data = [
            {
                "email": "priya.manager@sims.in",
                "full_name": "Priya Patel",
                "password": "Manager@123456",
                "role": UserRole.MANAGER,
                "is_super_admin": False,
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
            },
            {
                "email": "vikram.manager@sims.in",
                "full_name": "Vikram Malhotra",
                "password": "Manager@123456",
                "role": UserRole.MANAGER,
                "is_super_admin": False,
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
            },
            {
                "email": "admin@sims.in",
                "full_name": "Suresh Raina",
                "password": "Admin@123456",
                "role": UserRole.ADMIN,
                "is_super_admin": False,
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
            },
        ]

        mgr_map = {}
        for m_data in managers_data:
            existing = db.query(User).filter_by(email=m_data["email"]).first()
            m_role_str = m_data["role"].value if hasattr(m_data["role"], "value") else str(m_data["role"])
            role_record = role_map.get(m_role_str)
            if not existing:
                new_mgr = User(
                    email=m_data["email"],
                    hashed_password=get_password_hash(m_data["password"]),
                    full_name=m_data["full_name"],
                    role=m_role_str,
                    role_id=role_record.id if role_record else None,
                    is_active=True,
                    is_super_admin=m_data["is_super_admin"],
                    manager_id=m_data["manager_id"],
                    created_by_id=m_data["created_by_id"],
                )
                db.add(new_mgr)
                db.flush()
                mgr_map[m_data["email"]] = new_mgr
                logger.info(f"Seeded Manager: {m_data['email']}")
            else:
                existing.role_id = role_record.id if role_record else None
                mgr_map[m_data["email"]] = existing

        priya_mgr = mgr_map.get("priya.manager@sims.in") or super_admin
        vikram_mgr = mgr_map.get("vikram.manager@sims.in") or super_admin

        # Employees assigned to their respective Managers
        employees_data = [
            # Super Admin's direct sales rep
            {
                "email": "sales@sims.in",
                "full_name": "Amit Verma",
                "password": "Sales@123456",
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
            },
            # Priya's team
            {
                "email": "sneha.reddy@sims.in",
                "full_name": "Sneha Reddy",
                "password": "Sales@123456",
                "manager_id": priya_mgr.id,
                "created_by_id": priya_mgr.id,
            },
            {
                "email": "ananya.iyer@sims.in",
                "full_name": "Ananya Iyer",
                "password": "Sales@123456",
                "manager_id": priya_mgr.id,
                "created_by_id": priya_mgr.id,
            },
            # Vikram's team
            {
                "email": "rahul.deshmukh@sims.in",
                "full_name": "Rahul Deshmukh",
                "password": "Sales@123456",
                "manager_id": vikram_mgr.id,
                "created_by_id": vikram_mgr.id,
            },
            {
                "email": "kavita.nair@sims.in",
                "full_name": "Kavita Nair",
                "password": "Sales@123456",
                "manager_id": vikram_mgr.id,
                "created_by_id": vikram_mgr.id,
            },
            # Dedicated Operational Specialists
            {
                "email": "warehouse@sims.in",
                "full_name": "Ramesh Kumar",
                "password": "Warehouse@123456",
                "role": UserRole.WAREHOUSE,
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
                "allowed_screens": "dashboard,orders,products,inventory",
            },
            {
                "email": "finance@sims.in",
                "full_name": "Neha Gupta",
                "password": "Finance@123456",
                "role": UserRole.FINANCE,
                "manager_id": super_admin.id,
                "created_by_id": super_admin.id,
                "allowed_screens": "dashboard,orders,customers,inventory,audit",
            },
        ]

        for e_data in employees_data:
            existing = db.query(User).filter_by(email=e_data["email"]).first()
            e_role = e_data.get("role", UserRole.SALES)
            e_role_str = e_role.value if hasattr(e_role, "value") else str(e_role)
            role_record = role_map.get(e_role_str)
            if not existing:
                new_emp = User(
                    email=e_data["email"],
                    hashed_password=get_password_hash(e_data["password"]),
                    full_name=e_data["full_name"],
                    role=e_role_str,
                    role_id=role_record.id if role_record else None,
                    is_active=True,
                    is_super_admin=False,
                    manager_id=e_data["manager_id"],
                    created_by_id=e_data["created_by_id"],
                )
                if "allowed_screens" in e_data:
                    new_emp.allowed_screens = e_data["allowed_screens"]
                elif role_record and role_record.allowed_screens:
                    new_emp.allowed_screens = role_record.allowed_screens.split(",")
                db.add(new_emp)
                logger.info(f"Seeded User: {e_data['email']} ({e_role_str})")
            else:
                existing.role_id = role_record.id if role_record else None

        db.flush()

        # 3. Customers (Indian Enterprises and Organizations)
        customers_data = [
            {
                "name": "Reliance Retail Ltd",
                "email": "procurement@relianceretail.in",
                "phone": "+91 98201 12345",
                "company": "Reliance Retail Ventures",
                "address": "Maker Chambers IV, Nariman Point",
                "city": "Mumbai",
                "country": "India",
            },
            {
                "name": "Tata Consumer Products",
                "email": "orders@tataconsumer.in",
                "phone": "+91 98450 11223",
                "company": "Tata Consumer Ltd",
                "address": "1 Kirloskar Business Park, Hebbal",
                "city": "Bengaluru",
                "country": "India",
            },
            {
                "name": "Infosys Tech Solutions",
                "email": "procurement@infosys.in",
                "phone": "+91 98801 44556",
                "company": "Infosys Technologies Ltd",
                "address": "Electronics City, Hosur Road",
                "city": "Bengaluru",
                "country": "India",
            },
            {
                "name": "Mahindra Logistics Hub",
                "email": "billing@mahindralogistics.in",
                "phone": "+91 98220 99887",
                "company": "Mahindra Logistics Ltd",
                "address": "Hinjewadi Tech Park Phase 1",
                "city": "Pune",
                "country": "India",
            },
            {
                "name": "Adani Distribution Enterprises",
                "email": "supply@adanigroup.in",
                "phone": "+91 98980 33445",
                "company": "Adani Enterprises",
                "address": "SG Highway, Bodakdev",
                "city": "Ahmedabad",
                "country": "India",
            },
            {
                "name": "Wipro Digital Retail",
                "email": "accounts@wipro.in",
                "phone": "+91 99002 66778",
                "company": "Wipro Enterprises",
                "address": "Doddakannelli, Sarjapur Road",
                "city": "Bengaluru",
                "country": "India",
            },
            {
                "name": "Sun Pharma Healthcare Supply",
                "email": "orders@sunpharma.in",
                "phone": "+91 98112 77889",
                "company": "Sun Pharma Industries",
                "address": "Goregaon East Western Express Hwy",
                "city": "Mumbai",
                "country": "India",
            },
            {
                "name": "Blue Horizon Retail India",
                "email": "contact@bluehorizon.in",
                "phone": "+91 97110 55667",
                "company": "Blue Horizon India Pvt Ltd",
                "address": "Connaught Place, Barakhamba Road",
                "city": "New Delhi",
                "country": "India",
            },
            {
                "name": "Delta Manufacturing Chennai",
                "email": "supply@deltamfg.in",
                "phone": "+91 98401 22334",
                "company": "Delta Mfg India Pvt Ltd",
                "address": "Guindy Industrial Estate, Anna Salai",
                "city": "Chennai",
                "country": "India",
            },
            {
                "name": "Apollo Supply Chain India",
                "email": "logistics@apollosupply.in",
                "phone": "+91 98490 66778",
                "company": "Apollo Health & Logistics",
                "address": "Jubilee Hills Road No. 36",
                "city": "Hyderabad",
                "country": "India",
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
            # --- APPLE ---
            {
                "sku": "PHONE-APP-15P", "name": "Apple iPhone 15 Pro Max", "description": "256GB, Titanium, A17 Pro", "category": "Smartphones",
                "price": Decimal("149900.00"), "cost_price": Decimal("115000.00"), "stock_quantity": 45, "reorder_level": 10,
            },
            {
                "sku": "PHONE-APP-15", "name": "Apple iPhone 15", "description": "128GB, Pink, A16 Bionic", "category": "Smartphones",
                "price": Decimal("79900.00"), "cost_price": Decimal("62000.00"), "stock_quantity": 12, "reorder_level": 5,
            },
            {
                "sku": "PHONE-APP-14P", "name": "Apple iPhone 14 Pro", "description": "128GB, Space Black", "category": "Smartphones",
                "price": Decimal("119900.00"), "cost_price": Decimal("92000.00"), "stock_quantity": 30, "reorder_level": 8,
            },
            {
                "sku": "PHONE-APP-13", "name": "Apple iPhone 13", "description": "128GB, Midnight", "category": "Smartphones",
                "price": Decimal("59900.00"), "cost_price": Decimal("45000.00"), "stock_quantity": 65, "reorder_level": 15,
            },
            {
                "sku": "PHONE-APP-SE3", "name": "Apple iPhone SE (3rd Gen)", "description": "64GB, Starlight", "category": "Smartphones",
                "price": Decimal("43900.00"), "cost_price": Decimal("32000.00"), "stock_quantity": 80, "reorder_level": 20,
            },

            # --- SAMSUNG ---
            {
                "sku": "PHONE-SAM-S24U", "name": "Samsung Galaxy S24 Ultra", "description": "512GB, Titanium Black", "category": "Smartphones",
                "price": Decimal("129999.00"), "cost_price": Decimal("98000.00"), "stock_quantity": 80, "reorder_level": 15,
            },
            {
                "sku": "PHONE-SAM-S24", "name": "Samsung Galaxy S24", "description": "256GB, Marble Gray", "category": "Smartphones",
                "price": Decimal("79999.00"), "cost_price": Decimal("60000.00"), "stock_quantity": 55, "reorder_level": 15,
            },
            {
                "sku": "PHONE-SAM-ZFLIP5", "name": "Samsung Galaxy Z Flip 5", "description": "256GB, Mint", "category": "Smartphones",
                "price": Decimal("99999.00"), "cost_price": Decimal("75000.00"), "stock_quantity": 25, "reorder_level": 8,
            },
            {
                "sku": "PHONE-SAM-ZFOLD5", "name": "Samsung Galaxy Z Fold 5", "description": "512GB, Phantom Black", "category": "Smartphones",
                "price": Decimal("154999.00"), "cost_price": Decimal("120000.00"), "stock_quantity": 15, "reorder_level": 5,
            },
            {
                "sku": "PHONE-SAM-A54", "name": "Samsung Galaxy A54 5G", "description": "128GB, Awesome Graphite", "category": "Smartphones",
                "price": Decimal("38999.00"), "cost_price": Decimal("29000.00"), "stock_quantity": 110, "reorder_level": 25,
            },
            {
                "sku": "PHONE-SAM-A14", "name": "Samsung Galaxy A14", "description": "64GB, Silver", "category": "Smartphones",
                "price": Decimal("14499.00"), "cost_price": Decimal("10500.00"), "stock_quantity": 150, "reorder_level": 30,
            },

            # --- GOOGLE ---
            {
                "sku": "PHONE-GOO-P8P", "name": "Google Pixel 8 Pro", "description": "128GB, Obsidian", "category": "Smartphones",
                "price": Decimal("106999.00"), "cost_price": Decimal("82000.00"), "stock_quantity": 120, "reorder_level": 25,
            },
            {
                "sku": "PHONE-GOO-P8", "name": "Google Pixel 8", "description": "128GB, Hazel", "category": "Smartphones",
                "price": Decimal("75999.00"), "cost_price": Decimal("58000.00"), "stock_quantity": 85, "reorder_level": 20,
            },
            {
                "sku": "PHONE-GOO-P7A", "name": "Google Pixel 7a", "description": "128GB, Sea", "category": "Smartphones",
                "price": Decimal("43999.00"), "cost_price": Decimal("33000.00"), "stock_quantity": 90, "reorder_level": 20,
            },
            {
                "sku": "PHONE-GOO-FOLD", "name": "Google Pixel Fold", "description": "256GB, Porcelain", "category": "Smartphones",
                "price": Decimal("174999.00"), "cost_price": Decimal("135000.00"), "stock_quantity": 10, "reorder_level": 3,
            },

            # --- ONEPLUS ---
            {
                "sku": "PHONE-ONE-12", "name": "OnePlus 12", "description": "256GB, Silky Black", "category": "Smartphones",
                "price": Decimal("64999.00"), "cost_price": Decimal("49000.00"), "stock_quantity": 95, "reorder_level": 20,
            },
            {
                "sku": "PHONE-ONE-12R", "name": "OnePlus 12R", "description": "128GB, Iron Gray", "category": "Smartphones",
                "price": Decimal("39999.00"), "cost_price": Decimal("30000.00"), "stock_quantity": 110, "reorder_level": 20,
            },
            {
                "sku": "PHONE-ONE-OPEN", "name": "OnePlus Open", "description": "512GB, Emerald Dusk", "category": "Smartphones",
                "price": Decimal("139999.00"), "cost_price": Decimal("105000.00"), "stock_quantity": 18, "reorder_level": 5,
            },
            {
                "sku": "PHONE-ONE-NORD3", "name": "OnePlus Nord 3", "description": "128GB, Misty Green", "category": "Smartphones",
                "price": Decimal("33999.00"), "cost_price": Decimal("25000.00"), "stock_quantity": 60, "reorder_level": 15,
            },

            # --- VIVO ---
            {
                "sku": "PHONE-VIV-X100", "name": "Vivo X100 Pro", "description": "512GB, Asteroid Black", "category": "Smartphones",
                "price": Decimal("89999.00"), "cost_price": Decimal("68000.00"), "stock_quantity": 42, "reorder_level": 15,
            },
            {
                "sku": "PHONE-VIV-X300", "name": "Vivo X300 Ultra", "description": "1TB, Titanium, Next-Gen Camera", "category": "Smartphones",
                "price": Decimal("119999.00"), "cost_price": Decimal("90000.00"), "stock_quantity": 25, "reorder_level": 8,
            },
            {
                "sku": "PHONE-VIV-X500", "name": "Vivo X500 Concept", "description": "512GB, Sapphire Glass Edition", "category": "Smartphones",
                "price": Decimal("149999.00"), "cost_price": Decimal("110000.00"), "stock_quantity": 10, "reorder_level": 4,
            },

            # --- OTHER BRANDS ---
            {
                "sku": "PHONE-XIA-14", "name": "Xiaomi 14 Ultra", "description": "512GB, Black, Leica Optics", "category": "Smartphones",
                "price": Decimal("99999.00"), "cost_price": Decimal("76000.00"), "stock_quantity": 60, "reorder_level": 15,
            },
            {
                "sku": "PHONE-NOT-P2", "name": "Nothing Phone (2)", "description": "256GB, Dark Grey", "category": "Smartphones",
                "price": Decimal("44999.00"), "cost_price": Decimal("34000.00"), "stock_quantity": 4, "reorder_level": 10,
            },
            {
                "sku": "PHONE-MOT-RAZR", "name": "Motorola Razr+", "description": "256GB, Infinite Black", "category": "Smartphones",
                "price": Decimal("89999.00"), "cost_price": Decimal("68000.00"), "stock_quantity": 3, "reorder_level": 12,
            },
            {
                "sku": "PHONE-ASU-ROG8", "name": "ASUS ROG Phone 8 Pro", "description": "512GB, Phantom Black", "category": "Smartphones",
                "price": Decimal("94999.00"), "cost_price": Decimal("72000.00"), "stock_quantity": 18, "reorder_level": 6,
            },
            {
                "sku": "PHONE-HUA-P60", "name": "Huawei P60 Pro", "description": "256GB, Rococo Pearl", "category": "Smartphones",
                "price": Decimal("99999.00"), "cost_price": Decimal("75000.00"), "stock_quantity": 30, "reorder_level": 10,
            },
            {
                "sku": "PHONE-OPP-X7", "name": "Oppo Find X7 Ultra", "description": "256GB, Ocean Blue", "category": "Smartphones",
                "price": Decimal("99999.00"), "cost_price": Decimal("75000.00"), "stock_quantity": 55, "reorder_level": 20,
            },
            {
                "sku": "PHONE-HON-M6", "name": "Honor Magic6 Pro", "description": "512GB, Epi Green", "category": "Smartphones",
                "price": Decimal("89999.00"), "cost_price": Decimal("68000.00"), "stock_quantity": 28, "reorder_level": 10,
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

        db.flush()

        # 5. Generate Mock Orders with realistic historical timeline
        logger.info("Generating mock orders distributed across recent days for dashboard...")
        customers = db.query(Customer).all()
        products = db.query(Product).all()
        sales_user = db.query(User).filter_by(role=UserRole.SALES).first()
        manager_user = db.query(User).filter_by(role=UserRole.MANAGER).first()

        now = datetime.now(timezone.utc)
        order_idx = 1000

        # We distribute orders over the last 30 days so the 7d, 30d graphs look realistic
        for days_ago in range(29, -1, -1):
            orders_today = random.randint(1, 3)
            for order_today_idx in range(orders_today):
                order_idx += 1
                c = random.choice(customers)
                available_products = [prod for prod in products if prod.stock_quantity > 3]
                if not available_products:
                    continue
                p = random.choice(available_products)
                qty = random.randint(1, min(2, p.stock_quantity))

                subtotal = p.price * qty
                requires_approval = subtotal > Decimal("75000.00")
                
                order_dt = now - timedelta(
                    days=days_ago,
                    hours=random.randint(1, 14),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )

                # Recent orders: ensure day 0 has both completed orders and active pending approvals
                if days_ago == 0 and order_today_idx == 0:
                    status = OrderStatus.COMPLETED
                elif days_ago <= 1 and requires_approval and random.random() < 0.55:
                    status = OrderStatus.PENDING_APPROVAL
                elif requires_approval:
                    # Approved orders become COMPLETED as per approval service workflow
                    if random.random() < 0.12:
                        status = OrderStatus.REJECTED
                    else:
                        status = OrderStatus.COMPLETED
                else:
                    status = OrderStatus.COMPLETED

                order_num = f"ORD-{order_dt.strftime('%Y%m%d')}-{order_idx}"
                order = SalesOrder(
                    order_number=order_num,
                    customer_id=c.id,
                    creator_id=sales_user.id,
                    status=status,
                    subtotal=subtotal,
                    tax_rate=Decimal("0.10"),
                    tax_amount=subtotal * Decimal("0.10"),
                    total_amount=subtotal * Decimal("1.10"),
                    requires_approval=requires_approval,
                    created_at=order_dt,
                    updated_at=order_dt,
                )
                db.add(order)
                db.flush()

                item = SalesOrderItem(
                    order_id=order.id,
                    product_id=p.id,
                    quantity=qty,
                    unit_price=p.price,
                    total_price=subtotal,
                    created_at=order_dt,
                    updated_at=order_dt,
                )
                db.add(item)

                if status == OrderStatus.COMPLETED:
                    p.stock_quantity -= qty
                    mov = InventoryMovement(
                        product_id=p.id,
                        movement_type=MovementType.OUT,
                        quantity=-qty,
                        balance_after=p.stock_quantity,
                        reference_order_id=order.id,
                        reason=f"Approved order fulfillment: {order.order_number}" if requires_approval else f"Auto-fulfilled order {order.order_number}",
                        created_at=order_dt + timedelta(minutes=random.randint(15, 90)),
                    )
                    db.add(mov)

                    if requires_approval:
                        appr = OrderApproval(
                            order_id=order.id,
                            approver_id=manager_user.id,
                            decision=ApprovalDecision.APPROVED,
                            comment="Order verified and credit limit validated. Approved.",
                            decided_at=order_dt + timedelta(minutes=random.randint(10, 60)),
                        )
                        db.add(appr)

                elif status == OrderStatus.REJECTED:
                    appr = OrderApproval(
                        order_id=order.id,
                        approver_id=manager_user.id,
                        decision=ApprovalDecision.REJECTED,
                        comment="Order exceeded corporate credit limit policy.",
                        decided_at=order_dt + timedelta(minutes=random.randint(10, 60)),
                    )
                    db.add(appr)

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
