<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">调度主管首页</h2>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="4">
        <el-card class="stat-card pending">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ workOrderStore.pendingOrders.length }}</div>
            <div class="stat-label">待派单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card processing">
          <div class="stat-icon"><el-icon><Setting /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ workOrderStore.processingOrders.length }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card delayed">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ workOrderStore.delayedOrders.length }}</div>
            <div class="stat-label">已延期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card completed">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ workOrderStore.completedOrders.length }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card urgent">
          <div class="stat-icon"><el-icon><BellFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ urgentCount }}</div>
            <div class="stat-label">紧急工单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card merged">
          <div class="stat-icon"><el-icon><Share /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ mergedCount }}</div>
            <div class="stat-label">合并工单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>待处理紧急工单</span>
              <el-button type="primary" text @click="router.push('/dispatcher/pool')">查看全部</el-button>
            </div>
          </template>
          <div v-if="urgentPendingOrders.length > 0">
            <WorkOrderCard
              v-for="order in urgentPendingOrders.slice(0, 3)"
              :key="order.id"
              :order="order"
            >
              <template #actions>
                <el-button type="primary" size="small" @click="goToAssign(order.id)">
                  立即派单
                </el-button>
              </template>
            </WorkOrderCard>
          </div>
          <el-empty v-else description="暂无紧急工单" :image-size="80" />
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="mb-20">
          <template #header>
            <span>维修师傅状态</span>
          </template>
          <el-table :data="workerStatus" size="small">
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
                <span>{{ row.buildings.join('、') }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="orderCount" label="当前工单" width="100">
              <template #default="{ row }">
                <el-badge :value="row.orderCount" :max="99" class="item">
                  <span>{{ row.orderCount }}</span>
                </el-badge>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card>
          <template #header>
            <span>楼栋工单统计</span>
          </template>
          <el-table :data="buildingStats" size="small">
            <el-table-column prop="building" label="楼栋" />
            <el-table-column prop="total" label="总数" width="60" />
            <el-table-column prop="pending" label="待处理" width="70">
              <template #default="{ row }">
                <span v-if="row.pending > 0" class="status-pending">{{ row.pending }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="processing" label="处理中" width="70">
              <template #default="{ row }">
                <span v-if="row.processing > 0" class="status-processing">{{ row.processing }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="urgent" label="紧急" width="60">
              <template #default="{ row }">
                <span v-if="row.urgent > 0" class="status-delayed">{{ row.urgent }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
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
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const urgentCount = computed(() => {
  return workOrderStore.workOrders.filter(o => o.urgency === 'urgent' && o.status !== 'completed').length
})

const mergedCount = computed(() => {
  return workOrderStore.workOrders.filter(o => o.mergedCount > 0).length
})

const urgentPendingOrders = computed(() => {
  return workOrderStore.workOrders
    .filter(o => o.urgency === 'urgent' && o.status === 'pending')
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

const workerStatus = computed(() => {
  const workers = userStore.getWorkers()
  return workers.map(worker => ({
    ...worker,
    orderCount: workOrderStore.getOrdersByWorker(worker.id)
      .filter(o => ['assigned', 'processing', 'delayed'].includes(o.status)).length
  }))
})

const buildingStats = computed(() => {
  return workOrderStore.getBuildingStats()
})

function goToAssign(id) {
  router.push(`/dispatcher/assign/${id}`)
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

.stat-card.pending {
  background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
}

.stat-card.processing {
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.stat-card.delayed {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-card.completed {
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}

.stat-card.urgent {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-card.merged {
  background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
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

.stat-card.pending .stat-icon { color: #e6a23c; }
.stat-card.processing .stat-icon { color: #409eff; }
.stat-card.delayed .stat-icon { color: #f56c6c; }
.stat-card.completed .stat-icon { color: #67c23a; }
.stat-card.urgent .stat-icon { color: #f56c6c; }
.stat-card.merged .stat-icon { color: #909399; }

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
