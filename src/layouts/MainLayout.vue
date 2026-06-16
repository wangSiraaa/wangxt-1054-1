<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#fff"><Tools /></el-icon>
        <span>宿舍快修</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <template v-if="currentRole === 'student'">
          <el-menu-item index="/student/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页概览</span>
          </el-menu-item>
          <el-menu-item index="/student/repair">
            <el-icon><EditPen /></el-icon>
            <span>我要报修</span>
          </el-menu-item>
          <el-menu-item index="/student/my-repairs">
            <el-icon><List /></el-icon>
            <span>我的报修</span>
          </el-menu-item>
        </template>
        <template v-if="currentRole === 'dispatcher'">
          <el-menu-item index="/dispatcher/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>调度首页</span>
          </el-menu-item>
          <el-menu-item index="/dispatcher/pool">
            <el-icon><Tickets /></el-icon>
            <span>工单池</span>
          </el-menu-item>
        </template>
        <template v-if="currentRole === 'worker'">
          <el-menu-item index="/worker/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>师傅看板</span>
          </el-menu-item>
          <el-menu-item index="/worker/available">
            <el-icon><TakeawayBox /></el-icon>
            <span>可接工单</span>
          </el-menu-item>
          <el-menu-item index="/worker/my-orders">
            <el-icon><List /></el-icon>
            <span>我的工单</span>
          </el-menu-item>
        </template>
        <template v-if="currentRole === 'dormManager'">
          <el-menu-item index="/dorm-manager/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>宿管首页</span>
          </el-menu-item>
          <el-menu-item index="/dorm-manager/building-progress">
            <el-icon><Histogram /></el-icon>
            <span>楼栋进度</span>
          </el-menu-item>
        </template>
        <template v-if="currentRole === 'sparePartsManager'">
          <el-menu-item index="/spare-parts/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>备件首页</span>
          </el-menu-item>
          <el-menu-item index="/spare-parts/inventory">
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </el-menu-item>
          <el-menu-item index="/spare-parts/delayed-orders">
            <el-icon><Clock /></el-icon>
            <span>延期工单</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="welcome">
            欢迎，{{ userStore.currentUser?.name }}
            <el-tag :type="roleTagType" size="small" class="role-tag">{{ roleName }}</el-tag>
          </span>
        </div>
        <div class="header-right">
          <el-popover
            placement="bottom-end"
            width="360"
            trigger="click"
            :show-arrow="false"
            popper-class="notification-popover"
          >
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
                <el-button type="primary" text>
                  <el-icon :size="18"><Bell /></el-icon>
                </el-button>
              </el-badge>
            </template>
            <NotificationList />
          </el-popover>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.currentUser?.name }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'
import NotificationList from '@/components/NotificationList.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

onMounted(() => {
  userStore.initFromStorage()
  workOrderStore.initFromStorage()
  sparePartsStore.initFromStorage()
})

const activeMenu = computed(() => route.path)

const currentRole = computed(() => userStore.currentRole)

const roleName = computed(() => {
  const roleMap = {
    student: '学生',
    dispatcher: '调度主管',
    worker: '维修师傅',
    dormManager: '宿管',
    sparePartsManager: '备件管理员'
  }
  return roleMap[userStore.currentRole] || ''
})

const roleTagType = computed(() => {
  const typeMap = {
    student: 'success',
    dispatcher: 'primary',
    worker: 'warning',
    dormManager: 'info',
    sparePartsManager: 'danger'
  }
  return typeMap[userStore.currentRole] || ''
})

const unreadCount = computed(() => {
  if (!userStore.currentUser) return 0
  return workOrderStore.getUnreadNotificationCount(userStore.currentUser.id)
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      workOrderStore.saveToStorage()
      sparePartsStore.saveToStorage()
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #1f2d3d;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #2b3a4a;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left .welcome {
  font-size: 16px;
  color: #303133;
}

.role-tag {
  margin-left: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409eff;
}

.username {
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
}
</style>
