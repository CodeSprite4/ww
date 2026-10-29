# Wildwood Warren Online

One small Node server that does two jobs:
1. serves the game page (`public/index.html`)
2. runs the multiplayer (WebSocket at `/ws`)

Because players open the game *from the server*, everyone shares one address, and your game save stays in one place too.

## Try it on your own computer
```
npm install
npm start
```
Open http://localhost:3000. Open it in two browser windows to see yourself twice.

## Put it on the internet (Render, free)
1. Make a free account at https://github.com and create a new repository. Upload everything in this folder (not `node_modules`).
2. Make a free account at https://render.com and click **New > Web Service**. Connect your GitHub repository.
3. Settings: Runtime **Node**, Build command `npm install`, Start command `node server.js`. (Or choose **Blueprint** and it reads `render.yaml`.)
4. Click **Create**. In a minute or two you get a link like `https://wildwood-warren.onrender.com`.
5. Share that link. Anyone who opens it joins automatically. Chat is at the bottom-left.

Notes:
- Free Render servers go to sleep after ~15 minutes with nobody on. The first visit after that takes ~30 seconds to wake up.
- Railway, Fly.io, or any computer with Node 18+ also works. Needs: `npm install`, then `node server.js`. The port comes from the `PORT` variable.
- Optional settings (environment variables): `MAX_PLAYERS` (default 80), `PER_IP` (default 6 connections per address).

## What is shared and what isn't
Shared: where animals are in Wildwood, names, looks, chat.
Not shared: homes, gems, kids, escape rooms. Those stay in each player's own browser.

## Chat safety
All chat goes through `filter.js` on the server. It blocks bad words (including tricks like `f u c k`, `sh1t`), mean messages ("you suck", "I hate you"), threats, links, emails, phone numbers and requests for personal info, shouting and spam. The sender is told why. You can add or remove words in `filter.js`. No filter is perfect, so keep an eye on the chat, especially for kids.

## If the game page was opened somewhere else (file, artifact)
Tap **🌐 Online**, type your server address (for example `wildwood-warren.onrender.com`) and press Connect.
