let detections;

function setup() {
  // 配合常見的攝影機比例
  createCanvas(640, 480);

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

function onResults(results) {
  detections = results;
}

function draw() {
  // 繪製攝影機內容
  if (detections && detections.image) {
    // 水平翻轉影像讓操作更直覺 (鏡像)
    push();
    translate(width, 0);
    scale(-1, 1);
    drawingContext.drawImage(detections.image, 0, 0, width, height);
    
    // 繪製手部關節
    if (detections.multiHandLandmarks) {
      for (const landmarks of detections.multiHandLandmarks) {
        drawConnectors(drawingContext, landmarks, HAND_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 5});
        drawLandmarks(drawingContext, landmarks,
                      {color: '#FF0000', lineWidth: 2});
      }
    }
    pop();
  } else {
    background(220);
    textAlign(CENTER);
    text("正在初始化攝影機...", width / 2, height / 2);
  }
}
