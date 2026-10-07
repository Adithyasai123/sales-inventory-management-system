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
const AuditLogsPage = React.lazy(() => import('./pages/audit/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
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
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute screenId="dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/orders"
              element={
                <ProtectedRoute screenId="orders">
                  <OrdersListPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/orders/create"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES']} screenId="orders">
                  <CreateOrderPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute screenId="products">
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES', 'FINANCE']} screenId="customers">
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/inventory"
              element={
                <ProtectedRoute screenId="inventory">
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            {/* Manager / Admin Routes */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} screenId="approvals">
                  <ApprovalsQueuePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} screenId="settings">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* User Management Route (Manager Super Admin & Admin) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} screenId="users">
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Audit & Transactional Notifications Route */}
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'FINANCE']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* User Profile & Reporting Hierarchy Tree (Full Screen) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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
