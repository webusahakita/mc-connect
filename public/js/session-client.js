/** Same-origin session and CSRF support shared by the existing HTML pages. */
(() => {
    const nativeFetch = window.fetch.bind(window);
    const workspace = /^\/(admin|stage|vendor)(\.html)?\/?$/.test(window.location.pathname);
    let tokenPromise;

    function loginRequired() {
        if (workspace) {
            const target = window.location.pathname + window.location.search;
            window.location.replace('/login?redirect=' + encodeURIComponent(target));
        }
    }

    function setToken(token) {
        tokenPromise = Promise.resolve(token);
        window.CSRF_TOKEN = token;
        let meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'csrf-token';
            document.head.appendChild(meta);
        }
        meta.content = token;
    }

    async function csrfToken(refresh = false) {
        if (refresh) tokenPromise = null;
        if (!tokenPromise) {
            tokenPromise = nativeFetch('/api/csrf-token', {
                credentials: 'same-origin', cache: 'no-store',
                headers: { Accept: 'application/json' }
            }).then(async response => {
                if (!response.ok) throw new Error('Token sesi tidak dapat dimuat.');
                const data = await response.json();
                if (!data.token) throw new Error('Token sesi tidak tersedia.');
                setToken(data.token);
                return data.token;
            }).catch(error => {
                tokenPromise = null;
                throw error;
            });
        }
        return tokenPromise;
    }

    window.MCSession = { user: null, setToken, ready: Promise.resolve(null) };
    if (workspace) {
        window.MCSession.ready = nativeFetch('/api/mc/session', {
            credentials: 'same-origin', cache: 'no-store',
            headers: { Accept: 'application/json' }
        }).then(async response => {
            if (response.status === 401) {
                loginRequired();
                return null;
            }
            if (!response.ok) return null;
            const data = await response.json();
            window.MCSession.user = data.user;
            // Display-only compatibility; authorization is always checked by the server.
            sessionStorage.removeItem('mc_auth_token');
            sessionStorage.setItem('mc_auth_user', JSON.stringify(data.user));
            return data.user;
        }).catch(() => null);
    }

    window.fetch = async (input, options) => {
        const url = new URL(input instanceof Request ? input.url : input, window.location.href);
        if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
            return nativeFetch(input, options);
        }

        await window.MCSession.ready;
        const base = input instanceof Request ? new Request(input, options) : new Request(url, options);
        const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(base.method);
        const send = async refresh => {
            const headers = new Headers(base.headers);
            headers.set('Accept', 'application/json');
            if (unsafe) headers.set('X-CSRF-TOKEN', await csrfToken(refresh));
            return nativeFetch(new Request(base.clone(), {
                headers, credentials: 'same-origin', cache: 'no-store'
            }));
        };

        let response = await send(false);
        // A 419 is rejected before the controller runs, so one token refresh is safe.
        if (unsafe && response.status === 419) response = await send(true);
        if (response.status === 401 && url.pathname !== '/api/mc/login') loginRequired();
        return response;
    };
})();
