<template>
  <div class="notification-list">
    <div class="notification-header">
      <span>消息通知</span>
      <el-button type="primary" link size="small" @click="markAllRead" v-if="unreadCount > 0">
        全部已读
      </el-button>
    </div>
    <el-divider style="margin: 10px 0;" />
    <div class="notification-content" v-if="notifications.length > 0">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="notification-item"
        :class="{ unread: !item.read }"
        @click="handleRead(item)"
      >
        <div class="notification-icon">
          <el-icon :size="18" :class="getIconClass(item.type)">
            <component :is="getIcon(item.type)" />
          </el-icon>
        </div>
        <div class="notification-info">
          <div class="notification-title">{{ item.title }}</div>
          <div class="notification-content-text">{{ item.content }}</div>
          <div class="notification-time">{{ item.time }}</div>
        </div>
        <div class="notification-dot" v-if="!item.read"></div>
      </div>
    </div>
    <el-empty description="暂无消息" v-else :image-size="80" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'

const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const notifications = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getNotificationsByUserId(userStore.currentUser.id).slice(0, 10)
})

const unreadCount = computed(() => {
  if (!userStore.currentUser) return 0
  return workOrderStore.getUnreadNotificationCount(userStore.currentUser.id)
})

function getIcon(type) {
  const iconMap = {
    merge: 'Share',
    assign: 'User',
    complete: 'CircleCheck',
    delay: 'Clock',
    spareParts: 'Box',
    process: 'Setting',
    transfer: 'Switch',
    cancel: 'Close',
    evaluate: 'Star'
  }
  return iconMap[type] || 'Bell'
}

function getIconClass(type) {
  const classMap = {
    merge: 'icon-merge',
    assign: 'icon-assign',
    complete: 'icon-complete',
    delay: 'icon-delay',
    spareParts: 'icon-spare'
  }
  return classMap[type] || ''
}

function handleRead(item) {
  workOrderStore.markNotificationAsRead(item.id)
}

function markAllRead() {
  if (userStore.currentUser) {
    workOrderStore.markAllNotificationsAsRead(userStore.currentUser.id)
  }
}
</script>

<style scoped>
.notification-list {
  min-width: 320px;
  max-height: 400px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  font-weight: 600;
  color: #303133;
}

.notification-content {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #ecf5ff;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  flex-shrink: 0;
}

.icon-merge {
  color: #409eff;
}

.icon-assign {
  color: #e6a23c;
}

.icon-complete {
  color: #67c23a;
}

.icon-delay {
  color: #f56c6c;
}

.icon-spare {
  color: #909399;
}

.notification-info {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-content-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 11px;
  color: #909399;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  position: absolute;
  top: 16px;
  right: 10px;
}
</style>
