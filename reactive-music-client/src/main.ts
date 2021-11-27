import { filter, fromEvent, interval, map, Subject, switchMap, takeUntil, tap } from 'rxjs'
import './style.css'

import { UserManager } from './services/UserManager'
import { configuration } from './configuration'
import { PianoService } from './services/PianoService'

const piano = new PianoService()
const userManager = new UserManager()

window.onload = () => {
  console.log('loaded')
  piano.preLoadAudio()
  let wss = new WebSocket(configuration.websocketUrl)

  const recconected$ = new Subject<void>()

  const setupWebSocket = () => {
    fromEvent(wss, 'close')
      .pipe(switchMap((close) => interval(1000).pipe(takeUntil(recconected$))))
      .subscribe((e) => {
        recconected$.next()
        wss = new WebSocket(configuration.websocketUrl)
        setupWebSocket()
      })

    fromEvent(wss, 'open').subscribe((e) => {
      console.log('opened connection', e)
      recconected$.next()
    })

    fromEvent(wss, 'message')
      .pipe(
        map((e) => JSON.parse((e as MessageEvent).data)),
        filter((e) => e.type === 'play-note'),
        map((e) => e.data as { note: string; velocity: number; duration: number })
      )
      .subscribe((e) => {
        console.log('playing', e)
        piano.play(e)
      })
  }
  setupWebSocket()
}

const makePianoDom = () => {
  const container = document.getElementById('piano')
  for (const key in piano.piano) {
    if (Object.prototype.hasOwnProperty.call(piano.piano, key)) {
      const note = piano.piano[key]
      const btn = document.createElement('button')
      btn.innerText = key
      btn.onclick = () => note.play()
      container?.appendChild(btn)
    }
  }
}
