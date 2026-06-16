<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">工单池</h2>
      <div class="filter-bar">
        <el-select v-model="buildingFilter" placeholder="全部楼栋" style="width: 130px; margin-right: 10px;" clearable>
          <el-option label="1号楼" value="1号楼" />
          <el-option label="2号楼" value="2号楼" />
          <el-option label="3号楼" value="3号楼" />
        </el-select>
        <el-select v-model="urgencyFilter" placeholder="全部紧急程度" style="width: 130px; margin-right: 10px;" clearable>
          <el-option
            v-for="level in workOrderStore.urgencyLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
          />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部问题类型" style="width: 150px; margin-right: 10px;" clearable>
          <el-option
            v-for="type in workOrderStore.problemTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          />
        </el-select>
        <el-button type="primary" @click="showMergePanel = !showMergePanel">
          <el-icon><Share /></el-icon>
          合并检查
        </el-button>
      </div>
    </div>

    <el-alert
      title="紧急工单（漏水、断电）已自动置顶，请优先处理"
      type="warning"
      show-icon
      :closable="false"
      class="mb-20"
    />

    <el-tabs v-model="activeTab" size="large" class="mb-20">
      <el-tab-pane label="待派单" name="pending">
        <span class="tab-badge">{{ pendingOrders.length }}</span>
      </el-tab-pane>
      <el-tab-pane label="处理中" name="processing">
        <span class="tab-badge">{{ processingOrders.length }}</span>
      </el-tab-pane>
      <el-tab-pane label="已延期" name="delayed">
        <span class="tab-badge">{{ delayedOrders.length }}</span>
      </el-tab-pane>
      <el-tab-pane label="已完成" name="completed">
        <span class="tab-badge">{{ completedOrders.length }}</span>
      </el-tab-pane>
    </el-tabs>

    <div v-if="showMergePanel" class="mb-20">
      <el-card class="merge-panel">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><Warning /></el-icon>
              可合并工单检查
            </span>
            <el-button type="danger" text @click="showMergePanel = false">关闭</el-button>
          </div>
        </template>
        <div v-if="mergeGroups.length > 0">
          <div v-for="(group, idx) in mergeGroups" :key="idx" class="merge-group">
            <div class="merge-group-header">
              <span class="merge-group-title">
                {{ group.building }} {{ group.room }} - {{ group.problemTypeName }}
              </span>
              <el-tag type="info">{{ group.orders.length }} 单可合并</el-tag>
            </div>
            <div class="merge-group-orders">
              <el-checkbox
                v-for="order in group.orders"
                :key="order.id"
                :label="order.id"
                v-model="selectedMergeOrders"
              >
                {{ order.id }} - {{ order.studentName }} ({{ order.createTime }})
              </el-checkbox>
            </div>
            <div class="merge-group-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="getSelectedInGroup(group).length < 2"
                @click="mergeOrders(group)"
              >
                合并选中工单
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无可合并的工单" :image-size="60" />
      </el-card>
    </div>

    <div v-if="filteredOrders.length > 0">
      <WorkOrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
      >
        <template #actions>
          <el-button
            v-if="order.status === 'pending'"
            type="primary"
            size="small"
            @click="goToAssign(order.id)"
          >
            派单
          </el-button>
          <el-button
            v-if="order.status === 'delayed'"
            type="warning"
            size="small"
            @click="handleDelay(order)"
          >
            处理延期
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
    <el-empty v-else description="暂无工单" />

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
          <el-descriptions-item label="报修人">{{ currentOrder.studentName }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
          <el-descriptions-item label="维修师傅">{{ currentOrder.workerName || '待分配' }}</el-descriptions-item>
          <el-descriptions-item label="派单时间">{{ currentOrder.assignedTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.mergedCount > 0" label="合并信息">
            合并 {{ currentOrder.mergedCount }} 单
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
          <h4>学生评价</h4>
          <el-rate v-model="currentOrder.evaluation.score" disabled />
          <p>{{ currentOrder.evaluation.comment }}</p>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentOrder?.status === 'pending'" type="primary" @click="goToAssign(currentOrder.id)">
          立即派单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="delayVisible" title="处理延期工单" width="500px">
      <template v-if="currentOrder">
        <el-form :model="delayForm" label-width="100px">
          <el-form-item label="工单号">{{ currentOrder.id }}</el-form-item>
          <el-form-item label="延期原因">{{ currentOrder.delayReason }}</el-form-item>
          <el-form-item label="预计完成">
            <el-date-picker
              v-model="delayForm.newEndTime"
              type="datetime"
              placeholder="选择新的预计完成时间"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="处理方案">
            <el-radio-group v-model="delayForm.action">
              <el-radio value="reassign">重新派单</el-radio>
              <el-radio value="extend">延长时间</el-radio>
              <el-radio value="resolve">备件已到位，继续处理</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="delayForm.remark" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="delayVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDelayHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useUserStore } from '@/stores/user'
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const router = useRouter()
const workOrderStore = useWorkOrderStore()
const userStore = useUserStore()

const activeTab = ref('pending')
const buildingFilter = ref('')
const urgencyFilter = ref('')
const typeFilter = ref('')
const showMergePanel = ref(false)
const detailVisible = ref(false)
const delayVisible = ref(false)
const currentOrder = ref(null)
const selectedMergeOrders = ref([])

const delayForm = reactive({
  action: 'extend',
  newEndTime: '',
  remark: ''
})

const pendingOrders = computed(() => workOrderStore.pendingOrders)
const processingOrders = computed(() => workOrderStore.processingOrders)
const delayedOrders = computed(() => workOrderStore.delayedOrders)
const completedOrders = computed(() => workOrderStore.completedOrders)

const allOrders = computed(() => {
  let orders = []
  if (activeTab.value === 'pending') {
    orders = workOrderStore.getSortedPendingOrders()
  } else if (activeTab.value === 'processing') {
    orders = processingOrders.value
  } else if (activeTab.value === 'delayed') {
    orders = delayedOrders.value
  } else {
    orders = completedOrders.value
  }
  return orders
})

const filteredOrders = computed(() => {
  let orders = allOrders.value
  if (buildingFilter.value) {
    orders = orders.filter(o => o.building === buildingFilter.value)
  }
  if (urgencyFilter.value) {
    orders = orders.filter(o => o.urgency === urgencyFilter.value)
  }
  if (typeFilter.value) {
    orders = orders.filter(o => o.problemTypeId === typeFilter.value)
  }
  return orders
})

const mergeGroups = computed(() => {
  const groups = {}
  workOrderStore.pendingOrders.forEach(order => {
    const key = `${order.building}-${order.room}-${order.problemTypeId}`
    if (!groups[key]) {
      groups[key] = {
        building: order.building,
        room: order.room,
        problemTypeId: order.problemTypeId,
        problemTypeName: order.problemTypeName,
        orders: []
      }
    }
    groups[key].orders.push(order)
  })
  return Object.values(groups).filter(g => g.orders.length >= 2)
})

function getSelectedInGroup(group) {
  return selectedMergeOrders.value.filter(id =>
    group.orders.some(o => o.id === id)
  )
}

function goToAssign(id) {
  router.push(`/dispatcher/assign/${id}`)
}

function showDetail(order) {
  currentOrder.value = order
  detailVisible.value = true
}

function handleDelay(order) {
  currentOrder.value = order
  delayForm.action = 'extend'
  delayForm.newEndTime = order.delayEndTime
  delayForm.remark = ''
  delayVisible.value = true
}

function submitDelayHandle() {
  if (!currentOrder.value) return
  if (delayForm.action === 'resolve') {
    currentOrder.value.status = 'assigned'
    currentOrder.value.delayReason = null
    currentOrder.value.delayEndTime = null
    ElMessage.success('工单已恢复正常状态')
  } else if (delayForm.action === 'extend') {
    if (!delayForm.newEndTime) {
      ElMessage.warning('请选择新的预计完成时间')
      return
    }
    currentOrder.value.delayEndTime = delayForm.newEndTime
    workOrderStore.addNotification({
      userId: currentOrder.value.studentId,
      title: '延期更新通知',
      content: `您的工单 ${currentOrder.value.id} 延期时间已更新为 ${delayForm.newEndTime}`,
      type: 'delay'
    })
    ElMessage.success('延期时间已更新')
  } else if (delayForm.action === 'reassign') {
    detailVisible.value = false
    delayVisible.value = false
    router.push(`/dispatcher/assign/${currentOrder.value.id}`)
    return
  }
  workOrderStore.saveToStorage()
  delayVisible.value = false
}

function mergeOrders(group) {
  const selected = getSelectedInGroup(group)
  if (selected.length < 2) return

  ElMessageBox.confirm(
    `确定要将选中的 ${selected.length} 个工单合并吗？合并后将保留主工单，其他工单将关联到主工单。`,
    '合并确认',
    { type: 'warning' }
  ).then(() => {
    const sortedOrders = [...group.orders]
      .filter(o => selected.includes(o.id))
      .sort((a, b) => new Date(a.createTime) - new Date(b.createTime))

    const mainOrder = sortedOrders[0]
    sortedOrders.slice(1).forEach(order => {
      mainOrder.mergedCount++
      mainOrder.mergedFrom.push(order.id)
      order.status = 'cancelled'
      workOrderStore.addNotification({
        userId: order.studentId,
        title: '工单合并通知',
        content: `您的工单 ${order.id} 已合并到 ${mainOrder.id}`,
        type: 'merge'
      })
    })

    workOrderStore.addNotification({
      userId: mainOrder.studentId,
      title: '工单合并通知',
      content: `您的工单 ${mainOrder.id} 有新的报修合并进来，共合并 ${mainOrder.mergedCount} 单`,
      type: 'merge'
    })

    workOrderStore.saveToStorage()
    selectedMergeOrders.value = []
    ElMessage.success('工单合并成功')
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.tab-badge {
  background: #f56c6c;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 5px;
}

.merge-panel {
  border: 2px solid #e6a23c;
}

.merge-group {
  background: #fafafa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.merge-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.merge-group-title {
  font-weight: 600;
  font-size: 15px;
}

.merge-group-orders {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.merge-group-actions {
  text-align: right;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
