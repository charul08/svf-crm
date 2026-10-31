import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      success('Welcome back!', 'Logged in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      let msg = err?.response?.data?.message;
      if (!msg) {
        if (!err?.response) {
          msg = 'Network error: Cannot reach server.';
        } else if (err?.response?.status >= 500) {
          msg = 'Server/Database error: Database is not connected in Vercel settings.';
        } else {
          msg = 'Invalid credentials. Please check your email and password.';
        }
      }
      error('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Demo@1234');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.4s ease' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center" style={{ marginBottom: 36 }}>
          <div className="logo-mark" style={{ width: 44, height: 44, fontSize: 18 }}>S</div>
          <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SVF CRM
          </span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface)', padding: 36 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>
            Sign in to your CRM workspace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center">
                <label className="input-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 11, color: 'var(--color-primary-400)', fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center' }}
            >
              {loading ? (
                <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <><LogIn size={17} /> Sign In</>
              )}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 4 }} />Demo Accounts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Admin', email: 'admin@svfcrm.com' },
                { label: 'Sales Rep', email: 'sales@svfcrm.com' },
              ].map(({ label, email }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => fillDemo(email)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary-500)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{email}</span>
                </button>
              ))}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>Password: <code style={{ color: 'var(--color-primary-400)' }}>Demo@1234</code></div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary-400)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
