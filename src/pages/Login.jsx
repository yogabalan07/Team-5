// Login page for inventory system users.
import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';
import Button from '../components/ui/Button.jsx';
import FormInput from '../components/ui/FormInput.jsx';
import AuthContext from '../context/AuthContext.jsx';

function Login() {
  const navigate = useNavigate();
  const { login, error: authError, isLoading, isAuthenticated } = useContext(AuthContext);

  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formValues.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formValues.password) {
      setError('Password is required');
      return;
    }

    const result = await login(formValues.username, formValues.password);

    if (result?.success) {
      navigate('/dashboard');
      return;
    }

    setError(result?.message || authError || 'Login failed. Please try again.');
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-panel login-panel--brand">
          <div className="brand-label">Inventory Management System</div>
          <h2>Smart Inventory Tracking for Modern Businesses</h2>
          <ul className="feature-list">
            <li>
              <span>Box</span>
              <div>
                <strong>Track Inventory</strong>
                <p>Real-time tracking of all inventory items</p>
              </div>
            </li>
            <li>
              <span>Users</span>
              <div>
                <strong>Manage Customers</strong>
                <p>Maintain customer information and purchase history</p>
              </div>
            </li>
            <li>
              <span>Vendors</span>
              <div>
                <strong>Manage Suppliers</strong>
                <p>Keep track of suppliers and purchase orders</p>
              </div>
            </li>
            <li>
              <span>Charts</span>
              <div>
                <strong>Generate Reports</strong>
                <p>Detailed reports and analytics for better decisions</p>
              </div>
            </li>
          </ul>
          <div className="promo-stats">
            <div>
              <strong>2,350</strong>
              <span>Total Items</span>
            </div>
            <div>
              <strong>85</strong>
              <span>Total Customers</span>
            </div>
            <div>
              <strong>40</strong>
              <span>Total Suppliers</span>
            </div>
            <div>
              <strong>2,350</strong>
              <span>Total Stock</span>
            </div>
          </div>
        </div>

        <div className="login-panel login-panel--form">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue managing your inventory</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <FormInput
              label="Enter Username"
              name="username"
              type="text"
              placeholder="Enter Username"
              value={formValues.username}
              onChange={handleChange}
              disabled={isLoading}
            />
            <FormInput
              label="Enter Password"
              name="password"
              type="password"
              placeholder="Enter Password"
              value={formValues.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <div className="form-footer-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formValues.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Remember Me</span>
              </label>
              <Link to="#" className="forgot-link">Forgot Password?</Link>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="login-footer">
            <p>Copyright 2026 Inventory Management System</p>
            <p>Developed by Team 5</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
