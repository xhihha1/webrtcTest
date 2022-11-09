'use strict'

const localVideo = document.querySelector('video#localVideo')
const remoteVideo = document.querySelector('video#remoteVideo')
const btnStart = document.querySelector('button#start')
const btnCall = document.querySelector('button#call')
const btnHangup = document.querySelector('button#hangup')

let localStream
let BobPC
let AlicePC

btnStart.onclick = start
btnCall.onclick = call
btnHangup.onclick = hangup

function start() {
  const constraints = {
    video: true,
    audio: false,
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return
  } else {
    navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream)

    btnStart.disabled = true
    btnCall.disabled = false
    btnHangup.disabled = true
  }
}

function gotMediaStream(stream) {
  localVideo.srcObject = stream
  localStream = stream
}

function call() {
  const offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
  }

  BobPC = new RTCPeerConnection()
  AlicePC = new RTCPeerConnection()

  BobPC.onicecandidate = (e) => {
    AlicePC.addIceCandidate(e.candidate)
    console.log('BobPC ICE candidate:', e.candidate)
  }

  AlicePC.onicecandidate = (e) => {
    BobPC.addIceCandidate(e.candidate)
    console.log('AlicePC ICE candidate:', e.candidate)
  }

  AlicePC.ontrack = gotRemoteStream

  localStream.getTracks().forEach((track) => {
    BobPC.addTrack(track, localStream)
  })

  BobPC.createOffer(offerOptions).then(gotLocalDescription)

  btnCall.disabled = true
  btnHangup.disabled = false
}

function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0]
  }
}

function gotLocalDescription(desc) {
  BobPC.setLocalDescription(desc)
  // 2. 通過 Signaling server 將包含 Bob SDP 的offer 發送給 Alice
  // 3. Alice 收到 offer 後呼叫 setRemoteDescription 設定 Bob 的 SDP
  AlicePC.setRemoteDescription(desc)
  // 4. Alice 呼叫 RTCPeerConnection.createAnswer 建立一個 answer
  AlicePC.createAnswer().then(gotAnswerDescription)
}

function gotAnswerDescription(desc) {
  AlicePC.setLocalDescription(desc)
  // 5. 通過 Signaling server 將包含 Alice SDP 的 answer 發送給 Bob
  // 6. Bob 收到 answer  後呼叫 setRemoteDescription 設定 Alice 的SDP
  BobPC.setRemoteDescription(desc)
}

function hangup() {
  BobPC.close()
  AlicePC.close()
  BobPC = null
  AlicePC = null

  btnCall.disabled = false
  btnHangup.disabled = true
}