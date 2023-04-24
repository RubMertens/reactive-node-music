import {
    filter,
    fromEvent,
    interval,
    map,
    share,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    tap,
    withLatestFrom,
} from "rxjs";
import {configuration} from "./configuration";

window.onload = () => {
    console.log("DOM loaded");
    document.addEventListener('keydown', (e) => {
        if (e.key === 't') {
            document.getElementsByTagName('body')[0].style.display = "block"
        }
    })
    let wss = new WebSocket(configuration.websocketUrl);

    const pingSyncStatus = document.getElementById(
        "ping-sync-status"
    ) as HTMLLabelElement;

    const buttonDiv = document.getElementById("play-btns") as HTMLDivElement;

    const songs = ["test", "adele", "mario", "ofortuna"];

    songs.forEach((s) => {
        const btn = document.createElement("button");
        btn.innerText = `Play ${s}`;
        fromEvent<MouseEvent>(btn, "click").subscribe((e) => {
            wss.send(
                JSON.stringify({
                    type: "play-song",
                    data: {
                        name: s,
                    },
                })
            );
        });
        buttonDiv.appendChild(btn);
    });

    fromEvent<MouseEvent>(
        document.getElementById("stop-song") as HTMLButtonElement,
        "click"
    ).subscribe((e) => {
        wss.send(
            JSON.stringify({
                type: "stop-song",
            })
        );
    });

    fromEvent(
        document.getElementById("ping-sync-off") as HTMLButtonElement,
        "click"
    ).subscribe(() => {
        wss.send(
            JSON.stringify({
                type: "ping-sync-off",
                data: "",
            })
        );
    });

    fromEvent(
        document.getElementById("ping-sync-on") as HTMLButtonElement,
        "click"
    ).subscribe(() => {
        wss.send(
            JSON.stringify({
                type: "ping-sync-on",
                data: "",
            })
        );
    });

    const reconnectedSubject$ = new Subject<void>();
    const setupWebSocket = () => {
        keyboardHandlers().subscribe((key) => {
            console.log("playing note ", key);
            wss.send(
                JSON.stringify({
                    type: "command-play-note",
                    data: {note: key},
                })
            );
        });

        const messages$ = fromEvent<MessageEvent>(wss, "message").pipe(
            map((ms) => JSON.parse(ms.data) as { type: string; data: any }),
            tap((m) => console.log(m)),
            share()
        );

        messages$
            .pipe(filter((m) => m.type === "ping-sync-status"))
            .subscribe((status) => {
                pingSyncStatus!.innerText = status.data + "";
            });

        messages$
            .pipe(filter((m) => m.type === "connected-clients"))
            .subscribe((connectedClients) => {
                const connectedClientDOM = document.getElementById(
                    "connected-clients"
                ) as HTMLElement;
                const clients = connectedClients.data as {
                    name: string;
                    ping: number;
                }[];
                connectedClientDOM.innerText = `${clients
                    .sort((c) => c.ping)
                    .map((c) => `${c.name} :: ${c.ping}`)
                    .join("\n")}`;
            });

        messages$
            .pipe(filter((m) => m.type === "connected-as"))
            .subscribe((connectedAs) => {
                console.log("identifying as dashboard client");
                wss.send(
                    JSON.stringify({
                        type: "identify",
                        data: {
                            id: connectedAs.data.id,
                        },
                    })
                );
            });

        fromEvent(wss, "close")
            .pipe(
                switchMap(() => interval(1000).pipe(takeUntil(reconnectedSubject$)))
            )
            .subscribe((e) => {
                reconnectedSubject$.next();
                wss = new WebSocket(configuration.websocketUrl);
                setupWebSocket();
            });
        fromEvent(wss, "open").subscribe((e) => {
            console.log("opened connection");
            reconnectedSubject$.next();
        });
    };
    setupWebSocket();
};

const keyboardHandlers = () => {
    let lowestRegister = 3;

    const register$ = fromEvent<KeyboardEvent>(document, "keydown").pipe(
        map((e) => {
            if (e.key === "Control") return --lowestRegister;
            if (e.key === "Shift") return ++lowestRegister;
            return lowestRegister;
        }),
        startWith(lowestRegister)
    );
    return fromEvent<KeyboardEvent>(document, "keydown").pipe(
        withLatestFrom(register$),
        map(([keyEvent, register]) => {
            const key = keyEvent.key;
            const noteMap: { [key: string]: string } = {
                w: "C" + register,
                s: "Db" + register,
                x: "D" + register,
                d: "Eb" + register,
                c: "E" + register,
                v: "F" + register,
                g: "Gb" + register,
                b: "G" + register,
                h: "Ab" + register,
                n: "A" + register,
                j: "Bb" + (register + 1),
                ",": "B" + (register + 1),
                ";": "C" + (register + 1),
                l: "Db" + (register + 1),
                ":": "D" + (register + 1),
                m: "Eb" + (register + 1),
                "=": "E" + (register + 1),
                a: "C" + (register + 1),
                é: "Db" + (register + 1),
                z: "D" + (register + 1),
                '"': "Eb" + (register + 1),
                e: "E" + (register + 1),
                r: "F" + (register + 1),
                "(": "Gb" + (register + 1),
                t: "G" + (register + 1),
                "§": "Ab" + (register + 1),
                y: "A" + (register + 1),
                è: "Bb" + (register + 2),
                u: "B" + (register + 2),
                i: "C" + (register + 2),
                ç: "Db" + (register + 2),
                o: "D" + (register + 2),
                à: "Eb" + (register + 2),
                p: "E" + (register + 2),
            };

            return noteMap[key];
        }),
        filter((note) => !!note)
    );
};

export type Connect = {
    type: "connect";
    data: {
        id: number;
    };
};
