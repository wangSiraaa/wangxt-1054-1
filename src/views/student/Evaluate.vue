<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">评价服务</h2>
      <el-button @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card v-if="order">
      <div class="order-summary">
        <h3>工单信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ order.id }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">{{ order.problemTypeName }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ order.building }} {{ order.room }}</el-descriptions-item>
          <el-descriptions-item label="维修师傅">{{ order.workerName }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ order.completeTime }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="evaluation-section" v-if="!order.evaluation">
        <h3>服务评价</h3>
        <el-form :model="evaluateForm" label-width="100px">
          <el-form-item label="服务评分" required>
            <el-rate
              v-model="evaluateForm.score"
              :max="5"
              show-score
              text-color="#ff9900"
              score-template="{value} 分"
            />
          </el-form-item>
          <el-form-item label="评价标签">
            <el-checkbox-group v-model="evaluateForm.tags">
              <el-checkbox label="响应及时">响应及时</el-checkbox>
              <el-checkbox label="技术专业">技术专业</el-checkbox>
              <el-checkbox label="服务态度好">服务态度好</el-checkbox>
              <el-checkbox label="一次修好">一次修好</el-checkbox>
              <el-checkbox label="备件齐全">备件齐全</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="评价内容">
            <el-input
              v-model="evaluateForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入您的评价..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" @click="submitEvaluation" :loading="loading">
              提交评价
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="evaluation-result" v-else>
        <h3>您已评价</h3>
        <el-rate v-model="order.evaluation.score" disabled show-score text-color="#ff9900" />
        <p class="comment">{{ order.evaluation.comment }}</p>
        <p class="evaluate-time">评价时间：{{ order.evaluation.time }}</p>
      </div>
    </el-card>

    <el-empty v-else description="工单不存在" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWorkOrderStore } from '@/stores/workOrder'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workOrderStore = useWorkOrderStore()

const loading = ref(false)

const orderId = computed(() => route.params.id)

const order = computed(() => {
  if (!orderId.value) return null
  return workOrderStore.getOrderById(orderId.value)
})

const evaluateForm = reactive({
  score: 5,
  tags: [],
  comment: ''
})

function submitEvaluation() {
  if (!order.value) return
  if (evaluateForm.score === 0) {
    ElMessage.warning('请选择评分')
    return
  }
  loading.value = true
  setTimeout(() => {
    let comment = evaluateForm.comment
    if (evaluateForm.tags.length > 0) {
      comment = `【${evaluateForm.tags.join('】【')}】 ${comment}`.trim()
    }
    const success = workOrderStore.evaluateOrder(
      order.value.id,
      userStore.currentUser.id,
      evaluateForm.score,
      comment
    )
    loading.value = false
    if (success) {
      workOrderStore.saveToStorage()
      ElMessage.success('评价提交成功')
      setTimeout(() => {
        router.push('/student/my-repairs')
      }, 1000)
    } else {
      ElMessage.error('评价失败')
    }
  }, 500)
}
</script>

<style scoped>
.order-summary {
  margin-bottom: 30px;
}

.evaluation-section h3,
.evaluation-result h3 {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.comment {
  font-size: 15px;
  color: #606266;
  margin: 15px 0;
  line-height: 1.8;
}

.evaluate-time {
  color: #909399;
  font-size: 13px;
}

:deep(.el-rate) {
  font-size: 24px;
}
</style>
