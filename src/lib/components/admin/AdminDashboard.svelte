<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { dashboardStats, addNotification } from '$lib/stores/admin'
  import { formatDateTime, timeAgo } from '$lib/utils/dateFormatter'
  //import RealtimeDashboard from '$lib/components/admin/RealtimeDashboard.svelte'
  let loading = true
  let error = ''
  let lastUpdateTime = ''
  let refreshInterval: NodeJS.Timer

  // Chart data for analytics
  let chartData = {
    daily: [],
    weekly: [],
    performance: []
  }

  onMount(async () => {
    await loadDashboardData()
    
    // Set up auto-refresh every 30 seconds
    refreshInterval = setInterval(loadDashboardData, 30000)
  })

  onDestroy(() => {
    if (refreshInterval) {
      //clearInterval(refreshInterval)
    }
  })

  async function loadDashboardData() {
    try {
      loading = true
      error = ''

      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()

      if (response.ok) {
        $dashboardStats = result.stats
        lastUpdateTime = new Date().toLocaleTimeString('id-ID')
        
        // Load chart data
        await loadChartData()
      } else {
        error = result.error || 'Failed to load dashboard data'
        addNotification('error', 'Gagal memuat data dashboard')
      }
    } catch (err) {
      error = 'Network error'
      addNotification('error', 'Terjadi kesalahan jaringan')
    } finally {
      loading = false
    }
  }

  async function loadChartData() {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const result = await response.json()
        chartData = result.data
        console.log('Chart data:', chartData)
      }
    } catch (err) {
      console.error('Failed to load chart data:', err)
    }
  }

  async function handleRefresh() {
    addNotification('info', 'Memperbarui data...')
    await loadDashboardData()
    addNotification('success', 'Data berhasil diperbarui')
  }

  // Reactive calculations
  $: stats = $dashboardStats
  $: completionRate = stats ? Math.round((stats.completed_quizzes / stats.total_students) * 100) : 0
  $: averagePerformance = stats ? stats.average_score : 0
  $: growthRate = 12.5 // Mock data, should come from API

  // Quick actions
  const quickActions = [
    {
      title: 'Buat Token Baru',
      description: 'Tambahkan token akses untuk siswa',
      href: '/admin/tokens',
      icon: 'M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2h.01M9 9h.01M13 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'blue'
    },
    {
      title: 'Lihat Hasil Terbaru',
      description: 'Analisis hasil quiz siswa',
      href: '/admin/results',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'green'
    },
    {
      title: 'Export Data',
      description: 'Download laporan lengkap',
      href: '/admin/results?export=true',
      icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'purple'
    }
  ]

  // Recent activities mock data
  const recentActivities = [
    {
      type: 'quiz_completed',
      student: 'Ahmad Fauzi',
      class: 'XII IPA 1',
      score: 85,
      time: new Date(Date.now() - 300000), // 5 minutes ago
      level: 3
    },
    {
      type: 'token_created',
      admin: 'Admin',
      token: 'CLASS2024',
      time: new Date(Date.now() - 900000), // 15 minutes ago
    },
    {
      type: 'quiz_started',
      student: 'Siti Nurhaliza',
      class: 'XII IPS 2',
      time: new Date(Date.now() - 1200000), // 20 minutes ago
      level: 1
    }
  ]
</script>

<svelte:head>
  <title>Dashboard - Admin Panel</title>
</svelte:head>

