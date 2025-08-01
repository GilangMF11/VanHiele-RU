<!-- lib/components/admin/DebugResults.svelte -->
<script lang="ts">
    import { onMount } from 'svelte'
    
    let debugData = {
      apiResponse: null,
      error: null,
      loading: false,
      networkError: null
    }
    
    async function testResultsAPI() {
      debugData.loading = true
      debugData.error = null
      debugData.networkError = null
      
      try {
        console.log('🧪 Testing results API...')
        
        const response = await fetch('/api/admin/results', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Important for cookies
        })
        
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          //debugData.networkError = `HTTP ${response.status}: ${errorText}`
          console.error('❌ API Error:', debugData.networkError)
          return
        }
        
        const data = await response.json()
        debugData.apiResponse = data
        console.log('✅ API Response:', data)
        
      } catch (error) {
        //debugData.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('💥 Fetch error:', error)
      } finally {
        debugData.loading = false
      }
    }
    
    async function testDatabaseDirect() {
      try {
        const response = await fetch('/api/admin/debug-db', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('🗄️ Database debug:', data)
        }
      } catch (error) {
        console.error('Database debug error:', error)
      }
    }
    
    onMount(() => {
      testResultsAPI()
      testDatabaseDirect()
    })
  </script>
  
  <div class="debug-container">
    <h2>🧪 Debug Results API</h2>
    
    <div class="debug-section">
      <h3>API Test Results</h3>
      <button on:click={testResultsAPI} disabled={debugData.loading}>
        {debugData.loading ? 'Testing...' : 'Test API Again'}
      </button>
      
      {#if debugData.loading}
        <div class="loading">Loading...</div>
      {/if}
      
      {#if debugData.networkError}
        <div class="error">
          <h4>Network Error:</h4>
          <pre>{debugData.networkError}</pre>
        </div>
      {/if}
      
      {#if debugData.error}
        <div class="error">
          <h4>JavaScript Error:</h4>
          <pre>{debugData.error}</pre>
        </div>
      {/if}
      
      {#if debugData.apiResponse}
        <div class="success">
          <h4>API Response:</h4>
          <pre>{JSON.stringify(debugData.apiResponse, null, 2)}</pre>
        </div>
      {/if}
    </div>
    
    <div class="debug-section">
      <h3>Local Storage Check</h3>
      <div class="info">
        <p><strong>Admin Session Cookie:</strong> {document?.cookie?.includes('admin_session') ? '✅ Present' : '❌ Missing'}</p>
      </div>
    </div>
    
    <div class="debug-section">
      <h3>Console Logs</h3>
      <p>Check the browser console (F12) for detailed logs</p>
    </div>
  </div>
  
  <style>
    .debug-container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
      font-family: monospace;
    }
    
    .debug-section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    .loading {
      color: #0066cc;
      font-weight: bold;
    }
    
    .error {
      color: #cc0000;
      background: #ffeeee;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .success {
      color: #006600;
      background: #eeffee;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .info {
      background: #eef;
      padding: 1rem;
      border-radius: 4px;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
      font-size: 0.85rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    h2, h3, h4 {
      margin-top: 0;
    }
  </style>