import { Suspense, lazy } from 'react'

const RealisticGlobe = lazy(() => import('../components/RealisticGlobe'))

function Globe() {
  return (
    <div className="globe-page">
      <Suspense fallback={
        <div className="globe-fallback">
          <div className="globe-fallback-content">
            <div className="globe-fallback-spinner"></div>
          </div>
        </div>
      }>
        <RealisticGlobe />
      </Suspense>
    </div>
  )
}

export default Globe
