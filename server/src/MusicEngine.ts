import { readFile } from "fs/promises";
import path from "path";
import { delay, from, map, merge, Observable, of, switchMap } from "rxjs";
import { TimedNote } from "./TimedNote";

const noteConversionMap: { [key: string]: string } = {
  A: "A",
  "A#": "Bb",
  B: "B",
  C: "C",
  "C#": "Db",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "Gb",
  G: "G",
  "G#": "Ab",
};

export class MusicEngine {
  private callBackMusicPlayer(notes: TimedNote[]): Observable<TimedNote> {
    return new Observable<TimedNote>((subscriber) => {
      const startTime = Date.now();

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];

        const callBackNote = (cb: Function) => {
          const checkNote = () => {
            const pointInSong = Date.now() - startTime;
            if (note.start < pointInSong) {
              cb();
            } else {
              setTimeout(() => {
                checkNote();
              }, 0);
            }
          };
          checkNote();
        };
        callBackNote(() => {
          subscriber.next(note);
        });
      }
      return () => {
        subscriber.complete();
      };
    });
  }

  private delayMusicPlayer(notes: TimedNote[]): Observable<TimedNote> {
    return merge(...notes.map((n) => of(n).pipe(delay(n.start))));
  }

  play(songName: string): Observable<TimedNote> {
    return from(
      readFile(path.resolve(__dirname, `music/${songName}.json`))
    ).pipe(
      map((file) => {
        const parsed = JSON.parse(file.toString());
        const tempo = 60 / parsed.header.bpm;
        const tracks = parsed.tracks as Array<any>;

        return tracks
          .flatMap((track) => track.notes)
          .map(
            (n: {
              name: string;
              time: number;
              velocity: number;
              duration: number;
            }) => {
              return <TimedNote>{
                start: n.time * tempo * 1000,
                duration: n.duration * tempo * 1000,
                velocity: n.velocity * tempo * 1000,
                note:
                  noteConversionMap[n.name.substring(0, n.name.length - 1)] +
                  n.name.substr(n.name.length - 1),
              };
            }
          );
      }),
      switchMap((notes: TimedNote[]) => {
        return this.callBackMusicPlayer(notes);
        // return this.delayMusicPlayer(notes)
      })
    );
  }
}
