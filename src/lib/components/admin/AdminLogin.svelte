<script lang="ts">
  import { goto } from '$app/navigation'
  import { adminUser, adminLoading, addNotification } from '$lib/stores/admin'
  import { loginAdmin } from '$lib/utils/adminAuth'
  import { validateForm, commonRules } from '$lib/utils/validation'
  import { onMount } from 'svelte'
  import { tick } from 'svelte'
  
  let username = ''
  let password = ''
  let errors: Record<string, string[]> = {}
  let showPassword = false
  let rememberMe = false
  let isLoading = false
  
  // Auto-focus username field
  let usernameInput: HTMLInputElement
  
  onMount(() => {
    if (usernameInput) {
      usernameInput.focus()
    }
    
    // Check if already logged in
    if ($adminUser?.isAuthenticated) {
      goto('/admin/dashboard')
    }
    
    // Load remembered username
    const remembered = localStorage.getItem('admin_remember')
    if (remembered === 'true') {
      username = localStorage.getItem('admin_username') || ''
      rememberMe = true
    }
  })
  
  async function handleLogin() {
  // Clear previous errors
  errors = {}
  
  // Validate form
  const validation = validateForm({ username, password }, {
    username: commonRules.username,
    password: { required: true, minLength: 3 }
  })
  
  if (!validation.valid) {
    errors = validation.errors
    return
  }
  
  isLoading = true
  $adminLoading = true
  
  try {
    console.log('🔄 Starting login process...') // 🔍 Debug
    
    const result = await loginAdmin(username, password)
    console.log('📡 Login API result:', result) // 🔍 Debug
    
    if (result.success && result.user) {
      console.log('✅ Login successful, setting user state...') // 🔍 Debug
      
      // ✅ Set admin user state
      $adminUser = {
        ...result.user,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      }
      
      console.log('🔍 Admin user state set:', $adminUser) // 🔍 Debug
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('admin_remember', 'true')
        localStorage.setItem('admin_username', username)
      } else {
        localStorage.removeItem('admin_remember')
        localStorage.removeItem('admin_username')
      }
      
      addNotification('success', `Selamat datang, ${result.user.username}!`)
      
      // ✅ Wait for Svelte reactivity
      await tick()
      
      // ✅ Multiple navigation strategies
      console.log('🚀 Attempting navigation to dashboard...') // 🔍 Debug
      
      // Strategy 1: Direct goto
      try {
        await goto('/admin/dashboard', { replaceState: true })
        //window.location.href = '/admin/dashboard'
        console.log('✅ Navigation successful with goto') // 🔍 Debug
      } catch (gotoError) {
        console.error('❌ Goto failed:', gotoError) // 🔍 Debug
        
        // Strategy 2: Force page reload
        console.log('🔄 Trying page reload fallback...') // 🔍 Debug
        window.location.href = '/admin/dashboard'
      }
      
    } else {
      console.error('❌ Login failed:', result.error) // 🔍 Debug
      errors = { general: [result.error || 'Login gagal'] }
      addNotification('error', result.error || 'Login gagal')
    }
  } catch (err) {
    console.error('💥 Login error:', err) // 🔍 Debug
    const errorMessage = 'Terjadi kesalahan sistem'
    errors = { general: [errorMessage] }
    addNotification('error', errorMessage)
  } finally {
    isLoading = false
    $adminLoading = false
    console.log('🏁 Login process completed') // 🔍 Debug
  }
}


  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !isLoading) {
      handleLogin()
    }
  }
  
  function togglePasswordVisibility() {
    showPassword = !showPassword
  }
</script>

<!-- Rest of the template remains the same -->
<svelte:head>
  <title>Admin Login - Quiz Management System</title>
  <meta name="description" content="Login ke panel admin sistem quiz" />
</svelte:head>

