import React from 'react'
import ThreadPage from './Components/ThreadPage'

function page({ params }) {
  return (
    <div>
      <ThreadPage params={params} />
    </div>
  )
}

export default page