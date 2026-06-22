// Sidebar component with sample navigation links for inventory modules.
import { NavLink } from 'react-router-dom';

const navigationLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Products', path: '/products' },
  { label: 'Categories', path: '/categories' },
  { label: 'Suppliers', path: '/suppliers' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Stock In', path: '/stock-in' },
  { label: 'Stock Out', path: '/stock-out' },
  { label: 'Purchase Orders', path: '/purchase-orders' },
  { label: 'Sales', path: '/sales' },
  { label: 'Reports', path: '/reports' },
  { label: 'Users', path: '/users' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      {navigationLinks.map((link) => (
        <NavLink key={link.path} to={link.path}>
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;
