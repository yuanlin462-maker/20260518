let detections;
let gameTimer = 3;
let lastTimestamp = 0;
let currentGesture = "等待中...";
let computerGesture = "";
let gameResult = "";
let resultLocked = false;
let cameraStarted = false;

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
  lastTimestamp = millis(); // 初始化計時器
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
  if (cameraStarted && !resultLocked) {
    let elapsed = millis() - lastTimestamp;
    if (elapsed > 1000) {
      gameTimer--;
      lastTimestamp = millis();
      if (gameTimer <= 0) {
        computerGesture = random(["石頭 ✊", "剪刀 ✌️", "布 🖐️"]);
        resultLocked = true; // 倒數結束，鎖定結果
        gameResult = judgeWinner(currentGesture, computerGesture);
      }
    }
  }

  if (detections && detections.image) {
    cameraStarted = true;
    // 1. 解析手勢：只在倒數期間更新 currentGesture
    if (!resultLocked) analyzeGesture();

    // 2. 繪製攝影機影像 (居中 50%)
    let dw = width * 0.5;
    let dh = height * 0.5;
    let dx = (width - dw) / 2; // 置中位置
    let dy = (height - dh) / 2; // 置中位置

    push();
    translate(dx + dw, dy);
    scale(-1, 1); // 鏡像處理
    drawingContext.drawImage(detections.image, 0, 0, dw, dh);
    
    // 3. 繪製骨架 (只在倒數期間顯示)
    if (detections.multiHandLandmarks && !resultLocked) {
      for (const landmarks of detections.multiHandLandmarks) {
        stroke(0, 255, 0); 
        strokeWeight(3);
        for (const connection of HAND_CONNECTIONS) {
          let from = landmarks[connection[0]];
          let to = landmarks[connection[1]];
          // 將歸一化座標轉換為影像區域內的像素座標
          line(from.x * dw, from.y * dh, to.x * dw, to.y * dh);
        }

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

  // 4. 顯示遊戲 UI
  drawUI();
}

// 解析目前手勢的邏輯
function analyzeGesture() {
  if (detections.multiHandLandmarks && detections.multiHandLandmarks.length > 0) {
    const landmarks = detections.multiHandLandmarks[0];
    
    let isIndexUp = landmarks[8].y < landmarks[6].y;
    let isMiddleUp = landmarks[12].y < landmarks[10].y;
    let isRingUp = landmarks[16].y < landmarks[14].y;
    let isPinkyUp = landmarks[20].y < landmarks[18].y;

    let upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(v => v).length;

    if (upCount === 0) currentGesture = "石頭 ✊";
    else if (upCount === 2 && isIndexUp && isMiddleUp) currentGesture = "剪刀 ✌️";
    else if (upCount >= 3) currentGesture = "布 🖐️";
    else currentGesture = "偵測中...";
  } else {
    currentGesture = "未偵測到手";
  }
}

// 繪製使用者介面
function drawUI() {
  push();
  textAlign(CENTER, CENTER);
  
  // 右上角顯示：倒數時顯示「準備中」，結束後顯示「最終結果」
  push();
  textAlign(RIGHT, TOP);
  fill(0);
  textSize(30);
  if (resultLocked) {
    text("您出的是: " + currentGesture, width - 40, 40);
    text("電腦出的是: " + computerGesture, width - 40, 80);
  } else {
    text("您出的是: 準備中...", width - 40, 40);
  }
  pop();

  // 畫面中央的倒數與提示
  if (!resultLocked) {
    fill(255);
    textSize(180);
    let timerText = "";
    if (gameTimer === 3) timerText = "剪刀✌";
    else if (gameTimer === 2) timerText = "石頭✊";
    else if (gameTimer === 1) timerText = "布!🖐";
    
    text(timerText, width / 2, height / 2);
  } else {
    fill(255);
    textSize(30);
    text("點擊畫面重新開始", width / 2, height * 0.9);
  }
  pop();
}

// 點擊畫面重置遊戲
function mousePressed() {
  if (resultLocked) {
    gameTimer = 3;
    resultLocked = false;
    gameResult = "";
    computerGesture = "";
    lastTimestamp = millis();
  }
}
