import { TimedNote } from './TimedNote'
import { WebSocketServer, Server, AddressInfo, RawData, MessageEvent, WebSocket } from 'ws'
import { createServer } from 'http'
import {
  connect,
  EMPTY,
  filter,
  from,
  fromEvent,
  interval,
  map,
  Observable,
  pipe,
  scan,
  share,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { v4 as uuid } from 'uuid'

import { MusicEngine } from './MusicEngine'

const http = createServer()

const musicEngine = new MusicEngine()

const wss = new Server({ server: http })

const connectedClients: { [key: string]: { id: string; ws: WebSocket; ping: number } } = {}

const connectedDashboards: { [key: string]: WebSocket } = {}

const stopSongs$ = new Subject<void>()

wss.on('connection', (ws) => {
  const id = uuid()
  connectedClients[id] = { id, ws, ping: 1 }
  console.log(
    `Connectedc client with id ${id}. ${Object.keys(connectedClients).length} clients connected. ${
      Object.keys(connectedDashboards).length
    } dashboard clients connected`
  )
  const destroy$ = new Subject<void>()

  ws.send(
    JSON.stringify({
      type: 'connected-as',
      data: {
        id,
      },
    })
  )
  const messages$ = fromEvent(ws, 'message').pipe(
    takeUntil(destroy$),
    map((e) => (e as MessageEvent).data as string),
    map((e) => JSON.parse(e) as { type: string; data: any })
    // share()
  )

  interval(500)
    .pipe(
      switchMap((i) => {
        ws.send(
          JSON.stringify({
            type: 'ping',
            data: { time: Date.now(), i },
          })
        )
        return messages$.pipe(
          filter((e) => e.type === 'pong'),
          map((e) => e.data as { ping: number })
        )
      })
    )
    .subscribe((pingmsg) => {
      console.log(id, pingmsg)
      connectedClients[id].ping = pingmsg.ping
    })

  messages$.subscribe((e) => console.log('recieved', e))

  messages$
    .pipe(
      filter((e) => e.type === 'play-song'),
      map((e) => e.data as { name: string }),
      tap((e) => console.log('received play song', e)),
      switchMap((playSong) => musicEngine.play(playSong.name)),
      takeUntil(destroy$),
      takeUntil(stopSongs$)
    )
    .subscribe((note) => {
      const slowestPing = Object.values(connectedClients)
        .map((cc) => cc.ping)
        .reduce((prev, curr) => (prev >= curr ? prev : curr))
      for (const clientId in connectedClients) {
        setTimeout(() => {
          connectedClients[clientId].ws.send(
            JSON.stringify({
              type: 'play-note',
              data: note,
            })
          )
        }, slowestPing - connectedClients[clientId].ping)
      }
    })

  messages$
    .pipe(
      filter((e) => e.type === 'command-play-note'),
      map((e) => e.data as { note: string })
    )
    .subscribe((e) => {
      const slowestPing = Object.values(connectedClients)
        .map((cc) => cc.ping)
        .reduce((prev, curr) => (prev >= curr ? prev : curr))
      for (const clientId in connectedClients) {
        const client = connectedClients[clientId]
        setTimeout(() => {
          client.ws.send(
            JSON.stringify({
              type: 'play-note',
              data: {
                note: e.note,
                duration: 1000,
                velocity: 1000,
                start: 0,
              } as TimedNote,
            })
          )
        }, slowestPing - client.ping)
      }
    })

  messages$
    .pipe(
      filter((e) => e.type === 'identify'),
      map((e) => e.data)
    )
    .subscribe((msg) => {
      //by the power of closure, we can rely on id being captured in the function scope
      connectedDashboards[id] = ws
      delete connectedClients[id]
      console.log('Connected dashboard clients', id)
      console.log(`Connected normal clients: [${Object.keys(connectedClients).length}]`)
      console.log(`Connected Dashboard clients: [${Object.keys(connectedDashboards).length}]`)
    })
  messages$.pipe(filter((e) => e.type === 'stop-song')).subscribe((_) => {
    stopSongs$.next()
  })

  fromEvent(ws, 'close').subscribe((close) => {
    destroy$.next()
    destroy$.complete()
    console.log(`Client with id ${id} closed`)
    delete connectedClients[id]
  })
})

http.listen(process.env.PORT ?? 8080, () => {
  console.log(`Server started on port ${(http.address() as AddressInfo).port}`)
})

export type Message = ConnectedMessage

export type ConnectedMessage = {
  type: 'connect'
  id: string
  data: {
    id: number
  }
}
