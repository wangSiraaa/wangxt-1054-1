<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">工单派单</h2>
      <el-button @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card v-if="order" class="mb-20">
      <div class="order-info">
        <div class="order-id">
          {{ order.id }}
          <el-tag v-if="order.urgency === 'urgent'" type="danger" effect="dark">紧急</el-tag>
          <el-tag v-if="order.mergedCount > 0" type="info">合并{{ order.mergedCount }}单</el-tag>
        </div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="问题类型">{{ order.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ order.building }} {{ order.room }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ order.studentName }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :class="workOrderStore.getUrgencyInfo(order.urgency).className">
              {{ workOrderStore.getUrgencyInfo(order.urgency).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :class="workOrderStore.getStatusInfo(order.status).className">
              {{ workOrderStore.getStatusInfo(order.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="3">{{ order.description }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="order.requiredSpareParts.length > 0" class="mt-20">
        <h4>所需备件</h4>
        <el-table :data="order.requiredSpareParts" size="small">
          <el-table-column prop="sparePartName" label="备件名称" />
          <el-table-column prop="quantity" label="需求数量" />
          <el-table-column label="当前库存">
            <template #default="{ row }">
              <span :class="checkStock(row.sparePartId, row.quantity) ? 'status-completed' : 'status-delayed'">
                {{ getStock(row.sparePartId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="库存状态">
            <template #default="{ row }">
              <el-tag v-if="checkStock(row.sparePartId, row.quantity)" type="success">库存充足</el-tag>
              <el-tag v-else type="danger">库存不足</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-alert
          v-if="!hasEnoughStock && order.status !== 'delayed'"
          title="备件库存不足，系统将自动延期工单，请先补货后再派单"
          type="error"
          show-icon
          :closable="false"
          class="mt-10"
        >
          <template #default>
            <p>缺失备件：{{ missingPartNames }}</p>
            <div class="alert-actions mt-10">
              <el-button type="danger" size="small" @click="goToSpareParts">
                <el-icon><Warning /></el-icon>
                去补货
              </el-button>
            </div>
          </template>
        </el-alert>
        <el-alert
          v-if="order.status === 'delayed'"
          :title="hasEnoughStock ? '备件已补货完成，可以进行派单' : '工单已延期，备件库存仍然不足'"
          :type="hasEnoughStock ? 'success' : 'warning'"
          show-icon
          :closable="false"
          class="mt-10"
        >
          <template #default>
            <p v-if="order.delayReason">延期原因：{{ order.delayReason }}</p>
            <div class="alert-actions mt-10">
              <el-button 
                v-if="!hasEnoughStock" 
                type="warning" 
                size="small" 
                @click="goToSpareParts"
              >
                <el-icon><Warning /></el-icon>
                去补货
              </el-button>
              <el-button 
                v-if="hasEnoughStock" 
                type="success" 
                size="small" 
                @click="restoreOrder"
                :loading="restoring"
              >
                <el-icon><CircleCheckFilled /></el-icon>
                恢复待派单
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <h3>选择维修师傅</h3>
      </template>

      <div class="filter-tips mb-20">
        <el-alert
          title="系统已自动筛选具备对应技能和该楼栋权限的师傅"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <div v-if="availableWorkers.length > 0">
        <el-radio-group v-model="selectedWorkerId" class="worker-list">
          <el-radio
            v-for="worker in availableWorkers"
            :key="worker.id"
            :value="worker.id"
            class="worker-radio"
          >
            <div class="worker-card" :class="{ selected: selectedWorkerId === worker.id }">
              <div class="worker-avatar">
                <el-avatar :size="50" :icon="UserFilled" />
              </div>
              <div class="worker-info">
                <div class="worker-name">
                  {{ worker.name }}
                  <el-tag v-if="getWorkerCurrentOrderCount(worker.id) === 0" type="success" size="small">空闲</el-tag>
                  <el-tag v-else type="warning" size="small">{{ getWorkerCurrentOrderCount(worker.id) }}单在处理</el-tag>
                </div>
                <div class="worker-skills">
                  <span class="label">技能：</span>
                  <el-tag v-for="skill in worker.skills" :key="skill" size="small" type="info" effect="plain">
                    {{ skill }}
                  </el-tag>
                </div>
                <div class="worker-buildings">
                  <span class="label">负责楼栋：</span>
                  {{ worker.buildings.join('、') }}
                </div>
              </div>
              <div class="worker-select">
                <el-icon v-if="selectedWorkerId === worker.id" :size="24" color="#409eff"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </el-radio>
        </el-radio-group>

        <div class="action-bar mt-20">
          <el-button size="large" @click="router.back()">取消</el-button>
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedWorkerId || !canAssign"
            :loading="loading"
            @click="submitAssign"
          >
            {{ !hasEnoughStock ? '备件不足，无法派单' : '确认派单' }}
          </el-button>
        </div>
      </div>
      <el-empty v-else description="暂无符合条件的维修师傅">
        <template #description>
          <p>没有找到具备 "{{ order?.problemTypeName }}" 技能</p>
          <p>且负责 "{{ order?.building }}" 的维修师傅</p>
        </template>
        <el-button type="primary" @click="showAllWorkers = true">查看所有师傅</el-button>
      </el-empty>
    </el-card>

    <el-dialog v-model="showAllWorkers" title="所有维修师傅" width="600px">
      <el-table :data="allWorkers" size="small">
        <el-table-column prop="name" label="师傅姓名" />
        <el-table-column prop="skills" label="技能">
          <template #default="{ row }">
            <el-tag v-for="skill in row.skills" :key="skill" size="small" style="margin-right: 4px;">
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="buildings" label="负责楼栋">
          <template #default="{ row }">
            {{ row.buildings.join('、') }}
          </template>
        </el-table-column>
        <el-table-column label="当前工单">
          <template #default="{ row }">
            {{ getWorkerCurrentOrderCount(row.id) }} 单
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, UserFilled, CircleCheckFilled, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const loading = ref(false)
const restoring = ref(false)
const selectedWorkerId = ref(null)
const showAllWorkers = ref(false)

const orderId = computed(() => route.params.id)

const order = computed(() => {
  if (!orderId.value) return null
  return workOrderStore.getOrderById(orderId.value)
})

const allWorkers = computed(() => userStore.getWorkers())

const availableWorkers = computed(() => {
  if (!order.value) return []
  const problemType = order.value.problemTypeName
  const building = order.value.building

  return allWorkers.value.filter(worker => {
    const hasBuilding = worker.buildings.includes(building)
    const hasSkill = worker.skills.some(skill =>
      problemType.includes(skill.replace('维修', '')) || skill === problemType
    )
    return hasBuilding && hasSkill
  })
})

const hasEnoughStock = computed(() => {
  if (!order.value) return true
  return order.value.requiredSpareParts.every(part =>
    checkStock(part.sparePartId, part.quantity)
  )
})

const missingPartNames = computed(() => {
  if (!order.value) return ''
  return order.value.requiredSpareParts
    .filter(part => !checkStock(part.sparePartId, part.quantity))
    .map(part => part.sparePartName)
    .join('、')
})

const canAssign = computed(() => {
  if (!order.value) return false
  if (order.value.status === 'delayed' && !hasEnoughStock.value) return false
  return hasEnoughStock.value
})

function checkStock(partId, quantity) {
  return sparePartsStore.checkStock(partId, quantity)
}

function getStock(partId) {
  const part = sparePartsStore.getPartById(partId)
  return part?.stock || 0
}

function goToSpareParts() {
  router.push('/spare-parts/inventory')
}

async function restoreOrder() {
  if (!order.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要恢复工单 ${order.value.id} 为待派单状态吗？`,
      '恢复工单',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    restoring.value = true
    const result = workOrderStore.restoreDelayedOrder(order.value.id)
    
    if (result.success) {
      ElMessage.success(result.message)
      workOrderStore.saveToStorage()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作已取消')
    }
  } finally {
    restoring.value = false
  }
}

function getWorkerCurrentOrderCount(workerId) {
  return workOrderStore.getOrdersByWorker(workerId)
    .filter(o => ['assigned', 'processing', 'delayed'].includes(o.status)).length
}

async function submitAssign() {
  if (!selectedWorkerId.value || !order.value) return
  
  if (!hasEnoughStock.value) {
    try {
      await ElMessageBox.confirm(
        '备件库存不足，强制派单将自动延期工单。建议先补货后再派单。是否继续？',
        '库存不足警告',
        {
          confirmButtonText: '强制派单（自动延期）',
          cancelButtonText: '取消派单',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch (error) {
      if (error === 'cancel') {
        return
      }
    }
  }

  loading.value = true

  setTimeout(() => {
    const worker = userStore.users.find(u => u.id === selectedWorkerId.value)
    if (!worker) {
      loading.value = false
      ElMessage.error('未找到该师傅信息')
      return
    }

    const result = workOrderStore.assignWorkOrderWithStockCheck(
      order.value.id, 
      worker.id, 
      worker.name
    )

    if (result.success) {
      order.value.requiredSpareParts.forEach(part => {
        sparePartsStore.consumeStock(part.sparePartId, part.quantity)
      })
      sparePartsStore.saveToStorage()
      
      ElMessage.success(`工单已派给 ${worker.name} 师傅`)
    } else {
      if (result.reason === 'sparePartsInsufficient') {
        ElMessage.warning(result.message)
      } else {
        ElMessage.error(result.message)
      }
    }

    workOrderStore.saveToStorage()

    loading.value = false
    setTimeout(() => {
      router.push('/dispatcher/pool')
    }, 1500)
  }, 500)
}

onMounted(() => {
  if (availableWorkers.value.length > 0) {
    const sortedWorkers = [...availableWorkers.value].sort((a, b) =>
      getWorkerCurrentOrderCount(a.id) - getWorkerCurrentOrderCount(b.id)
    )
    selectedWorkerId.value = sortedWorkers[0].id
  }
})
</script>

<style scoped>
.order-id {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.worker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.worker-radio {
  margin-right: 0;
}

.worker-radio :deep(.el-radio__input) {
  display: none;
}

.worker-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.worker-card:hover {
  border-color: #b3d8ff;
  background: #ecf5ff;
}

.worker-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.worker-info {
  flex: 1;
}

.worker-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.worker-skills,
.worker-buildings {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.worker-skills .label,
.worker-buildings .label {
  color: #909399;
  width: 60px;
  flex-shrink: 0;
}

.worker-select {
  width: 30px;
  text-align: center;
}

.action-bar {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.filter-tips {
  margin-bottom: 20px;
}
</style>
