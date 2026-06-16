import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSparePartsStore = defineStore('spareParts', () => {
  const spareParts = ref([
    { id: 1, name: '水管密封圈', code: 'SP001', unit: '个', stock: 5, minStock: 10, location: 'A区-01', category: '水电配件' },
    { id: 2, name: '空气开关', code: 'SP002', unit: '个', stock: 15, minStock: 5, location: 'A区-02', category: '电器配件' },
    { id: 3, name: '抽屉滑轨', code: 'SP003', unit: '副', stock: 8, minStock: 5, location: 'B区-01', category: '家具配件' },
    { id: 4, name: '管道疏通剂', code: 'SP004', unit: '瓶', stock: 0, minStock: 10, location: 'C区-01', category: '清洁用品' },
    { id: 5, name: 'LED灯泡', code: 'SP005', unit: '只', stock: 30, minStock: 20, location: 'A区-03', category: '电器配件' },
    { id: 6, name: '空调遥控器电池', code: 'SP006', unit: '节', stock: 50, minStock: 30, location: 'A区-04', category: '电器配件' },
    { id: 7, name: '水龙头阀芯', code: 'SP007', unit: '个', stock: 3, minStock: 8, location: 'A区-05', category: '水电配件' },
    { id: 8, name: '门锁芯', code: 'SP008', unit: '个', stock: 6, minStock: 5, location: 'B区-02', category: '门窗配件' },
    { id: 9, name: '合页', code: 'SP009', unit: '副', stock: 12, minStock: 10, location: 'B区-03', category: '门窗配件' },
    { id: 10, name: '生料带', code: 'SP010', unit: '卷', stock: 2, minStock: 15, location: 'A区-06', category: '水电配件' }
  ])

  const categories = ['水电配件', '电器配件', '家具配件', '门窗配件', '清洁用品']

  function checkStock(partId, quantity) {
    const part = spareParts.value.find(p => p.id === partId)
    return part && part.stock >= quantity
  }

  function consumeStock(partId, quantity) {
    const part = spareParts.value.find(p => p.id === partId)
    if (part && part.stock >= quantity) {
      part.stock -= quantity
      if (part.stock < part.minStock) {
        return { success: true, lowStock: true, part }
      }
      return { success: true, lowStock: false, part }
    }
    return { success: false, part }
  }

  function restockPart(partId, quantity) {
    const part = spareParts.value.find(p => p.id === partId)
    if (part) {
      part.stock += quantity
      return true
    }
    return false
  }

  function getLowStockParts() {
    return spareParts.value.filter(p => p.stock < p.minStock)
  }

  function getPartById(id) {
    return spareParts.value.find(p => p.id === id)
  }

  function getPartByName(name) {
    return spareParts.value.find(p => p.name === name)
  }

  function initFromStorage() {
    const partsStr = localStorage.getItem('spareParts')
    if (partsStr) {
      spareParts.value = JSON.parse(partsStr)
    }
  }

  function saveToStorage() {
    localStorage.setItem('spareParts', JSON.stringify(spareParts.value))
  }

  return {
    spareParts,
    categories,
    checkStock,
    consumeStock,
    restockPart,
    getLowStockParts,
    getPartById,
    getPartByName,
    initFromStorage,
    saveToStorage
  }
})
