<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">备件管理首页</h2>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card total">
          <div class="stat-icon"><el-icon><Box /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ sparePartsStore.spareParts.length }}</div>
            <div class="stat-label">备件种类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card low">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ lowStockParts.length }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card delayed">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ delayedOrders.length }}</div>
            <div class="stat-label">延期工单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card out">
          <div class="stat-icon"><el-icon><Close /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ outOfStockParts.length }}</div>
            <div class="stat-label">缺货</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <el-button type="primary" text @click="router.push('/spare-parts/inventory')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="lowStockParts" size="small" v-if="lowStockParts.length > 0">
            <el-table-column prop="code" label="编码" width="100" />
            <el-table-column prop="name" label="备件名称" />
            <el-table-column prop="stock" label="当前库存" width="100">
              <template #default="{ row }">
                <span class="status-delayed">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="minStock" label="最低库存" width="100" />
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column prop="location" label="库位" width="100" />
            <el-table-column label="缺口">
              <template #default="{ row }">
                <span class="status-delayed">-{{ row.minStock - row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="showRestockDialog(row)">
                  补货
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无库存预警" :image-size="60" />
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>待处理延期工单</span>
              <el-button type="primary" text @click="router.push('/spare-parts/delayed-orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <div v-if="delayedOrders.length > 0">
            <div
              v-for="order in delayedOrders.slice(0, 5)"
              :key="order.id"
              class="delayed-order-item"
            >
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <el-tag type="danger" size="small">备件不足</el-tag>
              </div>
              <div class="order-info">
                {{ order.building }} {{ order.room }} - {{ order.problemTypeName }}
              </div>
              <div class="order-reason">
                原因：{{ order.delayReason }}
              </div>
              <div class="order-footer">
                <span class="status-delayed">预计：{{ order.delayEndTime }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无延期工单" :image-size="60" />
        </el-card>

        <el-card>
          <template #header>
            <span>分类统计</span>
          </template>
          <el-table :data="categoryStats" size="small">
            <el-table-column prop="category" label="分类" />
            <el-table-column prop="count" label="种类数" width="80" />
            <el-table-column prop="totalStock" label="总库存" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.lowCount > 0" type="danger" size="small">
                  {{ row.lowCount }}种预警
                </el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="restockVisible" title="备件补货" width="400px">
      <template v-if="currentPart">
        <el-descriptions :column="1" border size="small" class="mb-20">
          <el-descriptions-item label="备件名称">{{ currentPart.name }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentPart.stock }} {{ currentPart.unit }}</el-descriptions-item>
          <el-descriptions-item label="最低库存">{{ currentPart.minStock }} {{ currentPart.unit }}</el-descriptions-item>
        </el-descriptions>
        <el-form :model="restockForm" label-width="100px">
          <el-form-item label="补货数量" required>
            <el-input-number
              v-model="restockForm.quantity"
              :min="1"
              :max="1000"
              style="width: 100%;"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="restockVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">确认补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSparePartsStore } from '@/stores/spareParts'
import { useWorkOrderStore } from '@/stores/workOrder'

const router = useRouter()
const sparePartsStore = useSparePartsStore()
const workOrderStore = useWorkOrderStore()

const restockVisible = ref(false)
const currentPart = ref(null)

const restockForm = reactive({
  quantity: 10
})

const lowStockParts = computed(() => sparePartsStore.getLowStockParts())

const outOfStockParts = computed(() => {
  return sparePartsStore.spareParts.filter(p => p.stock === 0)
})

const delayedOrders = computed(() => workOrderStore.delayedOrders)

const categoryStats = computed(() => {
  return sparePartsStore.categories.map(category => {
    const parts = sparePartsStore.spareParts.filter(p => p.category === category)
    return {
      category,
      count: parts.length,
      totalStock: parts.reduce((sum, p) => sum + p.stock, 0),
      lowCount: parts.filter(p => p.stock < p.minStock).length
    }
  })
})

function showRestockDialog(part) {
  currentPart.value = part
  restockForm.quantity = part.minStock - part.stock + 5
  restockVisible.value = true
}

function submitRestock() {
  if (!currentPart.value) return
  sparePartsStore.restockPart(currentPart.value.id, restockForm.quantity)

  const relatedOrders = workOrderStore.workOrders.filter(o =>
    o.status === 'delayed' &&
    o.requiredSpareParts.some(p => p.sparePartId === currentPart.value.id)
  )

  relatedOrders.forEach(order => {
    workOrderStore.addNotification({
      userId: order.workerId,
      title: '备件补货通知',
      content: `${currentPart.value.name} 已补货，工单 ${order.id} 可以继续处理`,
      type: 'spareParts'
    })
  })

  sparePartsStore.saveToStorage()
  ElMessage.success(`已补货 ${restockForm.quantity} ${currentPart.value.unit}`)
  restockVisible.value = false
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

.stat-card.total {
  background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
}

.stat-card.low {
  background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
}

.stat-card.delayed {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-card.out {
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
.stat-card.low .stat-icon { color: #e6a23c; }
.stat-card.delayed .stat-icon { color: #f56c6c; }
.stat-card.out .stat-icon { color: #f56c6c; }

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

.delayed-order-item {
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
  margin-bottom: 4px;
}

.order-reason {
  font-size: 12px;
  color: #f56c6c;
  margin-bottom: 4px;
}

.order-footer {
  font-size: 12px;
  color: #909399;
}
</style>
