import * as cheerio from 'cheerio'
// import JSZipUtils from 'jszip-utils'
import JSZip from 'jszip'
import toast from 'react-hot-toast'

import { USER_AGENTS } from './consts'
import type { AlbumRow, TrackRow } from './types'

function getRandom(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}

export const getCors = (url: string) => `https://cors.squid.wtf/${url}`

export function politeFetch(url: string, lastReqRef: React.RefObject<number>) {
  const elapsed = Date.now() - lastReqRef.current
  const corsUrl = getCors(url)

  const headers = {
    'User-Agent': getRandom(USER_AGENTS),
    Referer: 'https://downloads.khinsider.com/',
    'Accept-Language': 'en-US,en;q=0.5',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*//**;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br'
  }

  return fetch(corsUrl, { headers, signal: AbortSignal.timeout(10 * 1000) }).finally(() => {
    lastReqRef.current = Date.now()
  })
}

export async function searchAlbums(query: string, lastReqRef: React.RefObject<number>) {
  const searchUrl = `https://downloads.khinsider.com/search?search=${query}`
  const searchHtml = await (await politeFetch(searchUrl, lastReqRef)).text()

  const $ = cheerio.load(searchHtml)
  const albumRows = $('table.albumList tr:not(:first-child)')

  const albums: AlbumRow[] = []

  albumRows.each((index, row) => {
    const albumLink = $(row).find('td:nth-of-type(2) a')
    if (albumLink.length === 0) return

    const albumName = albumLink.text().trim()
    const albumUrl = `https://downloads.khinsider.com${albumLink.attr('href')}`

    albums.push({ name: albumName, url: albumUrl })
  })

  const seen = new Set()
  const uniqueAlbums = albums.filter((album) => {
    if (seen.has(album.url)) return false
    seen.add(album.url)
    return true
  })

  return uniqueAlbums
}

export async function getTracks(url: string, lastReqRef: React.RefObject<number>) {
  const albumHtml = await (await politeFetch(url, lastReqRef)).text()
  const $ = cheerio.load(albumHtml)
  const tracks: TrackRow[] = []

  $('table#songlist tr:has(a[href$=".mp3"]), table#songlist tr:has(a[href$=".flac"])').each((index, row) => {
    const link = $(row).find('a[href$=".mp3"], a[href$=".flac"]')
    if (link.length === 0) return

    const trackUrl = link.attr('href')!.startsWith('http')
      ? link.attr('href')!
      : `https://downloads.khinsider.com${link.attr('href')}`
    const trackPath = trackUrl.split('/')

    tracks.push({
      name: link.first().text().trim(),
      url: trackUrl,
      format: link.attr('href')!.toLowerCase().endsWith('.flac') ? 'flac' : 'mp3',
      fileName: decodeURI(decodeURI(trackPath[trackPath.length - 1]))
    })
  })

  return tracks
}

export async function getDownloadUrl(trackPageUrl: string, lastReqRef: React.RefObject<number>) {
  const trackPageHtml = await (await politeFetch(trackPageUrl, lastReqRef)).text()
  const $ = cheerio.load(trackPageHtml)

  const audioLinks: string[] = []

  $('a[href$=".mp3"], a[href$=".flac"]').each((index, link) => {
    let href = $(link).attr('href')
    if (!href) return

    href = decodeURIComponent(href)
    if (!href.startsWith('http')) {
      href = `https://downloads.khinsider.com${href}`
    }
    audioLinks.push(href)
  })

  const flacLinks = audioLinks.filter((link) => link.endsWith('.flac'))
  if (flacLinks.length > 0) {
    return getCors(flacLinks[0])
  }

  const mp3Links = audioLinks.filter((link) => link.endsWith('.mp3'))
  if (mp3Links.length > 0) {
    return getCors(mp3Links[0])
  }

  throw new Error('Failed to fetch download url')
}

export async function copyDownloadUrls(albumUrl: string, lastReqRef: React.RefObject<number>) {
  const tracks = await getTracks(albumUrl, lastReqRef)
  const urlArray = await Promise.all(tracks.map(async (t) => getDownloadUrl(t.url, lastReqRef)))
  const filterUrl = urlArray.filter((u) => !!u && u.length > 1).map((u) => encodeURI(u))

  await navigator.clipboard.writeText(filterUrl.join('\n'))
  toast.success('Copied links to the clipboard!')
}

export function triggerDownload(url: string, fileName: string) {
  const fileLink = document.createElement('a')
  fileLink.href = url
  fileLink.setAttribute('download', fileName)
  document.body.appendChild(fileLink)
  fileLink.click()
  fileLink.remove()
}

export async function downloadAlbum(album: AlbumRow, lastReqRef: React.RefObject<number>) {
  const trackList = await getTracks(album.url, lastReqRef)
  const newZip = new JSZip()

  const downloadList = await Promise.all(
    trackList.map(async (t) => ({ ...t, blob: await (await fetch(await getDownloadUrl(t.url, lastReqRef))).blob() }))
  )

  downloadList.forEach((d) => {
    newZip.file(d.fileName, d.blob)
  })
  const zipBlob = window.URL.createObjectURL(await newZip.generateAsync({ type: 'blob' }))
  triggerDownload(zipBlob, `${album.name}.zip`)
}
