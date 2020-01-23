const generateMessage = (username,text)=>{
    return {
        username,
        text: text,
        time: new Date().getTime(),
    }
};
const generateLocation = (username,url)=>{
    return {
        username,
        url: url,
        time: new Date().getTime(),
    }
};
const generateImage = (username,buffer)=>{
    return {
        username,
        buffer: buffer,
        time: new Date().getTime(),
    }
}
module.exports = {
    generateMessage,
    generateLocation,
    generateImage
};