# Stranger Chat

Random chat (text / audio / video) + friends system + direct P2P (WebRTC). Messages server par save nahi hote.

**Stack:** Next.js 15 (App Router) + TypeScript, custom Node server (`server.ts`) + Socket.IO signaling, WebRTC,
MongoDB + Mongoose, Tailwind CSS v4, GSAP, Lucide, IndexedDB.

## Run karo (Pop!_OS)

```bash
cp .env.example .env.local      # MONGODB_URI set karo
npm install
npm run dev                     # http://localhost:3000
```

Production: `npm run build && npm start`

> MongoDB ke bina bhi random chat chalega. Friends system ke liye `MONGODB_URI` zaroori hai.
> Local MongoDB: `docker run -d -p 27017:27017 --name mongo mongo:7`

**Test kaise karein:** do alag browser/profile (ya ek normal + ek incognito) mein `/chat` kholo, dono par Start dabao.
Camera/mic ke liye `localhost` ya HTTPS chahiye (HTTP par LAN IP se camera nahi chalega).

## Kya-kya hai

| Feature | Kahan |
|---|---|
| Random matchmaking (text/audio/video queue), Next, report, block | `src/server/socket.ts`, `src/components/ChatRoom.tsx` |
| WebRTC (DataChannel text + file chunks, audio/video tracks) | `src/lib/webrtc.ts` |
| Guest unique ID (8 char), friends, requests (send / accept / reject / remove) | `src/app/api/*`, `src/components/FriendsPanel.tsx` |
| Friend ko direct chat / audio / video call (online hone par) | `direct:*` events in `socket.ts` |
| 24-hour local messages + auto cleanup | `src/lib/idb.ts` |
| Photos/files P2P (25 MB tak, 16 KB chunks, backpressure) | `src/lib/webrtc.ts` |

## Important design notes

- **Server par message nahi:** server sirf signaling (offer/answer/ICE) relay karta hai.
- **24 ghante:** har message `expiresAt = ts + 24h` ke saath IndexedDB mein jata hai. Page open hone par aur har minute
  expired messages delete hote hain. Sender aur receiver ka cleanup independent hai.
- **History sirf friend chats ki:** random stranger se chat ephemeral hai (dobara usi stranger se milna possible nahi),
  isliye wo IndexedDB mein save nahi hoti. Chahiye to `ChatRoom.tsx` mein `convRef.current` random ke liye bhi set karo.
- **Guest ID:** `uid` public hai, `secret` sirf browser ke localStorage mein; DB mein sirf `sha256(secret)`.
  Browser data clear = ID gayi (account recovery nahi hai).
- **TURN:** kuch networks par direct P2P fail hota hai. `.env.local` mein `NEXT_PUBLIC_TURN_*` set karo
  (coturn ya Twilio/Metered).

## Public launch se pehle (zaroori)

- [ ] Report queue ke liye admin review (collection: `reports`) + repeat offenders ka auto-ban
- [ ] IP-based rate limiting (reverse proxy ya `rate-limiter-flexible`) — `/api/guest` par khaaskar
- [ ] Video moderation policy / NSFW detection, aur age verification ka strong tareeka (abhi sirf 18+ checkbox hai)
- [ ] HTTPS + production `CORS_ORIGIN`, TURN server
- [ ] Privacy policy, Terms, aur local laws (IT Rules 2021) ke hisaab se grievance officer
- [ ] Multiple server instances chalane hon to `@socket.io/redis-adapter` + shared matchmaking queue

## Roadmap status

1-9 implemented (UI, signaling, P2P text, matchmaking, audio/video, files, guest IDs, friends, 24h IndexedDB).
Phase 10: animations basic hain; safety (report/block) hai; **testing aur deployment aapko karna hai**.
