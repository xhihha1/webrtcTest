# save this as app.py
import flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send, join_room, leave_room
import json
app = flask.Flask(__name__, template_folder='temp')
app.config["DEBUG"] = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
CORS(app)

@app.route("/")
def home():
    return flask.render_template('index.html')
    # return flask.render_template('index.html', async_mode=socketio.async_mode)

@app.route("/chat")
def chat():
    return flask.render_template('chat.html')

@app.route("/rtc2")
def rtc2():
    return flask.render_template('rtc2.html')

@app.route("/rtc3")
def rtc3():
    return flask.render_template('rtcSocket.html')

@app.route("/rtc3s")
def rtc3s():
    return flask.render_template('rtcShare.html')

@app.route("/rtc3c")
def rtc3c():
    return flask.render_template('rtcCanvas.html')

@app.route("/rtc3v")
def rtc3v():
    return flask.render_template('rtcViewer.html')

@app.route("/status")
def upload():
    # if not flask.request.json:
    #     flask.abort(400)

    # d = flask.request.json.get("data", 0)
    # print("receive data:{}".format(d))
    # # do something

    # # 回傳給前端
    socketio.emit('status_response', {'data': '123'})
    return flask.jsonify({"response": "ok"})
    # return "Hello, World!"

@app.route("/hello")
def hello():
    return "Hello, World!"

@socketio.on('connect')
def connected_msg(msg):
    print(msg)
    print('--- connect ---')
    emit('status_response', {'data': '456'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

@socketio.on('message')
def connected_message(room, data):
    emit('message', data, to=room)

@socketio.on('join')
def connected_join(room):
    print(room)
    print('--- join ---')
    join_room(room)
    # send(flask.request.sid + ' has entered the room.', to=room)
    emit('joined', room + ':' + flask.request.sid, to=room)

@socketio.on('leave')
def connected_leave(room):
    # username = data['username']
    # room = data['room']
    leave_room(room)
    emit('leave', (room, flask.request.sid), to=room)

@socketio.on('my event')
def handle_my_custom_event(json):
    print('received json: ' + str(json))

# ------------------

@socketio.on('join1')
def connected_join1(room, timer):
    print('--- join room ---:' + room)
    join_room(room)
    emit('ready', (room + ':' + flask.request.sid, timer), to=room)

@socketio.on('offer')
def connected_offer1(room, desc, timer):
    print('--- offer ---:' + room)
    emit('offer', (desc, timer), to=room)

@socketio.on('answer')
def connected_answer1(room, desc, timer):
    print('--- answer ---:' + room)
    emit('answer', (desc, timer), to=room)

@socketio.on('ice_candidate')
def connected_candidate1(room, data, timer):
    print('--- ice_candidate ---:' + room)
    emit('ice_candidate', (data, timer), to=room)

@socketio.on('leave1')
def connected_leave1(room, timer):
    emit('bye', (room, timer), to=room)
    leave_room(room)
    emit('leave1', (room, timer))
# ------------------

if __name__ == '__main__':
    print('why????')
    # app.run(host="0.0.0.0", port=5500)
    #  ssl_context='adhoc'
    # socketio.run(app, keyfile='server.key', certfile='server.crt')
    # socketio.run(app, host="127.0.0.1", port=5501, debug=True)
    socketio.run(app, host="0.0.0.0", port=5501, debug=True, keyfile='server.key', certfile='server.crt')