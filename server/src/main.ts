import fs from "fs";
import { createServer } from "http";
import {
  filter,
  fromEvent,
  interval,
  map,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { v4 as uuid } from "uuid";
import { AddressInfo, MessageEvent, Server, WebSocket } from "ws";
import { MusicEngine } from "./MusicEngine";
import { TimedNote } from "./TimedNote";

const http = createServer((req, res) => {
  if (req.url === "/") {
    req.url = "/index.html";
  }
  fs.readFile(__dirname + req.url, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    console.log(req.url);
    if (req.url?.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
    res.writeHead(200);
    res.end(data);
  });
});

const musicEngine = new MusicEngine();

const wss = new Server({ server: http });

const connectedClients: {
  [key: string]: { id: string; ws: WebSocket; ping: number };
} = {};

const connectedDashboards: { [key: string]: WebSocket } = {};
let pingSyncEnabled = false;

const stopSongs$ = new Subject<void>();

interval(1000).subscribe((i) => {
  for (const client of Object.values(connectedClients)) {
    client.ws.send(
      JSON.stringify({
        type: "ping",
        data: { time: Date.now(), i },
      })
    );
  }
});

const publishConnectedClients = () => {
  Object.values(connectedDashboards).forEach((cd) =>
    cd.send(
      JSON.stringify({
        type: "connected-clients",
        data: Object.values(connectedClients).map((cc) => ({
          name: cc.id,
          ping: cc.ping,
        })),
      })
    )
  );
};

const publishPingSyncState = () => {
  Object.values(connectedDashboards).forEach((cd) => {
    cd.send(
      JSON.stringify({
        type: "ping-sync-status",
        data: pingSyncEnabled,
      })
    );
  });
};

interval(1000).subscribe((i) => {
  publishConnectedClients();
});

wss.on("connection", (ws) => {
  const id = uuid();
  connectedClients[id] = { id, ws, ping: 1 };
  console.log(
    `Connectedc client with id ${id}. ${
      Object.keys(connectedClients).length
    } clients connected. ${
      Object.keys(connectedDashboards).length
    } dashboard clients connected`
  );
  const destroy$ = new Subject<void>();

  ws.send(
    JSON.stringify({
      type: "connected-as",
      data: {
        id,
      },
    })
  );

  publishConnectedClients();

  const messages$ = fromEvent(ws, "message").pipe(
    takeUntil(destroy$),
    map((e) => (e as MessageEvent).data as string),
    map((e) => JSON.parse(e) as { type: string; data: any })
    // share()
  );

  messages$
    .pipe(
      filter((e) => e.type === "pong"),
      map((e) => e.data as { ping: number })
    )
    .subscribe((pingMsg) => {
      return (connectedClients[id].ping = pingMsg.ping);
    });

  messages$
    .pipe(
      filter((e) => e.type === "play-song"),
      map((e) => e.data as { name: string }),
      tap((e) => console.log("received play song", e)),
      switchMap((playSong) =>
        musicEngine.play(playSong.name).pipe(takeUntil(stopSongs$))
      ),
      takeUntil(destroy$)
    )
    .subscribe((note) => {
      // const slowestPing = Object.values(connectedClients)
      //   .map((cc) => cc.ping)
      //   .reduce((prev, curr) => (prev >= curr ? prev : curr));
      for (const clientId in connectedClients) {
        connectedClients[clientId].ws.send(
          JSON.stringify({
            type: "play-note",
            data: note,
          })
        );

        // setTimeout(() => {
        //   connectedClients[clientId].ws.send(
        //     JSON.stringify({
        //       type: "play-note",
        //       data: note,
        //     })
        //   );
        // }, slowestPing - connectedClients[clientId].ping);
      }
    });

  messages$
    .pipe(
      filter((e) => e.type === "command-play-note"),
      map((e) => e.data as { note: string })
    )
    .subscribe((e) => {
      // const slowestPing = Object.values(connectedClients)
      //   .map((cc) => cc.ping)
      //   .reduce((prev, curr) => (prev >= curr ? prev : curr));
      for (const clientId in connectedClients) {
        const client = connectedClients[clientId];
        console.log(`sending play note to ${client.id}`);
        client.ws.send(
          JSON.stringify({
            type: "play-note",
            data: {
              note: e.note,
              duration: 1000,
              velocity: 1000,
              start: 0,
            } as TimedNote,
          })
        );
        // setTimeout(() => {
        //   client.ws.send(
        //     JSON.stringify({
        //       type: "play-note",
        //       data: {
        //         note: e.note,
        //         duration: 1000,
        //         velocity: 1000,
        //         start: 0,
        //       } as TimedNote,
        //     })
        //   );
        // }, slowestPing - client.ping);
      }
    });

  messages$
    .pipe(
      filter((e) => e.type === "identify"),
      map((e) => e.data)
    )
    .subscribe((e) => {
      //by the power of closure, we can rely on id being captured in the function scope
      console.log("identified", e.id, "as dashboard");
      console.log("data:", e);
      connectedDashboards[e.id] = ws;
      delete connectedClients[e.id];
      console.log("Connected dashboard clients", e.id);
      console.log(
        `Connected normal clients: [${Object.keys(connectedClients).length}]`
      );
      console.log(
        `Connected Dashboard clients: [${
          Object.keys(connectedDashboards).length
        }]`
      );

      publishConnectedClients();
      publishPingSyncState();
    });
  messages$.pipe(filter((e) => e.type === "stop-song")).subscribe((_) => {
    stopSongs$.next();
  });

  messages$.pipe(filter((e) => e.type === "ping-sync-off")).subscribe(() => {
    pingSyncEnabled = false;
    publishPingSyncState();
  });
  messages$.pipe(filter((e) => e.type === "ping-sync-on")).subscribe(() => {
    pingSyncEnabled = true;
    publishPingSyncState();
  });

  fromEvent(ws, "close").subscribe((close) => {
    destroy$.next();
    destroy$.complete();
    console.log(`Client with id ${id} closed`);
    delete connectedClients[id];
    delete connectedDashboards[id];
  });
});

http.listen(process.env.PORT ?? 8080, () => {
  console.log(`Server started on port ${(http.address() as AddressInfo).port}`);
});

export type Message = ConnectedMessage;

export type ConnectedMessage = {
  type: "connect";
  id: string;
  data: {
    id: number;
  };
};
