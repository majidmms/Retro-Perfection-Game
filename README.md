<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/086d187f-8fef-407d-aa29-0e4272219071

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy with Cloud Run

This app is **stateful**: the Express + Socket.IO server in [server.ts](server.ts) keeps all
room state in an in-memory `Map`. Because of this it needs a long-lived server with
WebSocket support — static hosting (including plain Firebase Hosting) and stateless
Cloud Functions won't work. Google Cloud Run is the recommended target.

**Prerequisites:**
- A Google Cloud project with billing enabled
- The [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`)
- The Cloud Run and Cloud Build APIs enabled:
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com
  ```

### 1. Make the server respect Cloud Run's port

Cloud Run injects the port to listen on via the `PORT` environment variable. In
[server.ts](server.ts), read it instead of hardcoding `3000`:

```ts
const PORT = Number(process.env.PORT) || 3000;
```

and bind to all interfaces:

```ts
httpServer.listen(PORT, "0.0.0.0", () => { /* ... */ });
```

### 2. Add a Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### 3. Deploy

Deploy directly from source. The in-memory room state requires pinning to a single
instance, and Socket.IO requires session affinity:

```bash
gcloud run deploy retro-game \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 --max-instances 1 \
  --session-affinity
```

### 4. Set your Gemini API key

Store the key as a secret (or env var) on the service rather than baking it into the image:

```bash
gcloud run services update retro-game \
  --region us-central1 \
  --set-secrets GEMINI_API_KEY=gemini-key:latest
```

After deployment, `gcloud` prints the service URL — open it to use the app.

### Caveats

- **Single instance only.** In-memory rooms can't be shared across instances, so
  `--max-instances` must stay at `1`. To scale horizontally you'd need to move room
  state into a shared store such as Redis or Firestore.
- **Session affinity** (`--session-affinity`) keeps each client pinned to the same
  instance, which Socket.IO relies on.

### Optional: front with Firebase Hosting

If you want a Firebase Hosting URL in front of Cloud Run, add a `firebase.json` with a
rewrite to the service:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "run": { "serviceId": "retro-game", "region": "us-central1" } }
    ]
  }
}
```

then run `firebase deploy --only hosting`.
