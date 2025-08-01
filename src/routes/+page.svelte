
<script lang="ts">

  import { gameState } from '$lib/stores/quiz.js'
  import WelcomeScreen from '$lib/components/WelcomeScreen.svelte'
  import DataEntry from '$lib/components/DataEntry.svelte'
  import TokenInput from '$lib/components/TokenInput.svelte'
  import QuizInterface from '$lib/components/QuizInterface.svelte'
  import ThankYouScreen from '$lib/components/ThankYouScreen.svelte'
  import type { GameState } from '$lib/types/index.js'

  let currentState: GameState = 'welcome'
  
  gameState.subscribe((value: GameState) => {
    currentState = value
  })
</script>


<svelte:head>
  <title>VanHiele.RU</title>
  <meta name="description" content="Sistem Quiz Ujian Masuk Perguruan Tinggi" />
</svelte:head>

<main class="min-h-screen">
  {#if currentState === 'welcome'}
    <WelcomeScreen />
  {:else if currentState === 'dataEntry'}
    <DataEntry />
  {:else if currentState === 'tokenInput'}
    <TokenInput />
  {:else if currentState === 'quiz'}
    <QuizInterface />
  {:else if currentState === 'thankYou'}
    <ThankYouScreen />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>