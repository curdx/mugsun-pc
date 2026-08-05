<!-- 隐私政策（注册协议链接落点，静态页） -->
<template>
  <div class="privacy-policy-page">
    <div class="policy-card">
      <h1 class="title">隐私政策</h1>
      <p class="updated">最近更新：2026 年</p>

      <h2>一、我们收集的信息</h2>
      <p>
        为提供平台服务，我们仅收集实现功能所必需的信息：账号信息（用户名、昵称、手机号、邮箱）、
        登录日志（登录时间、IP 地址、设备与浏览器信息）以及您在使用各功能模块时主动录入的业务数据。
      </p>

      <h2>二、信息的使用</h2>
      <p
        >收集的信息仅用于：身份鉴别与账号安全、权限控制、操作审计、产品功能的正常运转。我们不会将您的信息用于上述目的之外的用途。</p
      >

      <h2>三、信息的存储与保护</h2>
      <p>
        密码经 BCrypt
        不可逆加密存储；敏感字段（手机号、身份证等）支持国密算法加密存储与按权限脱敏展示；
        传输过程支持国密 SM2/SM4 加密。平台内置访问控制、数据权限与租户隔离机制，防止越权访问。
      </p>

      <h2>四、信息的共享</h2>
      <p>除非获得您的明确授权或法律法规另有规定，我们不会向任何第三方共享、出售您的个人信息。</p>

      <h2>五、您的权利</h2>
      <p
        >您可以在个人中心查看和更正您的账号信息、修改密码；如需注销账号或删除数据，请联系系统管理员处理。</p
      >

      <h2>六、政策变更</h2>
      <p>本政策如有更新，将通过平台公告方式告知，变更后继续使用即视为接受更新后的政策。</p>

      <div class="back">
        <RouterLink to="/auth/register">返回注册</RouterLink>
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
