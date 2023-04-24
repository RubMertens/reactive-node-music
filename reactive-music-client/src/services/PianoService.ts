import { Howl, Howler } from "howler";
import A1 from "../../assets/audio_files/piano/A1.webm";
import A2 from "../../assets/audio_files/piano/A2.webm";
import A3 from "../../assets/audio_files/piano/A3.webm";
import A4 from "../../assets/audio_files/piano/A4.webm";
import A5 from "../../assets/audio_files/piano/A5.webm";
import Ab1 from "../../assets/audio_files/piano/Ab1.webm";
import Ab2 from "../../assets/audio_files/piano/Ab2.webm";
import Ab3 from "../../assets/audio_files/piano/Ab3.webm";
import Ab4 from "../../assets/audio_files/piano/Ab4.webm";
import Ab5 from "../../assets/audio_files/piano/Ab5.webm";
import B1 from "../../assets/audio_files/piano/B1.webm";
import B2 from "../../assets/audio_files/piano/B2.webm";
import B3 from "../../assets/audio_files/piano/B3.webm";
import B4 from "../../assets/audio_files/piano/B4.webm";
import B5 from "../../assets/audio_files/piano/B5.webm";
import B6 from "../../assets/audio_files/piano/B6.webm";
import Bb1 from "../../assets/audio_files/piano/Bb1.webm";
import Bb2 from "../../assets/audio_files/piano/Bb2.webm";
import Bb3 from "../../assets/audio_files/piano/Bb3.webm";
import Bb4 from "../../assets/audio_files/piano/Bb4.webm";
import Bb5 from "../../assets/audio_files/piano/Bb5.webm";
import Bb6 from "../../assets/audio_files/piano/Bb6.webm";
import C1 from "../../assets/audio_files/piano/C1.webm";
import C2 from "../../assets/audio_files/piano/C2.webm";
import C3 from "../../assets/audio_files/piano/C3.webm";
import C4 from "../../assets/audio_files/piano/C4.webm";
import C5 from "../../assets/audio_files/piano/C5.webm";
import C6 from "../../assets/audio_files/piano/C6.webm";
import D1 from "../../assets/audio_files/piano/D1.webm";
import D2 from "../../assets/audio_files/piano/D2.webm";
import D3 from "../../assets/audio_files/piano/D3.webm";
import D4 from "../../assets/audio_files/piano/D4.webm";
import D5 from "../../assets/audio_files/piano/D5.webm";
import Db1 from "../../assets/audio_files/piano/Db1.webm";
import Db2 from "../../assets/audio_files/piano/Db2.webm";
import Db3 from "../../assets/audio_files/piano/Db3.webm";
import Db4 from "../../assets/audio_files/piano/Db4.webm";
import Db5 from "../../assets/audio_files/piano/Db5.webm";
import Db6 from "../../assets/audio_files/piano/Db6.webm";
import E1 from "../../assets/audio_files/piano/E1.webm";
import E2 from "../../assets/audio_files/piano/E2.webm";
import E3 from "../../assets/audio_files/piano/E3.webm";
import E4 from "../../assets/audio_files/piano/E4.webm";
import E5 from "../../assets/audio_files/piano/E5.webm";
import Eb1 from "../../assets/audio_files/piano/Eb1.webm";
import Eb2 from "../../assets/audio_files/piano/Eb2.webm";
import Eb3 from "../../assets/audio_files/piano/Eb3.webm";
import Eb4 from "../../assets/audio_files/piano/Eb4.webm";
import Eb5 from "../../assets/audio_files/piano/Eb5.webm";
import F1 from "../../assets/audio_files/piano/F1.webm";
import F2 from "../../assets/audio_files/piano/F2.webm";
import F3 from "../../assets/audio_files/piano/F3.webm";
import F4 from "../../assets/audio_files/piano/F4.webm";
import F5 from "../../assets/audio_files/piano/F5.webm";
import G1 from "../../assets/audio_files/piano/G1.webm";
import G2 from "../../assets/audio_files/piano/G2.webm";
import G3 from "../../assets/audio_files/piano/G3.webm";
import G4 from "../../assets/audio_files/piano/G4.webm";
import G5 from "../../assets/audio_files/piano/G5.webm";
import Gb1 from "../../assets/audio_files/piano/Gb1.webm";
import Gb2 from "../../assets/audio_files/piano/Gb2.webm";
import Gb3 from "../../assets/audio_files/piano/Gb3.webm";
import Gb4 from "../../assets/audio_files/piano/Gb4.webm";
import Gb5 from "../../assets/audio_files/piano/Gb5.webm";

export const PianoServiceConfiguration = {
    html5PoolSize: 30,
};

export class PianoService {
    piano: { [key: string]: Howl } = {};
    audiofiles: { [key: string]: string } = {
        Bb1,
        B1,
        C1,
        Db1,
        D1,
        Eb1,
        E1,
        F1,
        Gb1,
        G1,
        Ab1,
        A1,
        Bb2,
        B2,
        C2,
        Db2,
        D2,
        Eb2,
        E2,
        F2,
        Gb2,
        G2,
        Ab2,
        A2,
        Bb3,
        B3,
        C3,
        Db3,
        D3,
        Eb3,
        E3,
        F3,
        Gb3,
        G3,
        Ab3,
        A3,
        Bb4,
        B4,
        C4,
        Db4,
        D4,
        Eb4,
        E4,
        F4,
        Gb4,
        G4,
        Ab4,
        A4,
        Bb5,
        B5,
        C5,
        Db5,
        D5,
        Eb5,
        E5,
        F5,
        Gb5,
        G5,
        Ab5,
        A5,
        Bb6,
        B6,
        C6,
        Db6,
    };

    constructor() {
        Howler.html5PoolSize = PianoServiceConfiguration.html5PoolSize;
    }

    preLoadAudio() {
        for (const key in this.audiofiles) {
            // console.log('loading', key)
            const note = new Howl({
                src: this.audiofiles[key],
                preload: true,
                pool: 10,
            });
            this.piano[key] = note;
            (window as any).piano = this.piano;
        }
    }

    public play(timedNote: { note: string; velocity: number; duration: number }) {
        const audio = this.piano[timedNote.note];
        audio.volume(timedNote.velocity * 0.1);
        audio.duration(timedNote.duration);
        audio.play();
    }

    public iphonePlay(timedNote: { note: string; velocity: number; duration: number }) {
        const audio = new Howl({
            src: "./assets/audio_files/piano/"+timedNote.note+".m4a",
            preload: true,
            pool: 10,
        });
        audio.volume(timedNote.velocity * 0.1);
        audio.duration(timedNote.duration);
        audio.play();
    }
}
