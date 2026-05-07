<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapsed ? '64px' : '240px'" class="layout-aside">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <transition name="fade">
            <span v-if="!isCollapsed" class="brand-text">创新创业服务系统</span>
          </transition>
        </div>
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon :size="18">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        class="layout-menu"
        :collapse="isCollapsed"
        :collapse-transition="false"
      >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          
          <el-menu-item index="/projects">
            <el-icon><Document /></el-icon>
            <template #title>项目管理</template>
          </el-menu-item>
          
          <el-menu-item index="/teams">
            <el-icon><UserFilled /></el-icon>
            <template #title>团队管理</template>
          </el-menu-item>
          
          <el-menu-item index="/spaces">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>空间预约</template>
          </el-menu-item>
          
          <el-menu-item index="/activities">
            <el-icon><Calendar /></el-icon>
            <template #title>活动管理</template>
          </el-menu-item>
          
          <el-menu-item index="/information-link">
            <el-icon><Connection /></el-icon>
            <template #title>信息对接</template>
          </el-menu-item>
          
          <el-menu-item index="/news">
            <el-icon><Reading /></el-icon>
            <template #title>新闻管理</template>
          </el-menu-item>
          
          <el-menu-item index="/persons">
            <el-icon><Avatar /></el-icon>
            <template #title>人员库</template>
          </el-menu-item>
        
        <el-menu-item v-if="isAdmin" index="/admin/review">
          <el-icon><Edit /></el-icon>
          <template #title>审核中心</template>
        </el-menu-item>

        <el-menu-item v-if="isStudentAdmin" index="/spaces/admin">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>空间预约审核</template>
        </el-menu-item>
        
        <el-menu-item v-if="isSchoolAdmin" index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container class="main-container">
      <el-header class="layout-header">
        <div class="header-left">
          <div class="breadcrumb">
            <el-icon><Location /></el-icon>
            <span>{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-button :icon="Bell" circle class="header-btn" />
          </el-badge>
          
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-dropdown">
              <el-avatar :size="32" class="user-avatar-small">
                {{ userStore.user?.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name-small">{{ userStore.user?.realName || '用户' }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  User, ArrowDown, Odometer, Document, UserFilled, Edit, 
  OfficeBuilding, Calendar, Reading, Avatar, Connection,
  Fold, Expand, Bell, SwitchButton, Location, Lock
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)
const notificationCount = ref(0)

const activeMenu = computed(() => route.path)

const isAdmin = computed(() => {
  const role = userStore.userRole
  return role === 'COLLEGE_ADMIN' || role === 'SCHOOL_ADMIN'
})

const isStudentAdmin = computed(() => {
  return userStore.userRole === 'STUDENT_ADMIN'
})

const isSchoolAdmin = computed(() => {
  return userStore.userRole === 'SCHOOL_ADMIN'
})

const currentPageTitle = computed(() => {
  const titleMap = {
    '/dashboard': '首页',
    '/projects': '项目管理',
    '/teams': '团队管理',
    '/spaces': '空间预约',
    '/spaces/admin': '空间预约审核',
    '/activities': '活动管理',
    '/information-link': '信息对接',
    '/news': '新闻管理',
    '/persons': '人员库',
    '/admin/review': '审核中心',
    '/admin/users': '用户管理',
    '/change-password': '修改密码',
    '/profile': '个人资料'
  }
  return titleMap[route.path] || '创新创业服务系统'
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    // 调用logout，如果是CAS用户会返回CAS登出地址
    const casLogoutUrl = await userStore.logout()
    ElMessage.success('已退出登录')
    
    if (casLogoutUrl) {
      // CAS用户：跳转到CAS退出页面
      window.location.href = casLogoutUrl
    } else {
      // 普通用户：跳转到本地登录页
      router.push('/login')
    }
  } else if (command === 'password') {
    router.push('/change-password')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: #f5f7fa;
}

.layout-aside {
  background: linear-gradient(180deg, #1a3a5f 0%, #0d2137 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-icon svg {
  width: 20px;
  height: 20px;
  color: #fff;
}

.brand-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.collapse-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.layout-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 12px 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.layout-menu::-webkit-scrollbar {
  width: 4px;
}

.layout-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.layout-menu :deep(.el-menu-item),
.layout-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.layout-menu :deep(.el-menu-item:hover),
.layout-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.layout-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #fff;
}

.layout-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
  height: 42px;
  line-height: 42px;
}

.layout-menu :deep(.el-icon) {
  font-size: 18px;
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  height: 60px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.breadcrumb .el-icon {
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.header-btn {
  border: none;
  background: #f5f7fa;
  color: #606266;
}

.header-btn:hover {
  background: #e4e7ed;
  color: #409eff;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-dropdown:hover {
  background: #f5f7fa;
}

.user-avatar-small {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-name-small {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.dropdown-arrow {
  color: #909399;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.layout-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fa;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
