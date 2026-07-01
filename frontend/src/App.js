import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import CustomerList from './components/customers/CustomerList';
import CustomerForm from './components/customers/CustomerForm';
import SupplierList from './components/suppliers/SupplierList';
import SupplierForm from './components/suppliers/SupplierForm';
import ItemList from './components/items/ItemList';
import ItemForm from './components/items/ItemForm';
import BrandList from './components/items/BrandList';
import GroupList from './components/items/GroupList';
import SectionList from './components/items/SectionList';
import UnitList from './components/items/UnitList';
import TaxList from './components/items/TaxList';
import SalesEntry from './components/sales/SalesEntry';
import SalesList from './components/sales/SalesList';
import SalesReturn from './components/sales/SalesReturn';
import SalesPrint from './components/sales/SalesPrint';
import SalesInvoiceView from './components/sales/SalesInvoiceView';
import PurchaseEntry from './components/purchases/PurchaseEntry';
import PurchaseOrder from './components/purchases/PurchaseOrder';
import PurchaseReturn from './components/purchases/PurchaseReturn';
import PurchaseList from './components/purchases/PurchaseList';
import PurchaseOrderList from './components/purchases/PurchaseOrderList';
import PurchaseOrderPrint from './components/purchases/PurchaseOrderPrint';
import GRNVerification from './components/purchases/GRNVerification';
import BillReceipt from './components/accounts/BillReceipt';
import BillPayment from './components/accounts/BillPayment';
import LedgerView from './components/accounts/LedgerView';
import SalesReport from './components/reports/SalesReport';
import SalesDetailsReport from './components/reports/SalesDetailsReport';
import PurchaseReport from './components/reports/PurchaseReport';
import PurchaseDetailsReport from './components/reports/PurchaseDetailsReport';
import CustomerReceipts from './components/reports/CustomerReceipts';
import SupplierPayments from './components/reports/SupplierPayments';
import StockReport from './components/reports/StockReport';
import UserManagement from './components/admin/UserManagement';
import PrivateRoute from './components/common/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading Inventory Pro...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* ==================== PROTECTED ROUTES ==================== */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* ==================== CUSTOMER ROUTES ==================== */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/edit/:id" element={<CustomerForm />} />
            
            {/* ==================== SUPPLIER ROUTES ==================== */}
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/suppliers/new" element={<SupplierForm />} />
            <Route path="/suppliers/edit/:id" element={<SupplierForm />} />
            
            {/* ==================== ITEM ROUTES ==================== */}
            <Route path="/items" element={<ItemList />} />
            <Route path="/items/new" element={<ItemForm />} />
            <Route path="/items/edit/:id" element={<ItemForm />} />
            <Route path="/items/:id" element={<ItemForm />} />
            
            {/* ==================== ITEM MASTER ROUTES ==================== */}
            <Route path="/items/brands" element={<BrandList />} />
            <Route path="/items/groups" element={<GroupList />} />
            <Route path="/items/sections" element={<SectionList />} />
            <Route path="/items/units" element={<UnitList />} />
            <Route path="/items/taxes" element={<TaxList />} />
            
            {/* ==================== SALES ROUTES ==================== */}
            <Route path="/sales/entry" element={<SalesEntry />} />
            <Route path="/sales/edit/:id" element={<SalesEntry />} />
            <Route path="/sales/list" element={<SalesList />} />
            <Route path="/sales/return" element={<SalesReturn />} />
            <Route path="/sales/print/:id" element={<SalesPrint />} />
            <Route path="/sales/invoice/:id" element={<SalesInvoiceView />} />
            
            {/* ==================== PURCHASE ROUTES ==================== */}
            <Route path="/purchases/order" element={<PurchaseOrder />} />
            <Route path="/purchases/edit-order/:id" element={<PurchaseOrder />} />
            <Route path="/purchases/orders" element={<PurchaseOrderList />} />
            <Route path="/purchases/print-order/:id" element={<PurchaseOrderPrint />} />
            <Route path="/purchases/entry" element={<PurchaseEntry />} />
            <Route path="/purchases/edit/:id" element={<PurchaseEntry />} />
            <Route path="/purchases/list" element={<PurchaseList />} />
            <Route path="/purchases/return" element={<PurchaseReturn />} />
            <Route path="/purchases/grn" element={<GRNVerification />} />
            
            {/* ==================== ACCOUNTS ROUTES ==================== */}
            <Route path="/accounts/receipts" element={<BillReceipt />} />
            <Route path="/accounts/payments" element={<BillPayment />} />
            <Route path="/accounts/ledger" element={<LedgerView />} />
            
            {/* ==================== REPORT ROUTES ==================== */}
            <Route path="/reports/sales" element={<SalesReport />} />
            <Route path="/reports/sales-details" element={<SalesDetailsReport />} />
            <Route path="/reports/purchases" element={<PurchaseReport />} />
            <Route path="/reports/purchase-details" element={<PurchaseDetailsReport />} />
            <Route path="/reports/customer-receipts" element={<CustomerReceipts />} />
            <Route path="/reports/supplier-payments" element={<SupplierPayments />} />
            <Route path="/reports/stock" element={<StockReport />} />
            
            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin/users" element={<UserManagement />} />
            
          </Route>
        </Route>
      </Routes>
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;