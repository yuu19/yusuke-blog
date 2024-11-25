<script lang="ts">
  import emailjs from '@emailjs/browser';
  import { goto } from '$app/navigation';
  const YOUR_SERVICE_ID = import.meta.env.VITE_YOUR_SERVICE_ID;
  const YOUR_TEMPLATE_ID = import.meta.env.VITE_YOUR_TEMPLATE_ID;
  const YOUR_PUBLIC_KEY = import.meta.env.VITE_YOUR_PUBLIC_KEY;
  const sendEmail = (e: any) => {
    emailjs
      .sendForm(YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, e.target, {
        publicKey: YOUR_PUBLIC_KEY,
      })
      .then(
        () => {
          console.log('SUCCESS!');
          goto('/');
          
        },
        (error: any) => {
          console.log('FAILED...', error.text);
        },
      );
  };
</script>

<div class="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
  <h2 class="text-2xl font-bold mb-4">お問い合わせ</h2>
  <form on:submit|preventDefault={sendEmail} class="space-y-4">
    <div>
      <label class="block text-gray-700">ユーザーネーム</label>
      <input
        type="text"
        name="user_name"
        required
        class="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
    </div>
    <div>
      <label class="block text-gray-700">メッセージ</label>
      <textarea
        name="message"
        required
        rows="5"
        class="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
    <button
      type="submit"
      class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
    >
      送信
    </button>
  </form>
</div>