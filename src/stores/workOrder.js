import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWorkOrderStore = defineStore('workOrder', () => {
  const problemTypes = [
    { id: 1, name: '水电维修', isUrgent: false },
    { id: 2, name: '漏水', isUrgent: true },
    { id: 3, name: '断电', isUrgent: true },
    { id: 4, name: '管道疏通', isUrgent: false },
    { id: 5, name: '门窗维修', isUrgent: false },
    { id: 6, name: '家具维修', isUrgent: false },
    { id: 7, name: '电器维修', isUrgent: false },
    { id: 8, name: '网络故障', isUrgent: false }
  ]

  const urgencyLevels = [
    { value: 'urgent', label: '紧急', className: 'urgent-tag' },
    { value: 'high', label: '高', className: 'high-tag' },
    { value: 'normal', label: '普通', className: 'normal-tag' },
    { value: 'low', label: '低', className: 'low-tag' }
  ]

  const workOrders = ref([
    {
      id: 'WO202401001',
      studentId: 1,
      studentName: '张三',
      building: '1号楼',
      room: '302',
      problemTypeId: 2,
      problemTypeName: '漏水',
      description: '卫生间水管漏水，地面有积水',
      photos: ['placeholder1.jpg', 'placeholder2.jpg'],
      urgency: 'urgent',
      status: 'pending',
      createTime: '2024-01-15 09:30:00',
      mergedCount: 2,
      mergedFrom: ['WO202401002'],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 1, sparePartName: '水管密封圈', quantity: 2 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401003',
      studentId: 2,
      studentName: '李四',
      building: '1号楼',
      room: '302',
      problemTypeId: 3,
      problemTypeName: '断电',
      description: '整个宿舍突然断电，其他宿舍正常',
      photos: ['placeholder3.jpg'],
      urgency: 'urgent',
      status: 'processing',
      createTime: '2024-01-15 10:15:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: 4,
      workerName: '李师傅',
      assignedTime: '2024-01-15 10:30:00',
      startProcessTime: '2024-01-15 10:45:00',
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 2, sparePartName: '空气开关', quantity: 1 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: 'EVT202401001',
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401004',
      studentId: 1,
      studentName: '张三',
      building: '1号楼',
      room: '302',
      problemTypeId: 5,
      problemTypeName: '门窗维修',
      description: '窗户把手松动，关不严',
      photos: ['placeholder4.jpg'],
      urgency: 'normal',
      status: 'completed',
      createTime: '2024-01-14 14:20:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: 5,
      workerName: '张师傅',
      assignedTime: '2024-01-14 14:30:00',
      startProcessTime: '2024-01-14 15:00:00',
      completeTime: '2024-01-14 16:30:00',
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [],
      evaluation: {
        score: 5,
        comment: '师傅很专业，很快就修好了',
        time: '2024-01-14 18:00:00'
      },
      transferHistory: [],
      eventId: null,
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401005',
      studentId: 1,
      studentName: '张三',
      building: '1号楼',
      room: '302',
      problemTypeId: 6,
      problemTypeName: '家具维修',
      description: '书桌抽屉滑轨坏了，拉不开',
      photos: ['placeholder5.jpg'],
      urgency: 'low',
      status: 'assigned',
      createTime: '2024-01-15 11:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: 5,
      workerName: '张师傅',
      assignedTime: '2024-01-15 11:30:00',
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 3, sparePartName: '抽屉滑轨', quantity: 1 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401006',
      studentId: 2,
      studentName: '李四',
      building: '2号楼',
      room: '405',
      problemTypeId: 4,
      problemTypeName: '管道疏通',
      description: '下水道堵塞，排水很慢',
      photos: ['placeholder6.jpg'],
      urgency: 'normal',
      status: 'delayed',
      createTime: '2024-01-15 08:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: 4,
      workerName: '李师傅',
      assignedTime: '2024-01-15 08:30:00',
      startProcessTime: null,
      completeTime: null,
      delayReason: '疏通剂库存不足，需要采购',
      delayEndTime: '2024-01-17 18:00:00',
      requiredSpareParts: [
        { sparePartId: 4, sparePartName: '管道疏通剂', quantity: 1 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: 'EVT202401002',
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401007',
      studentId: 1,
      studentName: '张三',
      building: '3号楼',
      room: '201',
      problemTypeId: 1,
      problemTypeName: '水电维修',
      description: '灯泡不亮，需要更换',
      photos: ['placeholder7.jpg'],
      urgency: 'low',
      status: 'pending',
      createTime: '2024-01-15 13:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 5, sparePartName: 'LED灯泡', quantity: 1 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401008',
      studentId: 2,
      studentName: '李四',
      building: '2号楼',
      room: '405',
      problemTypeId: 7,
      problemTypeName: '电器维修',
      description: '空调遥控器失灵',
      photos: ['placeholder8.jpg'],
      urgency: 'high',
      status: 'pending',
      createTime: '2024-01-15 14:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 6, sparePartName: '空调遥控器电池', quantity: 2 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401009',
      studentId: 1,
      studentName: '张三',
      building: '1号楼',
      room: '302',
      problemTypeId: 2,
      problemTypeName: '漏水',
      description: '阳台地漏附近漏水',
      photos: ['placeholder9.jpg'],
      urgency: 'urgent',
      status: 'pending',
      createTime: '2024-01-15 15:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: true,
      originalOrderId: 'WO202401001'
    },
    {
      id: 'WO202401010',
      studentId: 1,
      studentName: '张三',
      building: '1号楼',
      room: '303',
      problemTypeId: 3,
      problemTypeName: '断电',
      description: '宿舍断电，和302一起黑的',
      photos: [],
      urgency: 'urgent',
      status: 'pending',
      createTime: '2024-01-15 22:32:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [],
      evaluation: null,
      transferHistory: [],
      eventId: 'EVT202401001',
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401011',
      studentId: 2,
      studentName: '李四',
      building: '1号楼',
      room: '304',
      problemTypeId: 3,
      problemTypeName: '断电',
      description: '整层断电',
      photos: [],
      urgency: 'urgent',
      status: 'pending',
      createTime: '2024-01-15 22:33:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [],
      evaluation: null,
      transferHistory: [],
      eventId: 'EVT202401001',
      isRework: false,
      originalOrderId: null
    },
    {
      id: 'WO202401012',
      studentId: 1,
      studentName: '张三',
      building: '2号楼',
      room: '405',
      problemTypeId: 4,
      problemTypeName: '管道疏通',
      description: '下水道又堵了，上次还没修好',
      photos: [],
      urgency: 'normal',
      status: 'queued',
      createTime: '2024-01-15 16:00:00',
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: [
        { sparePartId: 4, sparePartName: '管道疏通剂', quantity: 1 }
      ],
      evaluation: null,
      transferHistory: [],
      eventId: 'EVT202401002',
      isRework: false,
      originalOrderId: 'WO202401006'
    }
  ])

  const notifications = ref([
    { id: 1, userId: 1, title: '工单合并通知', content: '您的报修已与其他同学合并处理', time: '2024-01-15 10:00:00', read: false, type: 'merge' },
    { id: 2, userId: 4, title: '新工单分配', content: '您有新的工单待处理', time: '2024-01-15 10:30:00', read: false, type: 'assign' },
    { id: 3, userId: 1, title: '工单完成', content: '您的门窗维修已完成，请评价', time: '2024-01-14 16:30:00', read: true, type: 'complete' },
    { id: 4, userId: 9, title: '备件不足提醒', content: '管道疏通剂库存不足，请及时采购', time: '2024-01-15 09:00:00', read: false, type: 'spareParts' },
    { id: 5, userId: 1, title: '工单延期通知', content: '您的工单因备件不足已延期', time: '2024-01-15 08:30:00', read: true, type: 'delay' }
  ])

  const statusList = [
    { value: 'pending', label: '待派单', className: 'status-pending' },
    { value: 'assigned', label: '已派单', className: 'status-processing' },
    { value: 'processing', label: '处理中', className: 'status-processing' },
    { value: 'delayed', label: '已延期', className: 'status-delayed' },
    { value: 'queued', label: '排队中', className: 'status-queued' },
    { value: 'completed', label: '已完成', className: 'status-completed' },
    { value: 'cancelled', label: '已取消', className: 'status-cancelled' }
  ]

  const pendingOrders = computed(() => workOrders.value.filter(o => o.status === 'pending'))
  const processingOrders = computed(() => workOrders.value.filter(o => ['assigned', 'processing'].includes(o.status)))
  const completedOrders = computed(() => workOrders.value.filter(o => o.status === 'completed'))
  const delayedOrders = computed(() => workOrders.value.filter(o => o.status === 'delayed'))
  const queuedOrders = computed(() => workOrders.value.filter(o => o.status === 'queued'))

  function getOvertimeOrders(hours = 24) {
    const now = new Date()
    return workOrders.value.filter(o => {
      if (['completed', 'cancelled'].includes(o.status)) return false
      const created = new Date(o.createTime)
      const diff = (now - created) / (1000 * 60 * 60)
      return diff > hours
    })
  }

  function getReworkStats() {
    const roomMap = {}
    workOrders.value.forEach(o => {
      const key = `${o.building}-${o.room}`
      if (!roomMap[key]) {
        roomMap[key] = { building: o.building, room: o.room, total: 0, rework: 0 }
      }
      roomMap[key].total++
      if (o.isRework) {
        roomMap[key].rework++
      }
    })
    return Object.values(roomMap)
      .filter(r => r.rework > 0)
      .map(r => ({ ...r, reworkRate: Math.round((r.rework / r.total) * 100) }))
      .sort((a, b) => b.reworkRate - a.reworkRate)
  }

  function getDelayedBySpareParts() {
    return delayedOrders.value
      .filter(o => o.delayReason && (o.delayReason.includes('库存') || o.delayReason.includes('备件') || o.delayReason.includes('不足')))
      .map(o => ({
        orderId: o.id,
        building: o.building,
        room: o.room,
        problemTypeName: o.problemTypeName,
        delayReason: o.delayReason,
        delayEndTime: o.delayEndTime,
        requiredSpareParts: o.requiredSpareParts
      }))
  }

  function getStatusInfo(status) {
    return statusList.find(s => s.value === status) || { label: '未知', className: '' }
  }

  function getUrgencyInfo(urgency) {
    return urgencyLevels.find(u => u.value === urgency) || { label: '未知', className: '' }
  }

  function getProblemType(id) {
    return problemTypes.find(p => p.id === id)
  }

  function getOrdersByStudent(studentId) {
    return workOrders.value.filter(o => o.studentId === studentId)
  }

  function getOrdersByWorker(workerId) {
    return workOrders.value.filter(o => o.workerId === workerId)
  }

  function getOrdersByBuilding(building) {
    return workOrders.value.filter(o => o.building === building)
  }

  function getAvailableOrdersForWorker(worker) {
    return workOrders.value.filter(o => {
      if (o.status !== 'pending') return false
      if (!worker.buildings.includes(o.building)) return false
      const problemType = getProblemType(o.problemTypeId)
      if (problemType && !worker.skills.some(s => problemType.name.includes(s.replace('维修', '')))) {
        if (!worker.skills.includes(problemType.name)) return false
      }
      return true
    })
  }

  function createWorkOrder(orderData) {
    const newId = 'WO' + Date.now().toString().slice(-9)
    const existingOrder = workOrders.value.find(o =>
      o.building === orderData.building &&
      o.room === orderData.room &&
      o.problemTypeId === orderData.problemTypeId &&
      ['pending', 'assigned', 'processing'].includes(o.status)
    )

    if (existingOrder) {
      existingOrder.mergedCount++
      existingOrder.mergedFrom.push(newId)
      addNotification({
        userId: orderData.studentId,
        title: '工单合并通知',
        content: `您的报修已与工单 ${existingOrder.id} 合并处理`,
        type: 'merge'
      })
      addNotification({
        userId: existingOrder.studentId,
        title: '工单合并通知',
        content: `您的工单 ${existingOrder.id} 有新的报修合并进来`,
        type: 'merge'
      })
      return existingOrder
    }

    const delayedOrder = workOrders.value.find(o =>
      o.building === orderData.building &&
      o.room === orderData.room &&
      o.problemTypeId === orderData.problemTypeId &&
      o.status === 'delayed'
    )

    if (delayedOrder) {
      const problemType = getProblemType(orderData.problemTypeId)
      const newOrder = {
        id: newId,
        ...orderData,
        problemTypeName: problemType ? problemType.name : '',
        status: 'queued',
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        mergedCount: 0,
        mergedFrom: [],
        workerId: null,
        workerName: null,
        assignedTime: null,
        startProcessTime: null,
        completeTime: null,
        delayReason: null,
        delayEndTime: null,
        requiredSpareParts: orderData.requiredSpareParts || [],
        evaluation: null,
        transferHistory: [],
        eventId: delayedOrder.eventId,
        isRework: false,
        originalOrderId: delayedOrder.id
      }

      workOrders.value.unshift(newOrder)

      if (delayedOrder.eventId) {
        addNotification({
          userId: orderData.studentId,
          title: '报修排队通知',
          content: `同房间有因"${delayedOrder.delayReason}"挂起的工单，您的报修已排队到事件 ${delayedOrder.eventId} 下，待备件到位后统一处理`,
          type: 'delay'
        })
      } else {
        addNotification({
          userId: orderData.studentId,
          title: '报修排队通知',
          content: `同房间有因"${delayedOrder.delayReason}"挂起的工单，您的报修已排队，待备件到位后统一处理`,
          type: 'delay'
        })
      }

      return newOrder
    }

    const problemType = getProblemType(orderData.problemTypeId)
    let urgency = orderData.urgency
    if (problemType && problemType.isUrgent) {
      urgency = 'urgent'
    }

    const completedSameRoom = workOrders.value.find(o =>
      o.building === orderData.building &&
      o.room === orderData.room &&
      o.problemTypeId === orderData.problemTypeId &&
      o.status === 'completed' &&
      o.completeTime &&
      (new Date() - new Date(o.completeTime)) < 7 * 24 * 60 * 60 * 1000
    )

    const newOrder = {
      id: newId,
      ...orderData,
      problemTypeName: problemType ? problemType.name : '',
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      mergedCount: 0,
      mergedFrom: [],
      workerId: null,
      workerName: null,
      assignedTime: null,
      startProcessTime: null,
      completeTime: null,
      delayReason: null,
      delayEndTime: null,
      requiredSpareParts: orderData.requiredSpareParts || [],
      evaluation: null,
      transferHistory: [],
      eventId: null,
      isRework: !!completedSameRoom,
      originalOrderId: completedSameRoom ? completedSameRoom.id : null
    }

    workOrders.value.unshift(newOrder)

    if (completedSameRoom) {
      addNotification({
        userId: 3,
        title: '返修预警',
        content: `${orderData.building} ${orderData.room} 的 ${problemType?.name} 在7天内返修，请关注`,
        type: 'merge'
      })
    }

    return newOrder
  }

  function assignWorkOrder(orderId, workerId, workerName) {
    const order = workOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'assigned'
      order.workerId = workerId
      order.workerName = workerName
      order.assignedTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      addNotification({
        userId: order.studentId,
        title: '工单已派单',
        content: `您的工单 ${orderId} 已派给 ${workerName} 师傅`,
        type: 'assign'
      })
      addNotification({
        userId: workerId,
        title: '新工单分配',
        content: `您有新的工单 ${orderId} 待处理`,
        type: 'assign'
      })
    }
    return order
  }

  function acceptOrder(orderId, workerId) {
    const order = workOrders.value.find(o => o.id === orderId)
    if (order && order.status === 'assigned') {
      order.status = 'processing'
      order.startProcessTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      addNotification({
        userId: order.studentId,
        title: '工单开始处理',
        content: `${order.workerName} 师傅已开始处理您的工单 ${orderId}`,
        type: 'process'
      })
    }
    return order
  }

  function completeOrder(orderId, completionNote) {
    const order = workOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'completed'
      order.completeTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      order.completionNote = completionNote
      addNotification({
        userId: order.studentId,
        title: '工单已完成',
        content: `您的工单 ${orderId} 已完成，请对服务进行评价`,
        type: 'complete'
      })
    }
    return order
  }

  function transferOrder(orderId, fromWorkerId, toWorkerId, toWorkerName, reason) {
    const order = workOrders.value.find(o => o.id === orderId)
    if (order) {
      order.transferHistory.push({
        fromWorkerId,
        toWorkerId,
        toWorkerName,
        reason,
        time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      })
      order.workerId = toWorkerId
      order.workerName = toWorkerName
      order.assignedTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      order.status = 'assigned'
      order.startProcessTime = null
      addNotification({
        userId: toWorkerId,
        title: '工单转派通知',
        content: `您收到转派工单 ${orderId}`,
        type: 'assign'
      })
      addNotification({
        userId: order.studentId,
        title: '工单转派通知',
        content: `您的工单 ${orderId} 已转派给 ${toWorkerName} 师傅`,
        type: 'transfer'
      })
    }
    return order
  }

  function delayOrder(orderId, reason, delayEndTime) {
    const order = workOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'delayed'
      order.delayReason = reason
      order.delayEndTime = delayEndTime
      addNotification({
        userId: order.studentId,
        title: '工单延期通知',
        content: `您的工单 ${orderId} 因"${reason}"已延期至 ${delayEndTime}`,
        type: 'delay'
      })
    }
    return order
  }

  function cancelOrder(orderId, studentId) {
    const order = workOrders.value.find(o => o.id === orderId && o.studentId === studentId)
    if (order && ['pending', 'assigned'].includes(order.status)) {
      order.status = 'cancelled'
      addNotification({
        userId: order.workerId,
        title: '工单已取消',
        content: `工单 ${orderId} 已被学生取消`,
        type: 'cancel'
      })
      return true
    }
    return false
  }

  function evaluateOrder(orderId, studentId, score, comment) {
    const order = workOrders.value.find(o => o.id === orderId && o.studentId === studentId)
    if (order && order.status === 'completed' && !order.evaluation) {
      order.evaluation = {
        score,
        comment,
        time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }
      addNotification({
        userId: order.workerId,
        title: '工单评价通知',
        content: `您的工单 ${orderId} 收到新的评价`,
        type: 'evaluate'
      })
      return true
    }
    return false
  }

  function getOrderById(id) {
    return workOrders.value.find(o => o.id === id)
  }

  function addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      ...notification,
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      read: false
    }
    notifications.value.unshift(newNotification)
  }

  function getNotificationsByUserId(userId) {
    return notifications.value.filter(n => n.userId === userId)
  }

  function markNotificationAsRead(notificationId) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  function markAllNotificationsAsRead(userId) {
    notifications.value.forEach(n => {
      if (n.userId === userId) {
        n.read = true
      }
    })
  }

  function getUnreadNotificationCount(userId) {
    return notifications.value.filter(n => n.userId === userId && !n.read).length
  }

  function getBuildingStats() {
    const buildings = ['1号楼', '2号楼', '3号楼']
    return buildings.map(building => {
      const orders = getOrdersByBuilding(building)
      return {
        building,
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => ['assigned', 'processing'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'completed').length,
        delayed: orders.filter(o => o.status === 'delayed').length,
        urgent: orders.filter(o => o.urgency === 'urgent').length
      }
    })
  }

  function getSortedPendingOrders() {
    return [...pendingOrders.value].sort((a, b) => {
      const urgencyPriority = { urgent: 0, high: 1, normal: 2, low: 3 }
      if (urgencyPriority[a.urgency] !== urgencyPriority[b.urgency]) {
        return urgencyPriority[a.urgency] - urgencyPriority[b.urgency]
      }
      return new Date(b.createTime) - new Date(a.createTime)
    })
  }

  function initFromStorage() {
    const ordersStr = localStorage.getItem('workOrders')
    if (ordersStr) {
      workOrders.value = JSON.parse(ordersStr)
    }
    const notificationsStr = localStorage.getItem('notifications')
    if (notificationsStr) {
      notifications.value = JSON.parse(notificationsStr)
    }
  }

  function saveToStorage() {
    localStorage.setItem('workOrders', JSON.stringify(workOrders.value))
    localStorage.setItem('notifications', JSON.stringify(notifications.value))
  }

  return {
    problemTypes,
    urgencyLevels,
    statusList,
    workOrders,
    notifications,
    pendingOrders,
    processingOrders,
    completedOrders,
    delayedOrders,
    queuedOrders,
    getStatusInfo,
    getUrgencyInfo,
    getProblemType,
    getOrdersByStudent,
    getOrdersByWorker,
    getOrdersByBuilding,
    getAvailableOrdersForWorker,
    createWorkOrder,
    assignWorkOrder,
    acceptOrder,
    completeOrder,
    transferOrder,
    delayOrder,
    cancelOrder,
    evaluateOrder,
    getOrderById,
    addNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    getBuildingStats,
    getSortedPendingOrders,
    getOvertimeOrders,
    getReworkStats,
    getDelayedBySpareParts,
    initFromStorage,
    saveToStorage
  }
})
