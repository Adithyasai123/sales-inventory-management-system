import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_screenshots():
    artifacts_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.gemini', 'antigravity', 'brain', '494b2369-d9d1-407d-bf40-c484460299c4'))
    os.makedirs(artifacts_dir, exist_ok=True)

    base_url = 'http://localhost:5173'

    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)

        pages_to_capture = [
          # (Filename prefix, URL path, setup_action, viewport)
          ('01_login_light_1440', '/login', 'light', 1440, 900),
          ('02_login_dark_1440', '/login', 'dark', 1440, 900),
          ('03_dashboard_light_1440', '/dashboard', 'light', 1440, 900),
          ('04_dashboard_dark_1440', '/dashboard', 'dark', 1440, 900),
          ('05_orders_light_1440', '/orders', 'light', 1440, 900),
          ('06_orders_empty_search_light_1440', '/orders', 'light_empty_search', 1440, 900),
          ('07_products_light_1440', '/products', 'light', 1440, 900),
          ('08_customers_light_1440', '/customers', 'light', 1440, 900),
          ('09_inventory_healthy_light_1440', '/inventory', 'light_inventory_healthy', 1440, 900),
          ('10_approvals_all_caught_up_light_1440', '/approvals', 'light', 1440, 900),
          ('11_users_light_1440', '/users', 'light', 1440, 900),
          ('12_settings_light_1440', '/settings', 'light', 1440, 900),
          ('13_404_not_found_light_1440', '/random-unknown-page', 'light', 1440, 900),
          ('14_dashboard_dark_mobile_390', '/dashboard', 'dark', 390, 844),
          ('15_orders_dark_mobile_390', '/orders', 'dark', 390, 844),
        ]

        for name, url_path, mode, width, height in pages_to_capture:
            context = browser.new_context(viewport={'width': width, 'height': height})
            page = context.new_page()

            # Set dark mode cookie if requested
            if 'dark' in mode:
                page.add_init_script("document.cookie = 'theme-mode=dark; path=/; max-age=31536000';")
            else:
                page.add_init_script("document.cookie = 'theme-mode=light; path=/; max-age=31536000';")

            # Login automatically via cookie tokens
            page.add_init_script("""
              document.cookie = 'access_token=mock_admin_token; path=/; max-age=86400';
              document.cookie = 'refresh_token=mock_refresh_token; path=/; max-age=604800';
            """)

            target_url = f"{base_url}{url_path}"
            page.goto(target_url, wait_until='networkidle')
            time.sleep(1.5)

            if mode == 'light_empty_search':
                # Type an unmatching search query into the search box
                search_input = page.query_selector("input[placeholder*='Search']")
                if search_input:
                    search_input.fill('xyz_non_existent_search_query_999')
                    time.sleep(0.5)

            elif mode == 'light_inventory_healthy':
                # Click low stock tab
                low_stock_tab = page.query_selector("button:has-text('Low Stock Alerts')")
                if low_stock_tab:
                    low_stock_tab.click()
                    time.sleep(0.5)

            out_path = os.path.join(artifacts_dir, f"{name}.png")
            page.screenshot(path=out_path)
            print(f"Captured: {name}.png -> {out_path}")
            context.close()

        browser.close()

if __name__ == '__main__':
    run_screenshots()
