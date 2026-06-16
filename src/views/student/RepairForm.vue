<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我要报修</h2>
    </div>

    <el-card>
      <el-form
        ref="repairFormRef"
        :model="repairForm"
        :rules="repairRules"
        label-width="100px"
        class="repair-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋" prop="building">
              <el-select v-model="repairForm.building" placeholder="请选择楼栋">
                <el-option label="1号楼" value="1号楼" />
                <el-option label="2号楼" value="2号楼" />
                <el-option label="3号楼" value="3号楼" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房间号" prop="room">
              <el-input v-model="repairForm.room" placeholder="请输入房间号，如：302" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="问题类型" prop="problemTypeId">
              <el-select v-model="repairForm.problemTypeId" placeholder="请选择问题类型">
                <el-option
                  v-for="type in workOrderStore.problemTypes"
                  :key="type.id"
                  :label="type.name + (type.isUrgent ? ' (紧急)' : '')"
                  :value="type.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度" prop="urgency">
              <el-radio-group v-model="repairForm.urgency">
                <el-radio
                  v-for="level in workOrderStore.urgencyLevels"
                  :key="level.value"
                  :value="level.value"
                >
                  <el-tag :class="level.className">{{ level.label }}</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="repairForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述问题情况..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传照片">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            list-type="picture-card"
            accept="image/*"
            multiple
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">照片占位，最多上传5张图片</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-alert
          v-if="isUrgentType"
          title="该问题类型为紧急问题，系统将自动设置为紧急程度并置顶处理"
          type="warning"
          show-icon
          :closable="false"
          class="mb-20"
        />

        <el-form-item>
          <el-button type="primary" size="large" @click="submitRepair" :loading="loading">
            提交报修
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="mergeVisible" title="发现相似工单" width="500px">
      <div class="merge-content">
        <p>系统发现您所在宿舍已有相同类型的报修：</p>
        <div class="merge-order-info">
          <el-tag type="primary">工单号：{{ mergedOrder?.id }}</el-tag>
          <p>问题类型：{{ mergedOrder?.problemTypeName }}</p>
          <p>位置：{{ mergedOrder?.building }} {{ mergedOrder?.room }}</p>
          <p>已有 {{ mergedOrder?.mergedCount + 1 }} 人报修此问题</p>
        </div>
        <p class="merge-tip">您的报修将自动合并到该工单处理，是否继续？</p>
      </div>
      <template #footer>
        <el-button @click="mergeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMerge">确认合并</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'

const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const repairFormRef = ref()
const loading = ref(false)
const fileList = ref([])
const mergeVisible = ref(false)
const mergedOrder = ref(null)
const pendingOrderData = ref(null)

const repairForm = reactive({
  building: userStore.currentUser?.building || '',
  room: userStore.currentUser?.room || '',
  problemTypeId: null,
  description: '',
  urgency: 'normal'
})

const repairRules = {
  building: [{ required: true, message: '请选择楼栋', trigger: 'change' }],
  room: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
  problemTypeId: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }]
}

const isUrgentType = computed(() => {
  if (!repairForm.problemTypeId) return false
  const type = workOrderStore.getProblemType(repairForm.problemTypeId)
  return type?.isUrgent || false
})

function handleFileChange(file) {
  fileList.value.push(file)
}

function handleFileRemove(file) {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

function submitRepair() {
  if (!repairFormRef.value) return
  repairFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      const orderData = {
        studentId: userStore.currentUser.id,
        studentName: userStore.currentUser.name,
        building: repairForm.building,
        room: repairForm.room,
        problemTypeId: repairForm.problemTypeId,
        description: repairForm.description,
        urgency: repairForm.urgency,
        photos: fileList.value.map((f, idx) => `photo_${Date.now()}_${idx}.jpg`),
        requiredSpareParts: []
      }

      setTimeout(() => {
        const existingOrder = workOrderStore.workOrders.find(o =>
          o.building === orderData.building &&
          o.room === orderData.room &&
          o.problemTypeId === orderData.problemTypeId &&
          ['pending', 'assigned', 'processing'].includes(o.status)
        )

        if (existingOrder) {
          mergedOrder.value = existingOrder
          pendingOrderData.value = orderData
          mergeVisible.value = true
          loading.value = false
        } else {
          createOrder(orderData)
        }
      }, 500)
    }
  })
}

function confirmMerge() {
  if (pendingOrderData.value) {
    createOrder(pendingOrderData.value)
  }
  mergeVisible.value = false
}

function createOrder(orderData) {
  const newOrder = workOrderStore.createWorkOrder(orderData)
  loading.value = false
  if (newOrder.mergedCount > 0 || newOrder.mergedFrom.length > 0) {
    ElMessage.success(`报修已提交，已合并到工单 ${newOrder.id}`)
  } else {
    ElMessage.success(`报修已提交，工单号：${newOrder.id}`)
  }
  workOrderStore.saveToStorage()
  router.push('/student/my-repairs')
}

function resetForm() {
  repairFormRef.value?.resetFields()
  repairForm.building = userStore.currentUser?.building || ''
  repairForm.room = userStore.currentUser?.room || ''
  fileList.value = []
}
</script>

<style scoped>
.repair-form {
  max-width: 900px;
}

.merge-content {
  padding: 10px 0;
}

.merge-order-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.merge-order-info p {
  margin: 8px 0;
  color: #606266;
}

.merge-tip {
  color: #409eff;
  font-weight: 500;
}

:deep(.el-radio) {
  margin-right: 15px;
}
</style>
