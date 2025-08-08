
<script lang="ts">
  import { adminUser } from '$lib/stores/admin'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { logoutAdmin } from '$lib/utils/adminAuth'
  import { goto } from '$app/navigation'

  let currentTime = ''
  let showProfileMenu = false
  
  // Update time every second
  onMount(() => {
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  })

  function updateTime() {
    currentTime = new Date().toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function handleLogout() {
    try {
      console.log('🚪 Starting logout process...')
      
      const result = await logoutAdmin()
      
      if (result.success) {
        console.log('✅ Logout successful, clearing user state...')
        
        // Clear admin user state
        $adminUser = null
        
        // Close dropdown menu
        showProfileMenu = false
        
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

  // Get page title based on current route
  $: pageTitle = getPageTitle($page.url.pathname)

  function getPageTitle(pathname: string): string {
    if (pathname.includes('/dashboard')) return 'Dashboard'
    if (pathname.includes('/results')) return 'Hasil Quiz'
    if (pathname.includes('/tokens')) return 'Token Management'
    return 'Admin Panel'
  }

  // Close profile menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element
    if (!target.closest('.profile-menu-container')) {
      showProfileMenu = false
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="admin-header">
  <div class="header-content">
    <!-- Left Section - Page Title & Breadcrumb -->
    <div class="header-left">
      <h1 class="page-title">{pageTitle}</h1>
      <div class="breadcrumb">
        <span class="breadcrumb-item">Admin</span>
        <svg class="breadcrumb-separator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
        <span class="breadcrumb-item current">{pageTitle}</span>
      </div>
    </div>

    <!-- Right Section - Status & Profile -->
    <div class="header-right">
      <!-- Real-time Status -->
      <div class="status-indicator">
        <div class="status-dot online"></div>
        <span class="status-text">Online</span>
      </div>

      <!-- Current Time -->
      <div class="time-display">
        <svg class="time-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
        <span class="time-text">{currentTime}</span>
      </div>

      <!-- Profile Menu -->
      <div class="profile-menu-container">
        <button 
          class="profile-button"
          on:click={() => showProfileMenu = !showProfileMenu}
        >
          <div class="profile-avatar">
            <span class="avatar-text">
              {$adminUser?.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div class="profile-info">
            <span class="profile-name">{$adminUser?.username || 'Admin'}</span>
            <span class="profile-role">{$adminUser?.role || 'admin'}</span>
          </div>
          <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        {#if showProfileMenu}
          <div class="profile-dropdown">
            <div class="dropdown-header">
              <div class="dropdown-avatar">
                <span class="avatar-text">
                  {$adminUser?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div class="dropdown-info">
                <div class="dropdown-name">{$adminUser?.username || 'Admin'}</div>
                <div class="dropdown-email">Administrator</div>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-content">
              <button class="dropdown-item" on:click={() => goto('/admin/dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Dashboard
              </button>
              
              <button class="dropdown-item" on:click={() => goto('/admin/results')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                Hasil Quiz
              </button>
              
              <button class="dropdown-item" on:click={() => goto('/admin/tokens')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                </svg>
                Token Management
              </button>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <button class="dropdown-item logout" on:click={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>

<style>
  .admin-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    max-width: 100%;
  }

  /* Left Section */
  .header-left {
    flex: 1;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #64748b;
  }

  .breadcrumb-item {
    color: #64748b;
  }

  .breadcrumb-item.current {
    color: #3b82f6;
    font-weight: 500;
  }

  .breadcrumb-separator {
    width: 16px;
    height: 16px;
    margin: 0 0.5rem;
    color: #cbd5e1;
  }

  /* Right Section */
  .header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-dot.online {
    background-color: #10b981;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .time-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .time-icon {
    width: 16px;
    height: 16px;
  }

  /* Profile Menu */
  .profile-menu-container {
    position: relative;
  }

  .profile-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .profile-button:hover {
    background-color: #f1f5f9;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-text {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .profile-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.875rem;
  }

  .profile-role {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: capitalize;
  }

  .dropdown-icon {
    width: 16px;
    height: 16px;
    color: #64748b;
    transition: transform 0.2s;
  }

  .profile-button:hover .dropdown-icon {
    transform: rotate(180deg);
  }

  /* Dropdown */
  .profile-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 240px;
    z-index: 50;
    animation: dropdownSlide 0.2s ease-out;
  }

  @keyframes dropdownSlide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .dropdown-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dropdown-info {
    flex: 1;
  }

  .dropdown-name {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .dropdown-email {
    font-size: 0.875rem;
    color: #64748b;
  }

  .dropdown-divider {
    height: 1px;
    background-color: #f1f5f9;
  }

  .dropdown-content {
    padding: 0.5rem;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    transition: background-color 0.2s;
    text-align: left;
  }

  .dropdown-item:hover {
    background-color: #f9fafb;
  }

  .dropdown-item.logout {
    color: #dc2626;
  }

  .dropdown-item.logout:hover {
    background-color: #fef2f2;
  }

  .dropdown-item svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      padding: 1rem;
    }

    .time-display {
      display: none;
    }

    .profile-info {
      display: none;
    }

    .breadcrumb {
      display: none;
    }

    .page-title {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .status-indicator {
      display: none;
    }
  }
</style>