<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">可接工单</h2>
      <div class="filter-bar">
        <el-select v-model="buildingFilter" placeholder="全部楼栋" style="width: 130px; margin-right: 10px;" clearable>
          <el-option
            v-for="b in userStore.currentUser?.buildings"
            :key="b"
            :label="b"
            :value="b"
          />
        </el-select>
        <el-select v-model="urgencyFilter" placeholder="全部紧急程度" style="width: 130px;" clearable>
          <el-option
            v-for="level in workOrderStore.urgencyLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
          />
        </el-select>
      </div>
    </div>

    <el-alert
      title="系统已根据您的技能和楼栋权限自动筛选可接工单"
      type="info"
      show-icon
      :closable="false"
      class="mb-20"
    />

    <div v-if="filteredOrders.length > 0">
      <WorkOrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
      >
        <template #actions>
          <el-button
            size="small"
            @click="checkSpareParts(order)"
          >
            查看备件
          </el-button>
          <el-button
            type="primary"
            size="small"
            @click="acceptOrder(order)"
          >
            接单
          </el-button>
        </template>
      </WorkOrderCard>
    </div>
    <el-empty v-else description="暂无可接工单" />

    <el-dialog v-model="sparePartsVisible" title="备件详情" width="500px">
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
        </div>
        <el-empty v-else description="该工单无需备件" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'
import WorkOrderCard from '@/components/WorkOrderCard.vue'

const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const buildingFilter = ref('')
const urgencyFilter = ref('')
const sparePartsVisible = ref(false)
const currentOrder = ref(null)

const availableOrders = computed(() => {
  if (!userStore.currentUser) return []
  return workOrderStore.getAvailableOrdersForWorker(userStore.currentUser)
})

const filteredOrders = computed(() => {
  let orders = availableOrders.value
  if (buildingFilter.value) {
    orders = orders.filter(o => o.building === buildingFilter.value)
  }
  if (urgencyFilter.value) {
    orders = orders.filter(o => o.urgency === urgencyFilter.value)
  }
  return orders.sort((a, b) => {
    const urgencyPriority = { urgent: 0, high: 1, normal: 2, low: 3 }
    return urgencyPriority[a.urgency] - urgencyPriority[b.urgency]
  })
})

function checkStock(partId, quantity) {
  return sparePartsStore.checkStock(partId, quantity)
}

function checkSpareParts(order) {
  currentOrder.value = order
  sparePartsVisible.value = true
}

function acceptOrder(order) {
  const hasEnoughStock = order.requiredSpareParts.every(part =>
    checkStock(part.sparePartId, part.quantity)
  )

  if (!hasEnoughStock) {
    ElMessageBox.confirm(
      '该工单所需备件库存不足，是否仍要接单？接单后将通知备件管理员补货。',
      '备件不足提醒',
      {
        confirmButtonText: '仍要接单',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      doAccept(order)
    }).catch(() => {})
  } else {
    ElMessageBox.confirm(`确定要接单 ${order.id} 吗？`, '确认接单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }).then(() => {
      doAccept(order)
    }).catch(() => {})
  }
}

function doAccept(order) {
  workOrderStore.assignWorkOrder(order.id, userStore.currentUser.id, userStore.currentUser.name)
  workOrderStore.acceptOrder(order.id, userStore.currentUser.id)

  order.requiredSpareParts.forEach(part => {
    sparePartsStore.consumeStock(part.sparePartId, part.quantity)
  })

  workOrderStore.saveToStorage()
  sparePartsStore.saveToStorage()
  ElMessage.success('接单成功')
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}
</style>
