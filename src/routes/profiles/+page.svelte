<svelte:head>
  <title>My Profile</title>
  <meta name="description" content="This is my profile." />
</svelte:head>

<div class="mb-12">
  <h1 class="text-3xl font-bold mb-2">Yusuke Kushida</h1>
  <p class="text-lg"></p>
  <p class="text-lg">秋田でプログラマーをしています。大学では数理ファイナンスを専攻していました。最近は型理論に興味があります。</p>
</div>


<main class="flex-grow">
  <section class="mb-6">
    <h2 class="text-2xl font-bold mb-2">History</h2>
    <ul>
      <li><span class="font-bold">2018年:</span> 茨城県立竹園高校卒業</li>
      <li><span class="font-bold">2022年:</span> 東北大学経済学部卒業</li>
      <li><span class="font-bold">2024年:</span> 東北大学経済学研究科卒業</li>
      <li><span class="font-bold">2024年 4月:</span>  </li>
    
    </ul>
  </section>

  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-2">SNS</h2>
    <div class="overflow-x-auto">
      <table>
        <tbody>
          <tr>
            <td class="border px-4 py-2">Zenn</td>
            <td class="border px-4 py-2"
              ><a
                class="text-blue-600 hover:text-blue-500"
                href="https://zenn.dev/yuu24"
                target="_blank">https://zenn.dev/yuu24</a
              ></td
            >
          </tr>
          <tr>
            <td class="border px-4 py-2">GitHub</td>
            <td class="border px-4 py-2"
              ><a
                class="text-blue-600 hover:text-blue-500"
                href="https://github.com/yuu19"
                target="_blank">https://github.com/yuu19</a
              ></td
            >
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</main>