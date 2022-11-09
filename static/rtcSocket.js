// button 標籤
const startBtn = document.querySelector('button#startBtn')
const leaveBtn = document.querySelector('button#leaveBtn')
// video 標籤
const localVideo = document.querySelector('video#localVideo')
const remoteVideo = document.querySelector('video#remoteVideo')

let localStream
let peerConn
const room = 'room1'
const timer = new Date().getTime()
let socket

function connectIO() {
  // socket
  // var url = 'http://127.0.0.1';
  // var port = '5501';
  // socket = io.connect(url + ':' + port);
  var url = location.origin;
  socket = io.connect(url);
  // const socket = io('ws://0.0.0.0:8080')

  socket.on('ready', async (msg, timeId) => {
    console.log(msg)
    if (timeId !== timer) {
      return false
    }
    // 發送 offer
    console.log('ready 準備發送 offer :' + timer)
    await sendSDP(true)
  })

  socket.on('ice_candidate', async (data, timeId) => {
    console.log('收到 ice_candidate:' + timeId)
    if (timeId === timer) {
      return false
    }
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: data.label,
      candidate: data.candidate,
    })
    await peerConn.addIceCandidate(candidate)
  })

  socket.on('offer', async (desc, timeId) => {
    console.log('收到 offer:' + timeId)
    if (timeId === timer) {
      return false
    }
    // 設定對方的配置
    await peerConn.setRemoteDescription(desc)
    console.log('ready 準備發送 answer :' + timer)
    // 發送 answer
    await sendSDP(false)
  })

  socket.on('answer', async (desc, timeId) => {
    console.log('收到 answer')
    if (timeId === timer) {
      return false
    }
    // 設定對方的配置
    await peerConn.setRemoteDescription(desc)
  })
  
  // 收到 leaved 把 socket 中斷連線
  socket.on('leaved1', (room, timeId) => {
    console.log('收到 leaved')
    if (timeId !== timer) {
      return false
    }
    // 中斷 socket
    socket.disconnect()
  })

  socket.on('bye', (room, timeId) => {
    console.log('收到 bye:' + timeId)
    // 對方要掛掉電話
    // hunghp()
  })

  socket.emit('join1', room, timer)
}


/**
 * 取得本地串流
 */
async function createStream() {
  try {
    // 取得影音的Stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })

    // 提升作用域
    localStream = stream

    // 導入<video>
    localVideo.srcObject = stream
  } catch (err) {
    throw err
  }
}

/**
 * 初始化Peer連結
 */
function initPeerConnection() {
  const configuration = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  }
  // const configuration = {}
  peerConn = new RTCPeerConnection(configuration)

  // 增加本地串流
  localStream.getTracks().forEach((track) => {
    peerConn.addTrack(track, localStream)
  })

  // 找尋到 ICE 候選位置後，送去 Server 與另一位配對
  peerConn.onicecandidate = (e) => {
    if (e.candidate) {
      console.log('發送 ICE:' + timer)
      // 發送 ICE
      socket.emit('ice_candidate', room, {
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate,
      }, timer)
    }
  }

  // 監聽 ICE 連接狀態
  peerConn.oniceconnectionstatechange = (e) => {
    if (e.target.iceConnectionState === 'disconnected') {
      remoteVideo.srcObject = null
    }
  }

  // 監聽是否有流傳入，如果有的話就顯示影像
  peerConn.onaddstream = ({ stream }) => {
    // 接收流並顯示遠端視訊
    remoteVideo.srcObject = stream
  }
}

/**
 * 處理信令
 * @param {Boolean} isOffer 是 offer 還是 answer
 */
async function sendSDP(isOffer) {
  try {
    if (!peerConn) {
      console.log('尚未開啟視訊')
      return
    }

    // 創建SDP信令
    const localSDP = await peerConn[isOffer ? 'createOffer' : 'createAnswer']({
      offerToReceiveAudio: true, // 是否傳送聲音流給對方
      offerToReceiveVideo: true, // 是否傳送影像流給對方
    })

    // 設定本地SDP信令
    await peerConn.setLocalDescription(localSDP)

    // 寄出SDP信令
    let e = isOffer ? 'offer' : 'answer'
    socket.emit(e, room, peerConn.localDescription, timer)
  } catch (err) {
    throw err
  }
}


function hangup() {
  if (peerConn) {
    peerConn.close()
    peerConn = null
  }
}

leaveBtn.onclick = () => {
  if (socket) {
    socket.emit('leave1', room, timer)
  }
  hangup()
  startBtn.disabled = false
  leaveBtn.disabled = true
}

/**
 * 初始化
 */
async function init() {
  await createStream()
  initPeerConnection()
  connectIO()
  // socket.emit('join1', room, timer)
  startBtn.disabled = true
  leaveBtn.disabled = false
}

// window.onload = init()
startBtn.onclick = init