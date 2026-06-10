# Smart Waste Classification System

Lightweight frontend demo for browser-based waste classification (Plastic, Paper, Metal, Glass) using a TensorFlow.js model exported from Google Teachable Machine.

Getting started

1. Place your Teachable Machine export in `./model/` so the model file is available at `./model/model.json` (and weight shards alongside it).
2. Open `index.html` in a modern browser (no server required for the demo, but some browsers may restrict webcam access on file:// — use a simple HTTP server when testing webcam features).

Quick local server (Python 3):

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Notes
- `script.js` attempts to load `./model/model.json`. If not found, the page runs a simulated demo mode with randomized predictions.
- To integrate a real model, replace the placeholder inference in `script.js` with your model's preprocessing and `model.predict(...)` call.

Files of interest
- `index.html` — main UI and SVGs
- `styles.css` — neon glassmorphism styles and animations
- `script.js` — UI logic, webcam/upload handling, and TF.js placeholder

License
MIT
