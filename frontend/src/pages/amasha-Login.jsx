import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validateEmail = (value) => {
    if (!value) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only Gmail addresses (@gmail.com) are accepted.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let msg = '';
    if (name === 'email') msg = validateEmail(value);
    if (name === 'password') msg = validatePassword(value);
    setFieldErrors((prev) => ({ ...prev, [name]: msg }));
  };

  // Block further typing in email once a non-gmail domain is fully typed
  const handleEmailKeyDown = (e) => {
    const value = e.target.value;
    const atIndex = value.indexOf('@');

    // If there's already an @ and the domain portion is complete (contains a dot)
    // and it clearly won't resolve to @gmail.com, block printable characters
    if (atIndex !== -1) {
      const domain = value.slice(atIndex + 1).toLowerCase();
      const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey;

      // Allow if the domain is still being typed and could still become gmail.com
      const gmailPrefix = 'gmail.com';
      const couldStillBeGmail = gmailPrefix.startsWith(domain + (isPrintable ? e.key : ''));

      if (isPrintable && domain.length > 0 && !couldStillBeGmail && !domain.startsWith('gmail')) {
        e.preventDefault();
        setFieldErrors((prev) => ({ ...prev, email: 'Only Gmail addresses (@gmail.com) are accepted.' }));
        return;
      }
    }

    if (e.key === 'Enter') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const { name, value } = e.target;
      let msg = '';
      if (name === 'email') msg = validateEmail(value);
      if (name === 'password') msg = validatePassword(value);
      setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(form.email);
    const passwordErr = validatePassword(form.password);
    setFieldErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid response');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('localAuthChange'));

      const role = data.user?.role;
      if (role === 'doctor') navigate('/doctor-dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inlineErrorStyle = {
    color: '#B91C1C',
    fontSize: '12px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #124170 0%, #26667F 50%, #67C090 100%)' }}>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{
                width: `${120 + i * 80}px`, height: `${120 + i * 80}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.3 - i * 0.04,
              }} />
          ))}
        </div>

        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path d="M22 4C12.06 4 4 12.06 4 22s8.06 18 18 18 18-8.06 18-18S31.94 4 22 4zm0 4a14 14 0 110 28A14 14 0 0122 8z" fill="white" opacity="0.6"/>
                <path d="M22 12v10l7 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 20h5M22 15v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-1px' }}>
            MediCore
          </h1>
          <p className="text-xl opacity-80 mb-12" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Smart Healthcare Platform
          </p>

          <div className="space-y-6 text-left">
            {[
              { icon: '🩺', title: 'Expert Doctors', desc: 'Connect with 500+ certified specialists' },
              { icon: '📅', title: 'Easy Scheduling', desc: 'Book appointments in under 60 seconds' },
              { icon: '🔒', title: 'Secure & Private', desc: 'HIPAA-compliant data protection' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm opacity-70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl p-8 lg:p-10" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#124170' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16z" fill="white"/>
                  <path d="M11 7v5l4 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: '#124170', fontFamily: "'Playfair Display', serif" }}>MediCore</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#124170', fontFamily: "'Playfair Display', serif" }}>
                Welcome back
              </h2>
              <p className="text-sm" style={{ color: '#67C090', fontFamily: "'DM Sans', sans-serif" }}>
                Sign in to continue your healthcare journey
              </p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#B91C1C" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#124170' }}>
                  Email Address <span style={{ color: '#67C090', fontSize: '11px', fontWeight: 400 }}>(@gmail.com only)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleEmailKeyDown}
                    placeholder="you@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      border: fieldErrors.email ? '1.5px solid #B91C1C' : '1.5px solid #DDF4E7',
                      background: '#F8FFFE', color: '#124170', fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={e => { if (!fieldErrors.email) e.target.style.borderColor = '#67C090'; }}
                    onBlurCapture={e => { if (!fieldErrors.email) e.target.style.borderColor = '#DDF4E7'; }}
                  />
                </div>
                {fieldErrors.email && (
                  <p style={inlineErrorStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#B91C1C" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/></svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium" style={{ color: '#124170' }}>Password</label>
                  <a href="#" className="text-xs font-medium" style={{ color: '#67C090' }}>Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#67C090" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      border: fieldErrors.password ? '1.5px solid #B91C1C' : '1.5px solid #DDF4E7',
                      background: '#F8FFFE', color: '#124170', fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={e => { if (!fieldErrors.password) e.target.style.borderColor = '#67C090'; }}
                    onBlurCapture={e => { if (!fieldErrors.password) e.target.style.borderColor = '#DDF4E7'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#67C090' }}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#67C090" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="#67C090" strokeWidth="1.8"/></svg>
                    }
                  </button>
                </div>
                {fieldErrors.password && (
                  <p style={inlineErrorStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#B91C1C" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/></svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded" style={{ accentColor: '#67C090' }} />
                <label htmlFor="remember" className="text-sm" style={{ color: '#26667F' }}>Remember me for 7 days</label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all mt-2"
                style={{
                  background: loading ? '#67C090' : 'linear-gradient(135deg, #124170 0%, #26667F 60%, #67C090 100%)',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 010 20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In to MediCore'}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm mt-6" style={{ color: '#26667F', fontFamily: "'DM Sans', sans-serif" }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold" style={{ color: '#124170' }}>
                Create one free
              </Link>
            </p>
            <p className="text-center text-sm mt-2" style={{ color: '#26667F', fontFamily: "'DM Sans', sans-serif" }}>
            
              <Link to="/admin" className="font-semibold" style={{ color: '#124170' }}>
  Admin Login
</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}