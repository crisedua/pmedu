import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User, ArrowRight, Lock, Mail, Globe, Check } from 'lucide-react';

export default function LoginPage() {
    const { login, users, register, loginWithGoogle, currentUser, language, setLanguage } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    // If user is already logged in, redirect to app
    useEffect(() => {
        if (currentUser) {
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, from]);

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
                justifyContent: 'flex-start', // Changed from center to accommodate long content
                padding: '4rem',
                color: 'white',
                position: 'relative',
                overflowY: 'auto', // Changed from hidden to auto
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>

                        {/* One-liner - visible for both languages but prioritizing Spanish structure as requested */}
                        {language === 'es' && (
                            <p style={{
                                fontSize: '1.1rem',
                                fontWeight: 500,
                                opacity: 0.9,
                                background: 'rgba(255,255,255,0.1)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                display: 'inline-block',
                                alignSelf: 'flex-start',
                                marginBottom: '-1rem'
                            }}>
                                De conversaciones y audios → a tareas con seguimiento y claridad.
                            </p>
                        )}

                        <div>
                            <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
                                {language === 'es' ? 'Un centro de control por voz para Project Managers' : 'A Voice Control Center for Project Managers'}
                            </h1>
                            <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
                                {language === 'es' ? (
                                    'Captura compromisos en el momento en que se dicen y conviértelos en tareas claras con responsable y fecha. Diseñado para entornos con mucha comunicación y poca estructura.'
                                ) : (
                                    'Capture commitments the moment they are spoken and turn them into clear tasks with assignees and due dates. Designed for high-communication, low-structure environments.'
                                )}
                            </p>
                        </div>

                        {language === 'es' && (
                            <>
                                {/* What It Does Section */}
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.9 }}>
                                        ¿Qué hace exactamente?
                                    </h3>
                                    <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                                        La app registra compromisos por voz y te permite responder al instante:
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {['¿Quién debe qué?', '¿Qué está atrasado?', '¿Qué vence la próxima semana?', '¿Qué se comprometió a hacer cada persona?'].map((item, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.9 }}>
                                                <span style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '50%', width: '6px', height: '6px' }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <p style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>
                                        Sin depender de WhatsApp, Jira o Slack.
                                    </p>
                                </div>

                                {/* Why It Matters Section */}
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>¿Por qué usarla?</h3>
                                    <p style={{ marginBottom: '0.75rem', opacity: 0.9 }}>Porque en proyectos reales:</p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {[
                                            'Las tareas se dicen, no se escriben',
                                            'Los compromisos se pierden',
                                            'El seguimiento recae siempre en el PM'
                                        ].map((item, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: '#F87171', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                    {/* Using a simple 'x' or similar since we want to portray the problem. Or maybe just a neutral bullet or check. 
                                                      Actually, "Check" implies solved. These are problems. 
                                                      Let's use a simple dot or arrow. Or the check if we want to say "This is true". 
                                                      The previous code used Check. Let's use Check but maybe color it differently or just keep it simple.
                                                      Re-reading: "Porque en proyectos reales: Las tareas se dicen..." -> These are facts.
                                                      I'll use a simple Check or bullet. Let's stick to the previous Check for consistency if it looked good, or maybe an AlertCircle.
                                                      Let's just use the Check but maybe in a neutral color or the same green to check off "facts".
                                                      Actually, let's use a standard bullet points style for "Problems" or maybe a cross? 
                                                      No, let's stick to the previous style for consistency. 
                                                      Wait, the user text says "Porque en proyectos reales: ...". These are pain points. 
                                                      Maybe just a simple list is better.
                                                   */}
                                                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>!</span>
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(255,255,255,0.15)',
                                        borderLeft: '4px solid #4ADE80'
                                    }}>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            Esta app se convierte en tu sistema de memoria y control.
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'white',
                                    color: '#4F46E5',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.5rem',
                                    marginBottom: '2rem'
                                }} onClick={() => setMode('register')}>
                                    <span>👉 Crear cuenta gratuita</span>
                                </div>
                            </>
                        )}
                    </div>
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

                    {/* Language Selector - Very Prominent */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--bg-tertiary)',
                            padding: '6px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-light)',
                        }}>
                            <Globe size={16} style={{ marginLeft: '8px', color: 'var(--text-muted)' }} />
                            <button
                                onClick={() => setLanguage('en')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    background: language === 'en' ? 'var(--color-primary-600)' : 'transparent',
                                    color: language === 'en' ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px',
                                }}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('es')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    background: language === 'es' ? 'var(--color-primary-600)' : 'transparent',
                                    color: language === 'es' ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px',
                                }}
                            >
                                Español
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {mode === 'login'
                                ? (language === 'es' ? 'Bienvenido' : 'Welcome back')
                                : (language === 'es' ? 'Crear cuenta' : 'Create account')}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {mode === 'login'
                                ? (language === 'es' ? 'Ingresa tus datos para acceder' : 'Enter your details to access your workspace')
                                : (language === 'es' ? 'Comienza con tu espacio de trabajo con IA' : 'Get started with your AI-powered workspace')}
                        </p>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="form-label">{language === 'es' ? 'Nombre completo' : 'Full Name'}</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={language === 'es' ? 'Ingresa tu nombre' : 'Enter your name'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">{language === 'es' ? 'Correo electrónico' : 'Email Address'}</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder={language === 'es' ? 'nombre@empresa.com' : 'name@company.com'}
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
                            <label className="form-label">{language === 'es' ? 'Contraseña' : 'Password'}</label>
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
                            {mode === 'login'
                                ? (language === 'es' ? 'Iniciar sesión' : 'Sign In')
                                : (language === 'es' ? 'Crear cuenta' : 'Create Account')}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    {/* Google Login - More Prominent */}
                    {mode === 'login' && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={loginWithGoogle}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    height: '44px',
                                    background: 'white',
                                    color: '#333',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {mode === 'login'
                            ? (language === 'es' ? '¿No tienes cuenta? ' : "Don't have an account? ")
                            : (language === 'es' ? '¿Ya tienes cuenta? ' : "Already have an account? ")}
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {mode === 'login'
                                ? (language === 'es' ? 'Regístrate' : 'Sign up')
                                : (language === 'es' ? 'Inicia sesión' : 'Log in')}
                        </button>
                    </div>
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
