<script>
  import { Github, ExternalLink } from 'lucide-svelte';
</script>

<svelte:head>
  <title>My Profile</title>
  <meta name="description" content="This is my profile." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <!-- Header Section -->
    <header class="mb-16 text-center">
      <div class="mb-8">
        <div class="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
          YK
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Yusuke Kushida</h1>
        <div class="max-w-2xl mx-auto">
          <p class="text-xl text-gray-600 leading-relaxed">
            秋田でプログラマーをしています。大学では数理ファイナンスを専攻していました。最近は型理論に興味があります。
          </p>
        </div>
      </div>
    </header>

    <main class="space-y-16">
      <!-- History Section -->
      <section>
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">History</h2>
        <div class="bg-white rounded-2xl shadow-lg p-8">
          <div class="space-y-6">
            <div class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex-shrink-0 w-20 text-right">
                <span class="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">2018年</span>
              </div>
              <div class="flex-grow">
                <p class="text-gray-800 font-medium">茨城県立竹園高校卒業</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex-shrink-0 w-20 text-right">
                <span class="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">2022年</span>
              </div>
              <div class="flex-grow">
                <p class="text-gray-800 font-medium">東北大学経済学部卒業</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex-shrink-0 w-20 text-right">
                <span class="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">2024年</span>
              </div>
              <div class="flex-grow">
                <p class="text-gray-800 font-medium">東北大学経済学研究科卒業</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex-shrink-0 w-20 text-right">
                <span class="inline-block bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">2024年4月</span>
              </div>
              <div class="flex-grow">
                <p class="text-gray-800 font-medium">プログラマーとして就職</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SNS Section -->
      <section>
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">SNS & Links</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <a 
            href="https://zenn.dev/yuu24" 
            target="_blank" 
            rel="noopener noreferrer"
            class="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  Z
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Zenn</h3>
                  <p class="text-gray-600 text-sm">技術記事を投稿</p>
                </div>
              </div>
              <ExternalLink class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <p class="text-blue-600 font-medium break-all">zenn.dev/yuu24</p>
          </a>

          <a 
            href="https://github.com/yuu19" 
            target="_blank" 
            rel="noopener noreferrer"
            class="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Github class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">GitHub</h3>
                  <p class="text-gray-600 text-sm">コードを公開</p>
                </div>
              </div>
              <ExternalLink class="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
            </div>
            <p class="text-gray-700 font-medium break-all">github.com/yuu19</p>
          </a>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="mt-16 text-center">
      <div class="border-t border-gray-200 pt-8">
        <p class="text-gray-500">© 2024 Yusuke Kushida. All rights reserved.</p>
      </div>
    </footer>
  </div>
</div>
