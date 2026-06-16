<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">宿管首页</h2>
      <el-tag type="success" size="large">
        负责楼栋：{{ userStore.currentUser?.buildings?.join('、') }}
      </el-tag>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card total">
          <div class="stat-icon"><el-icon><OfficeBuilding /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myBuildingStats?.total || 0 }}</div>
            <div class="stat-label">总工单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myBuildingStats?.pending || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card processing">
          <div class="stat-icon"><el-icon><Setting /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myBuildingStats?.processing || 0 }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card urgent">
          <div class="stat-icon"><el-icon><BellFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ myBuildingStats?.urgent || 0 }}</div>
            <div class="stat-label">紧急工单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>各楼栋工单进度</span>
              <el-button type="primary" text @click="router.push('/dorm-manager/building-progress')">
                查看详情
              </el-button>
            </div>
          </template>
          <el-table :data="myBuildingsStats" size="small">
            <el-table-column prop="building" label="楼栋" />
            <el-table-column prop="total" label="总数" width="70" />
            <el-table-column label="待处理" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.pending / row.total) * 100) || 0"
                  :stroke-width="12"
                  color="#e6a23c"
                />
              </template>
            </el-table-column>
            <el-table-column label="处理中" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.processing / row.total) * 100) || 0"
                  :stroke-width="12"
                  color="#409eff"
                />
              </template>
            </el-table-column>
            <el-table-column label="已完成" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.completed / row.total) * 100) || 0"
                  :stroke-width="12"
                  color="#67c23a"
                />
              </template>
            </el-table-column>
            <el-table-column prop="urgent" label="紧急" width="70">
              <template #default="{ row }">
                <el-tag v-if="row.urgent > 0" type="danger" size="small">{{ row.urgent }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="mb-20">
          <template #header>
            <span>最近紧急工单</span>
          </template>
          <div v-if="recentUrgentOrders.length > 0">
            <div
              v-for="order in recentUrgentOrders.slice(0, 5)"
              :key="order.id"
              class="urgent-order-item"
            >
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <el-tag type="danger" size="small">紧急</el-tag>
              </div>
              <div class="order-info">
                {{ order.building }} {{ order.room }} - {{ order.problemTypeName }}
              </div>
              <div class="order-footer">
                <span :class="workOrderStore.getStatusInfo(order.status).className">
                  {{ workOrderStore.getStatusInfo(order.status).label }}
                </span>
                <span class="order-time">{{ order.createTime }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无紧急工单" :image-size="60" />
        </el-card>

        <el-card>
          <template #header>
            <span>今日完工工单</span>
          </template>
          <el-table :data="todayCompletedOrders" size="small" v-if="todayCompletedOrders.length > 0">
            <el-table-column prop="id" label="工单号" />
            <el-table-column prop="room" label="房间" />
            <el-table-column prop="problemTypeName" label="问题类型" />
            <el-table-column prop="workerName" label="师傅" />
          </el-table>
          <el-empty v-else description="今日暂无完工工单" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const myBuildings = computed(() => userStore.currentUser?.buildings || [])

const myBuildingsStats = computed(() => {
  return workOrderStore.getBuildingStats().filter(s =>
    myBuildings.value.includes(s.building)
  )
})

const myBuildingStats = computed(() => {
  const stats = myBuildingsStats.value
  return {
    total: stats.reduce((sum, s) => sum + s.total, 0),
    pending: stats.reduce((sum, s) => sum + s.pending, 0),
    processing: stats.reduce((sum, s) => sum + s.processing, 0),
    completed: stats.reduce((sum, s) => sum + s.completed, 0),
    delayed: stats.reduce((sum, s) => sum + s.delayed, 0),
    urgent: stats.reduce((sum, s) => sum + s.urgent, 0)
  }
})

const myBuildingOrders = computed(() => {
  return workOrderStore.workOrders.filter(o =>
    myBuildings.value.includes(o.building)
  )
})

const recentUrgentOrders = computed(() => {
  return myBuildingOrders.value
    .filter(o => o.urgency === 'urgent' && o.status !== 'completed')
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

const todayCompletedOrders = computed(() => {
  const today = new Date().toDateString()
  return myBuildingOrders.value.filter(o => {
    if (o.status !== 'completed') return false
    return new Date(o.completeTime).toDateString() === today
  })
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  border: none;
  border-radius: 8px;
}

.stat-card.total {
  background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
}

.stat-card.pending {
  background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
}

.stat-card.processing {
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.stat-card.urgent {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
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

.stat-card.total .stat-icon { color: #909399; }
.stat-card.pending .stat-icon { color: #e6a23c; }
.stat-card.processing .stat-icon { color: #409eff; }
.stat-card.urgent .stat-icon { color: #f56c6c; }

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

.urgent-order-item {
  padding: 12px;
  border: 1px solid #fde2e2;
  background: #fef0f0;
  border-radius: 6px;
  margin-bottom: 10px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.order-id {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.order-info {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.order-time {
  color: #909399;
}
</style>
