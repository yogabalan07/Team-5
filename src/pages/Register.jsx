// Register page placeholder for future user signup form.
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormInput from '../components/ui/FormInput.jsx';

function Register() {
  return (
    <main className="auth-page">
      <h1>Register</h1>
      <p>Placeholder registration form for new inventory system users.</p>
      <form className="auth-form">
        <FormInput label="Name" name="name" placeholder="Full name" />
        <FormInput label="Email" name="email" type="email" placeholder="student@example.com" />
        <FormInput label="Password" name="password" type="password" placeholder="Password" />
        <Button type="submit">Register</Button>
      </form>
      <Link to="/login">Already have an account?</Link>
    </main>
  );
}

export default Register;
