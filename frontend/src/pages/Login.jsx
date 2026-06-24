import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(username, password);
        setLoading(false);
        
        if (result.success) {
            toast.success('Login successful!');
            navigate('/dashboard');
        } else {
            toast.error(result.error || 'Login failed. Please try again.');
        }
    };

    // Quick login function for testing
    const quickLogin = (user, pass) => {
        setUsername(user);
        setPassword(pass);
        // Auto submit after setting credentials
        setTimeout(() => {
            document.getElementById('login-form').dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
            );
        }, 100);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    Inventory Management System
                </h2>
                
                <form id="login-form" onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px'
                            }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px'
                            }}
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#5a67d8'}
                        onMouseLeave={(e) => e.target.style.background = '#667eea'}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Quick Login Buttons - For Testing */}
                <div style={{ marginTop: '20px' }}>
                    <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '10px' }}>
                        Quick Login (for testing):
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => quickLogin('admin', 'admin123')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: '#48bb78',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => quickLogin('user', 'user123')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: '#4299e1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            User
                        </button>
                    </div>
                </div>

                {/* Show credentials on login page */}
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f7fafc',
                    borderRadius: '5px',
                    border: '1px solid #e2e8f0'
                }}>
                    <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>
                        <strong>📧 Default Login:</strong><br/>
                        Username: <code style={{ background: '#edf2f7', padding: '2px 6px', borderRadius: '3px' }}>admin</code><br/>
                        Password: <code style={{ background: '#edf2f7', padding: '2px 6px', borderRadius: '3px' }}>admin123</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;