'use strict'

// 取得標籤
const videoElement = document.querySelector('video#player')
const recvideo = document.querySelector('video#replayer')
const btnShare = document.querySelector('button#share')
const btnRecord = document.querySelector('button#record')
const btnPlay = document.querySelector('button#replay')
const btnDownload = document.querySelector('button#download')

//record
let buffer
let mediaRecorder

// 將視訊顯示在 video 標籤上
function gotStream(stream) {
  videoElement.srcObject = stream
  window.stream = stream // 錄影用到
}

// 錯誤處理
function handleError(error) {
  console.log(error.message, error.name)
}

// 播放自己的視訊
function start() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
  const constraints = {
    frameRate: 15,
    width: 640,
    height: 360,
  }
  navigator.mediaDevices
    .getDisplayMedia(constraints)
    .then(gotStream)
    .catch(handleError)
}

// 開始錄影
function startRecord() {
  buffer = []

  var options = {
    mimeType: 'video/webm;codecs=vp8',
  }

  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported!`)
    return
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, options)
  } catch (e) {
    console.error('Failed to create MediaRecorder:', e)
    return
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e && e.data && e.data.size > 0) {
      buffer.push(e.data)
    }
  }
  mediaRecorder.start(10)
}

// 停止錄影
function stopRecord() {
  mediaRecorder.stop()
}

// 分享畫面點擊
btnShare.onclick = start

// 錄影按鈕點擊
btnRecord.onclick = () => {
  if (btnRecord.textContent === '錄影') {
    startRecord()
    btnRecord.textContent = '停止'
    btnPlay.disabled = true
    btnDownload.disabled = true
  } else {
    stopRecord()
    btnRecord.textContent = '錄影'
    btnPlay.disabled = false
    btnDownload.disabled = false
  }
}

// 回放錄影點擊
btnPlay.onclick = () => {
  var blob = new Blob(buffer, { type: 'video/webm' })
  recvideo.src = window.URL.createObjectURL(blob)
  recvideo.srcObject = null
  recvideo.controls = true
  recvideo.play()
}

// 下載螢幕錄影
btnDownload.onclick = () => {
  var blob = new Blob(buffer, { type: 'video/webm' })
  var url = window.URL.createObjectURL(blob)
  var a = document.createElement('a')

  a.href = url
  a.style.display = 'none'
  a.download = 'video.webm'
  a.click()
}