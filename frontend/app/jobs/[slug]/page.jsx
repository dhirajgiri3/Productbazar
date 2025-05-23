import React from 'react'
import JobDetailsPage from './Components/JobDetailsPage'

function page({ params }) {
  return (
    <div>
      <JobDetailsPage slug={params.slug} />
    </div>
  )
} 

export default page