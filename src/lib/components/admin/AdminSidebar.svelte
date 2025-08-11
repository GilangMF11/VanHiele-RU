

<script lang="ts">
  import { page } from '$app/stores'
  import { adminUser } from '$lib/stores/admin'
  import { logoutAdmin } from '$lib/utils/adminAuth'
  import { goto } from '$app/navigation'

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
      badge: null
    },
    {
      name: 'Hasil Quiz',
      href: '/admin/results',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      badge: null
    },
    {
      name: 'Token Management',
      href: '/admin/tokens',
      icon: 'M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2h.01M9 9h.01M13 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: 'New'
    }
  ]

  async function handleLogout() {
    try {
      console.log('🚪 Starting logout process...')
      
      const result = await logoutAdmin()
      
      if (result.success) {
        console.log('✅ Logout successful, clearing user state...')
        
        // Clear admin user state
        $adminUser = null
        
        console.log('🔄 Redirecting to login page...')
        
        // Use window.location for hard redirect to ensure clean state
        window.location.href = '/admin/login'
      } else {
        console.error('❌ Logout failed:', result.error)
        alert('Logout gagal: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Logout error:', error)
      alert('Terjadi kesalahan saat logout')
    }
  }

  let collapsed = false

  function toggleSidebar() {
    collapsed = !collapsed
  }
</script>

<div class="sidebar" class:collapsed>
  <!-- Logo Header -->
  <div class="sidebar-header">
    <div class="logo-container">
      <div class="logo-icon">
        <svg class="logo-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      {#if !collapsed}
        <div class="logo-text">
          <h1 class="logo-title">Admin Panel</h1>
          <p class="logo-subtitle">Quiz System</p>
        </div>
      {/if}
    </div>
    
    <button class="collapse-btn" on:click={toggleSidebar}>
      <svg class="collapse-icon" class:rotated={collapsed} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  </div>

  <!-- Navigation Menu -->
  <nav class="sidebar-nav">
    <ul class="nav-list">
      {#each menuItems as item}
        <li class="nav-item">
          <a
            href={item.href}
            class="nav-link"
            class:active={$page.url.pathname === item.href}
            title={collapsed ? item.name : ''}
          >
            <div class="nav-icon">
              <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
              </svg>
            </div>
            
            {#if !collapsed}
              <span class="nav-text">{item.name}</span>
              {#if item.badge}
                <span class="nav-badge">{item.badge}</span>
              {/if}
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- User Section -->
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">
        <span class="avatar-text">
          {$adminUser?.username?.charAt(0).toUpperCase() || 'A'}
        </span>
      </div>
      
      {#if !collapsed}
        <div class="user-details">
          <p class="user-name">{$adminUser?.username || 'Admin'}</p>
          <p class="user-role">{$adminUser?.role || 'admin'}</p>
        </div>
      {/if}
    </div>
    
    <button
      class="logout-btn"
      on:click={handleLogout}
      title="Logout"
    >
      <svg class="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {#if !collapsed}
        <span>Logout</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .sidebar {
    width: 280px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    color: white;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: relative;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }

  .sidebar.collapsed {
    width: 80px;
  }

  /* Header */
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  .logo-text {
    overflow: hidden;
  }

  .logo-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  .logo-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1;
  }

  .collapse-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .collapse-icon {
    width: 16px;
    height: 16px;
    color: white;
    transition: transform 0.3s ease;
  }

  .collapse-icon.rotated {
    transform: rotate(180deg);
  }

  /* Navigation */
  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0 1rem;
  }

  .nav-item {
    margin-bottom: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    border-radius: 10px;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateX(4px);
  }

  .nav-link.active {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .icon-svg {
    width: 100%;
    height: 100%;
  }

  .nav-text {
    font-weight: 500;
    font-size: 0.875rem;
    overflow: hidden;
    white-space: nowrap;
  }

  .nav-badge {
    background: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    margin-left: auto;
  }

  /* Footer */
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .avatar-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }

  .user-details {
    overflow: hidden;
  }

  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.2;
  }

  .user-role {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    text-transform: capitalize;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    color: #fca5a5;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    transform: translateY(-1px);
  }

  .logout-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .sidebar.collapsed {
      width: 280px;
      transform: translateX(-100%);
    }

    .sidebar.mobile-open {
      transform: translateX(0);
    }
  }

  /* Custom Scrollbar */
  .sidebar-nav::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-nav::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
</style>