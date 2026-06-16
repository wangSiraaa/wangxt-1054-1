<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">楼栋进度统计</h2>
      <div class="filter-bar">
        <el-select v-model="buildingFilter" placeholder="全部楼栋" style="width: 150px; margin-right: 10px;" clearable>
          <el-option
            v-for="b in userStore.currentUser?.buildings"
            :key="b"
            :label="b"
            :value="b"
          />
        </el-select>
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

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8" v-for="stat in buildingStats" :key="stat.building">
        <el-card class="building-card" :class="{ selected: buildingFilter === stat.building }" @click="toggleBuildingFilter(stat.building)">
          <div class="building-header">
            <h3>{{ stat.building }}</h3>
            <el-tag type="primary">{{ stat.total }} 单</el-tag>
          </div>
          <div class="building-progress">
            <div class="progress-item">
              <span class="label">待处理</span>
              <span class="value status-pending">{{ stat.pending }}</span>
            </div>
            <div class="progress-item">
              <span class="label">处理中</span>
              <span class="value status-processing">{{ stat.processing }}</span>
            </div>
            <div class="progress-item">
              <span class="label">已完成</span>
              <span class="value status-completed">{{ stat.completed }}</span>
            </div>
            <div class="progress-item">
              <span class="label">已延期</span>
              <span class="value status-delayed">{{ stat.delayed }}</span>
            </div>
            <div class="progress-item">
              <span class="label">紧急</span>
              <span class="value status-delayed">{{ stat.urgent }}</span>
            </div>
          </div>
          <div class="building-rate">
            <div class="rate-label">完成率</div>
            <el-progress
              :percentage="Math.round((stat.completed / stat.total) * 100) || 0"
              :stroke-width="10"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>工单明细</span>
          <span class="order-count">共 {{ filteredOrders.length }} 条</span>
        </div>
      </template>

      <el-table :data="filteredOrders" size="default" v-if="filteredOrders.length > 0">
        <el-table-column prop="id" label="工单号" width="140" fixed />
        <el-table-column prop="building" label="楼栋" width="90" />
        <el-table-column prop="room" label="房间" width="80" />
        <el-table-column prop="problemTypeName" label="问题类型" width="120" />
        <el-table-column prop="studentName" label="报修人" width="90" />
        <el-table-column prop="workerName" label="维修师傅" width="90">
          <template #default="{ row }">
            {{ row.workerName || '待分配' }}
          </template>
        </el-table-column>
        <el-table-column label="紧急程度" width="90">
          <template #default="{ row }">
            <el-tag :class="workOrderStore.getUrgencyInfo(row.urgency).className" size="small">
              {{ workOrderStore.getUrgencyInfo(row.urgency).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :class="workOrderStore.getStatusInfo(row.status).className" size="small">
              {{ workOrderStore.getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="报修时间" width="170" />
        <el-table-column prop="completeTime" label="完成时间" width="170">
          <template #default="{ row }">
            {{ row.completeTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无工单数据" />
    </el-card>

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
          <el-descriptions-item label="维修师傅">{{ currentOrder.workerName || '待分配' }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.completeTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentOrder.evaluation" class="mt-20">
          <h4>学生评价</h4>
          <el-rate v-model="currentOrder.evaluation.score" disabled />
          <p>{{ currentOrder.evaluation.comment }}</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'

const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const buildingFilter = ref('')
const statusFilter = ref('')
const detailVisible = ref(false)
const currentOrder = ref(null)

const myBuildings = computed(() => userStore.currentUser?.buildings || [])

const buildingStats = computed(() => {
  return workOrderStore.getBuildingStats().filter(s =>
    myBuildings.value.includes(s.building)
  )
})

const myBuildingOrders = computed(() => {
  return workOrderStore.workOrders.filter(o =>
    myBuildings.value.includes(o.building)
  )
})

const filteredOrders = computed(() => {
  let orders = myBuildingOrders.value
  if (buildingFilter.value) {
    orders = orders.filter(o => o.building === buildingFilter.value)
  }
  if (statusFilter.value) {
    orders = orders.filter(o => o.status === statusFilter.value)
  }
  return orders.sort((a, b) => {
    const urgencyPriority = { urgent: 0, high: 1, normal: 2, low: 3 }
    return urgencyPriority[a.urgency] - urgencyPriority[b.urgency]
  })
})

function toggleBuildingFilter(building) {
  if (buildingFilter.value === building) {
    buildingFilter.value = ''
  } else {
    buildingFilter.value = building
  }
}

function showDetail(order) {
  currentOrder.value = order
  detailVisible.value = true
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.building-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.building-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.building-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.building-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.building-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.building-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f5f7fa;
  padding: 5px 12px;
  border-radius: 12px;
}

.progress-item .label {
  font-size: 12px;
  color: #909399;
}

.progress-item .value {
  font-size: 14px;
  font-weight: 600;
}

.building-rate {
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.rate-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.order-count {
  color: #909399;
  font-size: 13px;
}
</style>
