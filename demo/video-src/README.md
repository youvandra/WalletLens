Remotion source for demo/walletlens-demo.mp4.

Setup: npm install, node generate-music.js (writes public/music.wav), then:
npx remotion render src/index.ts Demo out/walletlens-demo.mp4 --codec=h264 --crf=18 --timeout=120000 --concurrency=4
