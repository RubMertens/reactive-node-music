import { Howl, Howler } from 'howler'

export const PianoServiceConfiguration = {
  html5PoolSize: 30,
}

export class PianoService {
  constructor() {
    Howler.html5PoolSize = PianoServiceConfiguration.html5PoolSize
  }

  preLoadAudio() {
    for (const key in this.audiofiles) {
      // console.log('loading', key)
      const note = new Howl({
        src: this.audiofiles[key],
        preload: true,
        pool: 10,
      })
      this.piano[key] = note
      ;(window as any).piano = this.piano
    }
  }

  public play(timedNote: { note: string; velocity: number; duration: number }) {
    console.log('playing', timedNote)
    const audio = this.piano[timedNote.note]
    audio.volume(timedNote.velocity * 0.1)
    audio.duration(timedNote.duration)
    audio.play()
  }

  // play(timedNote: string) {
  //   const [note, velocity, duration] = timedNote.split(':')
  //   const audio = this.piano[note]
  //   console.log('playing', note)
  //   audio.volume(Number.parseFloat(velocity))
  //   audio.duration(Number.parseFloat(duration))
  //   audio.play()
  // }

  piano: { [key: string]: Howl } = {}

  audiofiles: { [key: string]: string } = {
    Bb1: '../../../assets/audio_files/piano/Bb1.webm',
    B1: '../../../assets/audio_files/piano/B1.webm',
    C1: '../../../assets/audio_files/piano/C1.webm',
    Db1: '../../../assets/audio_files/piano/Db1.webm',
    D1: '../../../assets/audio_files/piano/D1.webm',
    Eb1: '../../../assets/audio_files/piano/Eb1.webm',
    E1: '../../../assets/audio_files/piano/E1.webm',
    F1: '../../../assets/audio_files/piano/F1.webm',
    Gb1: '../../../assets/audio_files/piano/Gb1.webm',
    G1: '../../../assets/audio_files/piano/G1.webm',
    Ab1: '../../../assets/audio_files/piano/Ab1.webm',
    A1: '../../../assets/audio_files/piano/A1.webm',
    Bb2: '../../../assets/audio_files/piano/Bb2.webm',
    B2: '../../../assets/audio_files/piano/B2.webm',
    C2: '../../../assets/audio_files/piano/C2.webm',
    Db2: '../../../assets/audio_files/piano/Db2.webm',
    D2: '../../../assets/audio_files/piano/D2.webm',
    Eb2: '../../../assets/audio_files/piano/Eb2.webm',
    E2: '../../../assets/audio_files/piano/E2.webm',
    F2: '../../../assets/audio_files/piano/F2.webm',
    Gb2: '../../../assets/audio_files/piano/Gb2.webm',
    G2: '../../../assets/audio_files/piano/G2.webm',
    Ab2: '../../../assets/audio_files/piano/Ab2.webm',
    A2: '../../../assets/audio_files/piano/A2.webm',
    Bb3: '../../../assets/audio_files/piano/Bb3.webm',
    B3: '../../../assets/audio_files/piano/B3.webm',
    C3: '../../../assets/audio_files/piano/C3.webm',
    Db3: '../../../assets/audio_files/piano/Db3.webm',
    D3: '../../../assets/audio_files/piano/D3.webm',
    Eb3: '../../../assets/audio_files/piano/Eb3.webm',
    E3: '../../../assets/audio_files/piano/E3.webm',
    F3: '../../../assets/audio_files/piano/F3.webm',
    Gb3: '../../../assets/audio_files/piano/Gb3.webm',
    G3: '../../../assets/audio_files/piano/G3.webm',
    Ab3: '../../../assets/audio_files/piano/Ab3.webm',
    A3: '../../../assets/audio_files/piano/A3.webm',
    Bb4: '../../../assets/audio_files/piano/Bb4.webm',
    B4: '../../../assets/audio_files/piano/B4.webm',
    C4: '../../../assets/audio_files/piano/C4.webm',
    Db4: '../../../assets/audio_files/piano/Db4.webm',
    D4: '../../../assets/audio_files/piano/D4.webm',
    Eb4: '../../../assets/audio_files/piano/Eb4.webm',
    E4: '../../../assets/audio_files/piano/E4.webm',
    F4: '../../../assets/audio_files/piano/F4.webm',
    Gb4: '../../../assets/audio_files/piano/Gb4.webm',
    G4: '../../../assets/audio_files/piano/G4.webm',
    Ab4: '../../../assets/audio_files/piano/Ab4.webm',
    A4: '../../../assets/audio_files/piano/A4.webm',
    Bb5: '../../../assets/audio_files/piano/Bb5.webm',
    B5: '../../../assets/audio_files/piano/B5.webm',
    C5: '../../../assets/audio_files/piano/C5.webm',
    Db5: '../../../assets/audio_files/piano/Db5.webm',
    D5: '../../../assets/audio_files/piano/D5.webm',
    Eb5: '../../../assets/audio_files/piano/Eb5.webm',
    E5: '../../../assets/audio_files/piano/E5.webm',
    F5: '../../../assets/audio_files/piano/F5.webm',
    Gb5: '../../../assets/audio_files/piano/Gb5.webm',
    G5: '../../../assets/audio_files/piano/G5.webm',
    Ab5: '../../../assets/audio_files/piano/Ab5.webm',
    A5: '../../../assets/audio_files/piano/A5.webm',
    Bb6: '../../../assets/audio_files/piano/Bb6.webm',
    B6: '../../../assets/audio_files/piano/B6.webm',
    C6: '../../../assets/audio_files/piano/C6.webm',
    Db6: '../../../assets/audio_files/piano/Db6.webm',
  }
}
