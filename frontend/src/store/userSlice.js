import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAuthenticated: false,
  profile: null,
  token: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    hydrateUser(state, action) {
      state.isAuthenticated = !!action.payload?.user
      state.profile = action.payload?.user || null
      state.token = null
    },
    setUser(state, action) {
      state.isAuthenticated = true
      state.profile = action.payload.user
      state.token = action.payload.token || null
    },
    clearUser(state) {
      state.isAuthenticated = false
      state.profile = null
      state.token = null
    },
  },
})

export const { setUser, clearUser, hydrateUser } = userSlice.actions
export default userSlice.reducer

