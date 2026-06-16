<template>
  <div class="work-order-card" :class="{ urgent: order.urgency === 'urgent' }">
    <div class="card-header">
      <div class="order-id">
        {{ order.id }}
        <el-tag v-if="order.mergedCount > 0" type="info" size="small" effect="dark">
          合并{{ order.mergedCount }}单
        </el-tag>
      </div>
      <el-tag :class="workOrderStore.getUrgencyInfo(order.urgency).className" size="small">
        {{ workOrderStore.getUrgencyInfo(order.urgency).label }}
      </el-tag>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">问题类型：</span>
        <span class="value">{{ order.problemTypeName }}</span>
      </div>
      <div class="info-row">
        <span class="label">位置：</span>
        <span class="value">{{ order.building }} {{ order.room }}</span>
      </div>
      <div class="info-row">
        <span class="label">报修人：</span>
        <span class="value">{{ order.studentName }}</span>
      </div>
      <div class="info-row description" v-if="order.description">
        <span class="label">描述：</span>
        <span class="value">{{ order.description }}</span>
      </div>
      <div class="info-row">
        <span class="label">状态：</span>
        <span :class="workOrderStore.getStatusInfo(order.status).className">
          {{ workOrderStore.getStatusInfo(order.status).label }}
        </span>
      </div>
      <div class="info-row" v-if="order.workerName">
        <span class="label">维修师傅：</span>
        <span class="value">{{ order.workerName }}</span>
      </div>
      <div class="info-row" v-if="order.delayReason">
        <span class="label">延期原因：</span>
        <span class="value status-delayed">{{ order.delayReason }}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="create-time">{{ order.createTime }}</span>
      <div class="actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="photo-preview" v-if="order.photos && order.photos.length > 0">
      <el-image
        v-for="(photo, idx) in order.photos.slice(0, 3)"
        :key="idx"
        :src="getPlaceholderImage(idx)"
        :preview-src-list="order.photos.map((_, i) => getPlaceholderImage(i))"
        fit="cover"
        class="photo-thumb"
      />
      <span v-if="order.photos.length > 3" class="more-photos">+{{ order.photos.length - 3 }}</span>
    </div>
  </div>
</template>

<script setup>
import { useWorkOrderStore } from '@/stores/workOrder'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const workOrderStore = useWorkOrderStore()

const placeholderImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=water%20leakage%20in%20bathroom%20dorm%20room&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=power%20outage%20electrical%20problem%20dorm&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=broken%20window%20handle%20dorm%20room&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clogged%20drain%20sink%20bathroom&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=broken%20drawer%20slider%20desk&image_size=square'
]

function getPlaceholderImage(index) {
  return placeholderImages[index % placeholderImages.length]
}
</script>

<style scoped>
.work-order-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #dcdfe6;
  transition: all 0.3s;
}

.work-order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.work-order-card.urgent {
  border-left-color: #f56c6c;
  background: linear-gradient(to right, #fef0f0 0%, #fff 20%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-id {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-row.description {
  align-items: flex-start;
}

.info-row .label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #606266;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.create-time {
  font-size: 12px;
  color: #c0c4cc;
}

.actions {
  display: flex;
  gap: 8px;
}

.photo-preview {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  cursor: pointer;
}

.more-photos {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}
</style>
