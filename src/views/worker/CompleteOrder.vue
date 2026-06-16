<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">完工确认</h2>
      <el-button @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card v-if="order" class="mb-20">
      <div class="order-info">
        <div class="order-id">
          {{ order.id }}
          <el-tag :class="workOrderStore.getUrgencyInfo(order.urgency).className">
            {{ workOrderStore.getUrgencyInfo(order.urgency).label }}
          </el-tag>
        </div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="问题类型">{{ order.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ order.building }} {{ order.room }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ order.studentName }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="派单时间">{{ order.assignedTime }}</el-descriptions-item>
          <el-descriptions-item label="开始处理">{{ order.startProcessTime }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="3">{{ order.description }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="order.requiredSpareParts.length > 0" class="mt-20">
        <h4>备件使用确认</h4>
        <el-table :data="order.requiredSpareParts" size="small">
          <el-table-column prop="sparePartName" label="备件名称" />
          <el-table-column prop="quantity" label="使用数量" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag type="success">已出库</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <h3>完工信息</h3>
      </template>
      <el-form :model="completeForm" :rules="completeRules" ref="completeFormRef" label-width="120px">
        <el-form-item label="处理结果" prop="result">
          <el-radio-group v-model="completeForm.result">
            <el-radio value="success">维修成功</el-radio>
            <el-radio value="need-replace">需要更换部件</el-radio>
            <el-radio value="spare-parts">备件不足，需延期</el-radio>
            <el-radio value="other">其他原因</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="完工说明" prop="note">
          <el-input
            v-model="completeForm.note"
            type="textarea"
            :rows="4"
            placeholder="请详细说明维修情况..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传完工照片">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            list-type="picture-card"
            accept="image/*"
            multiple
            :limit="3"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item v-if="completeForm.result === 'spare-parts'" label="预计完成时间" prop="delayEndTime">
          <el-date-picker
            v-model="completeForm.delayEndTime"
            type="datetime"
            placeholder="选择预计完成时间"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item v-if="completeForm.result === 'spare-parts'" label="缺少备件" prop="missingParts">
          <el-select v-model="completeForm.missingPartIds" multiple placeholder="请选择缺少的备件" style="width: 100%;">
            <el-option
              v-for="part in order.requiredSpareParts"
              :key="part.sparePartId"
              :label="part.sparePartName"
              :value="part.sparePartId"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" @click="submitComplete" :loading="loading">
            确认完工
          </el-button>
          <el-button size="large" @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'
import { useSparePartsStore } from '@/stores/spareParts'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()
const sparePartsStore = useSparePartsStore()

const loading = ref(false)
const completeFormRef = ref()
const fileList = ref([])

const orderId = computed(() => route.params.id)

const order = computed(() => {
  if (!orderId.value) return null
  return workOrderStore.getOrderById(orderId.value)
})

const completeForm = reactive({
  result: 'success',
  note: '',
  delayEndTime: '',
  missingPartIds: []
})

const completeRules = {
  result: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  note: [{ required: true, message: '请输入完工说明', trigger: 'blur' }],
  delayEndTime: [{ required: true, message: '请选择预计完成时间', trigger: 'change' }],
  missingParts: [{ required: true, message: '请选择缺少的备件', trigger: 'change' }]
}

function handleFileChange(file) {
  fileList.value.push(file)
}

function handleFileRemove(file) {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

function submitComplete() {
  if (!completeFormRef.value || !order.value) return

  completeFormRef.value.validate((valid) => {
    if (!valid) return

    if (completeForm.result === 'spare-parts') {
      ElMessageBox.confirm(
        '确认要因备件不足延期吗？系统将通知备件管理员补货。',
        '延期确认',
        { type: 'warning' }
      ).then(() => {
        doDelay()
      }).catch(() => {})
    } else {
      ElMessageBox.confirm(
        '确认工单已完成吗？确认后将开放学生评价。',
        '完工确认',
        { type: 'info' }
      ).then(() => {
        doComplete()
      }).catch(() => {})
    }
  })
}

function doComplete() {
  loading.value = true
  setTimeout(() => {
    let note = completeForm.note
    const resultMap = {
      'success': '【维修成功】',
      'need-replace': '【需要更换部件】',
      'other': '【其他】'
    }
    note = (resultMap[completeForm.result] || '') + note

    workOrderStore.completeOrder(order.value.id, note)
    workOrderStore.saveToStorage()

    loading.value = false
    ElMessage.success('工单已完成，已开放学生评价')
    setTimeout(() => {
      router.push('/worker/my-orders')
    }, 1000)
  }, 500)
}

function doDelay() {
  loading.value = true
  setTimeout(() => {
    let reason = '备件不足：'
    const missingPartNames = completeForm.missingPartIds.map(id => {
      const part = order.value.requiredSpareParts.find(p => p.sparePartId === id)
      return part?.sparePartName || ''
    }).filter(Boolean)
    reason += missingPartNames.join('、')
    if (completeForm.note) {
      reason += '。' + completeForm.note
    }

    workOrderStore.delayOrder(order.value.id, reason, completeForm.delayEndTime)

    workOrderStore.addNotification({
      userId: 9,
      title: '备件不足紧急通知',
      content: `工单 ${order.value.id} 因备件不足延期，请及时补货：${missingPartNames.join('、')}`,
      type: 'spareParts'
    })

    workOrderStore.saveToStorage()

    loading.value = false
    ElMessage.success('工单已延期，已通知备件管理员')
    setTimeout(() => {
      router.push('/worker/my-orders')
    }, 1000)
  }, 500)
}
</script>

<style scoped>
.order-id {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
