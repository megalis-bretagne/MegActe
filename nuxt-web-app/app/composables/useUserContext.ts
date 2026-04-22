import { ref, computed } from 'vue'

export const useUserContext = () => {
  // État réactif pour l'utilisateur courant
  const currentUser = ref<any>(null)

  // Vérifie si l'utilisateur est super admin
  const isSuperAdmin = computed(() => {
    return currentUser.value?.user_info?.id_e === 0
  })

  // Retourne l'entité de base si l'utilisateur n'est pas super admin
  const entiteBase = computed(() => {
    if (isSuperAdmin.value) {
      return null
    }
    return currentUser.value?.entite || null
  })

  // Fonction pour initialiser l'utilisateur (à appeler au montage)
  const initUserConnected = async () => {
    try {
      // Appel à FastAPI pour récupérer les données utilisateur
      const userData = await $fetch('/api/user/current', {
        baseURL: 'http://localhost:8000',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      currentUser.value = userData
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  return {
    currentUser,
    isSuperAdmin,
    entiteBase,
    initUserConnected,
  }
}
