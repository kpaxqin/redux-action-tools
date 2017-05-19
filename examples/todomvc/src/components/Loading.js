import React from 'react'

const Loading = ({show})=> {
  return show && (
    <div className="loading backdrop" style={{color: 'blue'}}>
      <p>This is global loading mask...</p>
    </div>
  )
}

export default Loading;