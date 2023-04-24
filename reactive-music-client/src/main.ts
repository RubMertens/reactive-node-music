import {filter, fromEvent, interval, map, share, Subject, switchMap, takeUntil, tap,} from "rxjs";
import "../assets/dominik-scythe-412561-cropped.jpg";
import "../assets/PressStart2P-Regular.ttf";
import {configuration} from "./configuration";
import {PianoService} from "./services/PianoService";
import "./style.css";
import {Howl} from "howler";

const piano = new PianoService();

export type WebSocketConnection = {
    wss: WebSocket;
    status: "connected" | "reconnected" | "disconnected";
    reconnectIn: number;
};

window.onload = () => {
    console.log("loaded");
    piano.preLoadAudio();

    const loadButton = document.getElementById("join-btn") as HTMLButtonElement;
    const connectedAs = document.getElementById("connected-as") as HTMLDivElement;

    let wss: WebSocket;
    fromEvent<MouseEvent>(loadButton, "click").subscribe((e) => {
        console.log("join clicked");
        wss = new WebSocket(configuration.websocketUrl);
        setupWebSocket();
        loadButton.disabled = true;
    });


    const recconected$ = new Subject<void>();
    const setupWebSocket = () => {
        fromEvent(wss, "close").subscribe((e) => {
            connectedAs.innerText = "Connection closed";
            loadButton.disabled = false;
        });
        fromEvent(wss, "close")
            .pipe(switchMap((close) => interval(1000).pipe(takeUntil(recconected$))))
            .subscribe((e) => {
                recconected$.next();
                wss = new WebSocket(configuration.websocketUrl);
                setupWebSocket();
            });

        // interval(1000)
        //   .pipe(takeUntil(fromEvent(wss, "close")))
        //   .subscribe(() => {
        //     wss.send(
        //       JSON.stringify({
        //         type: "ping-req",
        //         data: {
        //           clientTime: Date.now(),
        //         },
        //       })
        //     );
        //   });

        fromEvent(wss, "open").subscribe((e) => {
            console.log("opened connection", e);
            recconected$.next();
            loadButton.disabled = true;
        });

        const parsedMessage$ = fromEvent<MessageEvent>(wss, "message").pipe(
            map((e) => JSON.parse(e.data)),
            share()
        );

        parsedMessage$
            .pipe(
                filter((e) => e.type === "connected-as"),
                map((e) => e.data as { id: string })
            )
            .subscribe((e) => {
                connectedAs.innerText = `Connected as ${e.id}`;
            });

        console.log("subbing to messages and stuff");

        if ([
                'iPad Simulator',
                'iPhone Simulator',
                'iPod Simulator',
                'iPad',
                'iPhone',
                'iPod'
            ].includes(navigator.platform)
            // iPad on iOS 13 detection
            || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
            parsedMessage$
                .pipe(
                    filter((e) => e.type === "play-note"),

                    map(
                        (e) => e.data as { note: string; velocity: number; duration: number }
                    ),
                    tap((e) => console.log(e))
                )
                .subscribe((e) => {
                    console.log("playing", e);
                    piano.iphonePlay(e);
                });

        } else {
            parsedMessage$
                .pipe(
                    filter((e) => e.type === "play-note"),

                    map(
                        (e) => e.data as { note: string; velocity: number; duration: number }
                    ),
                    tap((e) => console.log(e))
                )
                .subscribe((e) => {
                    console.log("playing", e);
                    piano.play(e);
                });
        }
        //ping {server-time}
        //pong {server-time, client-time}
        //pingpong {serv}

        parsedMessage$
            .pipe(
                filter((e) => e.type === "ping"),
                map((e) => e.data as { time: number; i: number })
            )
            .subscribe((pingmsg) => {
                wss.send(
                    JSON.stringify({
                        type: "pong",
                        data: {
                            ping: Date.now() - pingmsg.time,
                            i: pingmsg.i,
                        },
                    })
                );
            });
    };
};
