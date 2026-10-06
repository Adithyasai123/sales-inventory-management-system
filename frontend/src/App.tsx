import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/Loader';

// Lazy loaded page components for optimal code-splitting
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrdersListPage = React.lazy(() => import('./pages/orders/OrdersListPage').then(m => ({ default: m.OrdersListPage })));
const CreateOrderPage = React.lazy(() => import('./pages/orders/CreateOrderPage').then(m => ({ default: m.CreateOrderPage })));
const ProductsPage = React.lazy(() => import('./pages/products/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CustomersPage = React.lazy(() => import('./pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const InventoryPage = React.lazy(() => import('./pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ApprovalsQueuePage = React.lazy(() => import('./pages/approvals/ApprovalsQueuePage').then(m => ({ default: m.ApprovalsQueuePage })));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = React.lazy(() => import('./pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </AuthProvider>
  );
};

export default App;
