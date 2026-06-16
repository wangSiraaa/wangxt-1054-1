<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的工单</h2>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="全部状态" style="width: 150px;" clearable>
          <el-option
            v-for="status in workOrderStore.statusList"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" size="large" class="mb-20">
      <el-tab-pane label="待处理" name="pending">
        <span class="tab-badge">{{ pendingOrders.length }}</span>
      </el-tab-pane>
      <el-tab-pane label="处理中" name="processing">
        <span class="tab-badge">{{ processingOrders.length }}</span>
      </el-tab-pane>
      <el-tab-pane label="已完成" name="completed">
        <span class="tab-badge">{{ completedOrders.length }}</span>
      </el-tab-pane>
    </el-tabs>

    <div v-if="filteredOrders.length > 0">
      <WorkOrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
      >
        <template #actions>
          <el-button
            v-if="order.status === 'assigned'"
            type="primary"
            size="small"
            @click="startProcess(order)"
          >
            开始处理
          </el-button>
          <el-button
            v-if="order.status === 'processing'"
            type="success"
            size="small"
            @click="goToComplete(order.id)"
          >
            完成
          </el-button>
          <el-button
            v-if="order.status === 'assigned'"
            type="warning"
            size="small"
            @click="showTransferDialog(order)"
          >
            转派
          </el-button>
          <el-button
            size="small"
            @click="checkSpareParts(order)"
          >
            备件
          </el-button>
          <el-button
            size="small"
            type="primary"
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
          <el-descriptions-item label="派单时间">{{ currentOrder.assignedTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始处理">{{ currentOrder.startProcessTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.completeTime" label="完成时间">{{ currentOrder.completeTime }}</el-descriptions-item>
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
          <h4>学生评价</h4>
          <el-rate v-model="currentOrder.evaluation.score" disabled />
          <p>{{ currentOrder.evaluation.comment }}</p>
          <p class="create-time">{{ currentOrder.evaluation.time }}</p>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="transferVisible" title="转派工单" width="500px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border size="small" class="mb-20">
          <el-descriptions-item label="工单号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="问题">{{ currentOrder.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentOrder.building }} {{ currentOrder.room }}</el-descriptions-item>
        </el-descriptions>
        <el-form :model="transferForm" label-width="100px">
          <el-form-item label="转派给" required>
            <el-select v-model="transferForm.toWorkerId" placeholder="请选择师傅">
              <el-option
                v-for="worker in transferableWorkers"
                :key="worker.id"
                :label="worker.name + ' (' + worker.skills.join('、') + ')'"
                :value="worker.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="转派原因" required>
            <el-input v-model="transferForm.reason" type="textarea" :rows="3" placeholder="请输入转派原因" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="transferVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTransfer" :disabled="!transferForm.toWorkerId || !transferForm.reason">
          确认转派
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sparePartsVisible" title="备件检查" width="500px">
      <template v-if="currentOrder">
        <div v-if="currentOrder.requiredSpareParts.length > 0">
          <el-table :data="currentOrder.requiredSpareParts" size="small">
            <el-table-column prop="sparePartName" label="备件名称" />
            <el-table-column prop="quantity" label="所需数量" />
            <el-table-column label="库存状态">
              <template #default="{ row }">
                <el-tag v-if="checkStock(row.sparePartId, row.quantity)" type="success">库存充足</el-tag>
                <el-tag v-else type="danger">库存不足</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-alert
            v-if="!hasEnoughStockForOrder"
            title="备件库存不足，请联系备件管理员"
            type="warning"
            show-icon
            :closable="false"
            class="mt-20"
          />
        </div>
        <el-empty v-else description="该工单无需备件" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const activeTab = ref('pending')
const statusFilter = ref('')
const detailVisible = ref(false)
const transferVisible = ref(false)
const sparePartsVisible = ref(false)
const currentOrder = ref(null)

const transferForm = reactive({
  toWorkerId: null,
  reason: ''
})

const myOrders = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getOrdersByWorker(userStore.currentUser.id)
})

const pendingOrders = computed(() => {
  return myOrders.value.filter(o => o.status === 'assigned')
})

const processingOrders = computed(() => {
  return myOrders.value.filter(o => o.status === 'processing')
})

const completedOrders = computed(() => {
  return myOrders.value.filter(o => o.status === 'completed')
})

const filteredOrders = computed(() => {
  let orders = []
  if (activeTab.value === 'pending') {
    orders = pendingOrders.value
  } else if (activeTab.value === 'processing') {
    orders = processingOrders.value
  } else {
    orders = completedOrders.value
  }
  if (statusFilter.value) {
    orders = orders.filter(o => o.status === statusFilter.value)
  }
  return orders
})

const transferableWorkers = computed(() => {
  if (!currentOrder.value) return []
  const problemType = currentOrder.value.problemTypeName
  const building = currentOrder.value.building

  return userStore.getWorkers().filter(worker => {
    if (worker.id === userStore.currentUser.id) return false
    const hasBuilding = worker.buildings.includes(building)
    const hasSkill = worker.skills.some(skill =>
      problemType.includes(skill.replace('维修', '')) || skill === problemType
    )
    return hasBuilding && hasSkill
  })
})

const hasEnoughStockForOrder = computed(() => {
  if (!currentOrder.value) return true
  return currentOrder.value.requiredSpareParts.every(part =>
    checkStock(part.sparePartId, part.quantity)
  )
})

function getWorkerName(workerId) {
  const worker = userStore.users.find(u => u.id === workerId)
  return worker?.name || '未知'
}

function checkStock(partId, quantity) {
  return sparePartsStore.checkStock(partId, quantity)
}

function startProcess(order) {
  workOrderStore.acceptOrder(order.id, userStore.currentUser.id)
  workOrderStore.saveToStorage()
  ElMessage.success('已开始处理')
}

function goToComplete(id) {
  router.push(`/worker/complete/${id}`)
}

function showDetail(order) {
  currentOrder.value = order
  detailVisible.value = true
}

function showTransferDialog(order) {
  currentOrder.value = order
  transferForm.toWorkerId = null
  transferForm.reason = ''
  transferVisible.value = true
}

function checkSpareParts(order) {
  currentOrder.value = order
  sparePartsVisible.value = true
}

function submitTransfer() {
  if (!currentOrder.value || !transferForm.toWorkerId) return

  const toWorker = userStore.users.find(u => u.id === transferForm.toWorkerId)
  if (!toWorker) {
    ElMessage.error('未找到该师傅信息')
    return
  }

  workOrderStore.transferOrder(
    currentOrder.value.id,
    userStore.currentUser.id,
    toWorker.id,
    toWorker.name,
    transferForm.reason
  )
  workOrderStore.saveToStorage()
  ElMessage.success(`工单已转派给 ${toWorker.name}`)
  transferVisible.value = false
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

.create-time {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>
