import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const { login, users, register } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (!email) return;

        if (login(email)) {
            navigate(from, { replace: true });
        } else {
            setError('User not found. Please check email or register.');
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (!email || !name) return;

        try {
            register({ name, email });
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
        }
    };

    const loginAsDemoUser = (userEmail) => {
        login(userEmail);
        navigate(from, { replace: true });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: 'var(--bg-secondary)',
        }}>
            {/* Visual Side */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex', // Hidden on mobile via css
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
            }} className="login-sidebar">
                {/* Background decorative elements */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(50px)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        marginBottom: '2rem',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Sparkles size={20} />
                        <span style={{ fontWeight: 600 }}>AI Project Hub</span>
                    </div>

                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        Manage projects at <br /> <span style={{ opacity: 0.8 }}>warp speed</span>.
                    </h1>

                    <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
                        The intelligent workspace for modern teams. Create tasks, write documents, and organize work with the power of AI.
                    </p>
                </div>
            </div>

            {/* Form Side */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2rem',
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%',
                background: 'var(--bg-primary)', // Ensure white bg on mobile
            }}>
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>

                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {mode === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {mode === 'login'
                                ? 'Enter your details to access your workspace'
                                : 'Get started with your AI-powered workspace'}
                        </p>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    style={{ paddingLeft: '40px' }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                // Password check is mocked for logic simplicity
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px',
                                background: 'var(--color-error-bg, #FEF2F2)',
                                color: 'var(--color-error)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                marginBottom: '1rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '44px' }}>
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </div>

                    {/* Quick Demo Login */}
                    {mode === 'login' && (
                        <div style={{ marginTop: '3rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--text-tertiary)',
                                fontSize: '12px',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ height: '1px', flex: 1, background: 'var(--border-light)' }}></div>
                                OR QUICK LOGIN AS DEMO USER
                                <div style={{ height: '1px', flex: 1, background: 'var(--border-light)' }}></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {users.slice(0, 2).map((u, i) => (
                                    <button
                                        key={u.id}
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => loginAsDemoUser(u.email)}
                                        style={{ justifyContent: 'center' }}
                                    >
                                        <div className="avatar avatar-xs" style={{ width: '20px', height: '20px', fontSize: '9px' }}>{u.avatar}</div>
                                        {u.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .login-sidebar {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
