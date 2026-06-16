<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">延期工单处理</h2>
      <div class="filter-bar">
        <el-select v-model="buildingFilter" placeholder="全部楼栋" style="width: 150px;" clearable>
          <el-option label="1号楼" value="1号楼" />
          <el-option label="2号楼" value="2号楼" />
          <el-option label="3号楼" value="3号楼" />
        </el-select>
      </div>
    </div>

    <el-alert
      title="以下工单因备件不足已延期，请及时补货处理"
      type="warning"
      show-icon
      :closable="false"
      class="mb-20"
    />

    <el-card v-if="filteredOrders.length > 0">
      <el-table :data="filteredOrders" size="default">
        <el-table-column prop="id" label="工单号" width="140" fixed />
        <el-table-column prop="building" label="楼栋" width="90" />
        <el-table-column prop="room" label="房间" width="80" />
        <el-table-column prop="problemTypeName" label="问题类型" width="120" />
        <el-table-column prop="studentName" label="报修人" width="90" />
        <el-table-column prop="workerName" label="维修师傅" width="90" />
        <el-table-column label="延期原因" min-width="200">
          <template #default="{ row }">
            <span class="status-delayed">{{ row.delayReason }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="delayEndTime" label="预计完成" width="170">
          <template #default="{ row }">
            <span :class="{ 'status-delayed': isOverdue(row.delayEndTime) }">
              {{ row.delayEndTime }}
              <el-tag v-if="isOverdue(row.delayEndTime)" type="danger" size="small" style="margin-left: 5px;">
                已逾期
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="所需备件" min-width="180">
          <template #default="{ row }">
            <el-tag
              v-for="part in row.requiredSpareParts"
              :key="part.sparePartId"
              :type="getStockStatus(part.sparePartId, part.quantity) ? 'success' : 'danger'"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ part.sparePartName }} x{{ part.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showRestockDialog(row)"
              :disabled="hasEnoughStock(row)"
            >
              一键补货
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="resolveOrder(row)"
              :disabled="!hasEnoughStock(row)"
            >
              恢复处理
            </el-button>
            <el-button type="primary" link size="small" @click="showDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-empty v-else description="暂无延期工单" />

    <el-dialog v-model="restockVisible" title="一键补货" width="500px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border size="small" class="mb-20">
          <el-descriptions-item label="工单号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="问题">{{ currentOrder.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="延期原因">{{ currentOrder.delayReason }}</el-descriptions-item>
        </el-descriptions>
        <h4>所需备件</h4>
        <el-table :data="currentOrder.requiredSpareParts" size="small" class="mb-20">
          <el-table-column prop="sparePartName" label="备件名称" />
          <el-table-column prop="quantity" label="需求数量" width="100" />
          <el-table-column label="当前库存" width="100">
            <template #default="{ row }">
              <span :class="getStockStatus(row.sparePartId, row.quantity) ? 'status-completed' : 'status-delayed'">
                {{ getStock(row.sparePartId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="补货数量" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="restockQuantities[row.sparePartId]"
                :min="0"
                :max="100"
                style="width: 100%;"
              />
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="restockVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">确认补货</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="工单详情" width="650px">
      <template v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="danger">已延期</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题类型">{{ currentOrder.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :class="workOrderStore.getUrgencyInfo(currentOrder.urgency).className">
              {{ workOrderStore.getUrgencyInfo(currentOrder.urgency).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ currentOrder.building }} {{ currentOrder.room }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ currentOrder.studentName }}</el-descriptions-item>
          <el-descriptions-item label="维修师傅">{{ currentOrder.workerName }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="派单时间">{{ currentOrder.assignedTime }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
          <el-descriptions-item label="延期原因" :span="2" class="status-delayed">
            {{ currentOrder.delayReason }}
          </el-descriptions-item>
          <el-descriptions-item label="预计完成时间" :span="2">
            <span :class="{ 'status-delayed': isOverdue(currentOrder.delayEndTime) }">
              {{ currentOrder.delayEndTime }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentOrder.requiredSpareParts.length > 0" class="mt-20">
          <h4>所需备件</h4>
          <el-table :data="currentOrder.requiredSpareParts" size="small">
            <el-table-column prop="sparePartName" label="备件名称" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column label="库存状态">
              <template #default="{ row }">
                <el-tag v-if="getStockStatus(row.sparePartId, row.quantity)" type="success">库存充足</el-tag>
                <el-tag v-else type="danger">库存不足</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'

const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const buildingFilter = ref('')
const restockVisible = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)
const restockQuantities = reactive({})

const filteredOrders = computed(() => {
  let orders = workOrderStore.delayedOrders
  if (buildingFilter.value) {
    orders = orders.filter(o => o.building === buildingFilter.value)
  }
  return orders
})

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function getStock(partId) {
  const part = sparePartsStore.getPartById(partId)
  return part?.stock || 0
}

function getStockStatus(partId, quantity) {
  return sparePartsStore.checkStock(partId, quantity)
}

function hasEnoughStock(order) {
  return order.requiredSpareParts.every(part =>
    getStockStatus(part.sparePartId, part.quantity)
  )
}

function showRestockDialog(order) {
  currentOrder.value = order
  order.requiredSpareParts.forEach(part => {
    const stock = getStock(part.sparePartId)
    restockQuantities[part.sparePartId] = Math.max(part.quantity - stock, 1)
  })
  restockVisible.value = true
}

function showDetail(order) {
  currentOrder.value = order
  detailVisible.value = true
}

function submitRestock() {
  if (!currentOrder.value) return

  currentOrder.value.requiredSpareParts.forEach(part => {
    const qty = restockQuantities[part.sparePartId] || 0
    if (qty > 0) {
      sparePartsStore.restockPart(part.sparePartId, qty)
    }
  })

  workOrderStore.addNotification({
    userId: currentOrder.value.workerId,
    title: '备件补货完成',
    content: `工单 ${currentOrder.value.id} 所需备件已补货完成，可以继续处理`,
    type: 'spareParts'
  })
  workOrderStore.addNotification({
    userId: currentOrder.value.studentId,
    title: '工单恢复处理',
    content: `您的工单 ${currentOrder.value.id} 所需备件已到位，即将恢复处理`,
    type: 'spareParts'
  })

  sparePartsStore.saveToStorage()
  workOrderStore.saveToStorage()

  ElMessage.success('补货完成')
  restockVisible.value = false
}

function resolveOrder(order) {
  if (!hasEnoughStock(order)) {
    ElMessage.warning('备件库存不足，请先补货')
    return
  }

  order.status = 'assigned'
  order.delayReason = null
  order.delayEndTime = null

  workOrderStore.addNotification({
    userId: order.workerId,
    title: '工单恢复',
    content: `工单 ${order.id} 已恢复正常状态，请继续处理`,
    type: 'spareParts'
  })

  workOrderStore.saveToStorage()
  ElMessage.success('工单已恢复正常状态')
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}
</style>
