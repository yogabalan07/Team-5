// Top navigation component with sample links for primary account actions.
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar__brand">Inventory System</span>
      <div className="navbar__links">
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
