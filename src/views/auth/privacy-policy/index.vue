<!-- 隐私政策（注册协议链接落点，静态页） -->
<template>
  <div class="privacy-policy-page">
    <div class="policy-card">
      <h1 class="title">{{ $t('pages.auth.privacyPolicy.title') }}</h1>
      <p class="updated">{{ $t('pages.auth.privacyPolicy.updated') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.collectTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.collectContent') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.useTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.useContent') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.storageTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.storageContent') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.shareTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.shareContent') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.rightsTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.rightsContent') }}</p>

      <h2>{{ $t('pages.auth.privacyPolicy.changeTitle') }}</h2>
      <p>{{ $t('pages.auth.privacyPolicy.changeContent') }}</p>

      <div class="back">
        <RouterLink to="/auth/register">{{
          $t('pages.auth.privacyPolicy.backToRegister')
        }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'PrivacyPolicy' })
</script>

<style scoped lang="scss">
  .privacy-policy-page {
    min-height: 100vh;
    padding: 48px 16px;
    background: var(--art-bg-color);

    .policy-card {
      max-width: 760px;
      padding: 40px 48px;
      margin: 0 auto;
      background: var(--art-main-bg-color);
      border-radius: 8px;

      .title {
        margin: 0 0 8px;
        font-size: 24px;
      }

      .updated {
        margin: 0 0 24px;
        font-size: 13px;
        color: var(--art-gray-500);
      }

      h2 {
        margin: 24px 0 8px;
        font-size: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.9;
        color: var(--art-gray-700);
      }

      .back {
        margin-top: 32px;
        font-size: 14px;

        a {
          color: var(--theme-color);
          text-decoration: none;
        }
      }
    }
  }
</style>
