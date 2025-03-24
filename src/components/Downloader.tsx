import { useRef, useState } from 'react'
import * as cheerio from 'cheerio'

import Album from './Album'
import type { AlbumRow } from 'utils/types'
import { politeFetch, searchAlbums } from 'utils/search'
import Loader from './Loader'

export default function Downloader() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AlbumRow[]>([])
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const lastReqRef = useRef(Date.now())

  async function handleSearch(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setLoading(true)

    const formData = new FormData(ev.target as HTMLFormElement)
    const query = formData.get('query') as string
    try {
      const uniqueAlbums = await searchAlbums(query, lastReqRef)
      setResults(uniqueAlbums)
    } catch (error) {
      // handle error
    } finally {
      setLoading(false)
      setLastQuery(query)
    }
  }

  return (
    <>
      <form className='search-container' onSubmit={handleSearch}>
        <input
          type='text'
          name='query'
          className='search-box'
          placeholder='Search for soundtracks...'
          min={3}
          required
        />
        <input type='submit' className='search-btn' value='Search' />
      </form>
      <Loader show={loading} />
      {!loading && lastQuery ? (
        <div className='search-meta'>
          {results.length > 0 ? (
            <span className='result-count'>{`Found ${results.length} ${results.length === 1 ? 'album' : 'albums'}`}</span>
          ) : (
            <div className='no-results'>No albums found for "{lastQuery}"</div>
          )}
        </div>
      ) : null}
      <div className='results'>
        {results.map((r, i) => (
          <Album album={r} lastReqRef={lastReqRef} key={i} />
        ))}
      </div>
    </>
  )
}
