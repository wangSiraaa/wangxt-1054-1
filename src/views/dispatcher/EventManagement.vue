<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">事件单管理</h2>
      <div class="filter-bar">
        <el-select v-model="buildingFilter" placeholder="全部楼栋" style="width: 130px; margin-right: 10px;" clearable>
          <el-option label="1号楼" value="1号楼" />
          <el-option label="2号楼" value="2号楼" />
          <el-option label="3号楼" value="3号楼" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="全部状态" style="width: 130px; margin-right: 10px;" clearable>
          <el-option
            v-for="s in eventOrderStore.eventStatusList"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
        <el-button type="primary" @click="showCreatePanel = true">
          <el-icon><Plus /></el-icon>
          新建事件单
        </el-button>
      </div>
    </div>

    <el-alert
      title="高峰期提示：同楼栋同类型报修可一键合并为事件单，再按技能拆分派给不同师傅处理"
      type="info"
      show-icon
      :closable="false"
      class="mb-20"
    />

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card pending">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ eventOrderStore.pendingEvents.length }}</div>
            <div class="stat-label">待处理事件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card processing">
          <div class="stat-icon"><el-icon><Setting /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ eventOrderStore.processingEvents.length }}</div>
            <div class="stat-label">处理中事件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card completed">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ eventOrderStore.completedEvents.length }}</div>
            <div class="stat-label">已完成事件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card urgent">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ totalChildOrders }}</div>
            <div class="stat-label">关联工单总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="filteredEvents.length > 0">
      <el-card
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card mb-20"
        :class="{ 'event-urgent': getEventUrgency(event) === 'urgent' }"
      >
        <template #header>
          <div class="event-header">
            <div class="event-title-row">
              <span class="event-id">{{ event.id }}</span>
              <el-tag :class="eventOrderStore.getEventStatusInfo(event.status).className" size="small">
                {{ eventOrderStore.getEventStatusInfo(event.status).label }}
              </el-tag>
              <el-tag v-if="getEventUrgency(event) === 'urgent'" type="danger" size="small" effect="dark">含紧急</el-tag>
              <el-tag type="info" size="small">关联 {{ event.childWorkOrderIds.length }} 单</el-tag>
            </div>
            <div class="event-actions">
              <el-button type="primary" size="small" @click="showSplitDialog(event)" :disabled="event.status === 'closed'">
                拆分派工
              </el-button>
              <el-button size="small" @click="showEventDetail(event)">详情</el-button>
              <el-button
                v-if="event.status !== 'closed'"
                type="success"
                size="small"
                @click="handleCloseEvent(event)"
              >
                关闭事件
              </el-button>
            </div>
          </div>
        </template>
        <div class="event-body">
          <h3 class="event-title">{{ event.title }}</h3>
          <p class="event-desc">{{ event.description }}</p>
          <div class="event-meta">
            <span><el-icon><OfficeBuilding /></el-icon> {{ event.building }}</span>
            <span><el-icon><Clock /></el-icon> {{ event.createTime }}</span>
            <span><el-icon><User /></el-icon> {{ event.createdByName }}</span>
          </div>
        </div>
        <div class="event-children">
          <h4>关联工单</h4>
          <el-table :data="getEventChildOrders(event)" size="small" max-height="240">
            <el-table-column prop="id" label="工单号" width="140" />
            <el-table-column prop="room" label="房间" width="80" />
            <el-table-column prop="problemTypeName" label="问题类型" width="110" />
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
            <el-table-column prop="workerName" label="师傅" width="80">
              <template #default="{ row }">
                {{ row.workerName || '未分配' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
    <el-empty v-else description="暂无事件单" />

    <el-dialog v-model="showCreatePanel" title="新建事件单" width="700px" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="100px" class="mb-20">
        <el-form-item label="事件标题" required>
          <el-input v-model="createForm.title" placeholder="如：1号楼集中停电事件" />
        </el-form-item>
        <el-form-item label="所属楼栋" required>
          <el-select v-model="createForm.building" placeholder="选择楼栋">
            <el-option label="1号楼" value="1号楼" />
            <el-option label="2号楼" value="2号楼" />
            <el-option label="3号楼" value="3号楼" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="描述事件概况..." />
        </el-form-item>
      </el-form>

      <div class="merge-section">
        <h4>选择要合并的工单</h4>
        <el-select v-model="createForm.selectedOrders" multiple placeholder="选择待合并的报修工单" style="width: 100%;">
          <el-option
            v-for="order in availableOrdersForMerge"
            :key="order.id"
            :label="`${order.id} - ${order.building} ${order.room} ${order.problemTypeName} (${order.studentName})`"
            :value="order.id"
          />
        </el-select>
      </div>

      <template #footer>
        <el-button @click="showCreatePanel = false">取消</el-button>
        <el-button type="primary" @click="createEvent" :disabled="!createForm.title || !createForm.building">
          创建事件单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="splitVisible" title="拆分派工" width="650px" :close-on-click-modal="false">
      <template v-if="currentEvent">
        <el-alert
          :title="`事件：${currentEvent.title}，共 ${currentEvent.childWorkOrderIds.length} 条工单`"
          type="info"
          :closable="false"
          class="mb-20"
        />
        <el-form :model="splitForm" label-width="100px">
          <el-form-item label="选择师傅" required>
            <el-select v-model="splitForm.workerId" placeholder="选择维修师傅" style="width: 100%;">
              <el-option
                v-for="worker in userStore.getWorkers()"
                :key="worker.id"
                :label="`${worker.name} (${worker.skills.join('、')}) - 负责${worker.buildings.join('、')}`"
                :value="worker.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选择工单" required>
            <el-checkbox-group v-model="splitForm.selectedOrders">
              <el-checkbox
                v-for="order in getUnassignedEventOrders(currentEvent)"
                :key="order.id"
                :value="order.id"
                :label="order.id"
              >
                {{ order.room }} - {{ order.problemTypeName }} ({{ order.studentName }})
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="splitVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSplit" :disabled="!splitForm.workerId || splitForm.selectedOrders.length === 0">
          确认派工
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="事件详情" width="700px">
      <template v-if="currentEvent">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="事件单号">{{ currentEvent.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :class="eventOrderStore.getEventStatusInfo(currentEvent.status).className">
              {{ eventOrderStore.getEventStatusInfo(currentEvent.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentEvent.title }}</el-descriptions-item>
          <el-descriptions-item label="所属楼栋">{{ currentEvent.building }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentEvent.createTime }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentEvent.createdByName }}</el-descriptions-item>
          <el-descriptions-item label="关联工单数">{{ currentEvent.childWorkOrderIds.length }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentEvent.description }}</el-descriptions-item>
          <el-descriptions-item v-if="currentEvent.closeNote" label="关闭备注" :span="2">{{ currentEvent.closeNote }}</el-descriptions-item>
        </el-descriptions>

        <div class="mt-20">
          <h4>关联工单明细</h4>
          <el-table :data="getEventChildOrders(currentEvent)" size="small">
            <el-table-column prop="id" label="工单号" width="140" />
            <el-table-column prop="room" label="房间" width="80" />
            <el-table-column prop="problemTypeName" label="问题类型" />
            <el-table-column prop="studentName" label="报修人" width="80" />
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
          </el-table>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useEventOrderStore } from '@/stores/eventOrder'
import { useUserStore } from '@/stores/user'

const workOrderStore = useWorkOrderStore()
const eventOrderStore = useEventOrderStore()
const userStore = useUserStore()

const buildingFilter = ref('')
const statusFilter = ref('')
const showCreatePanel = ref(false)
const splitVisible = ref(false)
const detailVisible = ref(false)
const currentEvent = ref(null)

const createForm = reactive({
  title: '',
  building: '',
  description: '',
  selectedOrders: []
})

const splitForm = reactive({
  workerId: null,
  selectedOrders: []
})

const totalChildOrders = computed(() => {
  return eventOrderStore.eventOrders.reduce((sum, e) => sum + e.childWorkOrderIds.length, 0)
})

const filteredEvents = computed(() => {
  let events = eventOrderStore.eventOrders
  if (buildingFilter.value) {
    events = events.filter(e => e.building === buildingFilter.value)
  }
  if (statusFilter.value) {
    events = events.filter(e => e.status === statusFilter.value)
  }
  return events.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

const availableOrdersForMerge = computed(() => {
  if (!createForm.building) return workOrderStore.pendingOrders
  return workOrderStore.pendingOrders.filter(o => o.building === createForm.building)
})

function getEventChildOrders(event) {
  return event.childWorkOrderIds
    .map(id => workOrderStore.getOrderById(id))
    .filter(Boolean)
}

function getUnassignedEventOrders(event) {
  return getEventChildOrders(event).filter(o => !o.workerId && o.status !== 'queued')
}

function getEventUrgency(event) {
  const children = getEventChildOrders(event)
  return children.some(o => o.urgency === 'urgent') ? 'urgent' : 'normal'
}

function showSplitDialog(event) {
  currentEvent.value = event
  splitForm.workerId = null
  splitForm.selectedOrders = []
  splitVisible.value = true
}

function showEventDetail(event) {
  currentEvent.value = event
  detailVisible.value = true
}

function createEvent() {
  if (!createForm.title || !createForm.building) {
    ElMessage.warning('请填写事件标题和楼栋')
    return
  }

  const newEvent = {
    id: 'EVT' + Date.now().toString().slice(-9),
    title: createForm.title,
    building: createForm.building,
    description: createForm.description || `由调度主管 ${userStore.currentUser?.name || '系统'} 创建`,
    status: 'pending',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    createdBy: userStore.currentUser?.id || null,
    createdByName: userStore.currentUser?.name || '系统',
    childWorkOrderIds: [...createForm.selectedOrders],
    closedTime: null,
    closeNote: null
  }

  createForm.selectedOrders.forEach(orderId => {
    const order = workOrderStore.getOrderById(orderId)
    if (order) {
      order.eventId = newEvent.id
    }
  })

  eventOrderStore.eventOrders.unshift(newEvent)
  eventOrderStore.saveToStorage()
  workOrderStore.saveToStorage()

  showCreatePanel.value = false
  createForm.title = ''
  createForm.building = ''
  createForm.description = ''
  createForm.selectedOrders = []

  ElMessage.success('事件单创建成功')
}

function submitSplit() {
  if (!currentEvent.value || !splitForm.workerId || splitForm.selectedOrders.length === 0) return

  const worker = userStore.users.find(u => u.id === splitForm.workerId)
  if (!worker) return

  eventOrderStore.splitEventToWorker(
    currentEvent.value.id,
    splitForm.selectedOrders,
    worker.id,
    worker.name,
    workOrderStore
  )

  eventOrderStore.saveToStorage()
  workOrderStore.saveToStorage()
  splitVisible.value = false
  ElMessage.success(`已将 ${splitForm.selectedOrders.length} 条工单派给 ${worker.name} 师傅`)
}

function handleCloseEvent(event) {
  ElMessageBox.prompt('请输入关闭原因', '关闭事件确认', {
    confirmButtonText: '确认关闭',
    cancelButtonText: '取消',
    type: 'warning',
    inputType: 'textarea'
  }).then(({ value }) => {
    eventOrderStore.closeEvent(event.id, value)
    eventOrderStore.saveToStorage()
    workOrderStore.saveToStorage()
    ElMessage.success('事件已关闭')
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  border: none;
  border-radius: 8px;
}

.stat-card.pending { background: linear-gradient(135deg, #fff7e6 0%, #fff 100%); }
.stat-card.processing { background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%); }
.stat-card.completed { background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%); }
.stat-card.urgent { background: linear-gradient(135deg, #fef0f0 0%, #fff 100%); }

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

.stat-card.pending .stat-icon { color: #e6a23c; }
.stat-card.processing .stat-icon { color: #409eff; }
.stat-card.completed .stat-icon { color: #67c23a; }
.stat-card.urgent .stat-icon { color: #f56c6c; }

.stat-value { font-size: 24px; font-weight: 600; color: #303133; }
.stat-label { font-size: 13px; color: #909399; }

.event-card {
  border-left: 4px solid #409eff;
  transition: all 0.3s;
}

.event-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.event-card.event-urgent {
  border-left-color: #f56c6c;
  background: linear-gradient(to right, #fef0f0 0%, #fff 10%);
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

.event-actions {
  display: flex;
  gap: 8px;
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

.event-children h4 {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.merge-section h4 {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}
</style>
