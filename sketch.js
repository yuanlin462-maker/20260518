let detections;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);

  const videoElement = document.getElementById('input_video');

  // 初始化 MediaPipe Hands
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);

  // 初始化攝影機小工具
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

// 當視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function onResults(results) {
  detections = results;
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  if (detections && detections.image) {
    // 計算 50% 的影像寬高
    let dw = width * 0.5;
    let dh = height * 0.5;
    // 計算置中座標
    let dx = (width - dw) / 2;
    let dy = (height - dh) / 2;

    push();
    // 移動到影像框的右上角準備進行水平翻轉 (鏡像)
    translate(dx + dw, dy);
    scale(-1, 1);

    // 繪製攝影機影像，大小調整為寬高的 50%
    drawingContext.drawImage(detections.image, 0, 0, dw, dh);
    
    if (detections.multiHandLandmarks) {
      for (const landmarks of detections.multiHandLandmarks) {
        // 因為使用了縮放後的 context，必須手動將標記點座標轉換到 dw, dh 的大小
        const scaledLandmarks = landmarks.map(l => ({
          x: l.x * dw,
          y: l.y * dh,
          z: l.z
        }));
        drawConnectors(drawingContext, scaledLandmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3});
        drawLandmarks(drawingContext, scaledLandmarks, {color: '#FF0000', lineWidth: 1});
      }
    }
    pop();
  } else {
    textAlign(CENTER);
    text("正在初始化攝影機...", width / 2, height / 2);
  }
}
