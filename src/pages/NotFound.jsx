// Not Found page displayed when no frontend route matches the requested URL.
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="not-found-page">
      <h1>404</h1>
      <p>The page you requested was not found.</p>
      <Link to="/dashboard">Return to Dashboard</Link>
    </main>
  );
}

export default NotFound;
