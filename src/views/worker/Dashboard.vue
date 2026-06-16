<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">师傅看板</h2>
      <div>
        <el-tag type="info" size="large">
          技能：{{ userStore.currentUser?.skills?.join('、') }}
        </el-tag>
        <el-tag type="success" size="large" style="margin-left: 10px;">
          负责：{{ userStore.currentUser?.buildings?.join('、') }}
        </el-tag>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card available">
          <div class="stat-icon"><el-icon><TakeawayBox /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ availableOrders.length }}</div>
            <div class="stat-label">可接工单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card assigned">
          <div class="stat-icon"><el-icon><List /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myAssignedOrders.length }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card processing">
          <div class="stat-icon"><el-icon><Setting /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myProcessingOrders.length }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card completed">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myCompletedOrders.length }}</div>
            <div class="stat-label">今日完成</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>可接工单</span>
              <el-button type="primary" text @click="router.push('/worker/available')">查看全部</el-button>
            </div>
          </template>
          <div v-if="availableOrders.length > 0">
            <WorkOrderCard
              v-for="order in availableOrders.slice(0, 3)"
              :key="order.id"
              :order="order"
            >
              <template #actions>
                <el-button type="primary" size="small" @click="acceptOrder(order)">
                  立即接单
                </el-button>
              </template>
            </WorkOrderCard>
          </div>
          <el-empty v-else description="暂无可接工单" :image-size="60" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>我的待处理工单</span>
              <el-button type="primary" text @click="router.push('/worker/my-orders')">查看全部</el-button>
            </div>
          </template>
          <div v-if="myPendingOrders.length > 0">
            <WorkOrderCard
              v-for="order in myPendingOrders.slice(0, 3)"
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
              </template>
            </WorkOrderCard>
          </div>
          <el-empty v-else description="暂无待处理工单" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>今日完成工单</span>
      </template>
      <el-table :data="myCompletedOrders" size="small" v-if="myCompletedOrders.length > 0">
        <el-table-column prop="id" label="工单号" />
        <el-table-column prop="problemTypeName" label="问题类型" />
        <el-table-column prop="building" label="楼栋" />
        <el-table-column prop="room" label="房间" />
        <el-table-column prop="studentName" label="报修人" />
        <el-table-column prop="completeTime" label="完成时间" />
        <el-table-column label="评价">
          <template #default="{ row }">
            <el-rate v-if="row.evaluation" v-model="row.evaluation.score" disabled size="small" />
            <span v-else class="status-pending">待评价</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="今日暂无完成工单" :image-size="60" />
    </el-card>

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
            title="备件库存不足，如需继续处理请联系备件管理员"
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

const availableOrders = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getAvailableOrdersForWorker(userStore.currentUser)
})

const myAssignedOrders = computed(() => {
  return myOrders.value.filter(o => o.status === 'assigned')
})

const myProcessingOrders = computed(() => {
  return myOrders.value.filter(o => o.status === 'processing')
})

const myPendingOrders = computed(() => {
  return myOrders.value.filter(o => ['assigned', 'processing'].includes(o.status))
})

const myCompletedOrders = computed(() => {
  const today = new Date().toDateString()
  return myOrders.value.filter(o => {
    if (o.status !== 'completed') return false
    return new Date(o.completeTime).toDateString() === today
  })
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

function checkStock(partId, quantity) {
  return sparePartsStore.checkStock(partId, quantity)
}

function acceptOrder(order) {
  ElMessageBox.confirm(`确定要接单 ${order.id} 吗？`, '确认接单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    workOrderStore.assignWorkOrder(order.id, userStore.currentUser.id, userStore.currentUser.name)
    workOrderStore.acceptOrder(order.id, userStore.currentUser.id)
    workOrderStore.saveToStorage()
    ElMessage.success('接单成功')
  }).catch(() => {})
}

function startProcess(order) {
  workOrderStore.acceptOrder(order.id, userStore.currentUser.id)
  workOrderStore.saveToStorage()
  ElMessage.success('已开始处理')
}

function goToComplete(id) {
  router.push(`/worker/complete/${id}`)
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
.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  border: none;
  border-radius: 8px;
}

.stat-card.available {
  background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
}

.stat-card.assigned {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-card.processing {
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.stat-card.completed {
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.available .stat-icon { color: #e6a23c; }
.stat-card.assigned .stat-icon { color: #f56c6c; }
.stat-card.processing .stat-icon { color: #409eff; }
.stat-card.completed .stat-icon { color: #67c23a; }

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
