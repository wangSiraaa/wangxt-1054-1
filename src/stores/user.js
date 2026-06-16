import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const currentRole = ref(null)

  const users = [
    { id: 1, username: 'student1', password: '123456', role: 'student', name: '张三', studentNo: '2024001', building: '1号楼', room: '302' },
    { id: 2, username: 'student2', password: '123456', role: 'student', name: '李四', studentNo: '2024002', building: '1号楼', room: '302' },
    { id: 3, username: 'dispatcher', password: '123456', role: 'dispatcher', name: '王主管', department: '后勤维修部' },
    { id: 4, username: 'worker1', password: '123456', role: 'worker', name: '李师傅', skills: ['水电维修', '管道疏通'], buildings: ['1号楼', '2号楼'] },
    { id: 5, username: 'worker2', password: '123456', role: 'worker', name: '张师傅', skills: ['门窗维修', '家具维修'], buildings: ['1号楼', '3号楼'] },
    { id: 6, username: 'worker3', password: '123456', role: 'worker', name: '刘师傅', skills: ['水电维修', '电器维修'], buildings: ['2号楼', '3号楼'] },
    { id: 7, username: 'dormmanager1', password: '123456', role: 'dormManager', name: '赵宿管', buildings: ['1号楼'] },
    { id: 8, username: 'dormmanager2', password: '123456', role: 'dormManager', name: '钱宿管', buildings: ['2号楼', '3号楼'] },
    { id: 9, username: 'spareparts', password: '123456', role: 'sparePartsManager', name: '孙管理员', department: '备件仓库' }
  ]

  const isLoggedIn = computed(() => currentUser.value !== null)

  function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      currentUser.value = user
      currentRole.value = user.role
      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('currentRole', user.role)
      return true
    }
    return false
  }

  function logout() {
    currentUser.value = null
    currentRole.value = null
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentRole')
  }

  function initFromStorage() {
    const userStr = localStorage.getItem('currentUser')
    const roleStr = localStorage.getItem('currentRole')
    if (userStr && roleStr) {
      currentUser.value = JSON.parse(userStr)
      currentRole.value = roleStr
    }
  }

  function getWorkers() {
    return users.filter(u => u.role === 'worker')
  }

  function getDormManagers() {
    return users.filter(u => u.role === 'dormManager')
  }

  return {
    currentUser,
    currentRole,
    users,
    isLoggedIn,
    login,
    logout,
    initFromStorage,
    getWorkers,
    getDormManagers
  }
})
