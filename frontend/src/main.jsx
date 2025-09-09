import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store/index.js'
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

// Lazy load components for better performance
const CreateTrip = lazy(() => import('./create-trip/index.jsx'))
const TripPlan = lazy(() => import('./trip-plan/index.jsx'))
const Login = lazy(() => import('./components/auth/Login.jsx'))
const Signup = lazy(() => import('./components/auth/Signup.jsx'))
const Dashboard = lazy(() => import('./components/auth/Dashboard.jsx'))
const Help = lazy(() => import('./components/help/Help.jsx'))
const About = lazy(() => import('./components/about/About.jsx'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
)
import { configureFormatter } from '@raju_kar/code-formatter'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { hydrateUser } from './store/userSlice.js'


configureFormatter({ locale: 'en-US', timeZone: 'auto' })

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><App /></Layout>,
  },
  {
    path: '/create-trip',
    element: (
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <CreateTrip />
        </Suspense>
      </Layout>
    ),
  },
  {
    path: '/trip-plan',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <TripPlan />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Signup />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/help',
    element: (
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Help />
        </Suspense>
      </Layout>
    ),
  },
  {
    path: '/about',
    element: (
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <About />
        </Suspense>
      </Layout>
    ),
  },
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Bootstrap>
        <RouterProvider router={router} />
      </Bootstrap>
    </Provider>
  </StrictMode>,
)

function Bootstrap({ children }) {
  const dispatch = useDispatch()
  useEffect(() => {
    // Try to hydrate session from cookie
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) return null
        return await r.json()
      })
      .then((data) => dispatch(hydrateUser(data || {})))
      .catch(() => {})
  }, [dispatch])
  return children
}
