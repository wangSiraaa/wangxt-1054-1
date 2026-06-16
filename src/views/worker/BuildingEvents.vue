<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">楼栋事件</h2>
      <div class="view-toggle">
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button value="personal">个人工单</el-radio-button>
          <el-radio-button value="building">楼栋事件</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <template v-if="viewMode === 'personal'">
      <el-alert
        title="个人工单视图：仅展示分配给您的工单"
        type="info"
        show-icon
        :closable="false"
        class="mb-20"
      />

      <el-table :data="myOrders" size="default" v-if="myOrders.length > 0">
        <el-table-column prop="id" label="工单号" width="140" fixed />
        <el-table-column prop="building" label="楼栋" width="90" />
        <el-table-column prop="room" label="房间" width="80" />
        <el-table-column prop="problemTypeName" label="问题类型" width="120" />
        <el-table-column prop="studentName" label="报修人" width="80" />
        <el-table-column label="紧急程度" width="90">
          <template #default="{ row }">
            <el-tag :class="workOrderStore.getUrgencyInfo(row.urgency).className" size="small">
              {{ workOrderStore.getUrgencyInfo(row.urgency).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :class="workOrderStore.getStatusInfo(row.status).className" size="small">
              {{ workOrderStore.getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="所属事件" width="140">
          <template #default="{ row }">
            <el-button v-if="row.eventId" type="primary" link size="small" @click="switchToEvent(row.eventId)">
              {{ row.eventId }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'assigned'"
              type="primary"
              size="small"
              @click="acceptOrder(row)"
            >
              接单
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              type="success"
              size="small"
              @click="router.push(`/worker/complete/${row.id}`)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无个人工单" />
    </template>

    <template v-if="viewMode === 'building'">
      <el-alert
        title="楼栋事件视图：展示您负责楼栋下的所有事件单和关联工单"
        type="info"
        show-icon
        :closable="false"
        class="mb-20"
      />

      <div class="mb-20">
        <el-select v-model="buildingFilter" placeholder="选择楼栋" style="width: 150px;">
          <el-option
            v-for="b in myBuildings"
            :key="b"
            :label="b"
            :value="b"
          />
        </el-select>
      </div>

      <div v-if="filteredBuildingEvents.length > 0">
        <el-card
          v-for="event in filteredBuildingEvents"
          :key="event.id"
          class="event-card mb-20"
        >
          <template #header>
            <div class="event-header">
              <div class="event-title-row">
                <span class="event-id">{{ event.id }}</span>
                <el-tag :class="eventOrderStore.getEventStatusInfo(event.status).className" size="small">
                  {{ eventOrderStore.getEventStatusInfo(event.status).label }}
                </el-tag>
                <el-tag type="info" size="small">{{ event.childWorkOrderIds.length }} 单</el-tag>
              </div>
            </div>
          </template>
          <div class="event-body">
            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-desc">{{ event.description }}</p>
            <div class="event-meta">
              <span><el-icon><Clock /></el-icon> {{ event.createTime }}</span>
            </div>
          </div>
          <div class="event-children">
            <el-table :data="getEventChildOrders(event)" size="small" max-height="200">
              <el-table-column prop="id" label="工单号" width="140" />
              <el-table-column prop="room" label="房间" width="80" />
              <el-table-column prop="problemTypeName" label="问题类型" width="110" />
              <el-table-column prop="studentName" label="报修人" width="80" />
              <el-table-column label="紧急" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.urgency === 'urgent'" type="danger" size="small">紧急</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :class="workOrderStore.getStatusInfo(row.status).className" size="small">
                    {{ workOrderStore.getStatusInfo(row.status).label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="workerName" label="师傅" width="80">
                <template #default="{ row }">
                  {{ row.workerName || '未分配' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 'assigned' && row.workerId === userStore.currentUser?.id"
                    type="primary"
                    size="small"
                    @click="acceptOrder(row)"
                  >
                    接单
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="该楼栋暂无事件单" />

      <el-card v-if="unrelatedBuildingOrders.length > 0" class="mt-20">
        <template #header>
          <span>未归入事件的工单</span>
        </template>
        <el-table :data="unrelatedBuildingOrders" size="small">
          <el-table-column prop="id" label="工单号" width="140" />
          <el-table-column prop="room" label="房间" width="80" />
          <el-table-column prop="problemTypeName" label="问题类型" width="110" />
          <el-table-column prop="studentName" label="报修人" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :class="workOrderStore.getStatusInfo(row.status).className" size="small">
                {{ workOrderStore.getStatusInfo(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" />
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useEventOrderStore } from '@/stores/eventOrder'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const eventOrderStore = useEventOrderStore()

const viewMode = ref('personal')
const buildingFilter = ref('')

const myBuildings = computed(() => userStore.currentUser?.buildings || [])

const myOrders = computed(() => {
  return workOrderStore.getOrdersByWorker(userStore.currentUser?.id)
    .filter(o => ['assigned', 'processing', 'delayed', 'queued'].includes(o.status))
    .sort((a, b) => {
      const urgencyPriority = { urgent: 0, high: 1, normal: 2, low: 3 }
      return urgencyPriority[a.urgency] - urgencyPriority[b.urgency]
    })
})

const filteredBuildingEvents = computed(() => {
  const building = buildingFilter.value || (myBuildings.value[0] || '')
  if (!building) return []
  return eventOrderStore.getEventsByBuilding(building)
    .filter(e => e.status !== 'closed')
})

const unrelatedBuildingOrders = computed(() => {
  const building = buildingFilter.value || (myBuildings.value[0] || '')
  if (!building) return []
  return workOrderStore.getOrdersByBuilding(building)
    .filter(o => !o.eventId && o.status !== 'cancelled' && o.status !== 'completed')
})

function getEventChildOrders(event) {
  return event.childWorkOrderIds
    .map(id => workOrderStore.getOrderById(id))
    .filter(Boolean)
}

function switchToEvent(eventId) {
  viewMode.value = 'building'
}

function acceptOrder(order) {
  workOrderStore.acceptOrder(order.id, userStore.currentUser?.id)
  workOrderStore.saveToStorage()
  ElMessage.success('已接单')
}
</script>

<style scoped>
.view-toggle {
  display: flex;
  align-items: center;
}

.event-card {
  border-left: 4px solid #409eff;
  transition: all 0.3s;
}

.event-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.event-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-id {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.event-body {
  margin-bottom: 16px;
}

.event-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.event-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.6;
}

.event-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.event-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-children {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}
</style>
