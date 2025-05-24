import React from 'react'
import ThreadPage from './Components/ThreadPage'

async function page({ params }) {
  const awaitedParams = await params;
  return (
    <div>
      <ThreadPage params={awaitedParams} />
    </div>
  )
}

export default page