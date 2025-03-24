import { useEffect, useState } from 'react'

import { getDownloadUrl, getTracks, triggerDownload } from 'utils/search'
import type { AlbumRow, TrackRow } from 'utils/types'
import Loader from './Loader'
import ClipboardBtn from './ClipboardBtn'
import { AlbumDLBtn } from './AlbumDLBtn'

export default function Album(props: { album: AlbumRow; lastReqRef: React.RefObject<number> }) {
  const { album, lastReqRef } = props
  const [open, setOpen] = useState(false)

  return (
    <div className='album'>
      <div className='album-title' onClick={() => setOpen((o) => !o)}>
        <h3>{album.name}</h3>
        <div className='btn-container'>
          <ClipboardBtn albumUrl={album.url} lastReqRef={lastReqRef} />
          <AlbumDLBtn album={album} lastReqRef={lastReqRef} />
        </div>
      </div>
      <TrackList url={album.url} open={open} lastReqRef={lastReqRef} />
    </div>
  )
}

function TrackList(props: { url: string; open: boolean; lastReqRef: React.RefObject<number> }) {
  const { url, open, lastReqRef } = props
  const [tracks, setTracks] = useState<TrackRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchTracks() {
    try {
      setLoading(true)
      const tracks = await getTracks(url, lastReqRef)
      setTracks(tracks)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tracks && open) fetchTracks()
  }, [open])

  if (!open) return null

  return (
    <div className='album-open'>
      {loading ? (
        <div className='loader-container'>
          <Loader show />
        </div>
      ) : null}
      {tracks && open ? (
        <div className='track-list'>
          {tracks.map((t, i) => (
            <div className='track' key={i}>
              <span className='track-name'>
                <span className='track-number'>{(i + 1).toString().padStart(2, '0').slice(-2)}. </span>
                <span>{t.name}</span>
              </span>
              {/* <span className='format-tag'>{t.format}</span> */}
              <TrackDownload track={t} lastReqRef={lastReqRef} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function TrackDownload(props: { track: TrackRow; lastReqRef: React.RefObject<number> }) {
  const { track, lastReqRef } = props
  const [downloadUrl, setDownloadUrl] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function fetchUrl() {
    try {
      setLoading(true)
      const dlUrl = await getDownloadUrl(track.url, lastReqRef)

      setDownloadUrl(dlUrl)
      await downloadTrack(dlUrl)
    } finally {
      setLoading(false)
    }
  }

  async function downloadTrack(dlUrl: string) {
    if (!dlUrl) return

    const dlBlob = await (await fetch(dlUrl)).blob()
    const fileURL = window.URL.createObjectURL(dlBlob)

    triggerDownload(fileURL, track.fileName)
  }

  return (
    <button
      className='download-btn'
      disabled={loading}
      onClick={downloadUrl ? () => downloadTrack(downloadUrl) : fetchUrl}
    >
      {loading ? <Loader show /> : 'Download'}
    </button>
  )
}
