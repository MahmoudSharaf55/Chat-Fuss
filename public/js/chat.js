const socket = io();

const form = document.querySelector('#msg_form');
const input = document.querySelector('#msg');
const submitBtn = document.querySelector('#submit');
const messages = document.querySelector('#messages');
const message_template_left = document.querySelector('#message_template').innerHTML;
const message_template_right = document.querySelector('#message_template_right').innerHTML;
const location_template_left = document.querySelector('#location_template').innerHTML;
const location_template_right = document.querySelector('#location_template_right').innerHTML;
const img_template_left = document.querySelector('#img_template').innerHTML;
const img_template_right = document.querySelector('#img_template_right').innerHTML;
const audio_template_left = document.querySelector('#audio_template').innerHTML;
const audio_template_right = document.querySelector('#audio_template_right').innerHTML;
const sidebar_template = document.querySelector('#sidebar_template').innerHTML;
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    const visibleHeight = messages.offsetHeight;
    const containerHeight = messages.scrollHeight;
    if (visibleHeight < containerHeight) {
        messages.scrollTo(0, containerHeight);
    }
};

socket.on('msg', (message) => {
    let html;
    if (message.username.trim().toLowerCase() === username.trim().toLowerCase()) {
        html = Mustache.render(message_template_right, {
            username: message.username,
            message: message.text,
            time: moment(message.time).format('hh:mm a'),
        });
    } else {
        html = Mustache.render(message_template_left, {
            username: message.username,
            message: message.text,
            time: moment(message.time).format('hh:mm a'),
        });
    }
    messages.insertAdjacentHTML('beforeend', html);      // last child of div
    autoScroll();
});
socket.on('locationMessage', (loc) => {
    let html;
    if (loc.username.trim().toLowerCase() === username.trim().toLowerCase()) {
        html = Mustache.render(location_template_right, {
            username: loc.username,
            url: loc.url,
            time: moment(loc.time).format('hh:mm a'),
        });
    } else {
        html = Mustache.render(location_template_left, {
            username: loc.username,
            url: loc.url,
            time: moment(loc.time).format('hh:mm a'),
        });
    }
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});
socket.on('imgMessage', (message) => {
    console.log(message);
    let html;
    if (message.username.trim().toLowerCase() === username.trim().toLowerCase()) {
        html = Mustache.render(img_template_right, {
            username: message.username,
            buffer: message.buffer,
            time: moment(message.time).format('hh:mm a'),
        });
    } else {
        html = Mustache.render(img_template_left, {
            username: message.username,
            buffer: message.buffer,
            time: moment(message.time).format('hh:mm a'),
        });
    }
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});
socket.on('audioMessage', (message) => {
    console.log(message);
    let html;
    if (message.username.trim().toLowerCase() === username.trim().toLowerCase()) {
        html = Mustache.render(audio_template_right, {
            username: message.username,
            blob: message.blob,
            time: moment(message.time).format('hh:mm a'),
        });
    } else {
        html = Mustache.render(audio_template_left, {
            username: message.username,
            blob: message.blob,
            time: moment(message.time).format('hh:mm a'),
        });
    }
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebar_template, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
});
form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    submitBtn.setAttribute('disabled', 'disabled');
    socket.emit('sendMsg', input.value, (flag) => {
        submitBtn.removeAttribute('disabled');
        input.value = '';
        input.focus();
        console.log(flag);
    });
});

const locationBtn = document.querySelector('#locationBtn');

function sendLocation() {
    if (!navigator.geolocation) {
        return alert('geo is not supported')
    }
    locationBtn.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        locationBtn.removeAttribute('disabled');
        socket.emit('sendLocation', {lat: position.coords.latitude, long: position.coords.longitude}, (flag) => {
            console.log(flag);
        })
    }, error => {
        console.log(error);
    }, {
        enableHighAccuracy: true,
    })
}

if (username && room) {
    socket.emit('join', {username, room: room.toString()}, (error) => {
        if (error) {
            alert(error);
            location.href = '/';
        }
    });
} else {
    window.location = 'index.html';
}
const img_input = document.querySelector('#img_input');

function browseImage() {
    $('#img_input').trigger('click');
    return false;
}

img_input.onchange = e => {
    if (img_input.files && img_input.files[0]) {
        let reader = new FileReader();
        reader.readAsDataURL(img_input.files[0]);
        reader.onload = function (e) {
            socket.emit('sendImg', reader.result);
        };
    }
};

var recorder;

function startRec() {
    navigator.mediaDevices.getUserMedia(
        {
            audio: true,
        }).then(stream => {
        const audio_context = new AudioContext();
        var input = audio_context.createMediaStreamSource(stream);
        recorder = new Recorder(input);
        recorder.record();
    });
}

function stopRec() {
    recorder.stop();
    recorder.exportWAV(function (blob) {
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function (e) {
            socket.emit('sendAudio', reader.result);
        };
    });
}

function record() {
    if ($('#recordBtn').hasClass('rec_active')) {
        console.log('stop record');
        $('#recordBtn').toggleClass('rec_active');
        stopRec();
    } else {
        console.log('start record');
        $('#recordBtn').toggleClass('rec_active');
        startRec();
    }
}