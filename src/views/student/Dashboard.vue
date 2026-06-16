<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">学生首页</h2>
      <el-button type="primary" @click="goToRepair">
        <el-icon><EditPen /></el-icon>
        我要报修
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card pending">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myOrders.filter(o => ['pending', 'assigned', 'processing'].includes(o.status)).length }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card completed">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myOrders.filter(o => o.status === 'completed').length }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card delayed">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myOrders.filter(o => o.status === 'delayed').length }}</div>
            <div class="stat-label">已延期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card evaluate">
          <div class="stat-icon"><el-icon><Star /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myOrders.filter(o => o.status === 'completed' && !o.evaluation).length }}</div>
            <div class="stat-label">待评价</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-header">
      <h3 class="page-title">我的宿舍信息</h3>
    </div>
    <el-card class="mb-20">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="楼栋">{{ userStore.currentUser?.building }}</el-descriptions-item>
        <el-descriptions-item label="房间号">{{ userStore.currentUser?.room }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ userStore.currentUser?.studentNo }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="page-header">
      <h3 class="page-title">最近的报修</h3>
      <el-button type="primary" text @click="router.push('/student/my-repairs')">查看全部</el-button>
    </div>

    <div v-if="recentOrders.length > 0">
      <WorkOrderCard
        v-for="order in recentOrders"
        :key="order.id"
        :order="order"
      >
        <template #actions>
          <el-button
            v-if="order.status === 'completed' && !order.evaluation"
            type="success"
            size="small"
            @click="goToEvaluate(order.id)"
          >
            去评价
          </el-button>
          <el-button
            v-if="['pending', 'assigned'].includes(order.status)"
            type="danger"
            size="small"
            @click="handleCancel(order)"
          >
            撤单
          </el-button>
          <el-button
            size="small"
            @click="showDetail(order)"
          >
            详情
          </el-button>
        </template>
      </WorkOrderCard>
    </div>
    <el-empty v-else description="暂无报修记录" />

    <el-dialog v-model="detailVisible" title="工单详情" width="600px">
      <template v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :class="workOrderStore.getStatusInfo(currentOrder.status).className">
              {{ workOrderStore.getStatusInfo(currentOrder.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题类型">{{ currentOrder.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :class="workOrderStore.getUrgencyInfo(currentOrder.urgency).className">
              {{ workOrderStore.getUrgencyInfo(currentOrder.urgency).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ currentOrder.building }} {{ currentOrder.room }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="维修师傅">{{ currentOrder.workerName || '待分配' }}</el-descriptions-item>
          <el-descriptions-item label="派单时间">{{ currentOrder.assignedTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.completeTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.delayReason" label="延期原因" :span="2" class="status-delayed">
            {{ currentOrder.delayReason }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.mergedCount > 0" label="合并工单">
            共合并 {{ currentOrder.mergedCount }} 单
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentOrder.requiredSpareParts.length > 0" class="mt-20">
          <h4>所需备件</h4>
          <el-table :data="currentOrder.requiredSpareParts" size="small">
            <el-table-column prop="sparePartName" label="备件名称" />
            <el-table-column prop="quantity" label="数量" />
          </el-table>
        </div>

        <div v-if="currentOrder.evaluation" class="mt-20">
          <h4>我的评价</h4>
          <el-rate v-model="currentOrder.evaluation.score" disabled />
          <p>{{ currentOrder.evaluation.comment }}</p>
          <p class="create-time">{{ currentOrder.evaluation.time }}</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const detailVisible = ref(false)
const currentOrder = ref(null)

const myOrders = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getOrdersByStudent(userStore.currentUser.id)
})

const recentOrders = computed(() => {
  return myOrders.value.slice(0, 5)
})

function goToRepair() {
  router.push('/student/repair')
}

function goToEvaluate(id) {
  router.push(`/student/evaluate/${id}`)
}

function showDetail(order) {
  currentOrder.value = order
  detailVisible.value = true
}

function handleCancel(order) {
  ElMessageBox.confirm(`确定要撤销工单 ${order.id} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const success = workOrderStore.cancelOrder(order.id, userStore.currentUser.id)
    if (success) {
      ElMessage.success('工单已撤销')
    } else {
      ElMessage.error('撤销失败，该工单状态不支持撤销')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  border: none;
  border-radius: 8px;
}

.stat-card.pending {
  background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
}

.stat-card.completed {
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}

.stat-card.delayed {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-card.evaluate {
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.pending .stat-icon {
  color: #e6a23c;
}

.stat-card.completed .stat-icon {
  color: #67c23a;
}

.stat-card.delayed .stat-icon {
  color: #f56c6c;
}

.stat-card.evaluate .stat-icon {
  color: #409eff;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
