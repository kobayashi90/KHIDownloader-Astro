import { useState } from 'react'

import { downloadAlbum } from 'utils/search'
import type { AlbumRow } from 'utils/types'

import Loader from './Loader'

export function AlbumDLBtn(props: { album: AlbumRow; lastReqRef: React.RefObject<number> }) {
  const { album, lastReqRef } = props
  const [loading, setLoading] = useState(false)

  function handleClick(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation()
    setLoading(true)
    downloadAlbum(album, lastReqRef).finally(() => setLoading(false))
  }

  return (
    <button className='download-btn' onClick={handleClick} disabled={loading}>
      {loading ? (
        <div className='loader-container'>
          <Loader show />
        </div>
      ) : (
        <span> Download album</span>
      )}
    </button>
  )
}
