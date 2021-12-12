import { Message } from './../../server/src/main'
import {
  connect,
  connectable,
  filter,
  from,
  fromEvent,
  interval,
  map,
  Observable,
  share,
  Subject,
  subscribeOn,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import './style.css'

import { UserManager } from './services/UserManager'
import { configuration } from './configuration'
import { PianoService } from './services/PianoService'
import { EventEmitter } from 'stream'
import { parse } from 'path/posix'

const piano = new PianoService()
const userManager = new UserManager()

export type WebSocketConnection = {
  wss: WebSocket
  status: 'connected' | 'reconnected' | 'disconnected'
  reconnectIn: number
}

window.onload = () => {
  console.log('loaded')
  piano.preLoadAudio()

  const loadButton = document.getElementById('join-btn') as HTMLButtonElement
  const loadLocalhostbutton = document.getElementById('join-btn-local') as HTMLButtonElement
  const connectedAs = document.getElementById('connected-as') as HTMLDivElement

  let wss: WebSocket
  fromEvent<MouseEvent>(loadButton, 'click').subscribe((e) => {
    console.log('join clicked')
    wss = new WebSocket(configuration.websocketUrl)
    setupWebSocket()
  })
  fromEvent<MouseEvent>(loadLocalhostbutton, 'click').subscribe((e) => {
    wss = new WebSocket('ws://localhost:8080')
    setupWebSocket()
  })

  const recconected$ = new Subject<void>()
  const setupWebSocket = () => {
    fromEvent(wss, 'close').subscribe((e) => {
      connectedAs.innerText = 'Connection closed'
    })
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

    const parsedMessage$ = fromEvent<MessageEvent>(wss, 'message').pipe(
      map((e) => JSON.parse(e.data)),
      share()
    )

    parsedMessage$
      .pipe(
        filter((e) => e.type === 'connected-as'),
        map((e) => e.data as { id: string })
      )
      .subscribe((e) => {
        connectedAs.innerText = `Connected as ${e.id}`
      })

    parsedMessage$
      .pipe(
        filter((e) => e.type === 'play-note'),
        map((e) => e.data as { note: string; velocity: number; duration: number })
      )
      .subscribe((e) => {
        console.log('playing', e)
        piano.play(e)
      })

    parsedMessage$
      .pipe(
        filter((e) => e.type === 'ping'),
        map((e) => e.data as { time: number; i: number })
      )
      .subscribe((pingmsg) => {
        wss.send(
          JSON.stringify({
            type: 'pong',
            data: {
              ping: Date.now() - pingmsg.time,
              i: pingmsg.i,
            },
          })
        )
      })
  }
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
