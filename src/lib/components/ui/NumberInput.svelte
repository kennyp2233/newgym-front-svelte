<script lang="ts">
  import Input from './Input.svelte';
  export let allowDecimals = true;
  export let value = '';
  // Use $$restProps to forward additional props
  function handleKeyDown(e: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey && ['c', 'v', 'a'].includes(e.key)) ||
      /\d/.test(e.key) ||
      (allowDecimals && e.key === '.' && e.target && typeof (e.target as HTMLInputElement).value === 'string' && !(e.target as HTMLInputElement).value.includes('.')) ||
      (e.key === '-' && e.target && (e.target as HTMLInputElement).selectionStart === 0)
    ) return;

    e.preventDefault();
  }
</script>

<Input
  type="number"
  on:keydown={(e) => handleKeyDown(e.detail ? e.detail : e)}
  bind:value
  {...{ step: allowDecimals ? '0.01' : '1', ...$$restProps }}
/>
