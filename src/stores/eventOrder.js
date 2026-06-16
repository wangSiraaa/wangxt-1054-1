import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEventOrderStore = defineStore('eventOrder', () => {
  const eventOrders = ref([
    {
      id: 'EVT202401001',
      title: '1号楼集中停电事件',
      building: '1号楼',
      description: '1号楼多间宿舍反映夜间断电，疑似配电箱故障',
      status: 'processing',
      createTime: '2024-01-15 22:30:00',
      createdBy: 3,
      createdByName: '王主管',
      childWorkOrderIds: ['WO202401003', 'WO202401010', 'WO202401011'],
      closedTime: null,
      closeNote: null
    },
    {
      id: 'EVT202401002',
      title: '2号楼管道堵塞事件',
      building: '2号楼',
      description: '2号楼405周边宿舍下水道堵塞，需集中疏通',
      status: 'pending',
      createTime: '2024-01-15 08:30:00',
      createdBy: 3,
      createdByName: '王主管',
      childWorkOrderIds: ['WO202401006'],
      closedTime: null,
      closeNote: null
    }
  ])

  const eventStatusList = [
    { value: 'pending', label: '待处理', className: 'status-pending' },
    { value: 'processing', label: '处理中', className: 'status-processing' },
    { value: 'completed', label: '已完成', className: 'status-completed' },
    { value: 'closed', label: '已关闭', className: 'status-cancelled' }
  ]

  const pendingEvents = computed(() => eventOrders.value.filter(e => e.status === 'pending'))
  const processingEvents = computed(() => eventOrders.value.filter(e => e.status === 'processing'))
  const completedEvents = computed(() => eventOrders.value.filter(e => ['completed', 'closed'].includes(e.status)))

  function getEventStatusInfo(status) {
    return eventStatusList.find(s => s.value === status) || { label: '未知', className: '' }
  }

  function getEventById(id) {
    return eventOrders.value.find(e => e.id === id)
  }

  function getEventsByBuilding(building) {
    return eventOrders.value.filter(e => e.building === building)
  }

  function createEventFromOrders(orderIds, workOrderStore) {
    const orders = orderIds
      .map(id => workOrderStore.getOrderById(id))
      .filter(Boolean)

    if (orders.length < 2) return null

    const building = orders[0].building
    const problemTypes = [...new Set(orders.map(o => o.problemTypeName))]

    const newEvent = {
      id: 'EVT' + Date.now().toString().slice(-9),
      title: `${building}${problemTypes.join('/')}集中事件`,
      building,
      description: `由 ${orders.length} 条报修工单合并创建：${orders.map(o => `${o.room}-${o.studentName}(${o.problemTypeName})`).join('、')}`,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      createdBy: workOrderStore.currentUser?.id || null,
      createdByName: workOrderStore.currentUser?.name || '系统',
      childWorkOrderIds: [...orderIds],
      closedTime: null,
      closeNote: null
    }

    orders.forEach(order => {
      order.eventId = newEvent.id
    })

    eventOrders.value.unshift(newEvent)
    return newEvent
  }

  function splitEventToWorker(eventId, workOrderIds, workerId, workerName, workOrderStore) {
    const event = getEventById(eventId)
    if (!event) return null

    const targetOrders = workOrderIds
      .map(id => workOrderStore.getOrderById(id))
      .filter(o => o && event.childWorkOrderIds.includes(o.id))

    if (targetOrders.length === 0) return null

    targetOrders.forEach(order => {
      workOrderStore.assignWorkOrder(order.id, workerId, workerName)
    })

    if (event.status === 'pending') {
      event.status = 'processing'
    }

    return targetOrders
  }

  function addWorkOrderToEvent(eventId, workOrderId) {
    const event = getEventById(eventId)
    if (event && !event.childWorkOrderIds.includes(workOrderId)) {
      event.childWorkOrderIds.push(workOrderId)
      return true
    }
    return false
  }

  function removeWorkOrderFromEvent(eventId, workOrderId) {
    const event = getEventById(eventId)
    if (event) {
      event.childWorkOrderIds = event.childWorkOrderIds.filter(id => id !== workOrderId)
      if (event.childWorkOrderIds.length === 0) {
        event.status = 'closed'
        event.closedTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
        event.closeNote = '所有工单已移出，事件自动关闭'
      }
      return true
    }
    return false
  }

  function closeEvent(eventId, note) {
    const event = getEventById(eventId)
    if (event) {
      event.status = 'closed'
      event.closedTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      event.closeNote = note || ''
      return true
    }
    return false
  }

  function findExistingDelayedEvent(building, room, problemTypeId, workOrderStore) {
    const delayedOrders = workOrderStore.workOrders.filter(o =>
      o.building === building &&
      o.room === room &&
      o.problemTypeId === problemTypeId &&
      o.status === 'delayed' &&
      o.eventId
    )

    if (delayedOrders.length > 0) {
      return getEventById(delayedOrders[0].eventId)
    }
    return null
  }

  function getEventStats() {
    const buildings = ['1号楼', '2号楼', '3号楼']
    return buildings.map(building => {
      const events = getEventsByBuilding(building)
      return {
        building,
        totalEvents: events.length,
        pendingEvents: events.filter(e => e.status === 'pending').length,
        processingEvents: events.filter(e => e.status === 'processing').length,
        completedEvents: events.filter(e => ['completed', 'closed'].includes(e.status)).length,
        totalChildOrders: events.reduce((sum, e) => sum + e.childWorkOrderIds.length, 0)
      }
    })
  }

  function initFromStorage() {
    const str = localStorage.getItem('eventOrders')
    if (str) {
      eventOrders.value = JSON.parse(str)
    }
  }

  function saveToStorage() {
    localStorage.setItem('eventOrders', JSON.stringify(eventOrders.value))
  }

  return {
    eventOrders,
    eventStatusList,
    pendingEvents,
    processingEvents,
    completedEvents,
    getEventStatusInfo,
    getEventById,
    getEventsByBuilding,
    createEventFromOrders,
    splitEventToWorker,
    addWorkOrderToEvent,
    removeWorkOrderFromEvent,
    closeEvent,
    findExistingDelayedEvent,
    getEventStats,
    initFromStorage,
    saveToStorage
  }
})
