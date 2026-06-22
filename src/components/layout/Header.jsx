// Header component for displaying the current page title or actions.
function Header({ title = 'Inventory Management System' }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}

export default Header;
