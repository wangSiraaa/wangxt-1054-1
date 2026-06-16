<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#409eff"><HomeFilled /></el-icon>
        <h1>校园宿舍快修系统</h1>
        <p>Campus Dorm Repair System</p>
      </div>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">
          登 录
        </el-button>
      </el-form>
      <div class="demo-accounts">
        <p>演示账号（密码均为 123456）：</p>
        <div class="account-list">
          <span class="account-tag" @click="fillAccount('student1')">学生：student1</span>
          <span class="account-tag" @click="fillAccount('dispatcher')">调度主管：dispatcher</span>
          <span class="account-tag" @click="fillAccount('worker1')">维修师傅：worker1</span>
          <span class="account-tag" @click="fillAccount('dormmanager1')">宿管：dormmanager1</span>
          <span class="account-tag" @click="fillAccount('spareparts')">备件管理员：spareparts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const loading = ref(false)
const loginFormRef = ref()

function fillAccount(username) {
  loginForm.username = username
  loginForm.password = '123456'
}

async function handleLogin() {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        const success = userStore.login(loginForm.username, loginForm.password)
        if (success) {
          ElMessage.success('登录成功')
          router.push(`/${userStore.currentRole}/dashboard`)
        } else {
          ElMessage.error('用户名或密码错误')
        }
        loading.value = false
      }, 500)
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 15px 0 8px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.demo-accounts {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.demo-accounts p {
  color: #606266;
  font-size: 13px;
  margin-bottom: 10px;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.account-tag:hover {
  background: #409eff;
  color: #fff;
}
</style>
