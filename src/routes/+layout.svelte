<script>
  import "../app.css";
</script>

<svelte:head>
  <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4LE8SDBWB5"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-4LE8SDBWB5');
</script>
</svelte:head>

<div class="flex flex-col min-h-screen">
  <header class="flex items-center justify-between px-6 py-3 bg-black">
    <h1 class="text-white font-bold text-xl">
      <a href="/" class="text-xl font-bold text-white">
      Tech Blog
      </a>
    </h1>
    <nav class="flex gap-4">
      <a href="/" class="text-white hover:text-gray-400">home</a>
      <a href="/profiles" class="text-white hover:text-gray-400">Profile</a>
      <a href="/articles" class="text-white hover:text-gray-400">Articles</a>
      <a href="/form" class="text-white hover:text-gray-400">Form</a>
    </nav>
  </header>

  <div class="flex-grow px-4 py-6">
    <slot />
  </div>
  
  <footer class="bg-black py-2 text-center text-white">
    <p>My Awesome Website!</p>
  </footer>
</div>