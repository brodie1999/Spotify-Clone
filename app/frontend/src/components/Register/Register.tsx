// @ts-ignore
import React, { useState } from "react";
import { register} from "../../api";
import { useNavigate, Link } from "react-router-dom";

export function Register() {
    const [form, setForm]  = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [event.target.name]: event.target.value});
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const { access_token } = await register(form);
            localStorage.setItem("token", access_token);
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message);
        }

    };
    const isFormValid = form.username && form.email && form.password;

    return (
    <>
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #000000 0%, #121212 50%, #1DB954 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Background pattern overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    radial-gradient(circle at 20% 80%, rgba(29, 185, 84, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(29, 185, 84, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)
                `,
                zIndex: 1
            }} />

            <div style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: '#181818',
                borderRadius: '24px',
                padding: '3rem 2.5rem',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 2
            }}>
                {/* Brand header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2.5rem'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #1DB954, #1ed760)',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)'
                    }}>
                        🎵
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#FFFFFF',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}>
                        Join the music
                    </h1>
                    <p style={{
                        color: '#B3B3B3',
                        margin: '0.5rem 0 0 0',
                        fontSize: '1rem'
                    }}>
                        Create your account to get started
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(185, 28, 28, 0.15)',
                        border: '1px solid rgba(185, 28, 28, 0.3)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: '#FCA5A5',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#FFFFFF',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            Username
                        </label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: '#2A2A2A',
                                border: '2px solid transparent',
                                borderRadius: '12px',
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#1DB954';
                                e.target.style.backgroundColor = '#333333';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'transparent';
                                e.target.style.backgroundColor = '#2A2A2A';
                            }}
                            placeholder="Choose a username"
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            color: '#FFFFFF',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: '#2A2A2A',
                                border: '2px solid transparent',
                                borderRadius: '12px',
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#1DB954';
                                e.target.style.backgroundColor = '#333333';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'transparent';
                                e.target.style.backgroundColor = '#2A2A2A';
                            }}
                            placeholder="Enter your email address"
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            color: '#FFFFFF',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: '#2A2A2A',
                                border: '2px solid transparent',
                                borderRadius: '12px',
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#1DB954';
                                e.target.style.backgroundColor = '#333333';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'transparent';
                                e.target.style.backgroundColor = '#2A2A2A';
                            }}
                            placeholder="Create a secure password"
                        />
                        <p style={{
                            color: '#B3B3B3',
                            fontSize: '0.75rem',
                            margin: '0.5rem 0 0 0',
                            lineHeight: '1.4'
                        }}>
                            Use 8 or more characters with a mix of letters, numbers & symbols
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            marginTop: '0.5rem',
                            borderRadius: '50px',
                            background: isLoading || !isFormValid
                                ? 'linear-gradient(45deg, #404040, #505050)'
                                : 'linear-gradient(45deg, #1DB954, #1ed760)',
                            color: '#FFFFFF',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: isLoading || !isFormValid ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: isLoading || !isFormValid
                                ? 'none'
                                : '0 8px 25px rgba(29, 185, 84, 0.3)',
                            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading && isFormValid) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(29, 185, 84, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading && isFormValid) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.3)';
                            }
                        }}
                    >
                        {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid transparent',
                                    borderTop: '2px solid #FFFFFF',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Creating account...
                            </div>
                        ) : 'Create Account'}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: '1px',
                        backgroundColor: '#404040',
                        transform: 'translateY(-50%)'
                    }} />
                    <span style={{
                        backgroundColor: '#181818',
                        color: '#B3B3B3',
                        padding: '0 1rem',
                        fontSize: '0.875rem',
                        position: 'relative'
                    }}>
                        Already have an account?
                    </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link
                        to="/login"
                        style={{
                            color: '#1DB954',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '25px',
                            border: '1px solid #1DB954',
                            transition: 'all 0.3s ease',
                            display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1DB954';
                            e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#1DB954';
                        }}
                    >
                        Sign In Instead
                    </Link>
                </div>

                {/* Terms */}
                <p style={{
                    color: '#B3B3B3',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    margin: '2rem 0 0 0',
                    lineHeight: '1.4'
                }}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>

            {/* Add CSS animation for loading spinner */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    </>
    );
}
