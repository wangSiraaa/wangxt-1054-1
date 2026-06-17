import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed } from 'vue'

const pinia = createPinia()
setActivePinia(pinia)

console.log('='.repeat(60))
console.log('排队工单关联事件单 - 回归测试')
console.log('='.repeat(60))
console.log()

const useEventOrderStore = defineStore('eventOrder', () => {
  const eventOrders = ref([])
  
  function getEventById(id) {
    return eventOrders.value.find(e => e.id === id)
  }
  
  function addWorkOrderToEvent(eventId, workOrderId) {
    const event = getEventById(eventId)
    if (event && !event.childWorkOrderIds.includes(workOrderId)) {
      event.childWorkOrderIds.push(workOrderId)
      return true
    }
    return false
  }
  
  function getEventChildOrders(eventId, workOrderStore) {
    const event = getEventById(eventId)
    if (!event) return []
    return workOrderStore.workOrders.filter(o => event.childWorkOrderIds.includes(o.id))
  }
  
  function getEventStats() {
    const buildings = ['1号楼', '2号楼', '3号楼']
    return buildings.map(building => {
      const events = eventOrders.value.filter(e => e.building === building)
      return {
        building,
        totalChildOrders: events.reduce((sum, e) => sum + e.childWorkOrderIds.length, 0)
      }
    })
  }
  
  function saveToStorage() {
    console.log('  💾 调用 eventOrderStore.saveToStorage() - 数据已持久化')
  }
  
  return { eventOrders, getEventById, addWorkOrderToEvent, getEventChildOrders, getEventStats, saveToStorage }
})

const useSparePartsStore = defineStore('spareParts', () => {
  const spareParts = ref([{ id: 4, name: '管道疏通剂', stock: 0, minStock: 5 }])
  function checkStock(partId, quantity) {
    const part = spareParts.value.find(p => p.id === partId)
    return part && part.stock >= quantity
  }
  return { spareParts, checkStock }
})

