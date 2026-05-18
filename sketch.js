let detections;
let gameTimer = 3;
let lastTimestamp = 0;
let currentGesture = "等待中...";
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
    // 解析手勢
    if (detections.multiHandLandmarks && detections.multiHandLandmarks.length > 0) {
      const landmarks = detections.multiHandLandmarks[0];
      
      // 判斷手指是否伸直 (y 座標越小代表越高)
      let isIndexUp = landmarks[8].y < landmarks[6].y;
      let isMiddleUp = landmarks[12].y < landmarks[10].y;
      let isRingUp = landmarks[16].y < landmarks[14].y;
      let isPinkyUp = landmarks[20].y < landmarks[18].y;
      let isThumbUp = landmarks[4].x > landmarks[3].x; // 姆指通常判斷 x 軸(鏡像後)

      let upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(v => v).length;

      if (upCount === 0) currentGesture = "石頭 ✊";
      else if (upCount === 2 && isIndexUp && isMiddleUp) currentGesture = "剪刀 ✌️";
      else if (upCount >= 3) currentGesture = "布 🖐️";
    }

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

    // 顯示遊戲 UI
    drawUI();
  } else {
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(24);
    text("正在初始化攝影機...", width / 2, height / 2);
  }
}

function drawUI() {
  push();
  textAlign(CENTER, CENTER);
  
  // 在左上角顯示即時偵測狀態，方便玩家調整手勢
  push();
  textAlign(LEFT, TOP);
  fill(0);
  textSize(30);
  text("您出的是: " + currentGesture, 20, 20);
  pop();

  // 顯示倒數或結果
  if (!resultLocked) {
    fill(255);
    textSize(80);
    text(gameTimer > 0 ? gameTimer : "出拳！", width / 2, height * 0.15);
    
    textSize(32);
    text("請準備手勢...", width / 2, height * 0.25);
  } else {
    fill(0);
    textSize(50);
    text("您出的是：", width / 2, height * 0.15);
    fill(255, 0, 0);
    textSize(100);
    text(currentGesture, width / 2, height * 0.3);
    
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
