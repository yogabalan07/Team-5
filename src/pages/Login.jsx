// Login page placeholder for future user authentication form.
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormInput from '../components/ui/FormInput.jsx';

function Login() {
  return (
    <main className="auth-page">
      <h1>Login</h1>
      <p>Placeholder login form for inventory system users.</p>
      <form className="auth-form">
        <FormInput label="Email" name="email" type="email" placeholder="student@example.com" />
        <FormInput label="Password" name="password" type="password" placeholder="Password" />
        <Button type="submit">Login</Button>
      </form>
      <Link to="/register">Create an account</Link>
    </main>
  );
}

export default Login;
