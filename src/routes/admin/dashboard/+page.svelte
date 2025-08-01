<!-- routes/admin/login/+page.svelte -->
<script lang="ts">
  import AdminDashboard from '$lib/components/admin/AdminDashboard.svelte'
  
  // Optional: Add any route-specific logic here
  // For example: analytics, SEO, route guards, etc.
  
  // Optional: Route-specific data handling
  // import type { PageData } from './$types'
  // export let data: PageData
</script>

<!-- SEO and Meta Tags -->
<svelte:head>
  <title>Admin Login - Quiz Management System</title>
  <meta name="description" content="Login ke panel admin sistem quiz" />
  <meta name="robots" content="noindex, nofollow" />
  
</svelte:head>

<!-- Render the main login component -->
<AdminDashboard />

<!-- Optional: Add route-specific styles if needed -->
<style>
  /* Route-specific styles can go here if needed */
  /* Usually the component handles all styling */
</style>