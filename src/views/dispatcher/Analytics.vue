<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据分析看板</h2>
    </div>

    <el-tabs v-model="activeTab" class="mb-20">
      <el-tab-pane label="超时未处理" name="overtime" />
      <el-tab-pane label="返修率分析" name="rework" />
      <el-tab-pane label="备件短缺" name="spareParts" />
    </el-tabs>

    <template v-if="activeTab === 'overtime'">
      <el-row :gutter="20" class="mb-20">
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ overtimeOrders.length }}</div>
              <div class="stat-label">超时工单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-icon"><el-icon><Clock /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ avgOvertimeHours }}</div>
              <div class="stat-label">平均超时(h)</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card info">
            <div class="stat-icon"><el-icon><OfficeBuilding /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ overtimeBuildings }}</div>
              <div class="stat-label">涉及楼栋</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-icon"><el-icon><BellFilled /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ overtimeUrgent }}</div>
              <div class="stat-label">紧急超时</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card>
        <template #header>
          <div class="card-header">
            <span>超时工单列表（超过24小时未完成）</span>
            <el-select v-model="overtimeThreshold" style="width: 180px;" size="small">
              <el-option label="超过12小时" :value="12" />
              <el-option label="超过24小时" :value="24" />
              <el-option label="超过48小时" :value="48" />
              <el-option label="超过72小时" :value="72" />
            </el-select>
          </div>
        </template>
        <el-table :data="overtimeOrders" size="default" v-if="overtimeOrders.length > 0">
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
          <el-table-column label="已超时" width="100">
            <template #default="{ row }">
              <span class="overtime-text">{{ getOvertimeHours(row) }}h</span>
            </template>
          </el-table-column>
          <el-table-column prop="workerName" label="师傅" width="80">
            <template #default="{ row }">
              {{ row.workerName || '未分配' }}
            </template>
          </el-table-column>
          <el-table-column prop="delayReason" label="延期原因" min-width="150">
            <template #default="{ row }">
              {{ row.delayReason || '-' }}
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无超时工单" />
      </el-card>
    </template>

    <template v-if="activeTab === 'rework'">
      <el-alert
        title="返修率 = 7天内同一房间同一问题类型重复报修次数占总工单数比例。高返修率房间需重点关注维修质量"
        type="info"
        show-icon
        :closable="false"
        class="mb-20"
      />

      <el-row :gutter="20" class="mb-20">
        <el-col :span="8">
          <el-card class="stat-card danger">
            <div class="stat-icon"><el-icon><RefreshRight /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ reworkStats.length }}</div>
              <div class="stat-label">返修房间数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card warning">
            <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ topReworkRate }}%</div>
              <div class="stat-label">最高返修率</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card info">
            <div class="stat-icon"><el-icon><Document /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalReworkOrders }}</div>
              <div class="stat-label">返修工单总数</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card>
        <template #header>
          <span>房间返修率排名</span>
        </template>
        <el-table :data="reworkStats" size="default" v-if="reworkStats.length > 0">
          <el-table-column label="排名" width="70">
            <template #default="{ $index }">
              <el-tag v-if="$index < 3" type="danger" effect="dark" size="small">{{ $index + 1 }}</el-tag>
              <span v-else>{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="building" label="楼栋" width="100" />
          <el-table-column prop="room" label="房间" width="100" />
          <el-table-column prop="total" label="总工单数" width="110" />
          <el-table-column prop="rework" label="返修次数" width="110" />
          <el-table-column label="返修率" width="200">
            <template #default="{ row }">
              <el-progress
                :percentage="row.reworkRate"
                :stroke-width="14"
                :color="row.reworkRate > 50 ? '#f56c6c' : row.reworkRate > 30 ? '#e6a23c' : '#67c23a'"
              >
                <span>{{ row.reworkRate }}%</span>
              </el-progress>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showReworkDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无返修数据" />
      </el-card>
    </template>

    <template v-if="activeTab === 'spareParts'">
      <el-row :gutter="20" class="mb-20">
        <el-col :span="8">
          <el-card class="stat-card danger">
            <div class="stat-icon"><el-icon><Box /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ sparePartsDelayed.length }}</div>
              <div class="stat-label">备件延期工单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card warning">
            <div class="stat-icon"><el-icon><Goods /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ shortPartNames.length }}</div>
              <div class="stat-label">短缺备件种类</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card info">
            <div class="stat-icon"><el-icon><Connection /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ queuedBySpareParts }}</div>
              <div class="stat-label">排队中等件工单</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="14">
          <el-card class="mb-20">
            <template #header>
              <span>因备件不足延期的工单</span>
            </template>
            <el-table :data="sparePartsDelayed" size="small" v-if="sparePartsDelayed.length > 0">
              <el-table-column prop="orderId" label="工单号" width="140" />
              <el-table-column prop="building" label="楼栋" width="90" />
              <el-table-column prop="room" label="房间" width="80" />
              <el-table-column prop="problemTypeName" label="问题类型" width="110" />
              <el-table-column prop="delayReason" label="延期原因" min-width="160" />
              <el-table-column label="所需备件" width="180">
                <template #default="{ row }">
                  <el-tag v-for="sp in row.requiredSpareParts" :key="sp.sparePartId" size="small" type="danger" style="margin-right: 4px;">
                    {{ sp.sparePartName }}x{{ sp.quantity }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无备件延期工单" :image-size="60" />
          </el-card>
        </el-col>

        <el-col :span="10">
          <el-card class="mb-20">
            <template #header>
              <span>短缺备件清单</span>
            </template>
            <el-table :data="shortPartDetails" size="small" v-if="shortPartDetails.length > 0">
              <el-table-column prop="name" label="备件名称" />
              <el-table-column label="库存/最低" width="100">
                <template #default="{ row }">
                  <span :class="{ 'status-delayed': row.stock < row.minStock }">
                    {{ row.stock }}/{{ row.minStock }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="影响工单" width="90">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.affectedOrders }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无短缺备件" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <el-dialog v-model="reworkDetailVisible" title="返修详情" width="600px">
      <template v-if="currentReworkRoom">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="楼栋">{{ currentReworkRoom.building }}</el-descriptions-item>
          <el-descriptions-item label="房间">{{ currentReworkRoom.room }}</el-descriptions-item>
          <el-descriptions-item label="总工单数">{{ currentReworkRoom.total }}</el-descriptions-item>
          <el-descriptions-item label="返修次数">{{ currentReworkRoom.rework }}</el-descriptions-item>
          <el-descriptions-item label="返修率" :span="2">
            <el-progress
              :percentage="currentReworkRoom.reworkRate"
              :stroke-width="14"
              :color="currentReworkRoom.reworkRate > 50 ? '#f56c6c' : '#e6a23c'"
            />
          </el-descriptions-item>
        </el-descriptions>

        <div class="mt-20">
          <h4>该房间所有工单</h4>
          <el-table :data="roomOrders" size="small">
            <el-table-column prop="id" label="工单号" width="140" />
            <el-table-column prop="problemTypeName" label="问题类型" />
            <el-table-column label="是否返修" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.isRework" type="danger" size="small">返修</el-tag>
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
            <el-table-column prop="createTime" label="创建时间" />
          </el-table>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'

const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const activeTab = ref('overtime')
const overtimeThreshold = ref(24)
const reworkDetailVisible = ref(false)
const currentReworkRoom = ref(null)

const overtimeOrders = computed(() => workOrderStore.getOvertimeOrders(overtimeThreshold.value))

const avgOvertimeHours = computed(() => {
  if (overtimeOrders.value.length === 0) return 0
  const total = overtimeOrders.value.reduce((sum, o) => {
    const created = new Date(o.createTime)
    const diff = (new Date() - created) / (1000 * 60 * 60)
    return sum + diff
  }, 0)
  return Math.round(total / overtimeOrders.value.length)
})

const overtimeBuildings = computed(() => {
  return new Set(overtimeOrders.value.map(o => o.building)).size
})

const overtimeUrgent = computed(() => {
  return overtimeOrders.value.filter(o => o.urgency === 'urgent').length
})

const reworkStats = computed(() => workOrderStore.getReworkStats())

const topReworkRate = computed(() => {
  if (reworkStats.value.length === 0) return 0
  return reworkStats.value[0].reworkRate
})

const totalReworkOrders = computed(() => {
  return reworkStats.value.reduce((sum, r) => sum + r.rework, 0)
})

const sparePartsDelayed = computed(() => workOrderStore.getDelayedBySpareParts())

const shortPartNames = computed(() => {
  const names = new Set()
  sparePartsDelayed.value.forEach(o => {
    o.requiredSpareParts.forEach(sp => names.add(sp.sparePartName))
  })
  return [...names]
})

const queuedBySpareParts = computed(() => {
  return workOrderStore.queuedOrders.length
})

const shortPartDetails = computed(() => {
  return shortPartNames.value.map(name => {
    const part = sparePartsStore.spareParts.find(p => p.name === name)
    const affectedOrders = sparePartsDelayed.value.filter(o =>
      o.requiredSpareParts.some(sp => sp.sparePartName === name)
    ).length
    return {
      name,
      stock: part ? part.stock : 0,
      minStock: part ? part.minStock : 0,
      affectedOrders
    }
  }).sort((a, b) => b.affectedOrders - a.affectedOrders)
})

const roomOrders = computed(() => {
  if (!currentReworkRoom.value) return []
  return workOrderStore.workOrders.filter(o =>
    o.building === currentReworkRoom.value.building &&
    o.room === currentReworkRoom.value.room
  ).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

function getOvertimeHours(order) {
  const created = new Date(order.createTime)
  return Math.round((new Date() - created) / (1000 * 60 * 60))
}

function showReworkDetail(room) {
  currentReworkRoom.value = room
  reworkDetailVisible.value = true
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

.stat-card.danger { background: linear-gradient(135deg, #fef0f0 0%, #fff 100%); }
.stat-card.warning { background: linear-gradient(135deg, #fff7e6 0%, #fff 100%); }
.stat-card.info { background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%); }

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

.stat-card.danger .stat-icon { color: #f56c6c; }
.stat-card.warning .stat-icon { color: #e6a23c; }
.stat-card.info .stat-icon { color: #409eff; }

.stat-value { font-size: 24px; font-weight: 600; color: #303133; }
.stat-label { font-size: 13px; color: #909399; }

.overtime-text {
  color: #f56c6c;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
