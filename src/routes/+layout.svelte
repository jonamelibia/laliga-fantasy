<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';
  import LoginModal from '$lib/components/LoginModal.svelte';
  import { invalidateAll } from '$app/navigation';

  let { data, children } = $props<{ data: LayoutData; children: any }>();
  let mobileMenuOpen = $state(false);
  let showLoginModal = $state(false);
  let scrolled = $state(false);

  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('needLogin') === '1') {
      showLoginModal = true;
    }
  });

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    await invalidateAll();
  }

  $effect(() => {
    function handleScroll() {
      scrolled = window.scrollY > 50;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function closeMobile() {
    mobileMenuOpen = false;
  }
</script>

<div class="app">
  <nav class="navbar" class:scrolled>
    <div class="nav-inner">
      <a href="/" class="logo" onclick={closeMobile}>
        <span class="logo-f">F</span><span class="logo-l">L</span>
      </a>

      <div class="nav-center">
        <a href="/" class="nav-link" onclick={closeMobile}>Clasificación</a>
        {#if data.user}
          <a href="/admin" class="nav-link" onclick={closeMobile}>Admin</a>
          <a href="/profile" class="nav-link" onclick={closeMobile}>Mi Perfil</a>
        {/if}
        <a href="/stats" class="nav-link" onclick={closeMobile}>Stats</a>
      </div>

      <div class="nav-right">
        {#if data.user}
          <div class="user-pill">
            {#if data.user.photoUrl}
              <img src={data.user.photoUrl} alt="" class="nav-avatar" />
            {:else}
              <div class="nav-avatar-init">
                {data.user.displayName?.charAt(0) || data.user.jugador.charAt(0)}
              </div>
            {/if}
            <span class="nav-username">{data.user.displayName || data.user.jugador}</span>
          </div>
          <button class="logout-btn" onclick={handleLogout}>Salir</button>
        {:else}
          <button class="login-btn" onclick={() => showLoginModal = true}>
            Acceder
          </button>
        {/if}
      </div>

      <button
        class="hamburger"
        class:open={mobileMenuOpen}
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    {#if mobileMenuOpen}
      <div class="mobile-menu">
        <a href="/" class="mobile-link" onclick={closeMobile}>Clasificación</a>
        {#if data.user}
          <a href="/admin" class="mobile-link" onclick={closeMobile}>Admin</a>
          <a href="/profile" class="mobile-link" onclick={closeMobile}>Mi Perfil</a>
        {/if}
        {#if data.user}
          <div class="mobile-user">
            <span>{data.user.displayName || data.user.jugador}</span>
          </div>
          <button class="mobile-link" onclick={() => { closeMobile(); handleLogout(); }}>Salir</button>
        {:else}
          <button class="mobile-link" onclick={() => { closeMobile(); showLoginModal = true; }}>
            Acceder
          </button>
        {/if}
      </div>
    {/if}
  </nav>

  <main>
    {@render children()}
  </main>

  <footer class="footer">
    <div class="footer-line"></div>
    <p>Fantasy Liga Española &copy; 2026</p>
  </footer>
</div>

<LoginModal open={showLoginModal} onclose={() => showLoginModal = false} />

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
  }

  /* ── Navbar ─────────────────────────────────────── */

  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .navbar.scrolled {
    background: rgba(8, 8, 8, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 32px;
  }

  /* ── Logo ───────────────────────────────────────── */

  .logo {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    text-decoration: none;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .logo-f {
    color: #fff;
  }

  .logo-l {
    color: #E30613;
  }

  /* ── Nav Center ─────────────────────────────────── */

  .nav-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    position: relative;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    width: 0;
    height: 1.5px;
    background: #E30613;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-50%);
  }

  .nav-link:hover {
    color: #fff;
  }

  .nav-link:hover::after {
    width: 60%;
  }

  /* ── Nav Right ──────────────────────────────────── */

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-pill {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(255, 255, 255, 0.15);
  }

  .nav-avatar-init {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #AA151B;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .nav-username {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  .logout-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.75);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .logout-btn:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
  }

  .login-btn {
    background: transparent;
    border: 1px solid #AA151B;
    color: #fff;
    padding: 7px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .login-btn:hover {
    background: #AA151B;
    box-shadow: 0 4px 16px rgba(170, 21, 27, 0.3);
  }

  /* ── Hamburger ──────────────────────────────────── */

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    width: 36px;
    height: 36px;
  }

  .hamburger span {
    display: block;
    width: 100%;
    height: 2px;
    background: #E30613;
    border-radius: 1px;
    transition: all 0.3s;
    transform-origin: center;
  }

  .hamburger.open span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .hamburger.open span:nth-child(2) {
    opacity: 0;
  }

  .hamburger.open span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* ── Mobile Menu ────────────────────────────────── */

  .mobile-menu {
    display: none;
    flex-direction: column;
    padding: 8px 32px 16px;
    background: rgba(8, 8, 8, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    animation: mobileSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-link {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 12px 0;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .mobile-link:hover {
    color: #fff;
  }

  .mobile-user {
    padding: 12px 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  /* ── Footer ─────────────────────────────────────── */

  .footer {
    background: #080808;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    text-align: center;
    padding: 28px 24px;
  }

  .footer-line {
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(170, 21, 27, 0.3), transparent);
  }

  .footer p {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 12px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  @keyframes mobileSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .nav-inner {
      padding: 0 16px;
    }

    .nav-center, .nav-right {
      display: none;
    }

    .hamburger {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }
  }

  @media (max-width: 480px) {
    .mobile-menu {
      padding: 8px 16px 16px;
    }
  }
</style>
