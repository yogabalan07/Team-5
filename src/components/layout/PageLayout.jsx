// Shared protected page layout that wraps dashboard-style application screens.
import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

function PageLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default PageLayout;
