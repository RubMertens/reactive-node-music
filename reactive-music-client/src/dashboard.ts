import { UserManager } from './services/UserManager'
import './style.css'

import { configuration } from './configuration'
import { filter, fromEvent, interval, map, startWith, Subject, switchMap, takeUntil, withLatestFrom } from 'rxjs'

window.onload = () => {
  console.log('DOM loaded')

  let wss = new WebSocket(configuration.websocketUrl)

  const playTestBtn = document.getElementById('play-test') as HTMLButtonElement

  fromEvent(playTestBtn, 'click').subscribe((click) => {
    wss.send(
      JSON.stringify({
        type: 'play-song',
        data: {
          name: 'mario',
        },
      })
    )
  })

  const reconnectedSubject$ = new Subject<void>()
  const setupWebSocket = () => {
    keyboardHandlers().subscribe((key) => {
      console.log('playing note ', key)
      wss.send(
        JSON.stringify({
          type: 'command-play-note',
          data: { note: key },
        })
      )
    })

    wss.onopen = (opened) => {
      console.log(opened)
      reconnectedSubject$.next()
      wss.send(
        JSON.stringify({
          type: 'identify',
          data: {
            clientType: 'dashboard',
          },
        })
      )
    }

    wss.onclose = (closed) => {
      reconnectedSubject$.next()
      console.log(closed)
      interval(1000)
        .pipe(takeUntil(reconnectedSubject$))

        .subscribe((_) => {
          console.log('trying reconnect')
          wss = new WebSocket(configuration.websocketUrl)
          setupWebSocket()
        })
    }
  }
  setupWebSocket()
}

const keyboardHandlers = () => {
  let lowestRegister = 3

  const register$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    map((e) => {
      if (e.key === 'Control') return --lowestRegister
      if (e.key === 'Shift') return ++lowestRegister
      return lowestRegister
    }),
    startWith(lowestRegister)
  )
  return fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    withLatestFrom(register$),
    map(([keyEvent, register]) => {
      const key = keyEvent.key
      const noteMap: { [key: string]: string } = {
        w: 'C' + register,
        s: 'Db' + register,
        x: 'D' + register,
        d: 'Eb' + register,
        c: 'E' + register,
        v: 'F' + register,
        g: 'Gb' + register,
        b: 'G' + register,
        h: 'Ab' + register,
        n: 'A' + register,
        j: 'Bb' + (register + 1),
        ',': 'B' + (register + 1),
        ';': 'C' + (register + 1),
        l: 'Db' + (register + 1),
        ':': 'D' + (register + 1),
        m: 'Eb' + (register + 1),
        '=': 'E' + (register + 1),
        a: 'C' + (register + 1),
        é: 'Db' + (register + 1),
        z: 'D' + (register + 1),
        '"': 'Eb' + (register + 1),
        e: 'E' + (register + 1),
        r: 'F' + (register + 1),
        '(': 'Gb' + (register + 1),
        t: 'G' + (register + 1),
        '§': 'Ab' + (register + 1),
        y: 'A' + (register + 1),
        è: 'Bb' + (register + 2),
        u: 'B' + (register + 2),
        i: 'C' + (register + 2),
        ç: 'Db' + (register + 2),
        o: 'D' + (register + 2),
        à: 'Eb' + (register + 2),
        p: 'E' + (register + 2),
      }
      return noteMap[key]
    }),
    filter((note) => !!note)
  )
}

export type Connect = {
  type: 'connect'
  data: {
    id: number
  }
}
