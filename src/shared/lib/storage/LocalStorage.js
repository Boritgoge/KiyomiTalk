export const LocalStorage = {
  getItem: (key) => {
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(key)
        // 'undefined' 문자열이나 빈 문자열 체크
        if (!item || item === 'undefined' || item === 'null') {
          return null
        }
        return JSON.parse(item)
      } catch (error) {
        console.error(`Failed to parse localStorage item ${key}:`, error)
        // 파싱 실패시 해당 아이템 삭제
        localStorage.removeItem(key)
        return null
      }
    }
    return null
  },

  setItem: (key, data) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data))
    }
  },

  removeItem: (key) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
  
  saveRoomId: (roomId) => {
    LocalStorage.setItem('currentRoomId', roomId)
  },
  
  getRoomId: () => {
    return LocalStorage.getItem('currentRoomId')
  }
}