<div class="dashboard-container">
  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">Dashboard Overview</h1>
        <p class="page-description">
          Selamat datang di panel admin sistem quiz. Pantau aktivitas dan performa siswa secara real-time.
        </p>
      </div>
      <div class="header-right">
        <button 
          class="refresh-button"
          on:click={handleRefresh}
          disabled={loading}
        >
          <svg class="refresh-icon" class:spinning={loading} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Memperbarui...' : 'Refresh'}
        </button>
        
        {#if lastUpdateTime}
          <div class="last-update">
            <svg class="update-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Update terakhir: {lastUpdateTime}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if loading && !stats}
    <!-- Loading State -->
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat data dashboard...</p>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3>Terjadi Kesalahan</h3>
      <p>{error}</p>
      <button class="retry-button" on:click={loadDashboardData}>
        Coba Lagi
      </button>
    </div>
  {:else if stats}
    <!-- Main Dashboard Content -->
    <div class="dashboard-content">
      
      <!-- Stats Cards Grid -->
      <div class="stats-grid">
        <!-- Total Students -->
        <div class="stat-card primary">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{stats.total_students.toLocaleString('id-ID')}</div>
            <div class="stat-label">Total Siswa</div>
            <div class="stat-trend positive">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>+{growthRate}%</span>
            </div>
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="stat-card success">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{stats.active_sessions.toLocaleString('id-ID')}</div>
            <div class="stat-label">Sesi Aktif Hari Ini</div>
            <div class="stat-description">Siswa yang sedang mengerjakan</div>
          </div>
        </div>

        <!-- Completed Quizzes -->
        <div class="stat-card warning">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{stats.completed_quizzes.toLocaleString('id-ID')}</div>
            <div class="stat-label">Quiz Selesai</div>
            <div class="stat-description">Tingkat penyelesaian: {completionRate}%</div>
          </div>
        </div>

        <!-- Average Score -->
        <div class="stat-card info">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{stats.average_score}%</div>
            <div class="stat-label">Rata-rata Skor</div>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {stats.average_score}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Stats -->
      <div class="secondary-stats">
        <div class="secondary-stat">
          <div class="secondary-stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="secondary-stat-content">
            <div class="secondary-stat-value">{stats.total_questions_answered.toLocaleString('id-ID')}</div>
            <div class="secondary-stat-label">Total Jawaban</div>
          </div>
        </div>

        <div class="secondary-stat">
          <div class="secondary-stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2h.01M9 9h.01M13 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="secondary-stat-content">
            <div class="secondary-stat-value">{stats.active_tokens.toLocaleString('id-ID')}</div>
            <div class="secondary-stat-label">Token Aktif</div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        
        <!-- Quick Actions -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">Quick Actions</h3>
            <p class="card-description">Aksi cepat untuk manajemen sistem</p>
          </div>
          <div class="quick-actions">
            {#each quickActions as action}
              <a href={action.href} class="quick-action {action.color}">
                <div class="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon} />
                  </svg>
                </div>
                <div class="action-content">
                  <div class="action-title">{action.title}</div>
                  <div class="action-description">{action.description}</div>
                </div>
                <div class="action-arrow">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">Aktivitas Terbaru</h3>
            <p class="card-description">Aktivitas sistem dalam 24 jam terakhir</p>
          </div>
          <div class="activity-list">
            {#each recentActivities as activity}
              <div class="activity-item">
                <div class="activity-icon {activity.type}">
                  {#if activity.type === 'quiz_completed'}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  {:else if activity.type === 'token_created'}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  {:else}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  {/if}
                </div>
                <div class="activity-content">
                  {#if activity.type === 'quiz_completed'}
                    <div class="activity-title">Quiz Selesai</div>
                    <div class="activity-description">
                      {activity.student} ({activity.class}) menyelesaikan Level {activity.level} dengan skor {activity.score}%
                    </div>
                  {:else if activity.type === 'token_created'}
                    <div class="activity-title">Token Dibuat</div>
                    <div class="activity-description">
                      {activity.admin} membuat token baru: {activity.token}
                    </div>
                  {:else}
                    <div class="activity-title">Quiz Dimulai</div>
                    <div class="activity-description">
                      {activity.student} ({activity.class}) memulai Level {activity.level}
                    </div>
                  {/if}
                  <div class="activity-time">{timeAgo(activity.time)}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>

      <!-- Real-time Component -->
     <!-- <RealtimeDashboard /> -->
      
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    padding: 1.5rem;
    max-width: 100%;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .header-left {
    flex: 1;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .page-description {
    color: #64748b;
    font-size: 1rem;
    margin: 0;
    line-height: 1.5;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .refresh-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #475569;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-icon {
    width: 16px;
    height: 16px;
  }

  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  .last-update {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .update-icon {
    width: 16px;
    height: 16px;
  }

  /* Loading & Error States */
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
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

  .error-icon {
    width: 48px;
    height: 48px;
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .retry-button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-card.primary .stat-icon {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .stat-card.success .stat-icon {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .stat-card.warning .stat-icon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }

  .stat-card.info .stat-icon {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }

  .stat-icon svg {
    width: 24px;
    height: 24px;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .stat-trend.positive {
    color: #059669;
  }

  .stat-trend svg {
    width: 12px;
    height: 12px;
  }

  .stat-description {
    font-size: 0.75rem;
    color: #64748b;
  }

  .stat-progress {
    margin-top: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  /* Secondary Stats */
  .secondary-stats {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .secondary-stat {
    flex: 1;
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .secondary-stat-icon {
    width: 40px;
    height: 40px;
    background: #f1f5f9;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .secondary-stat-icon svg {
    width: 20px;
    height: 20px;
  }

  .secondary-stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .secondary-stat-label {
    font-size: 0.875rem;
    color: #64748b;
  }

  /* Content Grid */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .content-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
  }

  .card-header {
    margin-bottom: 1.5rem;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .card-description {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .quick-action {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .quick-action:hover {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .action-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .quick-action.blue .action-icon {
    background: #dbeafe;
    color: #3b82f6;
  }

  .quick-action.green .action-icon {
    background: #d1fae5;
    color: #10b981;
  }

  .quick-action.purple .action-icon {
    background: #ede9fe;
    color: #8b5cf6;
  }

  .action-icon svg {
    width: 20px;
    height: 20px;
  }

  .action-content {
    flex: 1;
  }

  .action-title {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .action-description {
    font-size: 0.875rem;
    color: #64748b;
  }

  .action-arrow {
    color: #cbd5e1;
  }

  .action-arrow svg {
    width: 16px;
    height: 16px;
  }

  /* Recent Activity */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    background: #fafbfc;
  }

  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .activity-icon.quiz_completed {
    background: #d1fae5;
    color: #10b981;
  }

  .activity-icon.token_created {
    background: #dbeafe;
    color: #3b82f6;
  }

  .activity-icon.quiz_started {
    background: #fef3c7;
    color: #f59e0b;
  }

  .activity-icon svg {
    width: 18px;
    height: 18px;
  }

  .activity-content {
    flex: 1;
  }

  .activity-title {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .activity-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .activity-time {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .dashboard-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .secondary-stats {
      flex-direction: column;
    }

    .page-title {
      font-size: 1.5rem;
    }
  }
</style>