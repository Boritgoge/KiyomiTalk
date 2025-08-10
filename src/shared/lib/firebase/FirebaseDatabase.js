import app from "../../../../components/common/Firebase"
import { getDatabase, ref, update, onValue, push, child, remove, get, off } from "firebase/database"

let db = null

// Initialize database only when needed
const getDb = () => {
  if (!db) {
    try {
      db = getDatabase(app)
    } catch (error) {
      console.error('Failed to initialize Firebase Database:', error)
    }
  }
  return db
}

export const FirebaseDatabase = {
  read: (path, callback) => {
    try {
      const database = getDb()
      if (!database) {
        console.warn('Firebase Database not initialized')
        return () => {}
      }
      
      const _ref = ref(database, path)
      const unsubscribe = onValue(_ref, (snapshot) => {
        callback(snapshot.val())
      }, (error) => {
        console.error('Firebase Database read error:', error)
      })
      
      return unsubscribe
    } catch (error) {
      console.error('Firebase Database connection error:', error)
      return () => {} // Return empty unsubscribe function
    }
  },

  write: (path, data) => {
    const database = getDb()
    if (!database) return
    
    const key = push(child(ref(database), path)).key
    const updates = {}
    updates[`/${path}/${key}`] = { key, ...data }
    update(ref(database), updates)
  },

  updateByPath: (path, data) => {
    const database = getDb()
    if (!database) return
    
    const updates = {}
    updates[`${path}`] = data
    update(ref(database), updates)
  },

  readOnce: (path, callback) => {
    const database = getDb()
    if (!database) {
      callback(null)
      return () => {}
    }
    
    const _ref = ref(database, path)
    return onValue(_ref, (snapshot) => {
      callback(snapshot.val())
    }, {
      onlyOnce: true
    })
  },
  
  listenRoom: (roomId, callback) => {
    return FirebaseDatabase.read(`rooms/${roomId}`, callback)
  },
  
  listenRoomMembers: (roomId, callback) => {
    return FirebaseDatabase.read(`rooms/${roomId}/members`, callback)
  },
  
  listenUserRooms: (userId, callback) => {
    if (!userId) {
      console.warn('No userId provided for listenUserRooms')
      return () => {}
    }
    return FirebaseDatabase.read(`users/${userId}/rooms`, callback)
  },
  
  createRoom: async (name, user) => {
    const database = getDb()
    if (!database) return null
    
    const key = push(child(ref(database), 'rooms')).key
    const roomData = {
      key,
      name,
      owner: user.uid,
      members: {
        [user.uid]: {
          displayName: user.displayName,
          email: user.email
        }
      },
      createdAt: Date.now()
    }
    
    const updates = {}
    updates[`/rooms/${key}`] = roomData
    updates[`/users/${user.uid}/rooms/${key}`] = { name, joinedAt: Date.now() }
    
    await update(ref(database), updates)
    return key
  },
  
  deleteRoom: async (roomId) => {
    const database = getDb()
    if (!database) return
    
    const roomRef = ref(database, `rooms/${roomId}`)
    await remove(roomRef)
  },
  
  exitRoom: async (roomId, userId) => {
    const database = getDb()
    if (!database) return
    
    const updates = {}
    updates[`/rooms/${roomId}/members/${userId}`] = null
    updates[`/users/${userId}/rooms/${roomId}`] = null
    await update(ref(database), updates)
  },
  
  joinRoomByInvite: async (code, user) => {
    try {
      const database = getDb()
      if (!database) return null
      
      const roomData = await new Promise((resolve) => {
        FirebaseDatabase.readOnce(`rooms/${code}`, resolve)
      })
      
      if (!roomData) return null
      
      const updates = {}
      updates[`/rooms/${code}/members/${user.uid}`] = {
        displayName: user.displayName,
        email: user.email
      }
      updates[`/users/${user.uid}/rooms/${code}`] = {
        name: roomData.name,
        joinedAt: Date.now()
      }
      
      await update(ref(database), updates)
      return code
    } catch (error) {
      console.error('Error joining room:', error)
      return null
    }
  }
}

export function toList(data) {
  return Object.keys(data || {}).map(key => data[key])
}

export function toListWithKey(data) {
  return Object.keys(data || {}).map(key => ({ key, ...data[key] }))
}

export default getDb()