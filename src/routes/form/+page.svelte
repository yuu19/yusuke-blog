<script lang="ts">
  import emailjs from '@emailjs/browser';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-svelte';

  const YOUR_SERVICE_ID = import.meta.env.VITE_YOUR_SERVICE_ID;
  const YOUR_TEMPLATE_ID = import.meta.env.VITE_YOUR_TEMPLATE_ID;
  const YOUR_PUBLIC_KEY = import.meta.env.VITE_YOUR_PUBLIC_KEY;

  let isLoading = $state(false);
  let success = $state(false);
  let error = $state('');
  let formData = $state({
    user_name: '',
    message: ''
  });

  const resetForm = () => {
    formData.user_name = '';
    formData.message = '';
    success = false;
    error = '';
  };

  const sendEmail = async (event: Event) => {
    event.preventDefault();
    
    if (!YOUR_SERVICE_ID || !YOUR_TEMPLATE_ID || !YOUR_PUBLIC_KEY) {
      error = '環境変数が設定されていません。';
      return;
    }

    isLoading = true;
    error = '';
    success = false;

    try {
      await emailjs.sendForm(
        YOUR_SERVICE_ID, 
        YOUR_TEMPLATE_ID, 
        event.target as HTMLFormElement, 
        {
          publicKey: YOUR_PUBLIC_KEY
        }
      );
      
      console.log('SUCCESS!');
      success = true;
      
      // 2秒後にホームページにリダイレクト
      setTimeout(() => {
        goto('/');
      }, 2000);
      
    } catch (err: any) {
      console.log('FAILED...', err);
      error = 'メッセージの送信に失敗しました。もう一度お試しください。';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl font-bold">お問い合わせ</CardTitle>
      <CardDescription>
        ご質問やご意見がございましたら、お気軽にお送りください。
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      {#if success}
        <Alert class="mb-6 border-green-200 bg-green-50">
          <CheckCircle class="h-4 w-4 text-green-600" />
          <AlertDescription class="text-green-800">
            メッセージが正常に送信されました！まもなくホームページにリダイレクトします。
          </AlertDescription>
        </Alert>
      {/if}

      {#if error}
        <Alert class="mb-6 border-red-200 bg-red-50">
          <AlertCircle class="h-4 w-4 text-red-600" />
          <AlertDescription class="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      {/if}

      <form onsubmit={sendEmail} class="space-y-6">
        <div class="space-y-2">
          <Label for="user_name">ユーザーネーム</Label>
          <Input
            id="user_name"
            name="user_name"
            type="text"
            placeholder="お名前を入力してください"
            bind:value={formData.user_name}
            required
            disabled={isLoading || success}
            class="transition-all duration-200"
          />
        </div>

        <div class="space-y-2">
          <Label for="message">メッセージ</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="メッセージを入力してください"
            bind:value={formData.message}
            required
            disabled={isLoading || success}
            rows={5}
            class="transition-all duration-200 resize-none"
          />
        </div>

        <div class="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || success || !formData.user_name.trim() || !formData.message.trim()}
            class="flex-1"
          >
            {#if isLoading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              送信中...
            {:else if success}
              <CheckCircle class="mr-2 h-4 w-4" />
              送信完了
            {:else}
              <Send class="mr-2 h-4 w-4" />
              送信
            {/if}
          </Button>

          {#if success}
            <Button
              type="button"
              variant="outline"
              onclick={resetForm}
            >
              新規作成
            </Button>
          {/if}
        </div>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-muted-foreground">
          通常24時間以内にご返信いたします。
        </p>
      </div>
    </CardContent>
  </Card>
</div>
