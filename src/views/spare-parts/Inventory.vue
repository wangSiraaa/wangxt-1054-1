<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">库存管理</h2>
      <div class="filter-bar">
        <el-select v-model="categoryFilter" placeholder="全部分类" style="width: 150px; margin-right: 10px;" clearable>
          <el-option
            v-for="cat in sparePartsStore.categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索备件名称/编码"
          style="width: 200px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新增备件
        </el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="filteredParts" size="default">
        <el-table-column prop="code" label="编码" width="100" fixed />
        <el-table-column prop="name" label="备件名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="150">
          <template #default="{ row }">
            <div class="stock-info">
              <span :class="{ 'status-delayed': row.stock < row.minStock, 'status-pending': row.stock === 0 }">
                {{ row.stock }}
              </span>
              <span class="stock-unit">{{ row.unit }}</span>
              <el-progress
                :percentage="Math.min(Math.round((row.stock / (row.minStock * 2)) * 100), 100)"
                :stroke-width="6"
                :color="row.stock < row.minStock ? '#f56c6c' : '#67c23a'"
                style="flex: 1; margin-left: 10px;"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" width="100">
          <template #default="{ row }">
            {{ row.minStock }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.stock === 0" type="danger" size="small">缺货</el-tag>
            <el-tag v-else-if="row.stock < row.minStock" type="warning" size="small">库存低</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showRestockDialog(row)">
              补货
            </el-button>
            <el-button type="warning" link size="small" @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="新增备件" width="500px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备件编码" prop="code">
              <el-input v-model="addForm.code" placeholder="如：SP011" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备件名称" prop="name">
              <el-input v-model="addForm.name" placeholder="请输入备件名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="addForm.category" placeholder="请选择分类" style="width: 100%;">
                <el-option
                  v-for="cat in sparePartsStore.categories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="addForm.unit" placeholder="如：个、副、瓶" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="初始库存" prop="stock">
              <el-input-number v-model="addForm.stock" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低库存" prop="minStock">
              <el-input-number v-model="addForm.minStock" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库位" prop="location">
              <el-input v-model="addForm.location" placeholder="如：A区-07" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认新增</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑备件" width="500px">
      <template v-if="currentPart">
        <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="备件编码">
                <el-input v-model="editForm.code" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备件名称" prop="name">
                <el-input v-model="editForm.name" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分类" prop="category">
                <el-select v-model="editForm.category" style="width: 100%;">
                  <el-option
                    v-for="cat in sparePartsStore.categories"
                    :key="cat"
                    :label="cat"
                    :value="cat"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-input v-model="editForm.unit" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="当前库存">
                <el-input-number v-model="editForm.stock" :min="0" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="最低库存" prop="minStock">
                <el-input-number v-model="editForm.minStock" :min="1" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="库位" prop="location">
                <el-input v-model="editForm.location" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确认修改</el-button>
      </template>
    </el-dialog>

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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useSparePartsStore } from '@/stores/spareParts'
import { useWorkOrderStore } from '@/stores/workOrder'

const sparePartsStore = useSparePartsStore()
const workOrderStore = useWorkOrderStore()

const categoryFilter = ref('')
const searchKeyword = ref('')
const addVisible = ref(false)
const editVisible = ref(false)
const restockVisible = ref(false)
const currentPart = ref(null)
const addFormRef = ref()
const editFormRef = ref()

const addForm = reactive({
  code: '',
  name: '',
  category: '',
  unit: '',
  stock: 0,
  minStock: 5,
  location: ''
})

const editForm = reactive({
  id: null,
  code: '',
  name: '',
  category: '',
  unit: '',
  stock: 0,
  minStock: 5,
  location: ''
})

const restockForm = reactive({
  quantity: 10
})

const addRules = {
  code: [{ required: true, message: '请输入备件编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入初始库存', trigger: 'change' }],
  minStock: [{ required: true, message: '请输入最低库存', trigger: 'change' }],
  location: [{ required: true, message: '请输入库位', trigger: 'blur' }]
}

const editRules = {
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  minStock: [{ required: true, message: '请输入最低库存', trigger: 'change' }],
  location: [{ required: true, message: '请输入库位', trigger: 'blur' }]
}

const filteredParts = computed(() => {
  let parts = sparePartsStore.spareParts
  if (categoryFilter.value) {
    parts = parts.filter(p => p.category === categoryFilter.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    parts = parts.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword)
    )
  }
  return parts
})

function showAddDialog() {
  addForm.code = 'SP' + String(sparePartsStore.spareParts.length + 1).padStart(3, '0')
  addForm.name = ''
  addForm.category = ''
  addForm.unit = ''
  addForm.stock = 0
  addForm.minStock = 5
  addForm.location = ''
  addVisible.value = true
}

function showEditDialog(part) {
  currentPart.value = part
  editForm.id = part.id
  editForm.code = part.code
  editForm.name = part.name
  editForm.category = part.category
  editForm.unit = part.unit
  editForm.stock = part.stock
  editForm.minStock = part.minStock
  editForm.location = part.location
  editVisible.value = true
}

function showRestockDialog(part) {
  currentPart.value = part
  restockForm.quantity = Math.max(part.minStock - part.stock + 5, 1)
  restockVisible.value = true
}

function submitAdd() {
  if (!addFormRef.value) return
  addFormRef.value.validate((valid) => {
    if (valid) {
      const newPart = {
        id: Date.now(),
        ...addForm
      }
      sparePartsStore.spareParts.push(newPart)
      sparePartsStore.saveToStorage()
      ElMessage.success('新增成功')
      addVisible.value = false
    }
  })
}

function submitEdit() {
  if (!editFormRef.value || !currentPart.value) return
  editFormRef.value.validate((valid) => {
    if (valid) {
      const part = sparePartsStore.getPartById(editForm.id)
      if (part) {
        part.name = editForm.name
        part.category = editForm.category
        part.unit = editForm.unit
        part.stock = editForm.stock
        part.minStock = editForm.minStock
        part.location = editForm.location
        sparePartsStore.saveToStorage()
        ElMessage.success('修改成功')
      }
      editVisible.value = false
    }
  })
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
      content: `${currentPart.value.name} 已补货 ${restockForm.quantity} ${currentPart.value.unit}，工单 ${order.id} 可以继续处理`,
      type: 'spareParts'
    })
    workOrderStore.addNotification({
      userId: order.studentId,
      title: '备件补货通知',
      content: `您的工单 ${order.id} 所需备件已补货，即将恢复处理`,
      type: 'spareParts'
    })
  })

  sparePartsStore.saveToStorage()
  workOrderStore.saveToStorage()
  ElMessage.success(`已补货 ${restockForm.quantity} ${currentPart.value.unit}`)
  restockVisible.value = false
}

function handleDelete(part) {
  ElMessageBox.confirm(
    `确定要删除备件 "${part.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = sparePartsStore.spareParts.findIndex(p => p.id === part.id)
    if (index > -1) {
      sparePartsStore.spareParts.splice(index, 1)
      sparePartsStore.saveToStorage()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.stock-info {
  display: flex;
  align-items: center;
}

.stock-unit {
  color: #909399;
  margin-left: 4px;
  margin-right: 10px;
}
</style>
