import React from 'react'
import JobDetailsPage from './Components/JobDetailsPage'

async function page({ params }) {
  const { slug } = await params;
  return (
    <div>
      <JobDetailsPage slug={slug} />
    </div>
  )
} 

export default page