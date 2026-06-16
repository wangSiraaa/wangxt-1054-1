<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的报修</h2>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="全部状态" style="width: 150px; margin-right: 10px;" clearable>
          <el-option
            v-for="status in workOrderStore.statusList"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
        <el-button type="primary" @click="router.push('/student/repair')">
          <el-icon><Plus /></el-icon>
          新建报修
        </el-button>
      </div>
    </div>

    <div class="mb-20">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="processing">处理中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="delayed">已延期</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="filteredOrders.length > 0">
      <WorkOrderCard
        v-for="order in filteredOrders"
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
            type="primary"
            @click="showDetail(order)"
          >
            查看详情
          </el-button>
        </template>
      </WorkOrderCard>
    </div>
    <el-empty v-else description="暂无报修记录" />

    <el-dialog v-model="detailVisible" title="工单详情" width="650px">
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
          <el-descriptions-item label="开始处理">{{ currentOrder.startProcessTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.completeTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.delayReason" label="延期原因" :span="2" class="status-delayed">
            {{ currentOrder.delayReason }}
            <br />预计完成：{{ currentOrder.delayEndTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.mergedCount > 0" label="合并信息">
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

        <div v-if="currentOrder.transferHistory.length > 0" class="mt-20">
          <h4>转派记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(item, idx) in currentOrder.transferHistory"
              :key="idx"
              :timestamp="item.time"
            >
              <p>由 <b>{{ getWorkerName(item.fromWorkerId) }}</b> 转派给 <b>{{ item.toWorkerName }}</b></p>
              <p>原因：{{ item.reason }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="currentOrder.evaluation" class="mt-20">
          <h4>我的评价</h4>
          <el-rate v-model="currentOrder.evaluation.score" disabled />
          <p>{{ currentOrder.evaluation.comment }}</p>
          <p class="create-time">{{ currentOrder.evaluation.time }}</p>
        </div>

        <div v-if="currentOrder.completionNote" class="mt-20">
          <h4>完工说明</h4>
          <p>{{ currentOrder.completionNote }}</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const activeTab = ref('all')
const statusFilter = ref('')
const detailVisible = ref(false)
const currentOrder = ref(null)

const myOrders = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getOrdersByStudent(userStore.currentUser.id)
})

const filteredOrders = computed(() => {
  let orders = myOrders.value
  if (activeTab.value === 'pending') {
    orders = orders.filter(o => o.status === 'pending')
  } else if (activeTab.value === 'processing') {
    orders = orders.filter(o => ['assigned', 'processing'].includes(o.status))
  } else if (activeTab.value === 'completed') {
    orders = orders.filter(o => o.status === 'completed')
  } else if (activeTab.value === 'delayed') {
    orders = orders.filter(o => o.status === 'delayed')
  }
  if (statusFilter.value) {
    orders = orders.filter(o => o.status === statusFilter.value)
  }
  return orders
})

function getWorkerName(workerId) {
  const worker = userStore.users.find(u => u.id === workerId)
  return worker?.name || '未知'
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
      workOrderStore.saveToStorage()
      ElMessage.success('工单已撤销')
    } else {
      ElMessage.error('撤销失败，该工单状态不支持撤销')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.create-time {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>
