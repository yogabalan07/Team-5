// Central route map for all frontend pages in the inventory application.
import { Navigate, Route, Routes } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Products from '../pages/Products.jsx';
import Categories from '../pages/Categories.jsx';
import Suppliers from '../pages/Suppliers.jsx';
import Inventory from '../pages/Inventory.jsx';
import StockIn from '../pages/StockIn.jsx';
import StockOut from '../pages/StockOut.jsx';
import PurchaseOrders from '../pages/PurchaseOrders.jsx';
import Sales from '../pages/Sales.jsx';
import Reports from '../pages/Reports.jsx';
import Users from '../pages/Users.jsx';
import Profile from '../pages/Profile.jsx';
import Settings from '../pages/Settings.jsx';
import NotFound from '../pages/NotFound.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/stock-in" element={<StockIn />} />
        <Route path="/stock-out" element={<StockOut />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
