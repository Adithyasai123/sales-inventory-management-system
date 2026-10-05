import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Screen Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { CreateOrderPage } from './pages/orders/CreateOrderPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ApprovalsQueuePage } from './pages/approvals/ApprovalsQueuePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UsersPage } from './pages/users/UsersPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Protected Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/create" element={<CreateOrderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />

          {/* Manager / Admin Routes */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <ApprovalsQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Exclusive Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Inside Shell */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
