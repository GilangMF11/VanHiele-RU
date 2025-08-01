<script lang="ts">
  import { notifications } from '$lib/stores/admin'
  import { fly, fade } from 'svelte/transition'

  function removeNotification(id: string) {
    notifications.update(items => items.filter(item => item.id !== id))
  }

  function getIcon(type: string) {
    switch (type) {
      case 'success':
        return 'M5 13l4 4L19 7'
      case 'error':
        return 'M6 18L18 6M6 6l12 12'
      case 'warning':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }

  function getColorClasses(type: string) {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  function getIconColorClass(type: string) {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }
</script>

<div class="notification-container">
  {#each $notifications as notification (notification.id)}
    <div
      class="notification {getColorClasses(notification.type)}"
      in:fly="{{ x: 300, duration: 300 }}"
      out:fade="{{ duration: 200 }}"
    >
      <div class="notification-content">
        <div class="notification-icon {getIconColorClass(notification.type)}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(notification.type)} />
          </svg>
        </div>
        
        <div class="notification-message">
          <p>{notification.message}</p>
        </div>
        
        <!-- <button
          class="notification-close"
          on:click={() => removeNotification(notification.id)}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button> -->
      </div>
    </div>
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
  }

  .notification {
    border: 1px solid;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .notification-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .notification-message {
    flex: 1;
  }

  .notification-message p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.25;
  }

  .notification-close {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.125rem;
    border-radius: 0.25rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .notification-close:hover {
    opacity: 1;
  }

  @media (max-width: 480px) {
    .notification-container {
      top: 0.5rem;
      right: 0.5rem;
      left: 0.5rem;
      max-width: none;
    }
  }
</style>