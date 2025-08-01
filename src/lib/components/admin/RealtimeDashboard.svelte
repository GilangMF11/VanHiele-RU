// ==========================================
// 1. lib/components/admin/RealtimeDashboard.svelte - Real-time Component
// ==========================================
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { dashboardStats } from '$lib/stores/admin'
  import { timeAgo } from '$lib/utils/dateFormatter'

  let eventSource: EventSource | null = null
  let connected = false
  let lastUpdate = ''
  let recentActivity: any[] = []
  let connectionAttempts = 0
  let maxReconnectAttempts = 5

  onMount(() => {
    connectSSE()
  })

  onDestroy(() => {
    if (eventSource) {
      eventSource.close()
    }
  })

  function connectSSE() {
    if (connectionAttempts >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    eventSource = new EventSource('/api/admin/realtime')

    eventSource.onopen = () => {
      connected = true
      connectionAttempts = 0
      console.log('📡 Connected to real-time updates')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'connected':
            connected = true
            break
          
          case 'dashboard_update':
            $dashboardStats = data.stats
            recentActivity = data.recentActivity || []
            lastUpdate = new Date(data.timestamp).toLocaleTimeString('id-ID')
            break
          
          case 'activity_update':
            recentActivity = [data.activity, ...recentActivity.slice(0, 9)]
            break
          
          case 'error':
            console.error('SSE Error:', data.message)
            break
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = () => {
      connected = false
      connectionAttempts++
      console.log(`📡 Disconnected from real-time updates (attempt ${connectionAttempts})`)
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (eventSource) {
          eventSource.close()
          connectSSE()
        }
      }, Math.min(1000 * Math.pow(2, connectionAttempts), 30000)) // Exponential backoff, max 30s
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'quiz_completed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      case 'quiz_started':
        return 'M13 10V3L4 14h7v7l9-11h-7z'
      case 'token_created':
        return 'M12 4v16m8-8H4'
      case 'user_registered':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }

  function getActivityColor(type: string) {
    switch (type) {
      case 'quiz_completed':
        return 'success'
      case 'quiz_started':
        return 'warning'
      case 'token_created':
        return 'info'
      case 'user_registered':
        return 'primary'
      default:
        return 'neutral'
    }
  }

  function formatActivityText(activity: any) {
    switch (activity.type) {
      case 'quiz_completed':
        return `${activity.student_name} (${activity.student_class}) menyelesaikan Level ${activity.level} ${activity.is_correct ? 'dengan benar' : 'salah'}`
      case 'quiz_started':
        return `${activity.student_name} (${activity.student_class}) memulai Level ${activity.level}`
      case 'token_created':
        return `Token baru "${activity.token}" dibuat`
      case 'user_registered':
        return `${activity.student_name} bergabung dengan token ${activity.token}`
      default:
        return 'Aktivitas sistem'
    }
  }
</script>

<div class="realtime-dashboard">
  <!-- Connection Status -->
  <div class="realtime-header">
    <div class="header-left">
      <h3 class="realtime-title">Real-time Activity</h3>
      <p class="realtime-description">Aktivitas sistem secara langsung</p>
    </div>
    
    <div class="connection-status">
      <div class="status-indicator" class:connected class:disconnected={!connected}>
        <div class="status-dot"></div>
        <span class="status-text">
          {connected ? 'Terhubung' : 'Terputus'}
        </span>
      </div>
      
      {#if lastUpdate}
        <div class="last-update">
          <svg class="update-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Update: {lastUpdate}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Activity Feed -->
  <div class="activity-feed">
    {#if recentActivity.length > 0}
      <div class="activity-list">
        {#each recentActivity as activity, index}
          <div class="activity-item" style="animation-delay: {index * 100}ms">
            <div class="activity-timeline">
              <div class="timeline-dot {getActivityColor(activity.type)}">
                <svg class="timeline-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getActivityIcon(activity.type)} />
                </svg>
              </div>
              {#if index < recentActivity.length - 1}
                <div class="timeline-line"></div>
              {/if}
            </div>
            
            <div class="activity-content">
              <div class="activity-text">
                {formatActivityText(activity)}
              </div>
              <div class="activity-meta">
                <span class="activity-time">{timeAgo(activity.created_at)}</span>
                {#if activity.level}
                  <span class="activity-level">Level {activity.level}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="empty-text">Belum ada aktivitas terbaru</p>
        <p class="empty-subtext">Aktivitas akan muncul secara real-time di sini</p>
      </div>
    {/if}
  </div>

  <!-- Reconnect Button for failed connections -->
  {#if !connected && connectionAttempts >= maxReconnectAttempts}
    <div class="reconnect-section">
      <button class="reconnect-button" on:click={() => { connectionAttempts = 0; connectSSE(); }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Coba Hubungkan Lagi
      </button>
    </div>
  {/if}
</div>

<style>
  .realtime-dashboard {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
  }

  .realtime-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .header-left {
    flex: 1;
  }

  .realtime-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .realtime-description {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .connection-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .status-indicator.connected {
    background: #d1fae5;
    color: #059669;
  }

  .status-indicator.disconnected {
    background: #fee2e2;
    color: #dc2626;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.connected .status-dot {
    background: #10b981;
    animation: pulse 2s infinite;
  }

  .status-indicator.disconnected .status-dot {
    background: #ef4444;
  }

  .last-update {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.75rem;
  }

  .update-icon {
    width: 14px;
    height: 14px;
  }

  .activity-feed {
    min-height: 200px;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
  }

  .activity-item {
    display: flex;
    gap: 1rem;
    animation: slideIn 0.3s ease-out;
  }

  .activity-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .timeline-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .timeline-dot.success {
    background: #d1fae5;
    color: #10b981;
  }

  .timeline-dot.warning {
    background: #fef3c7;
    color: #f59e0b;
  }

  .timeline-dot.info {
    background: #dbeafe;
    color: #3b82f6;
  }

  .timeline-dot.primary {
    background: #ede9fe;
    color: #8b5cf6;
  }

  .timeline-dot.neutral {
    background: #f1f5f9;
    color: #64748b;
  }

  .timeline-icon {
    width: 16px;
    height: 16px;
  }

  .timeline-line {
    width: 2px;
    height: 40px;
    background: #e2e8f0;
    margin-top: 8px;
  }

  .activity-content {
    flex: 1;
    padding: 0.5rem 0 1.5rem 0;
  }

  .activity-text {
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .activity-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .activity-time {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .activity-level {
    background: #f1f5f9;
    color: #64748b;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.625rem;
    font-weight: 500;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    color: #cbd5e1;
    margin-bottom: 1rem;
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .empty-text {
    color: #64748b;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
  }

  .empty-subtext {
    color: #94a3b8;
    font-size: 0.875rem;
    margin: 0;
  }

  .reconnect-section {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
    border-top: 1px solid #f1f5f9;
    margin-top: 1rem;
  }

  .reconnect-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .reconnect-button:hover {
    background: #2563eb;
  }

  .reconnect-button svg {
    width: 16px;
    height: 16px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .realtime-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .connection-status {
      align-items: flex-start;
    }

    .activity-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }
</style>

