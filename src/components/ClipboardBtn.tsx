import { useState } from 'react'
import { copyDownloadUrls } from 'utils/search'
import Loader from './Loader'

export default function ClipboardBtn(props: { albumUrl: string; lastReqRef: React.RefObject<number> }) {
  const { albumUrl, lastReqRef } = props
  const [loading, setLoading] = useState(false)

  function handleCopy(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation()

    setLoading(true)
    copyDownloadUrls(albumUrl, lastReqRef).finally(() => {
      setLoading(false)
    })
  }

  return (
    <button className='download-btn' onClick={handleCopy} disabled={loading}>
      {loading ? (
        <div className='loader-container'>
          <Loader show />
        </div>
      ) : (
        <span>📋Copy</span>
      )}
    </button>
  )
}
