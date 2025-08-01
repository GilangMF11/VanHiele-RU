<!-- routes/admin/+layout.svelte -->
<script lang="ts">
    import { onMount } from 'svelte'
    import { page } from '$app/stores'
    import { adminUser } from '$lib/stores/admin'
    import type { LayoutData } from '$lib/types/admin';
    import AdminHeader from '$lib/components/admin/AdminHeader.svelte'
    import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte'
  
    export let data: LayoutData
  
    // Sync server data with client store
    onMount(() => {
      console.log('Admin layout mounted with data:', data) // 🔍 Debug
      
      if (data.adminUser) {
        console.log('Setting admin user from server data:', data.adminUser) // 🔍 Debug
        $adminUser = data.adminUser
      } else {
        console.log('No admin user from server, clearing store') // 🔍 Debug
        $adminUser = null
      }
    })
  
    // Reactive statement to sync data changes
    $: {
      if (data.adminUser && (!$adminUser || $adminUser.id !== data.adminUser.id)) {
        console.log('Updating admin user from reactive data:', data.adminUser) // 🔍 Debug
        $adminUser = data.adminUser
      }
    }
  
    // Check if current page is login
    $: isLoginPage = $page.url.pathname === '/admin/login'
  </script>
  
  <div class="admin-layout">
    {#if isLoginPage}
      <!-- Login page without sidebar -->
      <main class="login-main">
        <slot />
      </main>
    {:else if $adminUser?.isAuthenticated}
      <!-- Main admin layout with sidebar -->
      <div class="admin-container">
        <!-- Sidebar -->
        <AdminSidebar />
        
        <!-- Main content -->
        <main class="admin-main">
          <!-- Header -->
          <AdminHeader />
          
          <!-- Page content -->
          <div class="page-content">
            <slot />
          </div>
        </main>
      </div>
    {:else}
      <!-- Loading state while checking authentication -->
      <div class="auth-loading">
        <div class="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    {/if}
  </div>
  
  <style>
    .admin-layout {
      min-height: 100vh;
      background: #f8fafc;
    }
  
    .login-main {
      width: 100%;
      height: 100vh;
    }
  
    .admin-container {
      display: flex;
      min-height: 100vh;
    }
  
    .admin-sidebar {
      width: 280px;
      background: #1e293b;
      color: white;
      padding: 1rem;
    }
  
    .sidebar-placeholder h3 {
      margin: 0 0 1rem 0;
      color: white;
    }
  
    .sidebar-placeholder nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .sidebar-placeholder nav a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
  
    .sidebar-placeholder nav a:hover,
    .sidebar-placeholder nav a.active {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  
    .admin-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  
    .header-content h1 {
      margin: 0;
      color: #1e293b;
    }
  
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  
    .user-info button {
      padding: 0.5rem 1rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
  
    .user-info button:hover {
      background: #dc2626;
    }
  
    .page-content {
      flex: 1;
      padding: 0;
      overflow: auto;
    }
  
    .auth-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
  
    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
  
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>