<div class="login-container">
  <div class="login-background">
    <!-- Animated Background -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
  </div>
  
  <div class="login-content">
    <!-- Logo & Title Section -->
    <div class="login-header">
      <div class="logo-container">
        <div class="logo-icon">
          <svg class="logo-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="logo-text">
          <h1 class="logo-title">Admin Panel</h1>
          <p class="logo-subtitle">Quiz Management System</p>
        </div>
      </div>
      
      <div class="welcome-text">
        <h2>Selamat Datang Kembali</h2>
        <p>Silakan masuk ke akun administrator Anda</p>
      </div>
    </div>

    <!-- Login Form -->
    <div class="login-form-container">
      <form on:submit|preventDefault={handleLogin} class="login-form">
        
        <!-- General Error Message -->
        {#if errors.general}
          <div class="error-alert">
            <div class="error-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="error-message">
              {#each errors.general as error}
                <p>{error}</p>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Username Field -->
        <div class="form-group">
          <label for="username" class="form-label">
            <svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Username
          </label>
          <div class="input-container">
            <input
              bind:this={usernameInput}
              id="username"
              type="text"
              bind:value={username}
              on:keypress={handleKeyPress}
              disabled={isLoading}
              class="form-input"
              class:error={errors.username}
              placeholder="Masukkan username admin"
              autocomplete="username"
              required
            />
            <div class="input-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {#if errors.username}
            <div class="field-errors">
              {#each errors.username as error}
                <p class="field-error">{error}</p>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">
            <svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password
          </label>
          <div class="input-container">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              on:keypress={handleKeyPress}
              disabled={isLoading}
              class="form-input"
              class:error={errors.password}
              placeholder="Masukkan password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              on:click={togglePasswordVisibility}
              disabled={isLoading}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if showPassword}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                {/if}
              </svg>
            </button>
          </div>
          {#if errors.password}
            <div class="field-errors">
              {#each errors.password as error}
                <p class="field-error">{error}</p>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Remember Me -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={rememberMe}
              disabled={isLoading}
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">Ingat saya</span>
          </label>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          disabled={!username || !password || isLoading}
          class="login-button"
        >
          {#if isLoading}
            <div class="button-loading">
              <svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memverifikasi...</span>
            </div>
          {:else}
            <div class="button-content">
              <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Masuk ke Admin Panel</span>
            </div>
          {/if}
        </button>
      </form>
    </div>

    <!-- Footer -->
    <div class="login-footer">
      <p class="footer-text">
        © 2024 Quiz Management System. All rights reserved.
      </p>
      <div class="footer-links">
        <a href="#" class="footer-link">Bantuan</a>
        <span class="footer-separator">•</span>
        <a href="#" class="footer-link">Kontak</a>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    overflow: hidden;
  }

  .login-background {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .bg-shapes {
    position: absolute;
    inset: 0;
  }

  .shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
  }

  .shape-1 {
    width: 300px;
    height: 300px;
    top: -150px;
    right: -150px;
    animation-delay: 0s;
  }

  .shape-2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    left: -100px;
    animation-delay: 2s;
  }

  .shape-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    left: 10%;
    animation-delay: 4s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(120deg); }
    66% { transform: translateY(10px) rotate(240deg); }
  }

  .login-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    z-index: 2;
    max-width: 500px;
    margin: 0 auto;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .logo-svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  .logo-text {
    color: white;
  }

  .logo-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  .logo-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  .welcome-text h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
    margin: 0 0 0.5rem 0;
  }

  .welcome-text p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }

  .login-form-container {
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .error-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
  }

  .error-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-message p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.25;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  .label-icon {
    width: 16px;
    height: 16px;
  }

  .input-container {
    position: relative;
  }

  .form-input {
    width: 100%;
    padding: 0.875rem 3rem 0.875rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: white;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .form-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }

  .input-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .password-toggle:hover {
    color: #374151;
  }

  .field-errors {
    margin-top: 0.25rem;
  }

  .field-error {
    color: #ef4444;
    font-size: 0.75rem;
    margin: 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background: white;
    transition: all 0.2s;
    position: relative;
  }

  .checkbox-input:checked + .checkbox-custom {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .checkbox-input:checked + .checkbox-custom::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 6px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .checkbox-text {
    color: #374151;
    font-size: 0.875rem;
  }

  .login-button {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .button-loading,
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  .button-icon {
    width: 20px;
    height: 20px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .login-footer {
    margin-top: 2rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
  }

  .footer-text {
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
  }

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .footer-link {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-link:hover {
    color: white;
  }

  .footer-separator {
    opacity: 0.5;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .login-content {
      padding: 1rem;
    }

    .login-form-container {
      padding: 1.5rem;
    }

    .logo-container {
      flex-direction: column;
      gap: 0.5rem;
    }

    .logo-title {
      font-size: 1.5rem;
    }

    .welcome-text h2 {
      font-size: 1.25rem;
    }
  }
</style>
