import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const isAuthenticated = ref(false)
  const user = ref({
    id: null,
    name: null,
    email: null,
    photoURL: null,
    accessToken: null,
  })

  // actions
  function setUser(userData) {
    user.value = {
      id: userData.uid,
      name: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL,
      accessToken: userData.accessToken,
    }
    isAuthenticated.value = true
  }

  function setAccessToken(token) {
    user.value.accessToken = token
    isAuthenticated.value = true
  }

  function clearUser() {
    user.value = {
      id: null,
      name: null,
      email: null,
      photoURL: null,
      accessToken: null,
    }
    isAuthenticated.value = false
  }

  // getters
  const userProfile = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value && user.value.accessToken !== null)

  return {
    user,
    isAuthenticated,
    setUser,
    setAccessToken,
    clearUser,
    userProfile,
    isLoggedIn,
  }
}, {
  persist: true,
})
