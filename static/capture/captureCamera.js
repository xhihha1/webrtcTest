/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict'

// 取得標籤
const videoElement = document.querySelector('video')
const audioInputSelect = document.querySelector('select#audioSource')
const audioOutputSelect = document.querySelector('select#audioOutput')
const videoSelect = document.querySelector('select#videoSource')
const selectors = [audioInputSelect, audioOutputSelect, videoSelect]

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype)

// 將讀取到的設備加入到 select 標籤中
function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map((select) => select.value)
    selectors.forEach((select) => {
        while (select.firstChild) {
            select.removeChild(select.firstChild)
        }
    })
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i]
        const option = document.createElement('option')
        option.value = deviceInfo.deviceId
        if (deviceInfo.kind === 'audioinput') {
            option.text =
                deviceInfo.label || `microphone ${audioInputSelect.length + 1}`
            audioInputSelect.appendChild(option)
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text =
                deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`
            audioOutputSelect.appendChild(option)
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`
            videoSelect.appendChild(option)
        } else {
            console.log('Some other kind of source/device: ', deviceInfo)
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (
            Array.prototype.slice
            .call(select.childNodes)
            .some((n) => n.value === values[selectorIndex])
        ) {
            select.value = values[selectorIndex]
        }
    })
}

// 讀取設備
navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError)

// 手動修改音訊的輸出 例如預設耳機切換成喇叭
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element
            .setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`)
            })
            .catch((error) => {
                let errorMessage = error
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`
                }
                console.error(errorMessage)
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0
            })
    } else {
        console.warn('Browser does not support output device selection.')
    }
}

// 處理音訊改變的方法
function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value
    attachSinkId(videoElement, audioDestination)
}

// 將視訊顯示在 video 標籤上
function gotStream(stream) {
    videoElement.srcObject = stream
    window.stream = stream
    return navigator.mediaDevices.enumerateDevices()
}

// 錯誤處理
function handleError(error) {
    console.log(
        'navigator.MediaDevices.getUserMedia error: ',
        error.message,
        error.name,
    )
}

// 播放自己的視訊
function start() {
    if (window.stream) {
        window.stream.getTracks().forEach((track) => {
            track.stop()
        })
    }
    const audioSource = audioInputSelect.value
    const videoSource = videoSelect.value
    const constraints = {
        audio: {
            deviceId: audioSource ? {
                exact: audioSource
            } : undefined
        },
        video: {
            deviceId: videoSource ? {
                exact: videoSource
            } : undefined
        },
    }
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .then(gotDevices)
        .catch(handleError)
}

audioInputSelect.onchange = start
audioOutputSelect.onchange = changeAudioDestination

videoSelect.onchange = start

start()

// 拍照

function capture(video) {
    const w = video.videoWidth
    const h = video.videoHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(video, 0, 0, w, h)
    return canvas
}

function download(url) {
    var a = document.createElement('a')
    a.download = 'Image.jpg'
    a.href = url
    document.body.appendChild(a)
    a.click()
    a.remove()
}

document.querySelector('button#shoot').onclick = () =>
    download(capture(videoElement).toDataURL('image/jpeg'))

//record
let buffer
let mediaRecorder

const recvideo = document.querySelector('video#replayer');
const btnRecord = document.querySelector('button#record');
const btnPlay = document.querySelector('button#replay');
const btnDownload = document.querySelector('button#download');

function handleDataAvailable(e) {
  if (e && e.data && e.data.size > 0) {
    buffer.push(e.data)
  }
}

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

  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.start(10)
}

function stopRecord() {
  mediaRecorder.stop()
}

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

btnPlay.onclick = () => {
  var blob = new Blob(buffer, { type: 'video/webm' })
  recvideo.src = window.URL.createObjectURL(blob)
  recvideo.srcObject = null
  recvideo.controls = true
  recvideo.play()
}

btnDownload.onclick = () => {
  var blob = new Blob(buffer, { type: 'video/webm' })
  var url = window.URL.createObjectURL(blob)
  var a = document.createElement('a')

  a.href = url
  a.style.display = 'none'
  a.download = 'video.webm'
  a.click()
}

// 檢查瀏覽器支援哪些 Type
function getSupportedMimeTypes() {
  const VIDEO_TYPES = ['webm', 'ogg', 'mp4', 'x-matroska']
  const VIDEO_CODECS = [
    'vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1',
    'h265', 'h.265', 'h264', 'h.264', 'opus'
  ]

  const supportedTypes = []
  VIDEO_TYPES.forEach((videoType) => {
    const type = `video/${videoType}`
    VIDEO_CODECS.forEach((codec) => {
      const variations = [
        `${type};codecs=${codec}`,
        `${type};codecs:${codec}`,
        `${type};codecs=${codec.toUpperCase()}`,
        `${type};codecs:${codec.toUpperCase()}`,
        `${type}`,
      ]
      variations.forEach((variation) => {
        if (MediaRecorder.isTypeSupported(variation))
          supportedTypes.push(variation)
      })
    })
  })
  return supportedTypes
}

const supportedMimeTypes = getSupportedMimeTypes()
console.log('Best supported mime types by priority : ', supportedMimeTypes[0])
console.log(
  'All supported mime types ordered by priority : ',
  supportedMimeTypes,
)