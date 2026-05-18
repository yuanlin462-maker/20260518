let detections;
let gameTimer = 3;
let lastTimestamp = 0;
let currentGesture = "未偵測到手勢";
let resultLocked = false;

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
  // 設定背景顏色為 #FF77FF (亮粉色)
  background('#FF77FF');

  // 處理倒數計時邏輯 (每秒執行一次)
  if (!resultLocked) {
    if (millis() - lastTimestamp > 1000) {
      if (gameTimer > 0) {
        gameTimer--;
      } else {
        resultLocked = true; // 時間到，鎖定結果
      }
      lastTimestamp = millis();
    }
  }

  if (detections && detections.image) {
    // 1. 解析手勢 (只在倒數期間解析，一旦鎖定就不再更新，達到「不能動」的效果)
    if (!resultLocked) analyzeGesture();

    // 2. 繪製攝影機影像 (居中 50%)
    let dw = width * 0.5;
    let dh = height * 0.5;
    let dx = (width - dw) / 2;
    let dy = (height - dh) / 2;

    push();
    translate(dx + dw, dy);
    scale(-1, 1);
    drawingContext.drawImage(detections.image, 0, 0, dw, dh);
    
    if (detections.multiHandLandmarks) {
      for (const landmarks of detections.multiHandLandmarks) {
        // 1. 繪製骨架連接線 (使用綠色)
        stroke(0, 255, 0); 
        strokeWeight(3);
        for (const connection of HAND_CONNECTIONS) {
          let from = landmarks[connection[0]];
          let to = landmarks[connection[1]];
          // 將歸一化座標轉換為影像區域內的像素座標
          line(from.x * dw, from.y * dh, to.x * dw, to.y * dh);
        }

        // 2. 繪製指尖與關節點 (使用紅色點)
        noStroke();
        fill(255, 0, 0);
        for (const pt of landmarks) {
          circle(pt.x * dw, pt.y * dh, 7);
        }
      }
    }
    pop();
  } else {
    // 攝影機尚未就緒時的提示
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(24);
    text("正在初始化攝影機...", width / 2, height / 2);
  }

  // 3. 顯示遊戲 UI (移到最外層，確保隨時可見)
  drawUI();
}

function analyzeGesture() {
  if (detections.multiHandLandmarks && detections.multiHandLandmarks.length > 0) {
    const landmarks = detections.multiHandLandmarks[0];
    
    // 判斷手指是否伸直 (y 座標越小代表越高)
    let isIndexUp = landmarks[8].y < landmarks[6].y;
    let isMiddleUp = landmarks[12].y < landmarks[10].y;
    let isRingUp = landmarks[16].y < landmarks[14].y;
    let isPinkyUp = landmarks[20].y < landmarks[18].y;

    // 計算伸直的手指數量
    let upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(v => v).length;

    if (upCount === 0) currentGesture = "石頭 ✊";
    else if (upCount === 2 && isIndexUp && isMiddleUp) currentGesture = "剪刀 ✌️";
    else if (upCount >= 3) currentGesture = "布 🖐️";
    else currentGesture = "偵測中...";
  } else {
    currentGesture = "未偵測到手勢";
  }
}

function drawUI() {
  push();
  textAlign(CENTER, CENTER);
  
  // 在右上角顯示狀態：倒數時顯示「準備中」，結束後顯示「最終結果」
  push();
  textAlign(RIGHT, TOP);
  fill(0);
  textSize(30);
  let statusText = resultLocked ? currentGesture : "準備中...";
  text("您出的是: " + statusText, width - 20, 20);
  pop();

  // 顯示倒數或結果
  if (!resultLocked) {
    fill(255);
    textSize(80);
    text(gameTimer > 0 ? gameTimer : "出拳！", width / 2, height * 0.15);
    
    textSize(32);
    text("請準備手勢...", width / 2, height * 0.25);
  } else {
    // 移除中央的 "您出的是：" 大字，只保留重新開始提示
    // 重新開始提示
    fill(255);
    textSize(20);
    text("點擊畫面重新開始", width / 2, height * 0.9);
  }
  pop();
}

// 點擊畫面重置遊戲
function mousePressed() {
  if (resultLocked) {
    gameTimer = 3;
    resultLocked = false;
    lastTimestamp = millis();
  }
}
