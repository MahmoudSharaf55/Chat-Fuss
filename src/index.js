const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const Filter = require('bad-words');
const {generateMessage, generateLocation,generateImage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUserInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    socket.on('join', (options, callback) => {
        // socket.emit , io.emit , socket.broadcast.emit for sending to clients without room
        // io.to.emit , socket.broadcast.to.emit for sending to clients of specific room
        const {error, user} = addUser({
            id: socket.id,
            ...options,
        });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('msg', generateMessage(user.username,'Welcome'));
        socket.broadcast.to(user.room).emit('msg', generateMessage(user.username,`${user.username} has joined`));     // all user except current
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room),
        });
        callback()
    })
    socket.on('sendMsg', (msg, callback) => {
        const filter = new Filter();
        if (filter.isProfane(msg)) {
            return callback('Profane is not allowed');
        }
        const user = getUser(socket.id);
        io.to(user.room).emit('msg', generateMessage(user.username,msg));     // broadcast to all clients
        callback('delivered!');
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('msg', generateMessage(user.username,`${user.username} has left`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            });
        }
    });
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocation(user.username,`https://google.com/maps?q=${location.lat},${location.long}`));
        callback('Location delivered');
    })
    socket.on('sendImg', (buffer) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('imgMessage', generateImage(user.username,buffer));
    })
});

server.listen(port, () => {
    console.log('Running on port ' + port);
});

/*
router.post('/users/me/avatar', auth, upload.single('uploadImg'), async (req, res) => {   //middleware: uploadImg for param in form data request
    const buffer = await sharp(req.file.buffer).resize({width: 250,height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send('stored successfully')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})        // error given by cb function in file filter
});
 */