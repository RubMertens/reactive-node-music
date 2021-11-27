import { EMPTY, from, map, Observable, switchMap } from 'rxjs'
import path from 'path'
import { readFile } from 'fs/promises'
import { TimedNote } from './TimedNote'

const noteConversionMap: { [key: string]: string } = {
  A: 'A',
  'A#': 'Bb',
  B: 'B',
  C: 'C',
  'C#': 'Db',
  D: 'D',
  'D#': 'Eb',
  E: 'E',
  F: 'F',
  'F#': 'Gb',
  G: 'G',
  'G#': 'Ab',
}

export class MusicEngine {
  play(songName: string): Observable<TimedNote> {
    return from(readFile(path.resolve(__dirname, `../files/music/${songName}.json`))).pipe(
      map((file) => {
        const parsed = JSON.parse(file.toString())
        const tempo = 60 / parsed.header.bpm
        const tracks = parsed.tracks as Array<any>

        return tracks
          .flatMap((track) => track.notes)
          .map((n: { name: string; time: number; velocity: number; duration: number }) => {
            return <TimedNote>{
              start: n.time * tempo * 1000,
              duration: n.duration * tempo * 1000,
              velocity: n.velocity * tempo * 1000,
              note: noteConversionMap[n.name.substring(0, n.name.length - 1)] + n.name.substr(n.name.length - 1),
            }
          })
      }),
      switchMap((notes: TimedNote[]) => {
        return new Observable<TimedNote>((subscriber) => {
          const start = Date.now()
          for (const note of notes) {
            let played = false
            while (!played && !subscriber.closed) {
              const now = Date.now()
              const pointInSong = now - start
              if (note.start < pointInSong) {
                subscriber.next(note)
                played = true
              }
            }
          }
          subscriber.complete()
          return () => {
            subscriber.complete()
          }
        })
      })
    )

    return EMPTY
  }
}
