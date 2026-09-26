<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin MC - MC-Connect</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <style>
        .auth-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background: radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.12) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                        var(--bg-main);
        }
        .auth-card {
            width: 100%;
            max-width: 440px;
            background: var(--bg-surface);
            border: 1px solid var(--border-accent);
            border-radius: var(--radius-lg);
            padding: 2.5rem 2rem;
            box-shadow: var(--shadow-gold), var(--shadow-lg);
        }
        .auth-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .auth-header .brand-logo {
            justify-content: center;
            margin-bottom: 0.75rem;
        }
        .auth-title {
            font-size: 1.4rem;
            font-weight: 800;
        }
        .auth-subtitle {
            color: var(--text-secondary);
            font-size: 0.88rem;
            margin-top: 0.25rem;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #F87171;
            padding: 0.75rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
            margin-bottom: 1.25rem;
        }
        .quick-demo-pill {
            background: rgba(212, 175, 55, 0.1);
            border: 1px dashed var(--gold-primary);
            padding: 0.75rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.82rem;
            margin-bottom: 1.5rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-header">
                <a href="{{ route('public.home') }}" class="brand-logo">
                    <div class="brand-icon">MC</div>
                    <div class="brand-text">MC-<span>Connect</span></div>
                </a>
                <h1 class="auth-title">🔐 Login Portal Admin MC</h1>
                <p class="auth-subtitle">Masuk ke ruang kerja Event Command Center</p>
            </div>

            @if($errors->any())
            <div class="alert-error">
                {{ $errors->first() }}
            </div>
            @endif

            <div class="quick-demo-pill">
                <strong style="color:var(--gold-primary);">Demo Kredensial Default:</strong><br>
                Email: <code>vanya@mcconnect.id</code><br>
                Sandi: <code>password123</code>
            </div>

            <form action="{{ route('login.post') }}" method="POST">
                @csrf
                <div class="form-group">
                    <label class="form-label">Email Master of Ceremony *</label>
                    <input type="email" class="form-input" name="email" value="{{ old('email', 'vanya@mcconnect.id') }}" required autofocus>
                </div>

                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                        <label class="form-label" style="margin-bottom:0;">Kata Sandi *</label>
                    </div>
                    <input type="password" class="form-input" name="password" value="password123" required>
                </div>

                <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--text-secondary);">
                    <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
                        <input type="checkbox" name="remember" checked style="accent-color:var(--gold-primary);">
                        Ingat Saya
                    </label>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;">
                    Masuk ke Admin Workspace ➔
                </button>

                <div style="text-align:center; margin-top:1.5rem; font-size:0.85rem;">
                    <a href="{{ route('public.home') }}" style="color:var(--text-muted);">
                        ◀ Kembali ke Portal Publik
                    </a>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