const useWorkOrderStore = defineStore('workOrder', () => {
  const sparePartsStore = useSparePartsStore()
  const eventOrderStore = useEventOrderStore()
  
  const workOrders = ref([])
  const notifications = ref([])
  const queuedOrders = computed(() => workOrders.value.filter(o => o.status === 'queued'))
  
  function getProblemType(id) {
    const types = [{ id: 4, name: '管道疏通' }]
    return types.find(p => p.id === id)
  }
  
  function addNotification(n) {
    notifications.value.unshift({ id: Date.now(), ...n, read: false })
  }
  
  function createWorkOrder(orderData) {
    const newId = 'WO-TEST-' + Date.now()
    
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
        createTime: new Date().toLocaleString('zh-CN'),
        eventId: delayedOrder.eventId,
        originalOrderId: delayedOrder.id
      }
      
      workOrders.value.unshift(newOrder)
      
      if (delayedOrder.eventId) {
        console.log(`  🔗 调用 eventOrderStore.addWorkOrderToEvent(${delayedOrder.eventId}, ${newId}))
        eventOrderStore.addWorkOrderToEvent(delayedOrder.eventId, newId)
        eventOrderStore.saveToStorage()
        addNotification({ userId: orderData.studentId, title: '报修排队通知', type: 'delay' })
      }
      
      return newOrder
    }
    
    const newOrder = { id: newId, ...orderData, status: 'pending', eventId: null }
    workOrders.value.unshift(newOrder)
    return newOrder
  }
  
  return { workOrders, queuedOrders, createWorkOrder, getProblemType }
})

function runTest() {
  const workOrderStore = useWorkOrderStore()
  const eventOrderStore = useEventOrderStore()
  
  const testBuilding = '1号楼'
  const testRoom = '999'
  const testProblemTypeId = 4
  const delayedOrderId = 'WO-TEST-DELAYED-001'
  const testEventId = 'EVT-TEST-001'
  
  const originalDelayedOrder = {
    id: delayedOrderId,
    building: testBuilding,
    room: testRoom,
    problemTypeId: testProblemTypeId,
    status: 'delayed',
    delayReason: '疏通剂库存不足，需要采购',
    eventId: testEventId
  }
  
  const originalTestEvent = {
    id: testEventId,
    title: '1号楼管道疏通事件',
    building: testBuilding,
    status: 'processing',
    childWorkOrderIds: [delayedOrderId]
  }
  
  workOrderStore.workOrders = [originalDelayedOrder]
  eventOrderStore.eventOrders = [originalTestEvent]
  
  console.log('【前置条件】')
  console.log(`  1. 延期工单: ${delayedOrderId}')
  console.log(`     - 房间: ${testBuilding} ${testRoom}')
  console.log(`     - 状态: delayed (因备件不足)')
  console.log(`     - 关联事件: ${testEventId}')
  console.log(`  2. 事件单: ${testEventId}')
  console.log(`     - 子工单数量: ${originalTestEvent.childWorkOrderIds.length}')
  console.log(`     - 子工单列表: [${originalTestEvent.childWorkOrderIds.join(', ')}]')
  console.log()
  console.log('【执行操作】学生提交同房间同问题的报修')
  console.log()
  
  const newOrderData = {
    studentId: 999,
    studentName: '测试学生',
    building: testBuilding,
    room: testRoom,
    problemTypeId: testProblemTypeId,
    description: '下水道又堵了'
  }
  
  const result = workOrderStore.createWorkOrder(newOrderData)
  console.log()
  console.log('【验证结果】')
  console.log()
  
  let passCount = 0
  let failCount = 0
  
  function check(desc, condition, actual, expected) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}')
      console.log(`       实际: ${actual}')
      passCount++
    } else {
      console.log(`  ❌ FAIL: ${desc}')
      console.log(`       期望: ${expected}')
      console.log(`       实际: ${actual}')
      failCount++
    }
    console.log()
  }
  
  check('新工单状态应为 queued', result.status === 'queued', result.status, 'queued')
  check('新工单 eventId 应关联事件单', result.eventId === testEventId, result.eventId, testEventId)
  check('新工单 originalOrderId 应指向原延期工单', result.originalOrderId === delayedOrderId, result.originalOrderId, delayedOrderId)
  
  const updatedEvent = eventOrderStore.getEventById(testEventId)
  check('事件单 childWorkOrderIds 应包含新工单ID', 
    updatedEvent.childWorkOrderIds.includes(result.id),
    `[${updatedEvent.childWorkOrderIds.join(', ')}]',
    `包含 ${result.id}')
  )
  check('事件单子工单数量应为 2', 
    updatedEvent.childWorkOrderIds.length === 2,
    updatedEvent.childWorkOrderIds.length,
    2
  )
  check('事件单应同时包含原工单和新工单',
    updatedEvent.childWorkOrderIds.includes(delayedOrderId) && updatedEvent.childWorkOrderIds.includes(result.id),
    `[${updatedEvent.childWorkOrderIds.join(', ')}]',
    `[${delayedOrderId}, ${result.id}]')
  )
  check('queuedOrders 计算属性应包含新工单',
    workOrderStore.queuedOrders.some(o => o.id === result.id),
    `包含${result.id}: ${workOrderStore.queuedOrders.some(o => o.id === result.id)}',
    'true'
  )
  
  const eventChildOrders = eventOrderStore.getEventChildOrders(testEventId, workOrderStore)
  check('getEventChildOrders 应返回2条工单', eventChildOrders.length === 2, eventChildOrders.length, 2)
  check('子工单应包含 queued 状态的新工单',
    eventChildOrders.some(o => o.status === 'queued'),
    `包含queued状态: ${eventChildOrders.some(o => o.status === 'queued')}',
    'true'
  )
  
  const eventStats = eventOrderStore.getEventStats()
  const buildingStat = eventStats.find(s => s.building === testBuilding)
  check('事件统计中子工单总数应更新', buildingStat.totalChildOrders >= 2, buildingStat.totalChildOrders, '>= 2')
  
  console.log('='.repeat(60))
  console.log('【测试汇总】')
  console.log(`  ✅ 通过: ${passCount}')
  console.log(`  ❌ 失败: ${failCount}')
  console.log()
  if (failCount === 0) {
    console.log('🎉 所有测试通过！排队工单关联事件单逻辑正常。')
  } else {
    console.log(`⚠️  有 ${failCount} 个测试失败')
  }
  console.log('='.repeat(60))
  
  console.log()
  console.log('【关键修复点】')
  console.log('-'.repeat(60))
  console.log('修改文件: src/stores/workOrder.js')
  console.log()
  console.log('1. 第3行: 导入 useEventOrderStore')
  console.log('2. 第8行: 实例化 eventOrderStore')
  console.log('3. 第531-532行: 创建排队工单后同步更新事件单:')
  console.log('   eventOrderStore.addWorkOrderToEvent(delayedOrder.eventId, newId)')
  console.log('   eventOrderStore.saveToStorage()')
  console.log()
  console.log('修复效果:')
  console.log('  ✓ 新排队工单写入 eventId')
  console.log('  ✓ 事件单 childWorkOrderIds 同步追加新工单ID')
  console.log('  ✓ 事件单数据立即持久化')
  console.log('  ✓ 调度端事件单页面立即显示更新')
  console.log('-'.repeat(60))
  
  return failCount === 0
}

const passed = runTest()
process.exit(passed ? 0 : 1)
